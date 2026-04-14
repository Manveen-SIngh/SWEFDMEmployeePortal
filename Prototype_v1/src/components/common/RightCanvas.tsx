/**
 * RightCanvas.tsx
 * ---------------
 * A reusable slide-in overlay panel that appears from the right edge of the screen.
 * Used consistently across the portal for all form submissions and editing flows.
 *
 *
 * @param isOpen    - Whether the canvas is currently visible
 * @param onClose   - Callback invoked when the user closes the canvas
 * @param title     - Heading shown in the canvas header bar
 * @param children  - Form content rendered in the scrollable body
 * @param footer    - Optional footer content (typically action buttons)
 * @param width     - Optional override for canvas width (default: var(--canvas-width))
 */

import React, { useEffect } from "react";
import "./RightCanvas.css";

interface RightCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export default function RightCanvas({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width,
}: RightCanvasProps) {
  // -------------------------------------------------------------------------
  // Keyboard: close on Escape
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // -------------------------------------------------------------------------
  // Body scroll lock while canvas is open
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent overlay — click to close */}
      <div
        className="right-canvas__overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Canvas panel */}
      <div
        className="right-canvas"
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Fixed header */}
        <div className="right-canvas__header">
          <h2 className="right-canvas__title">{title}</h2>
          <button
            className="right-canvas__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="right-canvas__body">{children}</div>

        {/* Optional fixed footer */}
        {footer && (
          <div className="right-canvas__footer">{footer}</div>
        )}
      </div>
    </>
  );
}
