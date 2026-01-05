import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { getQuadrant } from './utils/taskLogic';
import { formatEstimateMinutes } from './utils/timeFormat';
import Quadrant from './components/Quadrant';
import FloatingActionButton from './components/FloatingActionButton';
import TaskCreationOverlay from './components/TaskCreationOverlay';
import AssignmentCountdownOverlay from './components/AssignmentCountdownOverlay';
import DroppableQuadrant from './components/DroppableQuadrant';
import DraggableTask from './components/DraggableTask';
import TaskBubble from './components/TaskBubble';
import Toast from './components/Toast';
import './App.css';
import './styles/global.css';
import './styles/tokens.css';

const QUADRANT_CONFIG = [
  {
    id: 'Q1',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    backgroundColor: 'var(--color-bg-q1)',
    boxShadow: '0px 2px 12px rgba(255, 59, 48, 0.15)',
  },
  {
    id: 'Q2',
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    backgroundColor: 'var(--color-bg-q2)',
    boxShadow: '0px 2px 12px rgba(0, 122, 255, 0.15)',
  },
  {
    id: 'Q3',
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    backgroundColor: 'var(--color-bg-q3)',
    boxShadow: '0px 2px 12px rgba(255, 149, 0, 0.15)',
  },
  {
    id: 'Q4',
    title: 'Delete',
    subtitle: 'Not Important, Not Urgent',
    backgroundColor: 'var(--color-bg-q4)',
    boxShadow: '0px 2px 12px rgba(88, 86, 214, 0.15)',
  },
];

const DEFAULT_TASKS = [
  { id: '1', title: 'Review project proposal', urgent: true, important: true },
  { id: '2', title: 'Plan team meeting', urgent: false, important: true },
];

function App({ initialTasks, __test_onDragEnd }) {
  const [tasks, setTasks] = useState(() => {
    if (initialTasks && Array.isArray(initialTasks)) {
      return initialTasks;
    }
    return DEFAULT_TASKS;
  });


  const [isTaskCreationOpen, setIsTaskCreationOpen] = useState(false);
  const [assignmentTask, setAssignmentTask] = useState(null);
  const [assignmentCountdown, setAssignmentCountdown] = useState(10);
  const [activeDragId, setActiveDragId] = useState(null);
  const [toast, setToast] = useState(null);
  const [undoState, setUndoState] = useState(null);

  const quadrantTasks = useMemo(() => {
    const result = {
      Q1: [],
      Q2: [],
      Q3: [],
      Q4: [],
    };

    tasks.forEach((task) => {
      const quadrant = getQuadrant(task);
      result[quadrant].push(task);
    });

    return result;
  }, [tasks]);

  const getQuadrantFromId = (quadrantId) => {
    const mapping = {
      Q1: { urgent: true, important: true },
      Q2: { urgent: false, important: true },
      Q3: { urgent: true, important: false },
      Q4: { urgent: false, important: false },
    };
    return mapping[quadrantId];
  };

  const updateTaskQuadrant = (taskId, quadrantId) => {
    const quadrantFlags = getQuadrantFromId(quadrantId);
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, urgent: quadrantFlags.urgent, important: quadrantFlags.important }
          : task
      )
    );
    return quadrantFlags;
  };

  const handleCreateTask = (taskData) => {
    const hours = taskData.estimateHours ? parseInt(taskData.estimateHours, 10) : 0;
    const minutes = taskData.estimateMinutes ? parseInt(taskData.estimateMinutes, 10) : 0;
    const totalMinutes = hours * 60 + minutes;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title,
      urgent: taskData.urgent || false,
      important: taskData.important || false,
      ...(taskData.priority && { priority: taskData.priority }),
      ...(totalMinutes > 0 && { estimateMinutesTotal: totalMinutes }),
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setIsTaskCreationOpen(false);
    setAssignmentTask(newTask);
    setAssignmentCountdown(10);
  };

  const handleAssignQuadrant = (quadrantId) => {
    if (!assignmentTask) return;

    const previousFlags = {
      urgent: assignmentTask.urgent,
      important: assignmentTask.important,
    };

    const quadrantFlags = getQuadrantFromId(quadrantId);
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === assignmentTask.id
          ? { ...task, urgent: quadrantFlags.urgent, important: quadrantFlags.important }
          : task
      )
    );

    setUndoState({
      taskId: assignmentTask.id,
      previousFlags,
    });

    const undoHandler = () => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === assignmentTask.id
            ? {
                ...task,
                urgent: previousFlags.urgent,
                important: previousFlags.important,
              }
            : task
        )
      );
      setToast(null);
      setUndoState(null);
    };

    setToast({
      message: `Placed in ${quadrantId}`,
      onUndo: undoHandler,
    });

    setAssignmentTask(null);
    setAssignmentCountdown(10);
  };


  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && ['Q1', 'Q2', 'Q3', 'Q4'].includes(over.id)) {
      const taskId = active.id;
      const task = tasks.find((t) => t.id === taskId);

      if (task) {
        const previousFlags = {
          urgent: task.urgent,
          important: task.important,
        };

        updateTaskQuadrant(taskId, over.id);

        setUndoState({
          taskId,
          previousFlags,
        });

        const undoHandler = () => {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    urgent: previousFlags.urgent,
                    important: previousFlags.important,
                  }
                : t
            )
          );
          setToast(null);
          setUndoState(null);
        };

        setToast({
          message: `Moved to ${over.id}`,
          onUndo: undoHandler,
        });
      }
    }

    setActiveDragId(null);
  };

  // Expose handler to test seam if provided
  useEffect(() => {
    if (__test_onDragEnd && typeof __test_onDragEnd === 'object' && __test_onDragEnd.setHandler) {
      __test_onDragEnd.setHandler(handleDragEnd);
    }
  }, [__test_onDragEnd, handleDragEnd]);

  useEffect(() => {
    if (!assignmentTask) return;

    if (assignmentCountdown <= 0) {
      const quadrant = getQuadrant(assignmentTask);
      const previousFlags = {
        urgent: assignmentTask.urgent,
        important: assignmentTask.important,
      };

      setUndoState({
        taskId: assignmentTask.id,
        previousFlags,
      });

      const undoHandler = () => {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === assignmentTask.id
              ? {
                  ...task,
                  urgent: previousFlags.urgent,
                  important: previousFlags.important,
                }
              : task
          )
        );
        setToast(null);
        setUndoState(null);
      };

      setToast({
        message: `Auto-placed in ${quadrant}`,
        onUndo: undoHandler,
      });

      setAssignmentTask(null);
      setAssignmentCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setAssignmentCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [assignmentTask, assignmentCountdown]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
        setUndoState(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getTaskUrgencyColor = (task) => {
    const quadrant = getQuadrant(task);
    const colorMap = {
      Q1: '#FF3B30',
      Q2: '#007AFF',
      Q3: '#FF9500',
      Q4: '#5856D6',
    };
    return colorMap[quadrant];
  };

  const getTaskTimeBadge = (task) => {
    return formatEstimateMinutes(task.estimateMinutesTotal);
  };

  const activeTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;

  const renderTask = (task, index) => {
    return (
      <DraggableTask key={task.id} id={task.id} isGhostHidden={false}>
        <TaskBubble
          taskName={task.title}
          urgencyColor={getTaskUrgencyColor(task)}
          timeBadge={getTaskTimeBadge(task)}
          onClick={() => {
            console.log('Task clicked:', task);
          }}
        />
      </DraggableTask>
    );
  };

  return (
    <div className="app">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          if (__test_onDragEnd) {
            __test_onDragEnd(event);
          }
          handleDragEnd(event);
        }}
      >
        <div className="app-container">
          {QUADRANT_CONFIG.map((config) => (
            <DroppableQuadrant key={config.id} id={config.id}>
              <Quadrant
                title={config.title}
                subtitle={config.subtitle}
                backgroundColor={config.backgroundColor}
                boxShadow={config.boxShadow}
                tasks={quadrantTasks[config.id]}
                renderTask={renderTask}
                testId={`quadrant-${config.id}`}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                }}
              />
            </DroppableQuadrant>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay-card">
              <TaskBubble
                taskName={activeTask.title}
                urgencyColor={getTaskUrgencyColor(activeTask)}
                timeBadge={getTaskTimeBadge(activeTask)}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <FloatingActionButton onClick={() => setIsTaskCreationOpen(true)} />

      <TaskCreationOverlay
        isOpen={isTaskCreationOpen}
        onSubmit={handleCreateTask}
        onClose={() => setIsTaskCreationOpen(false)}
      />

      <AssignmentCountdownOverlay
        isOpen={!!assignmentTask}
        task={assignmentTask}
        secondsLeft={assignmentCountdown}
        onAssignQuadrant={handleAssignQuadrant}
        onClose={() => {
          setAssignmentTask(null);
          setAssignmentCountdown(10);
        }}
      />

      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onDismiss={() => {
            setToast(null);
            setUndoState(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
