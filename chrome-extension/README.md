# Rewise Chrome Extension

This Chrome New Tab extension syncs study topics, categories, and Learning Map
data with the Rewise Firebase workspace. Existing revision features retain the
extension's local-cache fallback when the remote database is unavailable.

Version 2.1.6 adds the customizable Learning Map, Markdown hierarchy import,
category management, completion tracking, colored nesting, and drag-and-drop
reordering/reparenting. The Sheryians ReWise navigation now uses a lion icon.

## Build and install

1. Run `npm install` in this folder.
2. Run `npm run build`.
3. Open `chrome://extensions`, turn on **Developer mode**, and choose **Load unpacked**.
4. Select this folder’s `dist` directory.
