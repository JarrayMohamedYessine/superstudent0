---
name: Superstudent product scope
description: User-stated storage, Discord, language, and copy requirements for this app.
---

**Rules & Architecture:**
- **No Google Drive:** Google Drive has been completely removed. Do not import, reference, or use Google Drive anywhere.
- **No Notifications button:** The notifications button/bell was removed 2 months ago. Do not add notification bells or alerts to navigation or TopBar.
- **No Logout on Home:** Do not place a logout/sign-out button on the home page or TopBar.
- **Documents Bank (بنك الوثائق):** Keep the original authentic design of the document bank without fake files, provider badges (e.g., Telegram proxy / Drive badges), or intrusive sub-tabs.
- **Storage & Retrieval:** Keep browser cache independent from Telegram backend worker. Read browser cache directly; when data is missing, ask the worker to fetch it and populate the browser cache.
- **Discord:** Keep all Discord access on one dedicated site page with server invite, app downloads, and chat rooms.
- **Localization:** Support Arabic (with proper RTL), French, and English cleanly without artificial AI jargon.