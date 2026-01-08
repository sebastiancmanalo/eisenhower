import React from 'react';
import './FloatingActionButton.css';

function FloatingActionButton({ onClick }) {
  return (
    <button 
      className="floating-action-button"
      onClick={onClick}
      type="button"
      aria-label="Add new task"
    >
      <span className="floating-action-button__icon">+</span>
    </button>
  );
}

export default FloatingActionButton;






