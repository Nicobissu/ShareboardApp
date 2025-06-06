# ShareboardApp

Shareboard is a simple whiteboard and document annotation tool built with
HTML, CSS and vanilla JavaScript. Firebase is used for authentication and to
persist drawings and uploaded files. The application consists of a login page,
a register/reset password flow and a canvas page where you can draw, upload
PDFs or capture PDF pages onto the board.

## Requirements

- Node.js or Python to serve the static files locally using a lightweight web
  server such as [http-server](https://www.npmjs.com/package/http-server) or
  `python -m http.server`.
- A Firebase project. Your own credentials must be added to
  `ShareboardApp/js/firebase-config.js`.

## Setup

1. Clone this repository.
2. Replace the example Firebase configuration in
   `ShareboardApp/js/firebase-config.js` with the credentials from your Firebase
   console. The file should contain something similar to:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. From the `ShareboardApp` directory, start a local web server:

   ```bash
   npx http-server . -p 8080
   # or
   python3 -m http.server 8080
   ```

4. Open `http://localhost:8080` in your browser and register an account or log
   in with an existing one.

## Overview

- **Authentication** – Registration, login and password reset are handled via
  Firebase Authentication.
- **Whiteboard** – A Fabric.js canvas provides drawing tools, image support and
  undo/redo functionality.
- **Documents** – Upload PDFs or text files, view them in a dedicated page and
  capture pages onto the canvas for annotation.

## File Size Limits

Uploads are restricted to keep storage usage reasonable:

- Images added to the canvas must be **5 MB or smaller**.
 - Local documents loaded in the sidebar must be **20 MB or smaller**.

Refer to `js/document-manager.js` for the exact checks.

## Troubleshooting

If loading a canvas fails you may see an alert containing a Firebase error code
such as `permission-denied` or `unavailable`. This message now includes the
specific code or network error from Firestore. Verify your internet connection
and check Firestore permissions if the problem persists.
