import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import './DraggableTask.css';

function DraggableTask({ id, children, isGhostHidden }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  // Don't apply transform when ghost is hidden (prevents visible artifact)
  const style = transform && !isGhostHidden
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)${isDragging ? ' scale(0.98)' : ''}`,
      }
    : {};

  const className = `draggable-task${isDragging ? ' draggable-task--dragging' : ''}${isGhostHidden ? ' draggable-task--ghost-hidden' : ''}`;

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      {...listeners}
      {...attributes}
      data-testid={`draggable-${id}`}
      tabIndex={-1}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { isDragging: isDragging && !isGhostHidden })
        : children}
    </div>
  );
}

export default DraggableTask;

