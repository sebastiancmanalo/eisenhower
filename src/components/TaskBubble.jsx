import React from 'react';
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
  taskName, 
  urgencyColor, 
  urgency,
  timeBadge, 
  isDragging, 
  onClick,
  onContextMenu,
  assignee,
  dueDate,
  commentCount,
  attachmentCount,
  isGhostHidden
}) {
  const priority = urgency ? getPriorityFromUrgency(urgency) : 'low';
  const priorityColorClass = getPriorityColor(priority);

  // Map urgency label to CSS variable color
  const getUrgencyColorVar = (urgencyLabel) => {
    if (!urgencyLabel) return null;
    const colorMap = {
      'red': 'var(--urgency-red)',
      'yellow': 'var(--urgency-yellow)',
      'green': 'var(--urgency-green)'
    };
    return colorMap[urgencyLabel] || null;
  };

  // Get RGB values for glow effect
  // Maps urgency labels and hex colors to RGB strings
  const getGlowRgb = (urgencyLabel, color) => {
    // If urgency label is provided, use it for RGB mapping
    if (urgencyLabel) {
      const rgbMap = {
        'red': '255, 59, 48',
        'yellow': '255, 159, 10',
        'green': '52, 199, 89'
      };
      return rgbMap[urgencyLabel] || null;
    }
    // Fallback to hex color mapping
    if (color) {
      const colorMap = {
        '#FF3B30': '255, 59, 48',
        '#FF9F0A': '255, 159, 10',
        '#34C759': '52, 199, 89',
        '#007AFF': '0, 122, 255'
      };
      return colorMap[color] || null;
    }
    return null;
  };

  // Determine indicator color: use CSS variable if urgency exists, else fallback to urgencyColor
  const indicatorColor = urgency ? getUrgencyColorVar(urgency) : urgencyColor;
  const glowRgb = getGlowRgb(urgency, urgencyColor);
  
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

  return (
    <div 
      className={bubbleClassName}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${taskName}`}
      style={bubbleStyle}
    >
      {indicatorColor && (
        <div 
          className={`task-bubble__priority-dot ${priorityColorClass}`}
          style={{ backgroundColor: indicatorColor }}
          data-testid="task-urgency-indicator"
        />
      )}
      <div className="task-bubble__content">
        <h3 className="task-bubble__title">{taskName}</h3>
        {timeBadge && (
          <span className="task-bubble__duration">{timeBadge}</span>
        )}
      </div>
    </div>
  );
}

export default TaskBubble;

