import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Quadrant from './components/Quadrant.jsx';
import DroppableQuadrant from './components/DroppableQuadrant.jsx';
import TaskBubble from './components/TaskBubble.jsx';
import FloatingActionButton from './components/FloatingActionButton.jsx';
import TaskCreationOverlay from './components/TaskCreationOverlay.jsx';
import AssignmentCountdownOverlay from './components/AssignmentCountdownOverlay.jsx';
import TaskDetailsModal from './components/TaskDetailsModal.jsx';
import RightNowView from './components/RightNowView.jsx';
import PageDots from './components/PageDots.jsx';
import ToastHost from './components/ToastHost.jsx';
import SettingsMenu from './components/SettingsMenu.jsx';
import ImportConfirmDialog from './components/ImportConfirmDialog.jsx';
import { getQuadrant } from './utils/taskLogic.js';
import { getDeadlineUrgency } from './utils/deadlineUrgency.js';
import { normalizeTask } from './utils/normalizeTask.js';
import * as TaskRepository from './data/repository/TaskRepository.js';
import { getSession } from './data/session/SessionStore.js';
import { updateTaskSyncFields } from './utils/updateTaskSyncFields.js';
import { serializeTasksForExport, parseImportedTasks, mergeTasks } from './data/transfer/taskTransfer.js';
import { loadPreferences, savePreferences } from './notifications/notificationPreferences.js';
import { scheduleNext } from './notifications/NotificationScheduler.js';
import { show as showInAppNotification } from './notifications/InAppNotifier.js';
import { show as showBrowserNotification, requestPermission as requestBrowserPermission, getPermissionStatus } from './notifications/BrowserNotifier.js';
import { shouldDriftToQ1 } from './notifications/notificationRules.js';
import './styles/tokens.css';
import './styles/global.css';
import './App.css';

function App({ initialTasks, __test_onDragEnd }) {
  const defaultTasks = [
    { id: 1, title: "Finish design mockups", urgent: true, important: true, estimate: "~30m", createdAt: Date.now(), dueDate: null, notificationFrequency: 'high' },
    { id: 2, title: "Email stakeholder", urgent: false, important: true, createdAt: Date.now(), dueDate: null, notificationFrequency: 'medium' }
  ];
  
  // Track session state for reloading tasks on change
  const [session, setSession] = useState(() => getSession());
  
  const [tasks, setTasks] = useState(() => {
    // If initialTasks provided (test mode), use them directly
    if (initialTasks != null) {
      return initialTasks;
    }
    // Otherwise start with empty array, will load async
    return [];
  });
  
  // Track if we've loaded tasks from storage
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);
  
  // Helper to check if we should persist (not in test mode)
  const isTestOrInjected = initialTasks != null;
  
  // Load tasks from storage on mount or when session changes (unless in test mode)
  useEffect(() => {
    if (isTestOrInjected) {
      setHasLoadedTasks(true);
      return;
    }
    
    let cancelled = false;
    
    const loadInitialTasks = async () => {
      try {
        const { tasks: loadedTasks } = await TaskRepository.loadTasks();
        if (cancelled) return;
        
        if (loadedTasks && loadedTasks.length > 0) {
          setTasks(loadedTasks);
        } else {
          // No tasks in storage, use defaults
          setTasks(defaultTasks);
        }
        setHasLoadedTasks(true);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load tasks:', error);
        setTasks(defaultTasks);
        setHasLoadedTasks(true);
      }
    };
    
    loadInitialTasks();
    
    return () => {
      cancelled = true;
    };
  }, [isTestOrInjected, session]);
  
  // Configure drag sensor with activation constraint (requires 8px movement before drag starts)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingAssignmentTaskId, setPendingAssignmentTaskId] = useState(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [assignmentSecondsLeft, setAssignmentSecondsLeft] = useState(10);
  const [toasts, setToasts] = useState([]);
  const [activeDragTaskId, setActiveDragTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [startModalInEditMode, setStartModalInEditMode] = useState(false);
  const [view, setView] = useState('matrix'); // 'matrix' | 'rightNow'
  const toastTimeoutsRef = useRef(new Map());
  const pendingAssignmentSnapshotRef = useRef(null);
  
  // Import confirmation dialog state
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportedTasks, setPendingImportedTasks] = useState(null);
  
  // Notification system state
  const [notificationPreferences, setNotificationPreferences] = useState(() => loadPreferences());
  const [firedNotifications, setFiredNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('eisenhower.firedNotifications.v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Keep only last 500 entries
        const entries = Object.entries(parsed);
        if (entries.length > 500) {
          const sorted = entries.sort((a, b) => new Date(b[1]) - new Date(a[1]));
          return Object.fromEntries(sorted.slice(0, 500));
        }
        return parsed;
      }
      return {};
    } catch (error) {
      console.error('Failed to load fired notifications:', error);
      return {};
    }
  });

  const pushToast = ({ message, tone = "neutral", durationMs = 3000, key = null, meta = {}, onUndo = null }) => {
    if (key === "move") {
      // Find existing move toast
      setToasts(prev => {
        const existing = prev.find(t => t.key === "move");
        
        if (existing) {
          // Build a NEW Set from existing.movedTaskIds
          const nextSet = new Set(existing.movedTaskIds ?? []);
          
          // If meta.taskId exists, add it
          if (meta?.taskId) {
            nextSet.add(String(meta.taskId));
          }
          
          // Compute count from Set size
          const nextCount = nextSet.size;
          
          // Get next destination
          const nextDest = meta?.lastDest ?? existing.lastDest;
          
          // Build message
          const nextMessage = `Moved ${nextCount} task${nextCount === 1 ? "" : "s"} → ${nextDest}`;
          
          // Increment version
          const nextVersion = (existing.version ?? 0) + 1;
          
          // Collect undo handlers: existing ones + new one
          const existingUndoHandlers = existing.undoHandlers ?? [];
          const newUndoHandler = meta?.undoHandler;
          const nextUndoHandlers = newUndoHandler 
            ? [...existingUndoHandlers, newUndoHandler]
            : existingUndoHandlers;
          
          // Create combined undo handler if we have any
          const combinedUndoHandler = nextUndoHandlers.length > 0
            ? () => {
                nextUndoHandlers.forEach(handler => handler());
              }
            : null;
          
          // Refresh timer
          const existingTimeout = toastTimeoutsRef.current.get(existing.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            toastTimeoutsRef.current.delete(existing.id);
          }
          
          const timerId = setTimeout(() => {
            dismissToast(existing.id);
          }, durationMs);
          toastTimeoutsRef.current.set(existing.id, timerId);
          
          // Update toast immutably
          return prev.map(t =>
            t.id === existing.id
              ? { 
                  ...t, 
                  movedTaskIds: Array.from(nextSet), 
                  lastDest: nextDest, 
                  message: nextMessage, 
                  version: nextVersion, 
                  durationMs,
                  undoHandlers: nextUndoHandlers,
                  onUndo: combinedUndoHandler
                }
              : t
          );
        } else {
          // Create new move toast
          const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
          const taskId = meta?.taskId ? String(meta.taskId) : null;
          const movedTaskIds = taskId ? [taskId] : [];
          const nextCount = movedTaskIds.length || 1;
          const lastDest = meta?.lastDest;
          const version = 0;
          
          const nextMessage = lastDest
            ? `Moved ${nextCount} task${nextCount === 1 ? "" : "s"} → ${lastDest}`
            : message || `Moved ${nextCount} task`;
          
          // Collect undo handler from meta
          const undoHandler = meta?.undoHandler;
          const undoHandlers = undoHandler ? [undoHandler] : [];
          
          const newToast = { 
            id, 
            key: "move",
            tone, 
            durationMs, 
            movedTaskIds, 
            lastDest, 
            version, 
            message: nextMessage,
            undoHandlers: undoHandlers,
            onUndo: undoHandler || null
          };
          
          const timerId = setTimeout(() => {
            dismissToast(id);
          }, durationMs);
          toastTimeoutsRef.current.set(id, timerId);
          
          return [...prev, newToast];
        }
      });
      return null;
    } else if (key) {
      // Other keyed toasts (if any) - keep existing behavior
      const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const newToast = { id, message, tone, durationMs, key, onUndo };
      
      setToasts(prev => [...prev, newToast]);
      
      const timerId = setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      
      toastTimeoutsRef.current.set(id, timerId);
      
      return id;
    } else {
      // Non-keyed toast (existing behavior)
      const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const newToast = { id, message, tone, durationMs, onUndo };
      
      setToasts(prev => [...prev, newToast]);
      
      const timerId = setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      
      toastTimeoutsRef.current.set(id, timerId);
      
      return id;
    }
  };

  const dismissToast = (id) => {
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
    
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!isAssignmentOpen) {
      return;
    }

    // Capture snapshot when assignment overlay opens
    if (pendingAssignmentTaskId) {
      const pendingTask = tasks.find(task => task.id === pendingAssignmentTaskId);
      if (pendingTask) {
        pendingAssignmentSnapshotRef.current = {
          id: pendingTask.id,
          urgent: pendingTask.urgent,
          important: pendingTask.important
        };
      }
    }

    const intervalId = setInterval(() => {
      setAssignmentSecondsLeft((prev) => {
        if (prev <= 1) {
          const pendingTask = tasks.find(task => task.id === pendingAssignmentTaskId);
          if (pendingTask) {
            const previousSnapshot = pendingAssignmentSnapshotRef.current;
            const previousQuadrant = previousSnapshot 
              ? getQuadrant({ urgent: previousSnapshot.urgent, important: previousSnapshot.important })
              : null;
            const currentQuadrant = getQuadrant(pendingTask);
            
            setIsAssignmentOpen(false);
            setPendingAssignmentTaskId(null);
            pendingAssignmentSnapshotRef.current = null;
            
            // Only show toast if quadrant actually changed
            if (previousQuadrant && previousQuadrant !== currentQuadrant) {
              const undoHandler = () => {
              setTasks(prevTasks =>
                prevTasks.map(task =>
                  task.id === previousSnapshot.id
                    ? updateTaskSyncFields({ ...task, urgent: previousSnapshot.urgent, important: previousSnapshot.important })
                    : task
                )
              );
              };
              
              pushToast({ 
                message: `Auto-placed in ${currentQuadrant}`, 
                tone: "neutral",
                durationMs: 5000,
                onUndo: undoHandler
              });
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isAssignmentOpen, pendingAssignmentTaskId, tasks]);

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach(timerId => {
        clearTimeout(timerId);
      });
      toastTimeoutsRef.current.clear();
    };
  }, []);

  // Handle auth state changes - reload tasks when session changes
  const handleAuthStateChange = () => {
    if (isTestOrInjected) {
      return;
    }
    
    // Update session state (triggers reload via useEffect)
    const newSession = getSession();
    setSession(newSession);
    
    // Reload tasks from new scope
    TaskRepository.loadTasks().then(({ tasks: loadedTasks }) => {
      if (loadedTasks && loadedTasks.length > 0) {
        setTasks(loadedTasks);
      } else {
        setTasks(defaultTasks);
      }
      
      // Show toast based on session state
      if (newSession.isSignedIn) {
        const shortUserId = newSession.userId ? newSession.userId.substring(0, 12) + '...' : 'user';
        pushToast({ message: `Signed in as ${shortUserId}`, tone: "success" });
      } else {
        pushToast({ message: "Signed out", tone: "neutral" });
      }
    }).catch((error) => {
      console.error('Failed to reload tasks:', error);
    });
  };

  // Debounced save to storage when tasks change (unless in test mode or not yet loaded)
  const saveDebounceRef = useRef(null);
  
  useEffect(() => {
    // Don't save if in test mode or not loaded yet
    // Note: We allow saving empty arrays after load completes (user deleted all tasks)
    if (isTestOrInjected || !hasLoadedTasks) {
      return;
    }
    
    // Clear existing timeout
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    
    // Set new timeout for debounced save (250ms debounce, within 150-300ms range)
    saveDebounceRef.current = setTimeout(async () => {
      try {
        await TaskRepository.saveTasks(tasks);
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    }, 250);
    
    // Cleanup timeout on unmount or when tasks change before timeout
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [tasks, isTestOrInjected, hasLoadedTasks]);

  // Arrow key navigation for view switching
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore key events when focused element is input/textarea/select or contentEditable
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // ArrowLeft => setView("matrix")
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setView('matrix');
      }
      // ArrowRight => setView("rightNow")
      else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setView('rightNow');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notification system tick - runs every 60 seconds and on visibility change
  useEffect(() => {
    if (isTestOrInjected) {
      return; // Skip in test mode
    }

    const runNotificationTick = () => {
      const now = new Date();
      const activeTasks = tasks.filter(task => !task.completedAt && !task.deletedAt);
      
      // Get planned notifications
      const planned = scheduleNext(activeTasks, notificationPreferences, now, firedNotifications);
      
      // Process each planned notification
      for (const notification of planned) {
        const fireAt = new Date(notification.fireAtISO);
        const nowTime = now.getTime();
        const fireTime = fireAt.getTime();
        
        // Check if notification should fire (within 1 minute tolerance)
        if (fireTime <= nowTime + 60000) {
          // Check if already fired
          if (firedNotifications[notification.id]) {
            continue;
          }
          
          // Mark as fired
          setFiredNotifications(prev => {
            const next = { ...prev, [notification.id]: now.toISOString() };
            
            // Persist to localStorage (keep last 500)
            try {
              const entries = Object.entries(next);
              const toStore = entries.length > 500
                ? Object.fromEntries(
                    entries.sort((a, b) => new Date(b[1]) - new Date(a[1])).slice(0, 500)
                  )
                : next;
              localStorage.setItem('eisenhower.firedNotifications.v1', JSON.stringify(toStore));
            } catch (error) {
              console.error('Failed to save fired notifications:', error);
            }
            
            return next;
          });
          
          // Handle drift notifications
          if (notification.type === 'drift') {
            const task = activeTasks.find(t => t.id === notification.taskId);
            if (task && shouldDriftToQ1(task, now)) {
              // Auto-move task to Q1
              setTasks(prevTasks =>
                prevTasks.map(t =>
                  t.id === task.id
                    ? updateTaskSyncFields({ ...t, urgent: true, important: true })
                    : t
                )
              );
            }
          }
          
          // Show in-app notification if enabled
          if (notificationPreferences.inAppReminders) {
            showInAppNotification(notification, pushToast);
          }
          
          // Show browser notification if enabled and permission granted
          if (notificationPreferences.browserNotifications && getPermissionStatus() === 'granted') {
            showBrowserNotification(notification);
          }
        }
      }
    };

    // Run immediately on mount
    runNotificationTick();

    // Set up interval (60 seconds)
    const intervalId = setInterval(runNotificationTick, 60000);

    // Run on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runNotificationTick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tasks, notificationPreferences, firedNotifications, isTestOrInjected, pushToast]);

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setStartModalInEditMode(false);
  };

  const handleTaskContextMenu = (task) => {
    setSelectedTaskId(task.id);
    setStartModalInEditMode(true);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
    setStartModalInEditMode(false);
  };

  const handleUpdateTask = (taskId, updatedFields) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? updateTaskSyncFields({ ...task, ...updatedFields })
          : task
      )
    );
    pushToast({ message: "Task updated", tone: "success" });
  };

  const handleDeleteTask = (taskId) => {
    const now = new Date().toISOString();
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? updateTaskSyncFields({ ...task, deletedAt: now })
          : task
      )
    );
    setSelectedTaskId(null);
    pushToast({ message: "Deleted task", tone: "neutral" });
  };

  const handleCompleteTask = (taskId) => {
    const now = new Date().toISOString();
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? updateTaskSyncFields({ ...task, completedAt: now })
          : task
      )
    );
    setSelectedTaskId(null);
    const task = tasks.find(t => t.id === taskId);
    pushToast({ message: `Completed: ${task?.title || 'task'}`, tone: "success" });
  };

  const handleExportTasks = () => {
    try {
      const jsonString = serializeTasksForExport(tasks);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `eisenhower-tasks-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      pushToast({ message: 'Exported tasks', tone: "success" });
    } catch (error) {
      console.error('Export failed:', error);
      pushToast({ message: 'Failed to export tasks', tone: "error" });
    }
  };

  const handleImportTasks = async (file) => {
    try {
      const text = await file.text();
      const { tasks: importedTasks } = parseImportedTasks(text);
      
      if (!Array.isArray(importedTasks) || importedTasks.length === 0) {
        pushToast({ message: 'No valid tasks found in file', tone: "error" });
        return;
      }

      // Guard against extremely large imports
      if (importedTasks.length > 10000) {
        pushToast({ message: 'File contains too many tasks (max 10,000)', tone: "error" });
        return;
      }

      // Normalize each imported task
      const normalizedImported = importedTasks.map(task => {
        try {
          return normalizeTask(task);
        } catch (error) {
          console.error('Skipping invalid task during import:', error, task);
          return null;
        }
      }).filter(Boolean);

      if (normalizedImported.length === 0) {
        pushToast({ message: 'No valid tasks found in file', tone: "error" });
        return;
      }

      // Store pending imported tasks and show confirmation dialog
      setPendingImportedTasks(normalizedImported);
      setImportConfirmOpen(true);
    } catch (error) {
      console.error('Import failed:', error);
      pushToast({ message: `Import failed: ${error.message}`, tone: "error" });
    }
  };

  const handleImportReplace = async () => {
    if (!pendingImportedTasks) return;
    
    try {
      setTasks(pendingImportedTasks);
      
      if (!isTestOrInjected) {
        try {
          await TaskRepository.saveTasks(pendingImportedTasks);
        } catch (error) {
          console.error('Failed to save imported tasks:', error);
          pushToast({ message: 'Imported but failed to save to storage', tone: "error" });
          setImportConfirmOpen(false);
          setPendingImportedTasks(null);
          return;
        }
      }

      pushToast({ message: `Imported ${pendingImportedTasks.length} task${pendingImportedTasks.length !== 1 ? 's' : ''}`, tone: "success" });
      setImportConfirmOpen(false);
      setPendingImportedTasks(null);
    } catch (error) {
      console.error('Replace import failed:', error);
      pushToast({ message: 'Failed to import tasks', tone: "error" });
      setImportConfirmOpen(false);
      setPendingImportedTasks(null);
    }
  };

  const handleImportMerge = async () => {
    if (!pendingImportedTasks) return;
    
    try {
      const mergedTasks = mergeTasks(tasks, pendingImportedTasks);
      setTasks(mergedTasks);
      
      if (!isTestOrInjected) {
        try {
          await TaskRepository.saveTasks(mergedTasks);
        } catch (error) {
          console.error('Failed to save merged tasks:', error);
          pushToast({ message: 'Merged but failed to save to storage', tone: "error" });
          setImportConfirmOpen(false);
          setPendingImportedTasks(null);
          return;
        }
      }

      const newCount = pendingImportedTasks.filter(imported => 
        !tasks.some(existing => String(existing.id) === String(imported.id))
      ).length;
      
      pushToast({ message: `Merged ${newCount} task${newCount !== 1 ? 's' : ''}`, tone: "success" });
      setImportConfirmOpen(false);
      setPendingImportedTasks(null);
    } catch (error) {
      console.error('Merge import failed:', error);
      pushToast({ message: 'Failed to merge tasks', tone: "error" });
      setImportConfirmOpen(false);
      setPendingImportedTasks(null);
    }
  };

  const handleImportCancel = () => {
    setImportConfirmOpen(false);
    setPendingImportedTasks(null);
  };

  const handleResetTasks = async () => {
    try {
      // Clear storage
      if (!isTestOrInjected) {
        await TaskRepository.clearTasks();
      }
      
      // Reset to default tasks
      setTasks(defaultTasks);
      pushToast({ message: "Local data reset", tone: "success" });
    } catch (error) {
      console.error('Reset failed:', error);
      pushToast({ message: 'Failed to reset local data', tone: "error" });
    }
  };

  const handleCreateTask = (newTaskData) => {
    // Convert hours and minutes to total minutes
    const hours = newTaskData.estimateHours ? parseInt(newTaskData.estimateHours, 10) : 0;
    const minutes = newTaskData.estimateMinutes ? parseInt(newTaskData.estimateMinutes, 10) : 0;
    const totalMinutes = hours * 60 + minutes;
    
    // Normalize dueDate: if it's a date string like "2026-01-08", convert to ISO string at end of day (local time)
    let dueDate = newTaskData.dueDate || null;
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
    
    const rawTask = {
      ...newTaskData,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
      estimateMinutesTotal: totalMinutes > 0 ? totalMinutes : null,
      createdAt: Date.now(),
      dueDate: dueDate,
      notificationFrequency: newTaskData.notificationFrequency || null
    };
    
    // Remove estimateHours and estimateMinutes from task (they're not part of the canonical format)
    delete rawTask.estimateHours;
    delete rawTask.estimateMinutes;
    
    // Normalize task to ensure dueDate and notificationFrequency have proper defaults
    const newTask = normalizeTask(rawTask);
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    setPendingAssignmentTaskId(newTask.id);
    setIsAssignmentOpen(true);
    setAssignmentSecondsLeft(10);
    setIsCreateOpen(false);
    pushToast({ message: "Task created", tone: "success" });
  };

  const handleAssignPendingTaskToQuadrant = (quadrantId) => {
    const quadrantFlags = {
      'Q1': { urgent: true, important: true },
      'Q2': { urgent: false, important: true },
      'Q3': { urgent: true, important: false },
      'Q4': { urgent: false, important: false }
    };

    const flags = quadrantFlags[quadrantId];
    if (!flags) {
      return;
    }

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === pendingAssignmentTaskId
          ? updateTaskSyncFields({ ...task, urgent: flags.urgent, important: flags.important })
          : task
      )
    );
    setIsAssignmentOpen(false);
    setPendingAssignmentTaskId(null);
  };

  const handleDragStart = (event) => {
    setActiveDragTaskId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveDragTaskId(null);
  };

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!over || !over.id) {
      setActiveDragTaskId(null);
      return;
    }

    const quadrantId = over.id;
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quadrantId)) {
      setActiveDragTaskId(null);
      return;
    }

    const quadrantFlags = {
      'Q1': { urgent: true, important: true },
      'Q2': { urgent: false, important: true },
      'Q3': { urgent: true, important: false },
      'Q4': { urgent: false, important: false }
    };

    const flags = quadrantFlags[quadrantId];
    const draggedTaskId = active.id;

    const draggedTask = tasks.find(task => String(task.id) === String(draggedTaskId));
    if (!draggedTask) {
      setActiveDragTaskId(null);
      return;
    }

    const currentQuadrant = getQuadrant(draggedTask);
    const isNoOp = currentQuadrant === quadrantId;

    // Capture previous state for undo
    const previousSnapshot = {
      id: draggedTask.id,
      urgent: draggedTask.urgent,
      important: draggedTask.important
    };

    setTasks(prevTasks => 
      prevTasks.map(task => {
        const taskIdString = String(task.id);
        const draggedIdString = String(draggedTaskId);
        return taskIdString === draggedIdString
          ? updateTaskSyncFields({ ...task, urgent: flags.urgent, important: flags.important })
          : task;
      })
    );
    setActiveDragTaskId(null);

    if (!isNoOp) {
      // Create undo handler for this move
      const undoHandler = () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            String(task.id) === String(previousSnapshot.id)
              ? updateTaskSyncFields({ ...task, urgent: previousSnapshot.urgent, important: previousSnapshot.important })
              : task
          )
        );
      };

      pushToast({ 
        key: "move",
        tone: "success",
        durationMs: 5000,
        meta: { 
          taskId: String(active.id), 
          lastDest: String(over.id),
          undoHandler: undoHandler
        }
      });
    }
  }, [tasks]);

  // Expose handler to test seam if provided
  useEffect(() => {
    if (__test_onDragEnd && typeof __test_onDragEnd === 'object' && __test_onDragEnd.setHandler) {
      __test_onDragEnd.setHandler(handleDragEnd);
    }
  }, [__test_onDragEnd, handleDragEnd]);

  const pendingTask = pendingAssignmentTaskId
    ? tasks.find(task => task.id === pendingAssignmentTaskId) || null
    : null;

  const activeTask = activeDragTaskId
    ? tasks.find(task => String(task.id) === String(activeDragTaskId)) || null
    : null;

  const urgencyColors = {
    red: '#FF3B30',
    yellow: '#FF9F0A',
    green: '#34C759'
  };

  const getUrgencyFromTask = (task) => {
    // Use deadline urgency if dueDate exists, otherwise fall back to quadrant-based urgency
    const deadlineUrgency = getDeadlineUrgency(task.dueDate);
    if (deadlineUrgency !== null) {
      return deadlineUrgency;
    }
    // Fall back to quadrant-based urgency
    if (task.urgent && task.important) return 'red';
    if (task.important && !task.urgent) return 'yellow';
    if (task.urgent && !task.important) return 'yellow';
    return 'green';
  };

  const formatTime = (estimateMinutesTotal) => {
    if (!estimateMinutesTotal || estimateMinutesTotal <= 0) return undefined;
    if (estimateMinutesTotal >= 60) {
      const hours = Math.floor(estimateMinutesTotal / 60);
      const minutes = estimateMinutesTotal % 60;
      return minutes > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${hours}h`;
    }
    return `${estimateMinutesTotal}m`;
  };

  // Filter out completed tasks (completedAt is set) and deleted tasks (deletedAt is set)
  const activeTasks = tasks.filter(task => !task.completedAt && !task.deletedAt);
  
  const q1Tasks = activeTasks.filter(task => getQuadrant(task) === 'Q1');
  const q2Tasks = activeTasks.filter(task => getQuadrant(task) === 'Q2');
  const q3Tasks = activeTasks.filter(task => getQuadrant(task) === 'Q3');
  const q4Tasks = activeTasks.filter(task => getQuadrant(task) === 'Q4');

  return (
    <div className="app">
      {view === 'matrix' ? (
        <DndContext 
          sensors={sensors}
          onDragStart={handleDragStart} 
          onDragCancel={handleDragCancel} 
          onDragEnd={(event) => {
            if (__test_onDragEnd && typeof __test_onDragEnd === 'function') {
              __test_onDragEnd(event);
            }
            handleDragEnd(event);
          }}
        >
          <div className="app-container">
            <DroppableQuadrant id="Q1">
              <Quadrant
                title="Do First"
                subtitle="Urgent & Important"
                backgroundColor="var(--color-bg-q1)"
                tasks={q1Tasks}
                onTaskClick={handleTaskClick}
                onTaskContextMenu={handleTaskContextMenu}
                activeDragTaskId={activeDragTaskId}
                emptyTitle="Nothing critical"
                emptySubtext="No urgent, important tasks right now."
                emptyHint="Keep it that way."
              />
            </DroppableQuadrant>
            
            <DroppableQuadrant id="Q2">
              <Quadrant
                title="Schedule"
                subtitle="Important, Not Urgent"
                backgroundColor="var(--color-bg-q2)"
                tasks={q2Tasks}
                onTaskClick={handleTaskClick}
                onTaskContextMenu={handleTaskContextMenu}
                activeDragTaskId={activeDragTaskId}
                emptyTitle="No strategic work queued"
                emptySubtext="Nothing important waiting without urgency."
                emptyHint="Add something you want to invest in."
              />
            </DroppableQuadrant>
            
            <DroppableQuadrant id="Q3">
              <Quadrant
                title="Delegate"
                subtitle="Urgent, Not Important"
                backgroundColor="var(--color-bg-q3)"
                tasks={q3Tasks}
                onTaskClick={handleTaskClick}
                onTaskContextMenu={handleTaskContextMenu}
                activeDragTaskId={activeDragTaskId}
                emptyTitle="No interruptions"
                emptySubtext="Nothing urgent pulling you off track."
              />
            </DroppableQuadrant>
            
            <DroppableQuadrant id="Q4">
              <Quadrant
                title="Delete"
                subtitle="Not Important, Not Urgent"
                backgroundColor="var(--color-bg-q4)"
                tasks={q4Tasks}
                onTaskClick={handleTaskClick}
                onTaskContextMenu={handleTaskContextMenu}
                activeDragTaskId={activeDragTaskId}
                emptyTitle="Clear"
                emptySubtext="No low-value tasks here."
              />
            </DroppableQuadrant>
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="drag-overlay-card">
                <TaskBubble
                  taskName={activeTask.title || 'Untitled Task'}
                  urgency={getUrgencyFromTask(activeTask)}
                  urgencyColor={urgencyColors[getUrgencyFromTask(activeTask)]}
                  timeBadge={formatTime(activeTask.estimateMinutesTotal)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="app-container">
          <RightNowView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onComplete={handleCompleteTask}
          />
        </div>
      )}
      <FloatingActionButton onClick={() => setIsCreateOpen(true)} />
      <TaskCreationOverlay
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
      />
      <AssignmentCountdownOverlay
        isOpen={isAssignmentOpen}
        task={pendingTask}
        secondsLeft={assignmentSecondsLeft}
        onAssignQuadrant={handleAssignPendingTaskToQuadrant}
        onClose={() => {
          setIsAssignmentOpen(false);
          setPendingAssignmentTaskId(null);
        }}
      />
      <TaskDetailsModal
        isOpen={selectedTaskId !== null}
        task={tasks.find(t => t.id === selectedTaskId) || null}
        onClose={handleCloseTaskModal}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCompleteTask={handleCompleteTask}
        startInEdit={startModalInEditMode}
      />
      <SettingsMenu
        onExport={handleExportTasks}
        onImport={handleImportTasks}
        onReset={handleResetTasks}
        notificationPreferences={notificationPreferences}
        onUpdateNotificationPreferences={(prefs) => {
          setNotificationPreferences(prefs);
          savePreferences(prefs);
        }}
        onAuthStateChange={handleAuthStateChange}
        onRequestBrowserPermission={async () => {
          const permission = await requestBrowserPermission();
          if (permission === 'granted') {
            setNotificationPreferences(prev => {
              const updated = { ...prev, browserNotifications: true };
              savePreferences(updated);
              return updated;
            });
            pushToast({ message: 'Browser notifications enabled', tone: 'success' });
          } else {
            pushToast({ message: 'Browser notifications permission denied', tone: 'error' });
          }
        }}
      />
      <ImportConfirmDialog
        isOpen={importConfirmOpen}
        incomingCount={pendingImportedTasks?.length || 0}
        onReplace={handleImportReplace}
        onMerge={handleImportMerge}
        onCancel={handleImportCancel}
      />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <PageDots active={view} onSelect={setView} />
    </div>
  );
}

export default App;

