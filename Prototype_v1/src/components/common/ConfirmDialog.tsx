// reusable confirmation dialog
// updated to support mandatory text input for audit logging

import React, { useEffect, useState } from "react";

// @ts-ignore
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel: string;
  requireInput?: boolean;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  danger = false,
  confirmLabel,
  requireInput = false,
  inputPlaceholder = "enter reason...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  // close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleConfirm = () => {
    if (requireInput && !inputValue.trim()) return;
    onConfirm(inputValue.trim());
  };

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
            <h3 
              id="confirm-title" 
              className="confirm-dialog__title"
            >
              {title}
            </h3>
            <p className="confirm-dialog__message">
              {message}
            </p>
            
            {requireInput && (
              <div className="confirm-dialog__input-wrap">
                <input
                  type="text"
                  className="confirm-dialog__input"
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                />
              </div>
            )}
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
            onClick={handleConfirm}
            disabled={requireInput && !inputValue.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}