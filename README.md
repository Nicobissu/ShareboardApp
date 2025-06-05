# ShareboardApp

This project is a simple Firebase-based web application. To test it locally you need to serve the files over HTTP.

## Running a local server

1. Install a static server, for example with Node.js:

   ```
   npm install -g http-server
   ```

   Or use Python's built-in server:

   ```
   python -m http.server
   ```

2. From the repository root run the server pointing to the `ShareboardApp` directory:

   ```
   http-server ShareboardApp
   ```

   or

   ```
   python -m http.server --directory ShareboardApp
   ```

3. Open `index.html` in your browser via the served address, e.g. `http://localhost:8080/index.html`.

## Firebase credentials

Firebase configuration is stored in `ShareboardApp/js/firebase-config.js`. Replace the placeholders there with your own project settings before running the app.
