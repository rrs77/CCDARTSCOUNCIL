CREATIVE CURRICULUM DESIGNER — PROMO PAGE FOR DREAMHOST
=========================================================

WHAT THIS IS
------------
A single self-contained HTML page that displays the CCD promo film
full-bleed in a 16:9 frame on any browser. It loads the live promo
from its published URL via an iframe, which means:

  - You upload this file to DreamHost ONCE.
  - Whenever the promo is updated and re-published in Replit, the
    page on your DreamHost site shows the new version automatically.
  - You never have to re-upload anything to update the content.


ONE-TIME SETUP (5 MINUTES)
--------------------------

STEP 1 — Get your published promo URL
  Open the Replit workspace and press Publish on the
  "Creative Curriculum Designer — Promo" artifact.
  You'll be given a public URL such as:
      https://ccd-promo.replit.app/

STEP 2 — Edit ONE line of index.html
  Open index.html in any text editor (Notepad, TextEdit, VS Code,
  whatever you have). Find this line near the middle:

      src="https://YOUR-PROMO-URL.replit.app/"

  Replace YOUR-PROMO-URL with your real published URL from step 1.
  Save the file.

STEP 3 — Upload to DreamHost
  Using the DreamHost file manager (Websites → Files → File Manager)
  or any FTP/SFTP client (Cyberduck, FileZilla, Transmit), upload
  index.html into the folder you want to serve it from. For example:

      yoursite.com/promo/index.html

  Visit that URL in a browser and the promo will play.


UPDATING THE PROMO LATER
------------------------
You DON'T need to touch DreamHost again.

  1. Make whatever changes you want to the promo in Replit.
  2. Press Publish again.
  3. Refresh the DreamHost page — the new version is already there.


CHOOSING WHERE IT LIVES ON YOUR SITE
------------------------------------
You can put it anywhere. Common choices:

  yoursite.com/promo/        ← upload index.html into a /promo/ folder
  yoursite.com/film/         ← upload index.html into a /film/ folder
  yoursite.com/index.html    ← only do this if the promo IS the homepage

If you want the promo to live INSIDE another page on your site
(for example, embedded in the middle of a longer marketing page),
you don't need this index.html file at all. Instead paste this
snippet into the page wherever you want the video to appear:

  <iframe
    src="https://YOUR-PROMO-URL.replit.app/"
    style="width:100%; aspect-ratio:16/9; border:0;"
    allow="autoplay; fullscreen"
    allowfullscreen
  ></iframe>


TROUBLESHOOTING
---------------
"The promo couldn't load."
  → The iframe URL is wrong, or the promo hasn't been published yet.
    Re-check the src="..." line in index.html.

The page is blank on mobile.
  → Make sure you uploaded the WHOLE file, not just a snippet.

I want to take it down temporarily.
  → Either rename index.html to index.html.off, or in Replit click
    "Stop" on the published deployment. The page will show the
    fallback "couldn't load" message.
