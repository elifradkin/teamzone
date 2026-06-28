# Draft — Permission request to Motra

Review, edit the bracketed fields, and send from your own email. Recipient:
**hello@motra.com** (the contact address in Motra's Terms of Service and Privacy
Policy). This requests the written permission referenced in Motra ToS §8
("…without written permission from us").

---

**To:** hello@motra.com
**Subject:** Permission request — server-side use of the Motra per-user MCP in a personal fitness app

Hi Motra team,

I'm building a personal, bilingual (Hebrew/English) fitness and nutrition app for
myself and a small group of users. It creates original muscle-effort and recovery
visualizations from each user's own training numbers (muscle groups, sets,
volume, RPE) — it does not copy or re-host any Motra UI, artwork, or content.

I'd like each of my users to connect their own Motra Pro account through your MCP
(`https://mcp.motra.com/mcp`) so the app can read **only that user's own**
workout data, with their explicit authorization via your OAuth flow. To power the
visualizations, my server would retrieve and store each consenting user's own
data in their account within my app.

I understand from your Terms of Service (§8) that systematic/automated retrieval
and storage of data via the Services requires your written permission. I'm
writing to request that permission, and to ask:

1. Do you permit server-side, per-user access to the MCP where each user
   authorizes access to their own data, for an app like this?
2. Are there conditions I should follow (rate limits, attribution, data
   retention/deletion expectations, token-refresh handling, non-commercial vs.
   commercial terms)?
3. Is there a developer agreement, API terms, or partner program I should sign
   or apply to?

Some details about how I handle data, in case it helps: users consent explicitly;
access tokens are encrypted at rest and never logged; users can revoke and delete
their connection and data at any time; data is hosted in the EU; and the app also
works without Motra (manual entry), so this is strictly opt-in for users who
choose to connect.

Happy to share more about the project or hop on a call. Thank you for considering
this — I'd much rather build on top of Motra the right way.

Best regards,
[Your name]
[Your email]
[Optional: link to the project or a short description]
