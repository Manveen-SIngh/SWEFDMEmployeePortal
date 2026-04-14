/**
 * AppLayout.tsx
 * -------------
  * The main application layout component.
 *
 * Used in routing:
 * AppLayout is the parent route element for all protected routes.
 * Child pages are rendered via <Outlet /> from React Router.
 * Each page component exports its content — AppLayout provides the frame.
 *
 * ANNOUNCEMENT FLOW:
 * The AnnouncementFlow sequence uses this layout as its background —
 * the announcement renders on top of the layout rather than replacing it.
 */

import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Header from "./Header";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      {/* Fixed left sidebar navigation */}
      <Navbar />

      {/* Main content area — everything to the right of the navbar */}
      <div className="app-layout__main">
        {/* Fixed top header bar */}
        <Header />

        {/* Scrollable page content — rendered by React Router child routes */}
        <main className="app-layout__content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
