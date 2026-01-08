import React, { useState, useEffect } from 'react';
import { getQuadrant } from '../utils/taskLogic.js';
import { formatEstimateMinutes } from '../utils/timeFormat.js';
import { sortTasksForRightNow } from '../utils/rightNowSort.js';
import './RightNowView.css';

const HELPER_TEXTS = [
  'Quick wins first, then what matters most.',
  'Your next best move — sorted for momentum.'
];

function RightNowView({ tasks, onTaskClick, onComplete }) {
  // Randomly select helper text once on mount, stable during component lifecycle
  const [helperText] = useState(() => {
    const randomIndex = Math.floor(Math.random() * HELPER_TEXTS.length);
    return HELPER_TEXTS[randomIndex];
  });

  // Animation state for helper text fade-in
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion (with safe fallback for test environments)
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Show immediately if user prefers reduced motion
      setShowHelper(true);
      return;
    }

    // Otherwise, delay fade-in by ~120ms
    const timer = setTimeout(() => {
      setShowHelper(true);
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Filter out completed tasks and sort
  const activeTasks = tasks.filter(task => !task.completedAt);
  const sortedTasks = sortTasksForRightNow(activeTasks);

  const quadrantLabels = {
    'Q1': 'Q1',
    'Q2': 'Q2',
    'Q3': 'Q3',
    'Q4': 'Q4'
  };

  const quadrantColors = {
    'Q1': '#FF3B30',
    'Q2': '#007AFF',
    'Q3': '#FF9F0A',
    'Q4': '#8E8E93'
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="right-now-view" data-testid="right-now-view">
        <div className="right-now-view__header">
          <h1 className="right-now-view__title">Right Now</h1>
          <p 
            className={`right-now-view__helper ${showHelper ? 'right-now-view__helper--visible' : ''}`}
            data-testid="right-now-helper"
          >
            {helperText}
          </p>
        </div>
        <div className="right-now-view__empty">
          <div className="right-now-view__empty-check">✓</div>
          <p className="right-now-view__empty-title">All done!</p>
          <p className="right-now-view__empty-subtext">No active tasks right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="right-now-view" data-testid="right-now-view">
      <div className="right-now-view__header">
        <h1 className="right-now-view__title">Right Now</h1>
        <p 
          className={`right-now-view__helper ${showHelper ? 'right-now-view__helper--visible' : ''}`}
          data-testid="right-now-helper"
        >
          {helperText}
        </p>
      </div>
      <div className="right-now-view__list">
        {sortedTasks.map((task) => {
          const quadrant = getQuadrant(task);
          const estimate = formatEstimateMinutes(task.estimateMinutesTotal);

          return (
            <div
              key={task.id}
              className="right-now-view__item"
              onClick={() => onTaskClick && onTaskClick(task)}
              data-testid={`right-now-task-${task.id}`}
            >
              <div className="right-now-view__item-content">
                <div className="right-now-view__item-main">
                  <div className="right-now-view__item-title">{task.title || 'Untitled Task'}</div>
                  <div className="right-now-view__item-meta">
                    <span
                      className="right-now-view__quadrant-indicator"
                      style={{ color: quadrantColors[quadrant] }}
                      data-testid={`right-now-quadrant-${task.id}`}
                    >
                      {quadrantLabels[quadrant]}
                    </span>
                    {estimate && (
                      <span className="right-now-view__estimate-badge" data-testid={`right-now-estimate-${task.id}`}>
                        {estimate}
                      </span>
                    )}
                    {task.priority && (
                      <span className="right-now-view__priority-badge" data-testid={`right-now-priority-${task.id}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="right-now-view__complete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete && onComplete(task.id);
                  }}
                  data-testid={`right-now-complete-${task.id}`}
                  aria-label={`Mark ${task.title || 'task'} as complete`}
                  type="button"
                >
                  ✓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RightNowView;

