import React from 'react';
import './PageDots.css';

function PageDots({ active, onSelect }) {
  return (
    <div className="page-dots" data-testid="page-dots">
      <button
        className={`page-dots__dot ${active === 'matrix' ? 'page-dots__dot--active' : ''}`}
        onClick={() => onSelect && onSelect('matrix')}
        aria-label="Show Matrix view"
        data-testid="page-dot-matrix"
        type="button"
      />
      <button
        className={`page-dots__dot ${active === 'rightNow' ? 'page-dots__dot--active' : ''}`}
        onClick={() => onSelect && onSelect('rightNow')}
        aria-label="Show Right Now view"
        data-testid="page-dot-rightNow"
        type="button"
      />
    </div>
  );
}

export default PageDots;

