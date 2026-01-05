import React from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import './AssignmentCountdownOverlay.css';

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'draggable-task',
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`assignment-overlay__task-card ${isDragging ? 'assignment-overlay__task-card--dragging' : ''}`}
      data-testid="assignment-draggable"
    >
      {task.title}
    </div>
  );
}

function DroppableZone({ id, label, onAssignQuadrant }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const handleClick = () => {
    if (onAssignQuadrant) {
      onAssignQuadrant(id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`assignment-overlay__zone ${isOver ? 'assignment-overlay__zone--over' : ''}`}
      data-testid={`dropzone-${id}`}
      onClick={handleClick}
    >
      {label}
    </div>
  );
}

function AssignmentCountdownOverlay({ isOpen, task, secondsLeft, onAssignQuadrant, onClose }) {
  if (!isOpen || !task) {
    return null;
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && over.id) {
      const quadrantId = over.id;
      if (['Q1', 'Q2', 'Q3', 'Q4'].includes(quadrantId)) {
        onAssignQuadrant(quadrantId);
      }
    }
  };

  return (
    <div className="assignment-overlay" data-testid="assignment-overlay">
      <div className="assignment-overlay__backdrop" onClick={onClose} data-testid="assignment-overlay-backdrop" />
      <div className="assignment-overlay__content">
        <h2 className="assignment-overlay__title">Assign task</h2>
        
        <div className="assignment-overlay__task-title">{task.title}</div>
        
        <div className="assignment-overlay__countdown" data-testid="assignment-countdown">{secondsLeft}s</div>
        
        <DndContext onDragEnd={handleDragEnd}>
          <div className="assignment-overlay__drag-area">
            <DraggableTask task={task} />
          </div>
          
          <div className="assignment-overlay__zones">
            <DroppableZone id="Q1" label="Q1" onAssignQuadrant={onAssignQuadrant} />
            <DroppableZone id="Q2" label="Q2" onAssignQuadrant={onAssignQuadrant} />
            <DroppableZone id="Q3" label="Q3" onAssignQuadrant={onAssignQuadrant} />
            <DroppableZone id="Q4" label="Q4" onAssignQuadrant={onAssignQuadrant} />
          </div>
        </DndContext>
      </div>
    </div>
  );
}

export default AssignmentCountdownOverlay;

