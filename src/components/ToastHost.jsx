import React from 'react';
import './ToastHost.css';

function ToastHost({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-host">
      {toasts.map((toast, index) => {
        const toneClass = toast.tone ? `toast--${toast.tone}` : 'toast--neutral';
        const durationMs = toast.durationMs || 3000;
        
        return (
          <div
            key={toast.id}
            className={`toast ${toneClass}`}
            style={{
              '--toast-index': index,
              '--toast-duration': `${durationMs}ms`
            }}
          >
            <div className="toastContent">
              <span className="toast__message">{toast.message}</span>
              {toast.onUndo && (
                <button
                  onClick={toast.onUndo}
                  className="toast__undo"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                className="toast__dismiss"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ToastHost;





