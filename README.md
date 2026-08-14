# Finance Tracker

A private, offline personal-finance tracker. All data is stored **locally on your device** (browser local storage). Nothing is sent anywhere.

The app is organized into three places:

- **Overview** — monthly plan availability, cash after commitments, reminders, budget health, debts, and goals.
- **Log** — confirmed expenses, refunds, debt payments, income, goal contributions, SMS intake, and CSV catch-up import.
- **Manage** — planned-payment reminders, budgets, goals, income plan, categories, cards and loans, preferences, and backup.

Planned payments are reminders only. They never create transactions automatically: use **Log**, **Reschedule**, or **Skip this month** for each occurrence.

## CSV catch-up import

Use **Log → Download CSV template** when you need to catch up on several transactions. After selecting the completed CSV, the app previews every row before saving.

- CSV account values and card endings are hints only.
- Choose **Paid with** inside the app for each expense or refund.
- Choose **Account paid** inside the app for each card or loan payment.
- Category and goal choices come from your current app data.
- Use the bulk selectors to classify several included rows at once.
- Declined transactions stay blocked and possible duplicates start excluded.
- `source_ref` is optional but recommended for reliable duplicate detection.
- A completed batch can be removed with **Undo last import**.

Nothing is written until every included row is valid and you press **Confirm import**.

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

Because the data lives only on your phone, open **Manage → Download a backup** once a month.
The backup file saves to Files / iCloud, and **Restore from Backup** brings it all back if you
ever clear Safari, change phones, or reinstall.
