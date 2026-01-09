import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImportConfirmDialog.css';

function ImportConfirmDialog({ isOpen, incomingCount, onReplace, onMerge, onCancel }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="import-confirm-dialog">
      <div
        className="import-confirm-dialog__backdrop"
        onClick={onCancel}
        data-testid="import-confirm-backdrop"
      />
      <div
        className="import-confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-confirm-title"
        data-testid="import-confirm-panel"
      >
        <h2 id="import-confirm-title" className="import-confirm-dialog__title">
          Import tasks
        </h2>
        <p className="import-confirm-dialog__message">
          Incoming: {incomingCount} task{incomingCount !== 1 ? 's' : ''}
        </p>
        <div className="import-confirm-dialog__actions">
          <button
            type="button"
            className="import-confirm-dialog__button import-confirm-dialog__button--replace"
            onClick={onReplace}
            data-testid="import-confirm-replace"
          >
            Replace
          </button>
          <button
            type="button"
            className="import-confirm-dialog__button import-confirm-dialog__button--merge"
            onClick={onMerge}
            data-testid="import-confirm-merge"
          >
            Merge
          </button>
          <button
            type="button"
            className="import-confirm-dialog__button import-confirm-dialog__button--cancel"
            onClick={onCancel}
            data-testid="import-confirm-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImportConfirmDialog;

