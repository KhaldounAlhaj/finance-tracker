# Finance Tracker

A private, offline personal-finance tracker. All data is stored **locally on your device** (browser local storage). Nothing is sent anywhere.

## Put it online (free) with GitHub Pages

1. Go to **github.com** and create a new **public** repository, e.g. `finance-tracker`.
2. Click **Add file → Upload files**, then drag in **all** of these files:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-180.png`
   - `icon-192.png`
   - `icon-512.png`
3. Commit the upload.
4. Open the repo's **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **Deploy from a branch**.
6. Branch: **main**, folder: **/ (root)**. Save.
7. Wait ~1 minute. Your live link appears at the top:
   `https://YOUR-USERNAME.github.io/finance-tracker/`

## Add it to your iPhone home screen

1. Open that link in **Safari** (must be Safari).
2. Tap the **Share** button (square with the up arrow).
3. Tap **Add to Home Screen**.
4. Name it "Finance" and tap **Add**.

It now opens full-screen like a real app, works offline, and remembers your data.

## Updating the app later

- Edit `index.html` directly on GitHub (pencil icon) and commit.
- In `sw.js`, bump the version line `const CACHE = "finance-v1";` to `"finance-v2"`, etc., so phones pick up the change.
- Reopen the app on your phone while online once — it refreshes automatically.

## Important — back up your data

Because the data lives only on your phone, open **Settings → Download Backup** once a month.
The backup file saves to Files / iCloud, and **Restore from Backup** brings it all back if you
ever clear Safari, change phones, or reinstall.
