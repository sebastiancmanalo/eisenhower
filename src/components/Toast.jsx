import React from 'react';

function Toast({ message, onUndo, onDismiss }) {
  return (
    <div className="app__toast" data-testid="toast">
      <span>{message}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          style={{
            marginLeft: '16px',
            padding: '4px 12px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Undo
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginLeft: '8px',
            padding: '4px 12px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Toast;

