/**
 * Native Browser PDF Helper
 * Generates and serves valid application/pdf Blobs and URLs
 * for direct, native in-browser tab viewing.
 */

/**
 * Converts a base64 Data URL (data:application/pdf;base64,...) to an in-memory application/pdf Blob URL.
 */
export function base64ToPdfBlobUrl(dataUrl: string): string {
  try {
    const commaIdx = dataUrl.indexOf(",");
    const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Failed to convert base64 to PDF blob:", err);
    return dataUrl;
  }
}

/**
 * Escapes characters for PDF string literals
 */
function escapePdfText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Generates standard compliant PDF-1.4 binary bytes containing the document title,
 * metadata, and formatted text content.
 */
export function generateNativePdfBlob(options: {
  title: string;
  subtitle?: string;
  subject?: string;
  section?: string;
  year?: number | string;
  author?: string;
  content?: string;
  isCorrige?: boolean;
}): Blob {
  const { title, subtitle, subject, section, year, author, content, isCorrige } = options;

  const headerLine = `REPUBLIQUE TUNISIENNE - MINISTERE DE L'EDUCATION`;
  const subHeader = `SuperStudent.TN | ${isCorrige ? "CORRECTION OFFICIELLE" : "SUJET D'EXAMEN ET RESUME"}`;
  const docTitle = title || "Document de Revision";
  const metaLine = [
    subject ? `Matiere: ${subject.toUpperCase()}` : "",
    section ? `Section: ${section}` : "",
    year ? `Session: ${year}` : "",
    author ? `Auteur: ${author}` : "",
  ].filter(Boolean).join("  |  ");

  const rawLines = (content || "Contenu du document en cours de revision.").split("\n");
  const maxLinesPerPage = 38;
  const pagesLines: string[][] = [];

  let currentBatch: string[] = [];
  for (const line of rawLines) {
    // Word wrap long lines approx 80 chars
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      currentBatch.push("");
    } else {
      let remaining = trimmed;
      while (remaining.length > 75) {
        let splitAt = remaining.lastIndexOf(" ", 75);
        if (splitAt === -1) splitAt = 75;
        currentBatch.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt).trim();
      }
      if (remaining.length > 0) {
        currentBatch.push(remaining);
      }
    }

    if (currentBatch.length >= maxLinesPerPage) {
      pagesLines.push(currentBatch);
      currentBatch = [];
    }
  }
  if (currentBatch.length > 0 || pagesLines.length === 0) {
    pagesLines.push(currentBatch);
  }

  const pageCount = pagesLines.length;
  const objects: string[] = [];

  // 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // 2: Pages (Kids defined later)
  const pageObjectIds = pagesLines.map((_, i) => 3 + i * 2);
  const kidsStr = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageCount} >>\nendobj\n`);

  // Fonts: Font 4 (Helvetica-Bold), Font 5 (Helvetica)
  const fontBoldId = 3 + pageCount * 2;
  const fontRegId = fontBoldId + 1;

  pagesLines.forEach((pageContent, pageIdx) => {
    const pageId = 3 + pageIdx * 2;
    const contentStreamId = pageId + 1;

    // Page object
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontBoldId} 0 R /F2 ${fontRegId} 0 R >> >> /Contents ${contentStreamId} 0 R >>\nendobj\n`
    );

    // Build content stream for page
    const streamCommands: string[] = [];

    // Header border line
    streamCommands.push(`0.2 0.3 0.6 RG 2 w 40 800 m 555 800 l S`);
    streamCommands.push(`0.8 0.8 0.8 RG 0.5 w 40 45 m 555 45 l S`);

    // Top Header Text
    streamCommands.push(`BT`);
    streamCommands.push(`/F1 9 Tf 0.2 0.3 0.5 rg`);
    streamCommands.push(`45 812 Td (${escapePdfText(headerLine)}) Tj`);
    streamCommands.push(`ET`);

    streamCommands.push(`BT`);
    streamCommands.push(`/F1 8 Tf 0.4 0.4 0.4 rg`);
    streamCommands.push(`430 812 Td (${escapePdfText(subHeader)}) Tj`);
    streamCommands.push(`ET`);

    // Main Title on first page
    let yPos = 770;
    if (pageIdx === 0) {
      streamCommands.push(`BT`);
      streamCommands.push(`/F1 14 Tf 0.05 0.1 0.2 rg`);
      streamCommands.push(`45 ${yPos} Td (${escapePdfText(docTitle)}) Tj`);
      streamCommands.push(`ET`);
      yPos -= 20;

      if (subtitle) {
        streamCommands.push(`BT`);
        streamCommands.push(`/F2 10 Tf 0.3 0.3 0.3 rg`);
        streamCommands.push(`45 ${yPos} Td (${escapePdfText(subtitle)}) Tj`);
        streamCommands.push(`ET`);
        yPos -= 16;
      }

      if (metaLine) {
        streamCommands.push(`BT`);
        streamCommands.push(`/F1 9 Tf 0.15 0.45 0.35 rg`);
        streamCommands.push(`45 ${yPos} Td (${escapePdfText(metaLine)}) Tj`);
        streamCommands.push(`ET`);
        yPos -= 22;
      }

      // Separator line
      streamCommands.push(`0.85 0.85 0.9 RG 0.75 w 45 ${yPos + 8} m 550 ${yPos + 8} l S`);
    }

    // Body Text Lines
    streamCommands.push(`BT`);
    streamCommands.push(`/F2 10 Tf 0.1 0.1 0.1 rg`);
    streamCommands.push(`45 ${yPos} Td`);
    streamCommands.push(`14 TL`);

    pageContent.forEach((line) => {
      streamCommands.push(`(${escapePdfText(line)}) '`);
    });
    streamCommands.push(`ET`);

    // Footer Page Numbers
    streamCommands.push(`BT`);
    streamCommands.push(`/F2 8 Tf 0.5 0.5 0.5 rg`);
    streamCommands.push(`270 30 Td (Page ${pageIdx + 1} / ${pageCount}) Tj`);
    streamCommands.push(`ET`);

    streamCommands.push(`BT`);
    streamCommands.push(`/F1 8 Tf 0.2 0.3 0.6 rg`);
    streamCommands.push(`45 30 Td (SuperStudent.TN - Plateforme Educative Nationale) Tj`);
    streamCommands.push(`ET`);

    const streamBody = streamCommands.join("\n");
    const streamLength = new TextEncoder().encode(streamBody).length;

    objects.push(
      `${contentStreamId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  });

  // Fonts
  objects.push(`${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);
  objects.push(`${fontRegId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // Construct PDF buffer
  const encoder = new TextEncoder();
  const header = "%PDF-1.4\n";
  let offset = encoder.encode(header).length;

  const xrefEntries: string[] = ["0000000000 65535 f \n"];
  const bodyChunks: Uint8Array[] = [encoder.encode(header)];

  for (let i = 0; i < objects.length; i++) {
    const paddedOffset = String(offset).padStart(10, "0");
    xrefEntries.push(`${paddedOffset} 00000 n \n`);
    const encodedObj = encoder.encode(objects[i]);
    bodyChunks.push(encodedObj);
    offset += encodedObj.length;
  }

  const startXref = offset;
  const xrefSection = `xref\n0 ${objects.length + 1}\n${xrefEntries.join("")}`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  bodyChunks.push(encoder.encode(xrefSection));
  bodyChunks.push(encoder.encode(trailer));

  return new Blob(bodyChunks as BlobPart[], { type: "application/pdf" });
}

/**
 * Generates a native PDF Base64 Data URL string directly.
 */
export function generateNativePdfDataUrl(options: {
  title: string;
  subtitle?: string;
  subject?: string;
  section?: string;
  year?: number | string;
  author?: string;
  content?: string;
  isCorrige?: boolean;
}): string {
  const blob = generateNativePdfBlob(options);
  return URL.createObjectURL(blob);
}

/**
 * Opens any PDF in Google PDF Reader / Google Docs Viewer outside the website
 * in a direct native browser PDF tab.
 */
export function openInGooglePdfViewer(url: string, title = "Document PDF"): void {
  if (!url || url === "#") return;

  const cleanFileName = title.endsWith(".pdf") ? title : `${title}.pdf`;
  let targetUrl = url;

  // Convert base64 Data URL to Blob URL
  if (targetUrl.startsWith("data:application/pdf;base64,")) {
    targetUrl = base64ToPdfBlobUrl(targetUrl);
  }

  // If remote web URL (http:// or https://), route through Google Docs Viewer
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}&embedded=false&site=SuperStudent.TN&file=${encodeURIComponent(cleanFileName)}`;
    const win = window.open(googleViewerUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      const a = document.createElement("a");
      a.href = googleViewerUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return;
  }

  // For Blob URLs (blob:http...): Open directly in a new tab where Chrome / Google PDF reader natively renders the PDF!
  const win = window.open(targetUrl, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = targetUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
