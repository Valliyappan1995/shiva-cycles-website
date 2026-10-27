SHIVA CYCLES TEST WEBSITE — BEGINNER SETUP
=========================================

WHAT IS INCLUDED
- Responsive bicycle catalogue homepage
- WhatsApp enquiry links
- Meta Pixel placeholder
- Browser events: PageView, ViewContent, Contact
- Cloudflare Pages Function endpoint for Meta Conversions API
- Shared event IDs intended for Pixel/CAPI deduplication

IMPORTANT
- This is a starter template, not yet connected to your Meta account.
- Replace YOUR_PIXEL_ID in index.html with your actual Pixel ID.
- Add secrets in Cloudflare dashboard; NEVER put the CAPI token in index.html or GitHub.
- Do not send this starter live for advertising until you have tested it.
- Confirm product photos, pricing, shop address and phone number before public launch.
- Current visuals use emoji-style placeholders, not actual product photos.

STEP A — CREATE A GITHUB REPOSITORY
1. Sign in at https://github.com
2. Click + (top right) > New repository.
3. Name it shiva-cycles-website
4. Choose Public (fine for this template because no secrets are included).
5. Click Create repository.
6. On the repository page, click "uploading an existing file".
7. Upload index.html, styles.css, and the functions folder (including api/event.js).
   If GitHub web upload does not preserve folders, create functions/api/event.js using
   Add file > Create new file and enter the path exactly.
8. Click Commit changes.

STEP B — DEPLOY ON CLOUDFLARE PAGES
1. Sign in at https://dash.cloudflare.com
2. Go to Workers & Pages > Create > Pages > Connect to Git.
3. Connect GitHub and select shiva-cycles-website.
4. For a plain HTML site, use no framework.
5. Set build command to blank / none.
6. Set build output directory to / (or the repository root, depending on the current UI).
7. Deploy. Cloudflare should provide a *.pages.dev address.
8. Open the website and confirm the homepage appears.

STEP C — CONFIGURE META PIXEL
1. In Meta Events Manager, open your website Pixel/dataset.
2. Copy the Pixel ID.
3. In GitHub, edit index.html and replace YOUR_PIXEL_ID with the numeric ID.
4. The template already fires PageView once with a shared event ID for browser/server
   deduplication. Do not add a second fbq('track', 'PageView') line.
5. Commit the change; Cloudflare will redeploy.

STEP D — CONFIGURE CAPI SECRETS IN CLOUDFLARE
Open Cloudflare Dashboard > Workers & Pages > your Pages project > Settings >
Variables and Secrets. Add these runtime variables/secrets:

- META_PIXEL_ID = your numeric Meta Pixel ID (plain variable is fine)
- META_CAPI_TOKEN = your Meta Conversions API access token (mark as SECRET / encrypted)
- META_API_VERSION = v26.0 (if Meta's current docs specify a newer supported version, use that)
- META_TEST_EVENT_CODE = your test event code from Events Manager (optional; remove after testing)

Save and redeploy if requested. Never commit the CAPI token to GitHub or send it in chat.

STEP E — TEST
1. In Meta Events Manager, open your dataset > Test Events.
2. Copy the test event code and add it as META_TEST_EVENT_CODE in Cloudflare.
3. Visit the public site in a new browser tab.
4. Open the product enquiry buttons and WhatsApp links.
5. In Test Events, check PageView, ViewContent, and Contact.
6. Browser and server versions should share the same event ID to allow deduplication.
7. Remove META_TEST_EVENT_CODE after testing so normal events are not sent as test events.

TROUBLESHOOTING
- If browser events do not appear, check the Pixel ID and use Meta Pixel Helper.
- If server events do not appear, verify Cloudflare runtime variables and the function route /api/event.
- Check Cloudflare Pages Functions logs for errors; do not expose access tokens.
- If Meta API version v26.0 is not supported by your account/API status, use the current supported version shown in Meta's official documentation.
- WhatsApp clicks are Contact click events, not proof that a message was sent.
- This demo does not collect email/phone hashes. Add customer matching only if there is a clear lawful basis and proper privacy notice.

FREE-TIER NOTE
Cloudflare's free plan has usage limits and platform terms can change. Review the current plan limits before running large ad campaigns.
