import React from 'react';
import { formatEstimateMinutes } from '../utils/timeFormat';
import './TaskBubble.css';

const getPriorityFromUrgency = (urgency) => {
  if (urgency === 'red') return 'high';
  if (urgency === 'yellow') return 'medium';
  return 'low';
};

const getPriorityColor = (priority) => {
  if (priority === 'high') return 'priority-high';
  if (priority === 'medium') return 'priority-medium';
  return 'priority-low';
};

const getPriorityText = (priority) => {
  if (priority === 'high') return 'HIGH';
  if (priority === 'medium') return 'MEDIUM';
  return 'LOW';
};

function TaskBubble({ 
  task,
  taskName, 
  urgencyColor, 
  urgency,
  timeBadge, 
  isDragging, 
  onClick,
  assignee,
  dueDate,
  commentCount,
  attachmentCount,
  isGhostHidden
}) {
  const priority = urgency ? getPriorityFromUrgency(urgency) : 'low';
  const priorityColorClass = getPriorityColor(priority);

  // Convert hex color to rgba for subtle glow
  const getGlowRgb = (color) => {
    if (!color) return null;
    const colorMap = {
      '#FF3B30': '255, 59, 48',
      '#FF9F0A': '255, 159, 10',
      '#34C759': '52, 199, 89',
      '#007AFF': '0, 122, 255'
    };
    return colorMap[color] || null;
  };

  const glowRgb = urgencyColor ? getGlowRgb(urgencyColor) : null;
  
  // Don't apply dragging styles if ghost is hidden (to prevent faint duplicate)
  const shouldShowDragging = isDragging && !isGhostHidden;
  const bubbleClassName = `task-bubble ${shouldShowDragging ? 'task-bubble--dragging' : ''} ${isGhostHidden ? 'task-bubble--ghost-hidden' : ''}`;
  const bubbleStyle = {
    ...(glowRgb ? { '--glow-rgb': glowRgb } : {}),
    ...(isGhostHidden ? { 
      visibility: 'hidden',
      pointerEvents: 'none'
    } : {})
  };

  // Get task name from task prop or taskName prop
  const displayName = task?.title || task?.name || taskName || 'Untitled Task';
  
  // Format time badge from task.estimateMinutesTotal or use provided timeBadge
  const displayTimeBadge = timeBadge || (task?.estimateMinutesTotal ? formatEstimateMinutes(task.estimateMinutesTotal) : null);

  return (
    <div 
      className={bubbleClassName}
      onClick={onClick}
      style={bubbleStyle}
    >
      {urgencyColor && (
        <div 
          className={`task-bubble__priority-dot ${priorityColorClass}`}
          style={{ backgroundColor: urgencyColor }}
        />
      )}
      <div className="task-bubble__content">
        <h3 className="task-bubble__title">{displayName}</h3>
        {displayTimeBadge && (
          <span className="task-bubble__duration">{displayTimeBadge}</span>
        )}
      </div>
    </div>
  );
}

export default TaskBubble;

