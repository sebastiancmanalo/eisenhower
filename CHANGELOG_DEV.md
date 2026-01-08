# Development Changelog

This file tracks development sessions and changes.

- One entry per session/day
- Used to reconstruct context when returning after time away
- Helps track what changed, which files were touched, and what needs manual testing

---

## 2026-01-08 - Milestone A: localStorage persistence + undo wiring + tests

**What Changed:**
- Added localStorage persistence for tasks (loadTasks, saveTasks, clearTasks utilities)
- Tasks automatically load from localStorage on app start (unless initialTasks prop provided for tests)
- Tasks automatically save to localStorage when they change (gated by initialTasks prop for test determinism)
- Wired undo functionality for auto-place toast (restores previous urgent/important flags)
- Wired undo functionality for drag move toast (restores previous quadrant, supports merged moves)
- Added comprehensive tests for persistence and undo functionality

**Files Touched:**
- `src/utils/storage.js` (new) - localStorage utilities with validation
- `src/App.jsx` - Added persistence loading/saving, undo handlers for auto-place and drag moves
- `src/App.persistence.test.jsx` (new) - Tests for localStorage loading, saving, and test mode gating
- `src/App.undo.test.jsx` (new) - Tests for undo functionality on drag moves
- `PROGRESS.md` - Updated persistence and undo status to ✅
- `CHANGELOG_DEV.md` - This entry

**What to Test Manually:**
- Create a task, refresh page → task should persist
- Create multiple tasks, move them between quadrants, refresh → all tasks should persist
- Drag a task to different quadrant → toast should show "Undo" button
- Click Undo on drag move toast → task should return to previous quadrant
- Create task, let auto-place countdown expire (if quadrant changed) → toast should show "Undo" button
- Click Undo on auto-place toast → task should return to previous quadrant
- Multiple rapid drag moves → merged toast should undo all affected tasks

**Notes:**
- Persistence is gated by initialTasks prop to keep tests deterministic
- Undo handlers capture previous state before changes are applied
- Drag move toasts merge multiple moves and undo restores all affected tasks
- Auto-place only shows toast (with undo) if quadrant actually changed

---

## 2026-01-08 - Documentation: PRD Alignment and Progress Tracking

**What Changed:**
- Created PRD_v2.md - Updated PRD reflecting current codebase reality
- Created PROGRESS.md - Progress tracking checklist
- Created CHANGELOG_DEV.md - Development log
- Added npm script "status" - Reminder to update progress docs

**Files Touched:**
- `PRD_v2.md` (new)
- `PROGRESS.md` (new)
- `CHANGELOG_DEV.md` (new)
- `package.json` (added "status" script)

**What to Test Manually:**
- Verify PRD_v2.md accurately reflects current app behavior
- Verify PROGRESS.md status indicators match actual implementation
- Run `npm run status` to see reminder message
- No application behavior changes (documentation only)

**Notes:**
- PRD_v2.md compares original PRD.md claims vs actual implementation
- PROGRESS.md tracks MVP Core, UI/UX, Right Now view, Notifications, Persistence, etc.
- CHANGELOG_DEV.md will track ongoing development progress

---

## 2026-01-09 - Milestone B: Task Details Modal + Edit + Complete + Delete + Tests

**What Changed:**
- Added TaskDetailsModal component (bottom sheet style) with view and edit modes
- Implemented task editing: title, urgent/important flags, priority, estimate
- Implemented mark complete: sets completedAt timestamp, hides task from quadrants
- Implemented delete task: with confirmation step, removes task from state
- Added completedAt field to task model
- Filtered completed tasks from quadrant displays
- Added comprehensive tests for modal functionality
- Updated task click handler to open modal instead of console.log

**Files Touched:**
- `src/components/TaskDetailsModal.jsx` (new) - Bottom sheet modal component
- `src/components/TaskDetailsModal.css` (new) - Modal styling
- `src/App.jsx` - Added modal state, handlers for update/delete/complete, filter completed tasks
- `src/App.taskDetailsModal.test.jsx` (new) - Tests for modal, edit, complete, delete
- `PROGRESS.md` - Updated task details, edit, complete, delete status to ✅
- `CHANGELOG_DEV.md` - This entry

**What to Test Manually:**
- Click a task bubble → modal should slide up from bottom
- Click Edit → form fields should become editable
- Edit title and save → task bubble should show updated title
- Change urgent/important flags → task should move to correct quadrant
- Click Mark complete → task should disappear from quadrant, toast should show
- Click Delete → confirmation should appear
- Confirm delete → task should be removed, toast should show
- Press ESC key → modal should close (or exit edit mode/delete confirm)
- Click backdrop → modal should close
- Complete a task → refresh page → task should remain completed (not visible)
- Edit/complete/delete tasks → refresh page → changes should persist

**Notes:**
- Modal uses bottom sheet design with drag handle visual
- Completed tasks are filtered out of quadrants (MVP behavior)
- Edit mode updates task in state, which triggers persistence automatically
- Delete uses inline confirmation (no window.confirm)
- Modal has proper ARIA attributes for accessibility
- ESC key handling: closes modal, exits edit mode, or cancels delete confirm

---

**Note:** Add new entries above this line, newest first.

