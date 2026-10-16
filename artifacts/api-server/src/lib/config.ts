// config.ts
import process from "process";
import path from "path";

export const CACHE_DIR = process.env.LOCAL_CACHE_DIR || path.join(process.cwd(), "local_cache");
export const CACHE_MAX_ITEMS = Number(process.env.LOCAL_CACHE_MAX_ITEMS || 20);
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
export const CATBOX_USERHASH = process.env.CATBOX_USERHASH || "";
export const STORAGE_META_PATH = process.env.STORAGE_META_PATH || path.join(process.cwd(), "storage_meta.json");
