import express, { type IRouter, type Request, type Response } from "express";
import { DiskLRUCache, CatboxProvider, TelegramProvider, computeSha256, MetaStore } from "../lib/storage";
import multer from "multer";

const router: IRouter = express.Router();
const upload = multer();

const CACHE = new DiskLRUCache();
const METASTORE = new MetaStore();
const CATBOX = new CatboxProvider();
const TG = new TelegramProvider();

// init once (best-effort)
(async () => {
  try {
    await CACHE.init();
    await METASTORE.init();
  } catch (e) {
    // ignore; will attempt on-demand
    console.error("Storage init error", e);
  }
})();

// Upload endpoint
router.post("/documents/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const file = req.file;
    const filename = file.originalname || "upload.pdf";
    if (!filename.toLowerCase().endsWith(".pdf")) return res.status(400).json({ error: "only pdf allowed" });
    const buffer = file.buffer as Buffer;
    const sha = computeSha256(buffer);
    const existing = METASTORE.getBySha(sha);
    if (existing) {
      return res.json({ id: existing.sha256, url: existing.externalUrl, cached: true });
    }
    // upload to catbox primarily
    const uploaded = await CATBOX.uploadFile(filename, buffer);
    const rec = {
      id: uploaded.url,
      sha256: sha,
      provider: "catbox",
      providerId: uploaded.url,
      externalUrl: uploaded.url,
      mime: "application/pdf",
      createdAt: Date.now(),
      ttl: 86400,
    };
    await METASTORE.upsert(rec as any);
    await CACHE.set(sha, buffer);
    return res.json({ id: sha, url: uploaded.url, cached: false });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Serve PDF by sha
router.get("/documents/:id/pdf", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // check cache
    const cached = await CACHE.get(id);
    if (cached) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=\"${id}.pdf\"`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=604800, stale-while-revalidate=60, stale-if-error=86400");
      return res.send(cached);
    }
    // lookup meta
    const rec = METASTORE.getBySha(id);
    if (!rec) {
      // fallback: if id looks like URL, try fetch
      if (id.startsWith("http://") || id.startsWith("https://") || id.startsWith("tg://")) {
        // attempt to fetch via providers
      } else {
        return res.status(404).send("Not found");
      }
    }
    let content: Buffer | null = null;
    if (rec?.provider === "catbox") {
      content = await CATBOX.downloadFile(rec.externalUrl);
    } else if (rec?.provider === "telegram") {
      content = await TG.downloadFile(rec.providerId);
    }
    if (!content) return res.status(404).send("Not found");
    // cache and return
    await CACHE.set(id, content);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"${id}.pdf\"`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=604800, stale-while-revalidate=60, stale-if-error=86400");
    return res.send(content);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(String(e?.message || e));
  }
});

export default router;
