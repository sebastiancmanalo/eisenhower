import React from 'react';
import TaskBubble from './TaskBubble.jsx';
import DraggableTask from './DraggableTask.jsx';
import './Quadrant.css';

const urgencyColors = {
  red: '#FF3B30',
  yellow: '#FF9F0A',
  green: '#34C759'
};

function Quadrant({ title, subtitle, backgroundColor, tasks, onTaskClick, isDropActive, activeDragTaskId, emptyTitle, emptySubtext, emptyHint }) {
  const isEmpty = !tasks || tasks.length === 0;

  const quadrantMap = {
    'Do First': 'Q1',
    'Schedule': 'Q2',
    'Delegate': 'Q3',
    'Delete': 'Q4'
  };
  const quadrantId = quadrantMap[title] || title;

  const quadrantClassName = `quadrant${isDropActive ? ' quadrant--drop-active' : ''}`;

  const defaultEmptyTitle = 'Clear';
  const defaultEmptySubtext = 'Nothing urgent here.';

  return (
    <div 
      className={quadrantClassName}
      style={{ backgroundColor: backgroundColor }}
      data-testid={`quadrant-${quadrantId}`}
    >
      <div className="quadrant-header">
        <h2 className="quadrant-title">
          {title}
          <span className="quadrant-separator"> • </span>
          <span className="quadrant-subtitle">{subtitle}</span>
        </h2>
      </div>
      
      {isEmpty ? (
        <div className="quadrant-empty">
          <div className="quadrant-empty-check">✓</div>
          <p className="quadrant-empty-title">{emptyTitle || defaultEmptyTitle}</p>
          <p className="quadrant-empty-subtext">{emptySubtext || defaultEmptySubtext}</p>
          {emptyHint && <p className="quadrant-empty-hint">{emptyHint}</p>}
        </div>
      ) : (
        <div className="quadrant-tasks">
          {tasks.map((task, index) => {
            // Map urgent/important to urgency color for display
            const getUrgencyFromTask = (task) => {
              if (task.urgent && task.important) return 'red';
              if (task.important && !task.urgent) return 'yellow';
              if (task.urgent && !task.important) return 'yellow';
              return 'green';
            };
            const urgency = getUrgencyFromTask(task);
            const urgencyColor = urgencyColors[urgency];
            // Format estimateMinutesTotal: "Xh Ym" if >= 60, "Nm" if < 60
            const formatTime = (estimateMinutesTotal) => {
              if (!estimateMinutesTotal || estimateMinutesTotal <= 0) return undefined;
              if (estimateMinutesTotal >= 60) {
                const hours = Math.floor(estimateMinutesTotal / 60);
                const minutes = estimateMinutesTotal % 60;
                return minutes > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${hours}h`;
              }
              return `${estimateMinutesTotal}m`;
            };
            const taskIdString = String(task.id || index);
            const isGhostHidden = activeDragTaskId && String(activeDragTaskId) === taskIdString;
            
            return (
              <DraggableTask key={task.id || index} id={taskIdString} isGhostHidden={isGhostHidden}>
                <TaskBubble
                  taskName={task.title || 'Untitled Task'}
                  urgency={urgency}
                  urgencyColor={urgencyColor}
                  timeBadge={formatTime(task.estimateMinutesTotal)}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  isGhostHidden={isGhostHidden}
                />
              </DraggableTask>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Quadrant;

