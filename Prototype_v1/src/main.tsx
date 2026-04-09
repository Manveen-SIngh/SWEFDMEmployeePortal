/**
 * main.tsx
 * --------
 * The React application entry point.
 *
 * This file is the first JavaScript executed in the browser.
 * It does three things:
 *   1. Imports global CSS (must come before React imports so styles are available
 *      to all components from the very first render)
 *   2. Imports the root App component and React
 *   3. Mounts the React application into the #root div in index.html
 *
 */

import React from "react";
import ReactDOM from "react-dom/client";

/* Global styles — must be imported first so CSS custom properties (variables)
   are defined before any component stylesheets load. */
import "./styles/global.css";

import App from "./App";

/* Find the root div in index.html — this is where React mounts the application.
   The non-null assertion (!) is safe because we know #root exists in index.html. */
const rootElement = document.getElementById("root")!;

/* Create the React root and render the application.
   createRoot is the React 18 concurrent-mode API. */
/*
  The App component is the topmost React component.
  It contains:
    - AuthProvider (global auth state)
    - NotificationProvider (global notification state)
    - RouterProvider (all page routes)
*/
ReactDOM.createRoot(rootElement).render(<App />);
