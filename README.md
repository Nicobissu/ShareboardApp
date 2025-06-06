# ShareboardApp

Shareboard is a simple whiteboard and document annotation tool built with
HTML, CSS and vanilla JavaScript. In this version the backend is a small
Node.js server with SQLite used to store uploaded PDF notes. Authentication has
been removed in favour of a local flow. The application consists of a login
page, a register/reset password flow and a canvas page where you can draw,
upload PDFs or capture PDF pages onto the board.

## Requirements

- Node.js with the dependencies listed in `backend/package.json` to run the
  local server that now serves both the API and the web application.

## Setup

1. Clone this repository.
2. From the `backend` directory run `npm install` and then `node server.js` to
   start the server on `http://localhost:3000`.
3. Open `http://localhost:3000` in your browser and register an account or log
   in with an existing one.

## Overview

- **Authentication** – Registration, login and password reset are handled
  localmente sin servicios externos.
- **Whiteboard** – A Fabric.js canvas provides drawing tools, image support and
  undo/redo functionality.
- **Documents** – Upload PDFs or text files, view them in a dedicated page and
  capture pages onto the canvas for annotation.

## File Size Limits

Uploads are restricted to keep storage usage reasonable:

- Images added to the canvas must be **5 MB or smaller**.

Refer to `js/document-manager.js` for the exact checks.

## Troubleshooting

If loading a canvas fails, check the browser console for any network errors or
messages from the local API server.
