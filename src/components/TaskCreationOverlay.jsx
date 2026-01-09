import React, { useState, useEffect, useRef } from 'react';
import { getQuadrant } from '../utils/taskLogic.js';
import './TaskCreationOverlay.css';

function TaskCreationOverlay({ isOpen, onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [priority, setPriority] = useState('');
  const [estimateHours, setEstimateHours] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notificationFrequency, setNotificationFrequency] = useState(null);
  const userManuallySetFrequency = useRef(false);

  // Update default frequency based on quadrant, unless user manually set it
  useEffect(() => {
    if (!userManuallySetFrequency.current) {
      const quadrant = getQuadrant({ urgent, important });
      let defaultFrequency = null;
      if (quadrant === 'Q1') {
        defaultFrequency = 'high';
      } else if (quadrant === 'Q2') {
        defaultFrequency = 'medium';
      } else {
        defaultFrequency = 'low';
      }
      setNotificationFrequency(defaultFrequency);
    }
  }, [urgent, important]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setUrgent(false);
      setImportant(false);
      setPriority('');
      setEstimateHours('');
      setEstimateMinutes('');
      setDueDate('');
      setNotificationFrequency(null);
      userManuallySetFrequency.current = false;
    }
  }, [isOpen]);

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
      ...(estimateMinutes !== '' && { estimateMinutes: estimateMinutes.toString() }),
      dueDate: dueDate || null,
      notificationFrequency: notificationFrequency || null
    };

    onSubmit(taskData);
    
    // Form reset is handled by useEffect when isOpen changes
  };

  const handleCancel = () => {
    // Form reset is handled by useEffect when isOpen changes
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

          <div className="task-creation-overlay__field">
            <label htmlFor="dueDate" className="task-creation-overlay__label">
              Due date
            </label>
            <input
              id="dueDate"
              type="date"
              className="task-creation-overlay__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="task-creation-overlay__field">
            <label className="task-creation-overlay__label">
              Reminder frequency
            </label>
            <div className="task-creation-overlay__frequency-group">
              <button
                type="button"
                className={`task-creation-overlay__frequency-button ${notificationFrequency === 'low' ? 'task-creation-overlay__frequency-button--active' : ''}`}
                onClick={() => {
                  userManuallySetFrequency.current = true;
                  setNotificationFrequency('low');
                }}
              >
                Low
              </button>
              <button
                type="button"
                className={`task-creation-overlay__frequency-button ${notificationFrequency === 'medium' ? 'task-creation-overlay__frequency-button--active' : ''}`}
                onClick={() => {
                  userManuallySetFrequency.current = true;
                  setNotificationFrequency('medium');
                }}
              >
                Medium
              </button>
              <button
                type="button"
                className={`task-creation-overlay__frequency-button ${notificationFrequency === 'high' ? 'task-creation-overlay__frequency-button--active' : ''}`}
                onClick={() => {
                  userManuallySetFrequency.current = true;
                  setNotificationFrequency('high');
                }}
              >
                High
              </button>
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

