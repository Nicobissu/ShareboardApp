# ShareboardApp

## Requirements

- A local HTTP server such as [http-server](https://www.npmjs.com/package/http-server) or `python -m http.server`.
- A Firebase project. Update `js/firebase-config.js` with your project's credentials.

## Running Locally

1. Clone this repository.
2. Place your Firebase configuration in `ShareboardApp/js/firebase-config.js`.
3. From the `ShareboardApp` directory, start a simple web server. For example:
   ```bash
   npx http-server . -p 8080
   # or
   python3 -m http.server 8080
   ```
4. Open `http://localhost:8080` in your browser and log in or register.

## File Size Limits

Uploads are restricted to keep storage usage reasonable:

- Images added to the canvas must be **5 MB or smaller**.
- Local documents loaded in the sidebar must be **10 MB or smaller**.

Refer to `js/document-manager.js` for the exact checks.

## Troubleshooting

If loading a canvas fails you may see an alert containing a Firebase error code
such as `permission-denied` or `unavailable`. This message now includes the
specific code or network error from Firestore. Verify your internet connection
and check Firestore permissions if the problem persists.
