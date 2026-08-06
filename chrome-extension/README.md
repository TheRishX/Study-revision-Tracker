# Rewise Chrome Extension

This is a standalone, local-only Chrome New Tab extension. It does not connect
to Firebase, a server, or an external database. Topics, categories, revision
history, goals, reflections, settings, and to-dos are saved in this Chrome
profile’s extension storage.

## Build and install

1. Run `npm install` in this folder.
2. Run `npm run build`.
3. Open `chrome://extensions`, turn on **Developer mode**, and choose **Load unpacked**.
4. Select this folder’s `dist` directory.
