# ReWise 3.0 Chrome Extension

This Chrome New Tab extension syncs study topics, categories, and Learning Map
data with the Rewise Firebase workspace. Existing revision features retain the
extension's local-cache fallback when the remote database is unavailable.

Version 3.0.0 includes the customizable Learning Map, Markdown hierarchy import,
category management, completion tracking, colored nesting, and drag-and-drop
reordering/reparenting. It also adds the focused Tomorrow planner with 2–4 timed
tasks, progress, completion celebrations, and plan archives. The Sheryians ReWise
navigation uses a lion icon.

## Build and install

1. Run `npm install` in this folder.
2. Run `npm run build`.
3. Open `chrome://extensions`, turn on **Developer mode**, and choose **Load unpacked**.
4. Select this folder’s `dist` directory, or unzip `ReWise-3.0.0.zip` and select
   the extracted folder.
