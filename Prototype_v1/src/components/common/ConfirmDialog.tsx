// reusable confirmation dialog for destructive actions
// renders as a centred modal overlay

import React, { useEffect } from "react";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  danger = false,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <>
      <div 
        className="confirm-dialog__overlay" 
        onClick={onCancel} 
      />
      <div 
        className="confirm-dialog" 
        role="alertdialog" 
        aria-modal="true" 
        aria-labelledby="confirm-title"
      >
        <div className="confirm-dialog__content">
          <div 
            className={`confirm-dialog__icon ${
              danger ? "confirm-dialog__icon--danger" : "confirm-dialog__icon--info"
            }`}
          >
            {danger ? (
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : (
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>

          <div className="confirm-dialog__text">
            <h3 id="confirm-title" className="confirm-dialog__title">
              {title}
            </h3>
            <p className="confirm-dialog__message">
              {message}
            </p>
          </div>
        </div>

        <div className="confirm-dialog__actions">
          <button 
            className="btn btn--secondary" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}