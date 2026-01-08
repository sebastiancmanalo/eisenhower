import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import Quadrant from './components/Quadrant.jsx';
import DroppableQuadrant from './components/DroppableQuadrant.jsx';
import TaskBubble from './components/TaskBubble.jsx';
import FloatingActionButton from './components/FloatingActionButton.jsx';
import TaskCreationOverlay from './components/TaskCreationOverlay.jsx';
import AssignmentCountdownOverlay from './components/AssignmentCountdownOverlay.jsx';
import ToastHost from './components/ToastHost.jsx';
import { getQuadrant } from './utils/taskLogic.js';
import './styles/tokens.css';
import './styles/global.css';
import './App.css';

function App({ initialTasks, __test_onDragEnd }) {
  const defaultTasks = [
    { id: 1, title: "Finish design mockups", urgent: true, important: true, estimate: "~30m" },
    { id: 2, title: "Email stakeholder", urgent: false, important: true }
  ];
  const [tasks, setTasks] = useState(initialTasks ?? defaultTasks);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingAssignmentTaskId, setPendingAssignmentTaskId] = useState(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [assignmentSecondsLeft, setAssignmentSecondsLeft] = useState(10);
  const [toasts, setToasts] = useState([]);
  const [activeDragTaskId, setActiveDragTaskId] = useState(null);
  const toastTimeoutsRef = useRef(new Map());

  const pushToast = ({ message, tone = "neutral", durationMs = 3000, key = null, meta = {} }) => {
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
              ? { ...t, movedTaskIds: Array.from(nextSet), lastDest: nextDest, message: nextMessage, version: nextVersion, durationMs }
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
          
          const newToast = { 
            id, 
            key: "move",
            tone, 
            durationMs, 
            movedTaskIds, 
            lastDest, 
            version, 
            message: nextMessage 
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
      const newToast = { id, message, tone, durationMs, key };
      
      setToasts(prev => [...prev, newToast]);
      
      const timerId = setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      
      toastTimeoutsRef.current.set(id, timerId);
      
      return id;
    } else {
      // Non-keyed toast (existing behavior)
      const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const newToast = { id, message, tone, durationMs };
      
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

    const intervalId = setInterval(() => {
      setAssignmentSecondsLeft((prev) => {
        if (prev <= 1) {
          const pendingTask = tasks.find(task => task.id === pendingAssignmentTaskId);
          if (pendingTask) {
            const quadrant = getQuadrant(pendingTask);
            setIsAssignmentOpen(false);
            setPendingAssignmentTaskId(null);
            pushToast({ message: `Auto-placed in ${quadrant}`, tone: "neutral" });
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

  const handleTaskClick = (task) => {
    console.log('Task clicked:', task);
  };

  const handleCreateTask = (newTaskData) => {
    // Convert hours and minutes to total minutes
    const hours = newTaskData.estimateHours ? parseInt(newTaskData.estimateHours, 10) : 0;
    const minutes = newTaskData.estimateMinutes ? parseInt(newTaskData.estimateMinutes, 10) : 0;
    const totalMinutes = hours * 60 + minutes;
    
    const newTask = {
      ...newTaskData,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
      estimateMinutesTotal: totalMinutes > 0 ? totalMinutes : null
    };
    
    // Remove estimateHours and estimateMinutes from task (they're not part of the canonical format)
    delete newTask.estimateHours;
    delete newTask.estimateMinutes;
    
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
          ? { ...task, urgent: flags.urgent, important: flags.important }
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

    setTasks(prevTasks => 
      prevTasks.map(task => {
        const taskIdString = String(task.id);
        const draggedIdString = String(draggedTaskId);
        return taskIdString === draggedIdString
          ? { ...task, urgent: flags.urgent, important: flags.important }
          : task;
      })
    );
    setActiveDragTaskId(null);

    if (!isNoOp) {
      pushToast({ 
        key: "move",
        tone: "success",
        durationMs: 1800,
        meta: { taskId: String(active.id), lastDest: String(over.id) }
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

  const q1Tasks = tasks.filter(task => getQuadrant(task) === 'Q1');
  const q2Tasks = tasks.filter(task => getQuadrant(task) === 'Q2');
  const q3Tasks = tasks.filter(task => getQuadrant(task) === 'Q3');
  const q4Tasks = tasks.filter(task => getQuadrant(task) === 'Q4');

  return (
    <div className="app">
      <DndContext onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={(event) => {
        if (__test_onDragEnd && typeof __test_onDragEnd === 'function') {
          __test_onDragEnd(event);
        }
        handleDragEnd(event);
      }}>
        <div className="app-container">
          <DroppableQuadrant id="Q1">
            <Quadrant
              title="Do First"
              subtitle="Urgent & Important"
              backgroundColor="var(--color-bg-q1)"
              tasks={q1Tasks}
              onTaskClick={handleTaskClick}
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
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;

