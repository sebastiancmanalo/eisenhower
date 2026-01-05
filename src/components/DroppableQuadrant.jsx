import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import './DroppableQuadrant.css';

function DroppableQuadrant({ id, children, className, style }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const dropzoneClassName = isOver ? 'dropzone dropzone--over' : 'dropzone';
  const combinedClassName = className
    ? `${className} ${dropzoneClassName}`
    : dropzoneClassName;

  return (
    <div
      ref={setNodeRef}
      className={combinedClassName}
      style={style}
      data-testid={`dropzone-${id}`}
      tabIndex={-1}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { isDropActive: isOver })
        : children}
    </div>
  );
}

export default DroppableQuadrant;

