import { BacDocumentItem, Account } from "../types";
import { INITIAL_BAC_DOCUMENTS } from "../data/bacDocumentsDataset";
import { getJSON, setJSON, delKey } from "./dataService";
import { canUserPublishDocuments } from "../constants";
import { createNotification } from "./notificationService";

const VAULT_KEY = "bac-documents-vault";
const DELETED_DOCS_KEY = "bac-deleted-doc-ids";
const BOOKMARKS_KEY = "bac-doc-bookmarks";

export async function getDeletedDocIds(): Promise<string[]> {
  try {
    const list = await getJSON<string[]>(DELETED_DOCS_KEY, true);
    return list || [];
  } catch {
    return [];
  }
}

export async function getAllBacDocuments(): Promise<BacDocumentItem[]> {
  try {
    const deletedIds = new Set(await getDeletedDocIds());
    const customDocs = (await getJSON<BacDocumentItem[]>(VAULT_KEY, true)) || [];
    // Merge initial dataset with user-created documents, avoiding duplicate IDs and excluding deleted
    const customIds = new Set(customDocs.map((d: BacDocumentItem) => d.id));
    const merged = [
      ...customDocs.filter((d: BacDocumentItem) => !deletedIds.has(d.id)),
      ...INITIAL_BAC_DOCUMENTS.filter((d: BacDocumentItem) => !customIds.has(d.id) && !deletedIds.has(d.id)),
    ];
    
    const enriched = merged.map((doc) => ensureRealPdfDataUrls(doc));
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching documents:", err);
    return INITIAL_BAC_DOCUMENTS.map((doc) => ensureRealPdfDataUrls(doc));
  }
}

export function ensureRealPdfDataUrls(doc: BacDocumentItem): BacDocumentItem {
  let pdfDataUrl = doc.pdfDataUrl || doc.pdfUrl;
  let corrigePdfDataUrl = doc.corrigePdfDataUrl || doc.corrigePdfUrl;

  if (!pdfDataUrl) {
    pdfDataUrl = resolveNativePdfUrl(doc, false);
  }
  if (!corrigePdfDataUrl && doc.hasCorrige) {
    corrigePdfDataUrl = resolveNativePdfUrl(doc, true);
  }

  return {
    ...doc,
    pdfDataUrl,
    corrigePdfDataUrl,
  };
}

export async function publishBacDocument(
  doc: Omit<BacDocumentItem, "id" | "createdAt" | "downloadCount">,
  user: Account
): Promise<{ success: boolean; error?: string; document?: BacDocumentItem }> {
  if (!canUserPublishDocuments(user)) {
    return {
      success: false,
      error: "عذرًا، النشر في بنك الوثائق متاح فقط للمشرفين والمشرف الأعلى والتلاميذ المتميزين.",
    };
  }

  try {
    const customDocs = (await getJSON<BacDocumentItem[]>(VAULT_KEY, true)) || [];
    const newDoc: BacDocumentItem = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorUsername: user.username,
      authorDisplayName: user.displayName || user.username,
      authorName: user.displayName || user.username,
      authorAvatar: user.avatar || user.avatarUrl,
      authorRole: user.role,
      downloadCount: 0,
      createdAt: Date.now(),
    };

    customDocs.unshift(newDoc);
    await setJSON(VAULT_KEY, customDocs, true);

    // Track PDF in applicant dev storage file if contributor is an applicant
    try {
      const devKey = `dev:applicant:${user.username.toLowerCase()}`;
      const devProfile = await getJSON<any>(devKey, true);
      if (devProfile) {
        const uploadedPdfs = devProfile.uploadedPdfs || [];
        uploadedPdfs.unshift({
          id: newDoc.id,
          title: newDoc.title,
          url: newDoc.pdfUrl,
          dataUrl: newDoc.pdfDataUrl,
          uploadedAt: newDoc.createdAt,
        });
        devProfile.uploadedPdfs = uploadedPdfs;
        await setJSON(devKey, devProfile, true);
      }
    } catch {
      // ignore
    }

    // Trigger notification to superadmin, mods & elite students
    try {
      await createNotification({
        title: {
          ar: "وثيقة جديدة في بنك الامتحانات 📚",
          fr: "Nouveau document dans la banque d'examens 📚",
          en: "New document added to exam bank 📚",
        },
        message: {
          ar: `قام ${user.displayName || user.username} بنشر وثيقة جديدة: "${newDoc.title}". متاح الآن التحميل والمعاينة.`,
          fr: `${user.displayName || user.username} a publié un nouveau document: "${newDoc.title}".`,
          en: `${user.displayName || user.username} published a new document: "${newDoc.title}".`,
        },
        type: "doc_approved",
        recipientRole: "all",
        iconType: "file-check",
        badgeLabel: { ar: "وثائق جديدة", fr: "Nouveau doc", en: "New Doc" },
        actionUrl: "documents",
      });
    } catch {
      // ignore notification errors
    }

    return { success: true, document: newDoc };
  } catch (err) {
    console.error("Error saving document:", err);
    return { success: false, error: "تعذر حفظ الوثيقة في قاعدة البيانات" };
  }
}

export async function deleteBacDocument(
  docId: string,
  user?: Account | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const customDocs = (await getJSON<BacDocumentItem[]>(VAULT_KEY, true)) || [];
    const targetDoc = customDocs.find((d: BacDocumentItem) => d.id === docId);

    if (user) {
      const isAuthorizedRole =
        user.role === "superadmin" ||
        user.role === "moderator" ||
        user.role === "teacher" ||
        user.role === "elite_student";
      const isAuthor = Boolean(
        targetDoc &&
          ((targetDoc.authorUsername && user.username && targetDoc.authorUsername.toLowerCase() === user.username.toLowerCase()) ||
            (targetDoc.authorName && user.displayName && targetDoc.authorName.toLowerCase() === user.displayName.toLowerCase()))
      );

      if (!isAuthorizedRole && !isAuthor && targetDoc) {
        return { success: false, error: "ليس لديك صلاحية حذف هذه الوثيقة" };
      }
    }

    // 1. Add to deleted IDs blacklist so initial dataset docs are also hidden
    const deletedIds = (await getDeletedDocIds()) || [];
    if (!deletedIds.includes(docId)) {
      deletedIds.push(docId);
      await setJSON(DELETED_DOCS_KEY, deletedIds, true);
    }

    // 2. Filter from custom vault
    const filtered = customDocs.filter((d: BacDocumentItem) => d.id !== docId);
    await setJSON(VAULT_KEY, filtered, true);

    // 3. Cascading cleanup: bookmarks and associated binary/metadata keys
    try {
      const bookmarks = (await getJSON<string[]>(BOOKMARKS_KEY, false)) || [];
      if (bookmarks.includes(docId)) {
        await setJSON(BOOKMARKS_KEY, bookmarks.filter((id) => id !== docId), false);
      }
      await delKey(`pdf:${docId}`, true);
      await delKey(`pdf:${docId}`, false);
      await delKey(`doc_meta:${docId}`, true);
      await delKey(`doc_meta:${docId}`, false);
    } catch {
      // safe ignore
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting document:", err);
    return { success: false, error: "تعذر حذف الوثيقة" };
  }
}

export async function purgeDocumentsByUsername(username: string): Promise<number> {
  if (!username) return 0;
  try {
    const uNorm = username.toLowerCase();
    const customDocs = (await getJSON<BacDocumentItem[]>(VAULT_KEY, true)) || [];
    const toDelete = customDocs.filter(
      (d: BacDocumentItem) => d.authorUsername && d.authorUsername.toLowerCase() === uNorm
    );
    const deletedIds = (await getDeletedDocIds()) || [];
    toDelete.forEach((d: BacDocumentItem) => {
      if (!deletedIds.includes(d.id)) deletedIds.push(d.id);
    });
    await setJSON(DELETED_DOCS_KEY, deletedIds, true);

    const remaining = customDocs.filter(
      (d: BacDocumentItem) => !d.authorUsername || d.authorUsername.toLowerCase() !== uNorm
    );
    await setJSON(VAULT_KEY, remaining, true);

    // Clean bookmarks and media keys for purged documents
    try {
      const bookmarks = (await getJSON<string[]>(BOOKMARKS_KEY, false)) || [];
      const purgedIdSet = new Set(toDelete.map((d) => d.id));
      const updatedBookmarks = bookmarks.filter((id) => !purgedIdSet.has(id));
      if (updatedBookmarks.length !== bookmarks.length) {
        await setJSON(BOOKMARKS_KEY, updatedBookmarks, false);
      }
      for (const d of toDelete) {
        await delKey(`pdf:${d.id}`, true);
        await delKey(`pdf:${d.id}`, false);
        await delKey(`doc_meta:${d.id}`, true);
        await delKey(`doc_meta:${d.id}`, false);
      }
    } catch {
      // safe ignore
    }

    return toDelete.length;
  } catch (err) {
    console.error("Error purging documents by username:", err);
    return 0;
  }
}

export async function incrementDocDownload(docId: string): Promise<void> {
  try {
    const customDocs = (await getJSON<BacDocumentItem[]>(VAULT_KEY, true)) || [];
    const target = customDocs.find((d: BacDocumentItem) => d.id === docId);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      await setJSON(VAULT_KEY, customDocs, true);
    }
  } catch {
    // silently fail
  }
}

export async function getBookmarkedDocIds(): Promise<string[]> {
  try {
    const list = await getJSON<string[]>(BOOKMARKS_KEY, false);
    return list || [];
  } catch {
    return [];
  }
}

export async function toggleDocBookmark(docId: string): Promise<string[]> {
  try {
    const current = (await getJSON<string[]>(BOOKMARKS_KEY, false)) || [];
    const index = current.indexOf(docId);
    let updated: string[];
    if (index >= 0) {
      updated = current.filter((id) => id !== docId);
    } else {
      updated = [...current, docId];
    }
    await setJSON(BOOKMARKS_KEY, updated, false);
    return updated;
  } catch {
    return [];
  }
}

/**
 * Generates and triggers download of a clean printable PDF / Text document
 */
export function downloadDocumentFile(doc: BacDocumentItem): void {
  if (doc.pdfDataUrl) {
    const a = document.createElement("a");
    a.href = doc.pdfDataUrl;
    a.download = doc.examFileName || `SuperStudent_${doc.title.replace(/[/\\?%*:|"<>]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  if (doc.pdfUrl) {
    window.open(doc.pdfUrl, "_blank");
    return;
  }

  // Generate a valid native PDF Blob
  const blob = generateNativePdfBlob({
    title: doc.title,
    subtitle: `${doc.type?.toUpperCase()} - ${doc.trimestre?.toUpperCase()}`,
    subject: doc.subjectId,
    section: doc.branchIds?.join(", "),
    year: doc.year || 2026,
    author: doc.authorDisplayName || doc.authorName || doc.authorUsername,
    content: doc.contentSnippet || "محتوى الوثيقة قيد التحديث والتدقيق التربوي.",
    isCorrige: false,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.examFileName || `SuperStudent_${doc.title.replace(/[/\\?%*:|"<>]/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Generates and triggers download of the Correction/Solution PDF
 */
export function downloadCorrigeFile(doc: BacDocumentItem): void {
  if (doc.corrigePdfDataUrl) {
    const a = document.createElement("a");
    a.href = doc.corrigePdfDataUrl;
    a.download = doc.corrigeFileName || `SuperStudent_${doc.title.replace(/[/\\?%*:|"<>]/g, "_")}_Corrige.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  if (doc.corrigePdfUrl) {
    window.open(doc.corrigePdfUrl, "_blank");
    return;
  }

  // Generate a valid native PDF Blob for Corrigé
  const blob = generateNativePdfBlob({
    title: doc.title,
    subtitle: "الإصلاح النموذجي والسلّم المعتمد",
    subject: doc.subjectId,
    section: doc.branchIds?.join(", "),
    year: doc.year || 2026,
    author: doc.authorDisplayName || doc.authorName || doc.authorUsername,
    content: doc.contentSnippet || "الإصلاح النموذجي متوفر ومطابق للبرنامج الرسمي.",
    isCorrige: true,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.corrigeFileName || `SuperStudent_${doc.title.replace(/[/\\?%*:|"<>]/g, "_")}_Corrige.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Downloads both the Exam PDF and the Correction PDF in one action
 */
export function downloadBothDocumentFiles(doc: BacDocumentItem): void {
  downloadDocumentFile(doc);
  if (doc.corrigePdfDataUrl || doc.corrigePdfUrl) {
    setTimeout(() => {
      downloadCorrigeFile(doc);
    }, 300);
  }
}

import { generateNativePdfBlob, openInGooglePdfViewer, base64ToPdfBlobUrl } from "../utils/pdfNativeHelper";

export async function getBacDocumentById(id: string): Promise<BacDocumentItem | null> {
  try {
    const docs = await getAllBacDocuments();
    return docs.find((d) => d.id === id) || null;
  } catch {
    return null;
  }
}

/**
 * Resolves a native browser viewable PDF URL for any BacDocumentItem.
 * Returns either a direct HTTP URL, converted Blob URL, or generated PDF Blob URL.
 */
export function resolveNativePdfUrl(doc: BacDocumentItem, isCorrige = false): string {
  const rawUrl = isCorrige
    ? (doc.corrigePdfDataUrl || doc.corrigePdfUrl)
    : (doc.pdfDataUrl || doc.pdfUrl);

  if (rawUrl) {
    if (rawUrl.startsWith("data:application/pdf;base64,")) {
      return base64ToPdfBlobUrl(rawUrl);
    }
    return rawUrl;
  }

  // Generate a valid native PDF Blob for documents containing snippets/exercises
  const blob = generateNativePdfBlob({
    title: doc.title,
    subtitle: isCorrige ? "Correction officielle & Barème de notation" : `${doc.type?.toUpperCase()} - ${doc.trimestre?.toUpperCase()}`,
    subject: doc.subjectId,
    section: doc.branchIds?.join(", "),
    year: doc.year || 2026,
    author: doc.authorDisplayName || doc.authorName || doc.authorUsername,
    content: doc.contentSnippet || "Contenu du document en cours de numérisation.",
    isCorrige,
  });

  return URL.createObjectURL(blob);
}

/**
 * Directly opens any document in a separate browser tab for native browser PDF viewing.
 */
export function openBacDocumentNativePdf(
  doc: BacDocumentItem,
  isCorrige = false,
  e?: React.MouseEvent
): void {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const url = resolveNativePdfUrl(doc, isCorrige);
  openInGooglePdfViewer(url, doc.title);
}

/**
 * Resolves any direct PDF url or base64 Data URL into a direct native-viewable link.
 */
export function resolveDirectViewUrl(
  pdfUrl?: string | null,
  pdfDataUrl?: string | null
): string {
  const activeUrl = pdfDataUrl || pdfUrl;
  if (!activeUrl) return "#";
  if (activeUrl.startsWith("data:application/pdf;base64,")) {
    return base64ToPdfBlobUrl(activeUrl);
  }
  return activeUrl;
}

