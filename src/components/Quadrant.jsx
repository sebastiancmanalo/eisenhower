import React from 'react';
import TaskBubble from './TaskBubble';
import './Quadrant.css';

function Quadrant({ title, subtitle, backgroundColor, boxShadow, tasks, onTaskClick, renderTask, testId }) {
  const isEmpty = !tasks || tasks.length === 0;

  return (
    <div 
      className="quadrant"
      style={{
        backgroundColor: backgroundColor,
        boxShadow: boxShadow,
      }}
      data-testid={testId}
    >
      <div className="quadrant-header">
        <h2 className="quadrant-title">{title}</h2>
        <p className="quadrant-subtitle">{subtitle}</p>
      </div>
      
      {isEmpty ? (
        <div className="quadrant-empty">
          <div className="quadrant-empty-icon">✓</div>
          <p className="quadrant-empty-title">All clear!</p>
          <p className="quadrant-empty-suggestion">
            Want to get ahead on something important?
          </p>
        </div>
      ) : (
        <div className="quadrant-tasks">
          {tasks.map((task, index) => {
            if (typeof renderTask === 'function') {
              return renderTask(task, index);
            }
            return (
              <TaskBubble
                key={task.id || index}
                task={task}
                onClick={() => onTaskClick && onTaskClick(task)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Quadrant;

