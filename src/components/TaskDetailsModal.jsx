import React, { useState, useEffect } from 'react';
import { getQuadrant } from '../utils/taskLogic.js';
import './TaskDetailsModal.css';

function TaskDetailsModal({ task, isOpen, onClose, onUpdateTask, onDeleteTask, onCompleteTask, startInEdit = false }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    urgent: false,
    important: false,
    priority: '',
    estimateHours: '',
    estimateMinutes: '',
    dueDate: '',
    notificationFrequency: null
  });

  // Initialize form when task changes or modal opens
  useEffect(() => {
    if (task && isOpen) {
      const hours = task.estimateMinutesTotal ? Math.floor(task.estimateMinutesTotal / 60) : '';
      const minutes = task.estimateMinutesTotal ? task.estimateMinutesTotal % 60 : '';
      
      // Convert ISO string to YYYY-MM-DD format for date input
      let dueDateValue = '';
      if (task.dueDate) {
        const dateObj = new Date(task.dueDate);
        if (!isNaN(dateObj.getTime())) {
          dueDateValue = dateObj.toISOString().split('T')[0];
        }
      }
      
      setEditForm({
        title: task.title || '',
        urgent: task.urgent || false,
        important: task.important || false,
        priority: task.priority || '',
        estimateHours: hours.toString(),
        estimateMinutes: minutes.toString(),
        dueDate: dueDateValue,
        notificationFrequency: task.notificationFrequency || null
      });
      setIsEditMode(startInEdit);
      setShowDeleteConfirm(false);
    }
  }, [task, isOpen, startInEdit]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditMode) {
          setIsEditMode(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isEditMode, showDeleteConfirm, onClose]);

  // Focus modal on open
  useEffect(() => {
    if (isOpen && task) {
      const modal = document.querySelector('[data-testid="task-modal"]');
      if (modal) {
        modal.focus();
      }
    }
  }, [isOpen, task]);

  if (!isOpen || !task) {
    return null;
  }

  const quadrant = getQuadrant(task);
  const quadrantLabels = {
    'Q1': 'Do First (Urgent & Important)',
    'Q2': 'Schedule (Important, Not Urgent)',
    'Q3': 'Delegate (Urgent, Not Important)',
    'Q4': 'Delete (Not Important, Not Urgent)'
  };

  const formatTime = (estimateMinutesTotal) => {
    if (!estimateMinutesTotal || estimateMinutesTotal <= 0) return 'Not set';
    if (estimateMinutesTotal >= 60) {
      const hours = Math.floor(estimateMinutesTotal / 60);
      const minutes = estimateMinutesTotal % 60;
      return minutes > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${hours}h`;
    }
    return `${estimateMinutesTotal}m`;
  };

  const handleSave = () => {
    const hours = editForm.estimateHours ? parseInt(editForm.estimateHours, 10) : 0;
    const minutes = editForm.estimateMinutes ? parseInt(editForm.estimateMinutes, 10) : 0;
    const totalMinutes = hours * 60 + minutes;

    // Normalize dueDate: if it's a date string like "2026-01-08", convert to ISO string at end of day (local time)
    let dueDate = editForm.dueDate || null;
    if (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') {
      // If it's just a date (YYYY-MM-DD), treat as end of day local time
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        const dateObj = new Date(dueDate);
        dateObj.setHours(23, 59, 59, 999);
        dueDate = dateObj.toISOString();
      }
      // Otherwise, assume it's already a valid ISO string
    } else {
      dueDate = null;
    }

    const updatedFields = {
      title: editForm.title.trim(),
      urgent: editForm.urgent,
      important: editForm.important,
      estimateMinutesTotal: totalMinutes > 0 ? totalMinutes : null,
      dueDate: dueDate,
      notificationFrequency: editForm.notificationFrequency || null,
      ...(editForm.priority.trim() && { priority: editForm.priority.trim() })
    };

    // Remove priority if empty
    if (!editForm.priority.trim()) {
      updatedFields.priority = null;
    }

    onUpdateTask(task.id, updatedFields);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    // Reset form to original task values
    const hours = task.estimateMinutesTotal ? Math.floor(task.estimateMinutesTotal / 60) : '';
    const minutes = task.estimateMinutesTotal ? task.estimateMinutesTotal % 60 : '';
    
    // Convert ISO string to YYYY-MM-DD format for date input
    let dueDateValue = '';
    if (task.dueDate) {
      const dateObj = new Date(task.dueDate);
      if (!isNaN(dateObj.getTime())) {
        dueDateValue = dateObj.toISOString().split('T')[0];
      }
    }
    
    setEditForm({
      title: task.title || '',
      urgent: task.urgent || false,
      important: task.important || false,
      priority: task.priority || '',
      estimateHours: hours.toString(),
      estimateMinutes: minutes.toString(),
      dueDate: dueDateValue,
      notificationFrequency: task.notificationFrequency || null
    });
    setIsEditMode(false);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDeleteTask(task.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleComplete = () => {
    onCompleteTask(task.id);
  };

  return (
    <div className="task-details-modal">
      <div 
        className="task-details-modal__backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="task-details-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        data-testid="task-modal"
        tabIndex={-1}
      >
        <button
          className="task-details-modal__close-button"
          onClick={onClose}
          aria-label="Close"
          data-testid="close-button"
          type="button"
        >
          ×
        </button>
        
        <div className="task-details-modal__content">
          {isEditMode ? (
            <>
              <div className="task-details-modal__header">
                <h2 id="task-modal-title" className="task-details-modal__title">
                  Edit Task
                </h2>
              </div>
              
              <div className="task-details-modal__field">
                <label htmlFor="edit-title" className="task-details-modal__label">
                  Title <span className="task-details-modal__required">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  className="task-details-modal__input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  autoFocus
                  data-testid="edit-title-input"
                />
              </div>

              <div className="task-details-modal__field">
                <label className="task-details-modal__checkbox-label">
                  <input
                    type="checkbox"
                    className="task-details-modal__checkbox"
                    checked={editForm.urgent}
                    onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })}
                    data-testid="edit-urgent-checkbox"
                  />
                  <span>Urgent</span>
                </label>
              </div>

              <div className="task-details-modal__field">
                <label className="task-details-modal__checkbox-label">
                  <input
                    type="checkbox"
                    className="task-details-modal__checkbox"
                    checked={editForm.important}
                    onChange={(e) => setEditForm({ ...editForm, important: e.target.checked })}
                    data-testid="edit-important-checkbox"
                  />
                  <span>Important</span>
                </label>
              </div>

              <div className="task-details-modal__field">
                <label htmlFor="edit-priority" className="task-details-modal__label">
                  Priority
                </label>
                <input
                  id="edit-priority"
                  type="text"
                  className="task-details-modal__input"
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  placeholder="e.g., high, medium, low"
                  data-testid="edit-priority-input"
                />
              </div>

              <div className="task-details-modal__field">
                <label className="task-details-modal__label">
                  Estimate
                </label>
                <div className="task-details-modal__estimate-group">
                  <div className="task-details-modal__estimate-field">
                    <label htmlFor="edit-estimateHours" className="task-details-modal__estimate-label">
                      Hours
                    </label>
                    <input
                      id="edit-estimateHours"
                      type="number"
                      className="task-details-modal__input task-details-modal__input--estimate"
                      value={editForm.estimateHours}
                      onChange={(e) => setEditForm({ ...editForm, estimateHours: e.target.value })}
                      min="0"
                      step="1"
                      data-testid="edit-estimate-hours-input"
                    />
                  </div>
                  <div className="task-details-modal__estimate-field">
                    <label htmlFor="edit-estimateMinutes" className="task-details-modal__estimate-label">
                      Minutes
                    </label>
                    <input
                      id="edit-estimateMinutes"
                      type="number"
                      className="task-details-modal__input task-details-modal__input--estimate"
                      value={editForm.estimateMinutes}
                      onChange={(e) => setEditForm({ ...editForm, estimateMinutes: e.target.value })}
                      min="0"
                      max="59"
                      step="1"
                      data-testid="edit-estimate-minutes-input"
                    />
                  </div>
                </div>
              </div>

              <div className="task-details-modal__field">
                <label htmlFor="edit-dueDate" className="task-details-modal__label">
                  Due date
                </label>
                <input
                  id="edit-dueDate"
                  type="date"
                  className="task-details-modal__input"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  data-testid="edit-due-date-input"
                />
              </div>

              <div className="task-details-modal__field">
                <label className="task-details-modal__label">
                  Reminder frequency
                </label>
                <div className="task-details-modal__frequency-group">
                  <button
                    type="button"
                    className={`task-details-modal__frequency-button ${editForm.notificationFrequency === 'low' ? 'task-details-modal__frequency-button--active' : ''}`}
                    onClick={() => setEditForm({ ...editForm, notificationFrequency: 'low' })}
                    data-testid="edit-frequency-low-button"
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    className={`task-details-modal__frequency-button ${editForm.notificationFrequency === 'medium' ? 'task-details-modal__frequency-button--active' : ''}`}
                    onClick={() => setEditForm({ ...editForm, notificationFrequency: 'medium' })}
                    data-testid="edit-frequency-medium-button"
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    className={`task-details-modal__frequency-button ${editForm.notificationFrequency === 'high' ? 'task-details-modal__frequency-button--active' : ''}`}
                    onClick={() => setEditForm({ ...editForm, notificationFrequency: 'high' })}
                    data-testid="edit-frequency-high-button"
                  >
                    High
                  </button>
                </div>
              </div>

              <div className="task-details-modal__actions">
                <button
                  type="button"
                  className="task-details-modal__button task-details-modal__button--cancel"
                  onClick={handleCancel}
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="task-details-modal__button task-details-modal__button--save"
                  onClick={handleSave}
                  disabled={!editForm.title.trim()}
                  data-testid="save-button"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="task-details-modal__header">
                <h2 id="task-modal-title" className="task-details-modal__title">
                  {task.title || 'Untitled Task'}
                </h2>
                <button
                  className="task-details-modal__edit-button"
                  onClick={() => setIsEditMode(true)}
                  aria-label="Edit task"
                  data-testid="edit-button"
                  type="button"
                >
                  Edit
                </button>
              </div>

              <div className="task-details-modal__info">
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Quadrant</span>
                  <span className="task-details-modal__info-value">{quadrantLabels[quadrant]}</span>
                </div>
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Urgent</span>
                  <span className="task-details-modal__info-value">{task.urgent ? 'Yes' : 'No'}</span>
                </div>
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Important</span>
                  <span className="task-details-modal__info-value">{task.important ? 'Yes' : 'No'}</span>
                </div>
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Estimate</span>
                  <span className="task-details-modal__info-value">{formatTime(task.estimateMinutesTotal)}</span>
                </div>
                {task.priority && (
                  <div className="task-details-modal__info-row">
                    <span className="task-details-modal__info-label">Priority</span>
                    <span className="task-details-modal__info-value">{task.priority}</span>
                  </div>
                )}
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Due date</span>
                  <span className="task-details-modal__info-value">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                  </span>
                </div>
                <div className="task-details-modal__info-row">
                  <span className="task-details-modal__info-label">Reminder frequency</span>
                  <span className="task-details-modal__info-value">
                    {task.notificationFrequency ? (task.notificationFrequency.charAt(0).toUpperCase() + task.notificationFrequency.slice(1)) : 'None'}
                  </span>
                </div>
              </div>

              {showDeleteConfirm ? (
                <div className="task-details-modal__delete-confirm">
                  <p className="task-details-modal__delete-text">Delete this task?</p>
                  <div className="task-details-modal__actions">
                    <button
                      type="button"
                      className="task-details-modal__button task-details-modal__button--cancel"
                      onClick={() => setShowDeleteConfirm(false)}
                      data-testid="delete-cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="task-details-modal__button task-details-modal__button--delete"
                      onClick={handleDelete}
                      data-testid="delete-confirm-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="task-details-modal__actions">
                  <button
                    type="button"
                    className="task-details-modal__button task-details-modal__button--complete"
                    onClick={handleComplete}
                    data-testid="complete-button"
                  >
                    Mark complete
                  </button>
                  <button
                    type="button"
                    className="task-details-modal__button task-details-modal__button--delete"
                    onClick={handleDelete}
                    data-testid="delete-button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetailsModal;

