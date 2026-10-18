"""SuperStudent storage backend (Cloudflare Python Worker).

Architecture (zero cost):
  * Telegram private channel  -> durable vault (texts + secrets), never public
  * Catbox                    -> PDFs / images (permanent public links)
  * Cloudflare Cache API      -> 1 day for secrets, 7 days for texts, 1 day for files
  * Cloudflare static assets  -> public snapshot (<= 20 files) served with no Worker call
  * Workers KV                -> tiny pointer index only (message ids), never content
"""
