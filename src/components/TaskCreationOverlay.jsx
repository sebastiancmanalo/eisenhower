import React, { useState } from 'react';
import './TaskCreationOverlay.css';

function TaskCreationOverlay({ isOpen, onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [priority, setPriority] = useState('');
  const [estimateHours, setEstimateHours] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const taskData = {
      title: title.trim(),
      urgent,
      important,
      ...(priority.trim() && { priority: priority.trim() }),
      ...(estimateHours !== '' && { estimateHours: estimateHours.toString() }),
      ...(estimateMinutes !== '' && { estimateMinutes: estimateMinutes.toString() })
    };

    onSubmit(taskData);
    
    // Reset form
    setTitle('');
    setUrgent(false);
    setImportant(false);
    setPriority('');
    setEstimateHours('');
    setEstimateMinutes('');
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setUrgent(false);
    setImportant(false);
    setPriority('');
    setEstimateHours('');
    setEstimateMinutes('');
    onClose();
  };

  return (
    <div className="task-creation-overlay">
      <div className="task-creation-overlay__backdrop" onClick={handleCancel} />
      <div className="task-creation-overlay__modal">
        <form className="task-creation-overlay__form" onSubmit={handleSubmit}>
          <h2 className="task-creation-overlay__title">Create New Task</h2>
          
          <div className="task-creation-overlay__field">
            <label htmlFor="title" className="task-creation-overlay__label">
              Title <span className="task-creation-overlay__required">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="task-creation-overlay__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="task-creation-overlay__field">
            <label className="task-creation-overlay__checkbox-label">
              <input
                type="checkbox"
                className="task-creation-overlay__checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
              />
              <span>Urgent</span>
            </label>
          </div>

          <div className="task-creation-overlay__field">
            <label className="task-creation-overlay__checkbox-label">
              <input
                type="checkbox"
                className="task-creation-overlay__checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
              />
              <span>Important</span>
            </label>
          </div>

          <div className="task-creation-overlay__field">
            <label htmlFor="priority" className="task-creation-overlay__label">
              Priority
            </label>
            <input
              id="priority"
              type="text"
              className="task-creation-overlay__input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="e.g., high, medium, low"
            />
          </div>

          <div className="task-creation-overlay__field">
            <label className="task-creation-overlay__label">
              Estimate
            </label>
            <div className="task-creation-overlay__estimate-group">
              <div className="task-creation-overlay__estimate-field">
                <label htmlFor="estimateHours" className="task-creation-overlay__estimate-label">
                  Hours
                </label>
                <input
                  id="estimateHours"
                  type="number"
                  className="task-creation-overlay__input task-creation-overlay__input--estimate"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
              <div className="task-creation-overlay__estimate-field">
                <label htmlFor="estimateMinutes" className="task-creation-overlay__estimate-label">
                  Minutes
                </label>
                <input
                  id="estimateMinutes"
                  type="number"
                  className="task-creation-overlay__input task-creation-overlay__input--estimate"
                  value={estimateMinutes}
                  onChange={(e) => setEstimateMinutes(e.target.value)}
                  min="0"
                  max="59"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="task-creation-overlay__actions">
            <button
              type="button"
              className="task-creation-overlay__button task-creation-overlay__button--cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="task-creation-overlay__button task-creation-overlay__button--submit"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskCreationOverlay;

