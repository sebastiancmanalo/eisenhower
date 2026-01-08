# Progress Tracker

## How to Update This File (DO NOT SKIP)
- After completing any feature or milestone:
  1) Update the relevant checkbox/status below
  2) Add a one-line note explaining what changed
  3) Commit PROGRESS.md in the same commit as the code
- If a feature is partially implemented, mark 🟡 and explain what's missing.
- If something regresses, downgrade status and explain why.

> If it's not marked ✅ here, it is not considered shipped.

---

## How to Update Progress

After each merged change / completed step:
1. Update PROGRESS.md - mark items as ✅ (completed), 🟡 (partial/in-progress), or ❌ (not started)
2. Add a CHANGELOG_DEV.md entry with date, what changed, files touched, and what to test manually

Before major refactors:
- Run `npm run snapshot` or commit current state
- Update PROGRESS.md with new status

---

## MVP Core

### Matrix View
- ✅ **Basic 4-quadrant layout** - Proportional layout with Q1 prominent, Q2/Q3/Q4 stacked
- ✅ **Quadrant colors** - Q1 (red), Q2 (blue), Q3 (yellow/orange), Q4 (gray)
- ✅ **Quadrant titles and subtitles** - "Do First", "Schedule", "Delegate", "Delete"
- ✅ **Empty states** - Checkmark icon, title, subtext, optional hints

### Task Creation
- ✅ **FAB button** - Floating Action Button opens creation overlay
- ❌ **Pull-down gesture** - Not implemented (PRD mentions this alternative)
- ✅ **Creation form** - Modal overlay with title, urgency, importance checkboxes
- ✅ **Time estimate input** - Hours and minutes number inputs
- ❌ **Due date picker** - Not in creation form
- ❌ **Notification frequency** - Low/Medium/High buttons not in form
- ✅ **Form validation** - Title required, other fields optional

### Assignment & Auto-Placement
- ✅ **10-second countdown overlay** - Appears after task creation
- ✅ **Drag-to-quadrant during countdown** - User can drag task to any quadrant
- ✅ **Auto-placement after timeout** - Task auto-places to correct quadrant based on flags
- ✅ **Toast notification on auto-place** - Shows "Auto-placed in [Quadrant]" (only if quadrant changed)
- ✅ **Undo button on auto-place toast** - Undo restores previous urgent/important flags

### Drag & Drop
- ✅ **Drag tasks between quadrants** - Works anytime after placement
- ✅ **Visual feedback during drag** - DragOverlay with task bubble preview
- ✅ **Quadrant highlighting** - Droppable zones show when dragging over
- ✅ **Flag updates on drop** - Urgent/important flags update to match target quadrant
- ✅ **Toast on move** - Shows "Moved X task(s) → [Quadrant]" (aggregates multiple moves)
- ✅ **Undo on move toast** - Undo button restores previous quadrant for all affected tasks

### Task Display
- ✅ **Bubble UI elements** - Tasks display as bubble cards
- ✅ **Task name display** - Shows on bubble
- ✅ **Color-coded urgency** - Red (Q1), Yellow (Q2/Q3), Green (Q4) based on quadrant
- ✅ **Time estimate badges** - Shows formatted time ("Xh Ym" or "Nm") if provided
- ❌ **Deadline-based color coding** - Not implemented (colors based on quadrant, not due date)
- ✅ **Task details modal** - Bottom sheet modal opens on task click

### Toast System
- ✅ **Toast notifications** - ToastHost component displays toasts
- ✅ **Auto-dismiss** - Toasts dismiss after configured duration (default 3000ms)
- ✅ **Manual dismiss** - × button to dismiss toast
- ✅ **Multiple toast stacking** - Multiple toasts can display
- ✅ **Toast for task created** - "Task created" message
- ✅ **Toast for auto-place** - "Auto-placed in [Quadrant]" message (only shown if quadrant changed)
- ✅ **Toast for move** - "Moved X task(s) → [Quadrant]" with aggregation
- ✅ **Undo functionality** - Undo button wired up for auto-place and drag move toasts, restores previous quadrant

---

## UI/UX

### Empty States
- ✅ **Empty state UI** - Checkmark, title, subtext, optional hints
- ✅ **Quadrant-specific messages** - Custom messages per quadrant
- ❌ **Ghost bubbles** - No example tasks shown in empty state

### Overflow Handling
- ✅ **Scrollable quadrants** - Each quadrant independently scrollable
- ❌ **Count badges** - No badge when >5 tasks in quadrant
- ✅ **Task sizing** - Tasks maintain size, no shrinking/overlapping

### Warnings & Celebrations
- ❌ **Q1 overload warning (8+ tasks)** - No warning badge or suggestions
- ❌ **Q1 empty celebration** - Standard empty state, no confetti or Q2 task suggestion

### Modal Overlays
- ✅ **Task creation modal** - Full-screen overlay with form
- ✅ **Assignment countdown modal** - Full-screen overlay with 2x2 grid
- ✅ **Task details modal** - Bottom sheet with view/edit modes, complete/delete actions
- ✅ **Backdrop clicks to close** - Works for creation overlay

---

## Milestone B — ✅ Complete

### Task Details Modal

**Implementation:**
- **Component**: `src/components/TaskDetailsModal.jsx`
- **State**: `selectedTaskId` in `src/App.jsx:54`
- **Entry points**:
  - **Click**: Opens modal via `handleTaskClick()` → `TaskBubble` onClick
  - **Right-click**: Opens modal in edit mode via `handleTaskContextMenu()`
  - **Keyboard**: Enter key on focused TaskBubble opens modal
- **Drag conflict resolved**: PointerSensor with `activationConstraint: { distance: 8 }` allows clicks without triggering drag

**Features Implemented:**
- Modal displays all task fields: Title, Urgent, Important, Estimate, Priority, Quadrant
- Edit mode with full form validation
- Save/Cancel buttons update central state via `handleUpdateTask()`
- Mark complete: Sets `completedAt` timestamp, removes task from matrix (filtered out by `activeTasks.filter(task => !task.completedAt)`)
- Delete: Removes task from array and closes modal
- Toast notifications: "Task updated", "Deleted task", "Completed: {title}"
- Comprehensive tests: 6 tests in `src/App.taskDetailsModal.test.jsx` covering open, edit, delete, complete, quadrant movement, and persistence

**Persistence:**
- Task updates, completions, and deletions are persisted to localStorage via existing persistence system

**Explicit Gap:**
- **Undo for delete/complete not implemented** (only drag undo exists in `src/App.jsx:437-455`)

---

## Right Now View

- ✅ **View implemented** - RightNowView component at `src/components/RightNowView.jsx`
- ✅ **Sorting algorithm** - `sortTasksForRightNow` in `src/utils/rightNowSort.js` (estimate ascending, then quadrant Q1→Q4, then createdAt/id)
- ✅ **Prioritized list** - Vertical list of tasks sorted by algorithm
- ✅ **Task details in list** - Displays title, quadrant indicator, estimate badge, priority badge
- ✅ **Mark complete from list** - Complete button on each task row (uses same completion pathway)
- ❌ **Manual reordering** - Not implemented (sorting is algorithm-based only)

---

## Navigation

- ✅ **View switching** - Toggle buttons in header to switch between Matrix and Right Now views
- ❌ **Swipe gestures** - Not implemented (swipe right/left between views)
- ❌ **Page dots indicator** - No view indicator (using toggle buttons instead)

---

## Notifications

- ❌ **Notification system** - Not implemented (no push notifications)
- ❌ **Frequency tiers** - Low/Medium/High not implemented
- ❌ **Frequency-quadrant relationship** - Not implemented
- ❌ **Automatic escalation** - Deadline-based escalation not implemented
- ❌ **Urgency drift** - Q2→Q1 automatic movement not implemented
- ❌ **Notification content** - No push notification messages
- ❌ **Quiet hours** - Not implemented
- ❌ **Notification persistence** - Not applicable (no notifications)

**Note:** Only in-app toast notifications exist (see Toast System above)

---

## Persistence & Sync

### Local Storage
- ✅ **localStorage** - Tasks persist to localStorage, loaded on app start
- ❌ **sessionStorage** - Not implemented
- ❌ **IndexedDB** - Not implemented
- ✅ **Task persistence** - Tasks saved to localStorage on change, loaded on mount (unless initialTasks provided for tests)
- ✅ **In-memory state** - Tasks exist only in React component state

### Backend & Sync
- ❌ **Backend service** - No backend (no Firebase, Cloud Functions, etc.)
- ❌ **Cloud storage** - No Firestore or database
- ❌ **Real-time sync** - Not implemented
- ❌ **Cross-device sync** - Not implemented
- ❌ **Conflict resolution** - Not applicable (no sync)
- ❌ **Offline queue** - Not implemented
- ❌ **Sync on reconnect** - Not applicable (no sync)

**Current State:** Fully client-side, no persistence, no sync

---

## Task Management

### Edit Task
- ✅ **Edit functionality** - Edit mode in task details modal
- ✅ **Edit button** - "Edit" button in modal header
- ✅ **Modify fields** - Can edit title, urgent/important, priority, estimate

### Mark Complete
- ✅ **Mark complete button** - Primary button in task details modal
- ✅ **Completion tracking** - completedAt timestamp set on completion
- ✅ **Task lifecycle** - Create → Categorize → Active → Complete (completed tasks hidden from quadrants)

### Delete Task
- ✅ **Delete functionality** - Delete button in task details modal with confirmation
- ✅ **Task removal** - Tasks can be deleted with confirmation step

---

## Time Estimation

### Manual Entry
- ✅ **Time estimate input** - Hours and minutes inputs in creation form
- ✅ **Time display** - Formatted badge on task bubble ("Xh Ym" or "Nm")

### ML/Heuristics
- ❌ **Keyword similarity** - Not implemented
- ❌ **Average time per quadrant** - Not implemented
- ❌ **Default estimates** - No default (e.g., 30 minutes)
- ❌ **Completion tracking** - Not implemented
- ❌ **Learning system** - Not implemented
- ❌ **Comparison display** - Not implemented ("You usually take 45min...")
- ❌ **Adjustment toggle** - Not implemented ("I'm faster/slower today")
- ❌ **Accuracy stats** - Not implemented ("Your time estimates improved 23%!")

**Current State:** Manual entry only, no ML, no learning, no defaults

---

## Onboarding

- ❌ **Onboarding flow** - Not implemented
- ❌ **Explainer cards** - No tutorial screens
- ❌ **Guided task creation** - No walkthrough
- ❌ **Skip tutorial** - Not applicable (no tutorial)

**Current State:** User drops directly into app with default demo tasks

---

## Accessibility

- 🟡 **ARIA labels** - Needs audit (some may be missing)
- 🟡 **Screen reader support** - Needs verification
- 🟡 **Keyboard navigation** - Drag-and-drop may not be keyboard accessible
- 🟡 **Touch targets** - Needs verification (minimum 44x44px)
- 🟡 **High contrast mode** - Needs verification
- ❌ **Haptic feedback** - Not applicable (web-only)

**Recommendation:** Accessibility audit needed

---

## Tests

### Unit Tests
- ✅ **getQuadrant utility** - Tests in `taskLogic.test.js`
- ✅ **formatEstimateMinutes utility** - Tests in `timeFormat.test.js`
- ✅ **sortTasksForRightNow utility** - Tests in `rightNowSort.test.js`
- ✅ **Quadrant component** - Tests in `Quadrant.test.jsx`

### Integration Tests
- ✅ **Task creation flow** - Tests in `App.createTaskOverlay.test.jsx`
- ✅ **Assignment countdown** - Tests in `App.assignmentCountdown.test.jsx`
- ✅ **Auto-placement** - Tests in `App.test.jsx` (Step 6 integration test)
- ✅ **Drag and drop** - Tests in `App.dragDrop.test.jsx`
- ✅ **Task movement toasts** - Tests verify toast messages
- ✅ **Time estimate calculation** - Tests verify estimateMinutesTotal calculation
- ✅ **Right Now view** - Tests in `App.rightNowView.test.jsx` (rendering, sorting, click handlers, completion, navigation)

### Test Coverage
- ✅ **Core functionality** - Task creation, assignment, drag-and-drop, auto-placement
- ✅ **Edge cases** - Empty tasks, invalid inputs, drag to same quadrant
- ✅ **Task details modal** - Tests in `App.taskDetailsModal.test.jsx`
- ✅ **Right Now view** - Tests in `App.rightNowView.test.jsx` (9 tests covering rendering, sorting, click handlers, completion, navigation)
- ✅ **Right Now sorting** - Tests in `rightNowSort.test.js` (9 tests covering estimate, quadrant, tie-breaker sorting)
- ❌ **Notifications** - Not testable (not implemented)

**Current State:** Good test coverage for implemented features, including Right Now view and sorting algorithm

---

## Build & Deployment

### Build
- ✅ **Vite build** - `npm run build` works
- ✅ **Development server** - `npm run dev` works
- ✅ **Test runner** - `npm test` (Vitest) works
- ✅ **Snapshot script** - `npm run snapshot` exists
- ✅ **Preflight script** - `npm run preflight` exists

### Deployment
- 🟡 **Production build** - Builds successfully, but deployment process not documented
- ❌ **CI/CD** - Not configured
- ❌ **Hosting** - Not deployed

---

## Known Issues & Technical Debt

### Critical
- ✅ **Persistence implemented** - Tasks saved to localStorage, loaded on mount
- ✅ **Undo wired up** - Auto-place and drag move toasts have undo handlers
- ✅ **Task details implemented** - Can view, edit, complete, and delete tasks

### Medium
- 🟡 **Accessibility gaps** - Needs audit and fixes
- 🟡 **No keyboard navigation** - Drag-and-drop not keyboard accessible
- ✅ **Right Now view implemented** - Core feature from PRD complete
- ❌ **No notifications** - Core feature from PRD not implemented

### Low
- ❌ **No onboarding** - Users dropped directly into app
- ❌ **No Q1 warnings/celebrations** - Missing UX polish
- ❌ **No count badges** - Missing overflow indicators
- ❌ **No ghost bubbles in empty states** - Missing visual guidance

---

## Milestone C — ✅ Complete

### Right Now View

**Implementation:**
- **Component**: `src/components/RightNowView.jsx` (and CSS)
- **Sorting Utility**: `src/utils/rightNowSort.js` exporting `sortTasksForRightNow(tasks)`
- **Navigation**: Toggle buttons in App header (`app-header__view-toggle` in `App.jsx`)
- **State**: View state `"matrix" | "rightNow"` in `App.jsx`

**Features Implemented:**
- Vertical list of tasks sorted by algorithm (estimate ascending, then quadrant Q1→Q4, then createdAt/id)
- Displays: task title, quadrant indicator (Q1/Q2/Q3/Q4 with color), estimate badge (using `formatEstimateMinutes`), priority badge (if present)
- Clicking a task row opens TaskDetailsModal via existing `handleTaskClick`
- Mark complete button on each row uses existing `handleCompleteTask` (sets completedAt, filters out from both views)
- Empty state when no active tasks ("All done!" message)
- View switching between Matrix and Right Now via toggle buttons
- Comprehensive tests: 9 tests in `App.rightNowView.test.jsx`, 9 tests in `rightNowSort.test.js`

**Sorting Algorithm:**
1. `estimateMinutesTotal` ascending (missing estimate → default 30 minutes)
2. Quadrant order: Q1, Q2, Q3, Q4 (using `getQuadrant`)
3. Stable tie-breaker: `createdAt` (if present), else `id` (ascending)

**Explicit Gap:**
- **Manual reordering** not implemented (sorting is algorithm-based only, no drag-to-reorder in Right Now view)

---

## Next Priorities

1. ✅ **Persistence** - localStorage implemented
2. ✅ **Undo functionality** - Undo wired up for auto-place and drag move toasts
3. ✅ **Task details modal** - View, edit, complete, delete implemented
4. ✅ **Mark complete** - Task lifecycle with completion tracking
5. ✅ **Right Now view** - Prioritized task list implemented
6. **Accessibility audit** - Fix ARIA labels, keyboard navigation

---

**Last Updated:** 2026-01-09 (Milestone C: Right Now View completed)

