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

## Current Status (Today)

### ✅ Milestone A: Complete
**localStorage persistence + undo wiring + tests**

**Implemented:**
- localStorage persistence utilities (`src/utils/storage.js`)
- Tasks automatically load from localStorage on app start (`src/App.jsx`)
- Tasks automatically save to localStorage on changes (gated for tests)
- Undo functionality for auto-place toast (restores previous urgent/important flags) (`src/App.jsx:437-455`)
- Undo functionality for drag move toast (restores previous quadrant, supports merged moves) (`src/App.jsx:437-455`)
- Comprehensive tests (`src/App.persistence.test.jsx`, `src/App.undo.test.jsx`)

### ✅ Milestone B: Complete
**Task Details Modal + Edit + Complete + Delete + tests**

**Implemented:**
- TaskDetailsModal component (`src/components/TaskDetailsModal.jsx`)
- Modal entry points: click, right-click (edit mode), Enter key (`src/App.jsx:284-292`, `src/components/TaskBubble.jsx:67-72`)
- Edit mode with full form validation (`src/components/TaskDetailsModal.jsx:88-108`)
- Mark complete functionality (sets completedAt, filters from matrix) (`src/App.jsx:316-323`)
- Delete task functionality with confirmation (`src/App.jsx:310-314`)
- Toast notifications for all actions (`src/App.jsx:307,313,323`)
- Drag conflict resolved (PointerSensor activationConstraint) (`src/App.jsx:43-48`)
- Comprehensive tests (`src/App.taskDetailsModal.test.jsx`)

### ✅ Milestone C: Complete
**Right Now View + sorting + page dots + arrow keys + tests**

**Implemented:**
- RightNowView component (`src/components/RightNowView.jsx`)
- Sorting algorithm (`src/utils/rightNowSort.js`) - estimate ascending, then quadrant Q1→Q4, then createdAt/id
- Prioritized task list with quadrant indicators, estimate badges, priority badges
- Mark complete from list (uses existing completion pathway)
- Empty state ("All done!" message)
- Page dots navigation (`src/components/PageDots.jsx`)
- Arrow key navigation (ArrowLeft/ArrowRight) (`src/App.jsx:303-312`)
- View switching between Matrix and Right Now (`src/App.jsx:58`)
- Comprehensive tests (`src/App.rightNowView.test.jsx` - 11 tests, `src/utils/rightNowSort.test.js` - 9 tests)

### ✅ Milestone F: Complete
**Backend-ready auth + per-user sync architecture (local-first, optional remote)**

**Implemented:**
- ✅ **Sync model + identifiers** - Task model includes sync fields: id (UUID string), updatedAt (ISO string), createdAt (ISO string), deletedAt (ISO string | null), completedAt (ISO string | null), deviceId (persisted in localStorage "eisenhower.deviceId"), revision (number, increments on mutations). normalizeTask() sets defaults for all sync fields.
- ✅ **Merge engine** - Created `src/sync/mergeTasks.js` with `mergeLocalAndRemote()` pure function. Rules: key by task.id, deletion tombstone wins if newer, higher revision wins, updatedAt tie-break, preserves unknown fields, no duplicate ids, keeps tombstones for propagation.
- ✅ **Repository seam upgrades** - Expanded `src/data/index.js` to support modes via `VITE_TASK_REPO_MODE` env var: local (default), hybrid (local + remote sync), remote-only. Created `getTaskRepository(authContext)` function.
- ✅ **HybridTaskRepository** - Created `src/data/HybridTaskRepository.js` that merges local and remote tasks. loadTasks() loads local, optionally loads remote if authenticated, merges via merge engine, saves merged back to local. saveTasks() saves local immediately, optionally saves remote if authenticated and online, enqueues to outbox on failure.
- ✅ **RemoteTaskRepositoryStub upgrade** - Added `loadTasksForUser(userId)` and `saveTasksForUser(userId, tasks)` methods with clear TODOs for Supabase/Firebase implementation paths. Fails gracefully when stub throws.
- ✅ **Auth stub + UI** - Created `src/auth/AuthProvider.jsx` with context providing user (id, email) | null, status ("anonymous" | "authenticated"), signIn() placeholder (sets mock user), signOut() (clears user). Added Account section to SettingsMenu with sign in/out UI. When switching auth state, tasks reload via repository load.
- ✅ **Sync outbox** - Implemented `src/sync/syncOutbox.js` with localStorage key "eisenhower.syncOutbox.v1". Stores operations like `{ id, type:"saveSnapshot", createdAtISO, payload:{ tasks, userId } }`. Hybrid saveTasks enqueues on remote failure. Deduplication: keeps only latest snapshot per userId. Retry on app focus/online event (window 'online' + visibilitychange).
- ✅ **Tests** - Unit tests for merge engine (local newer wins, remote newer wins, deletion tombstone wins, equal revision uses updatedAt tie-break, preserves unknown fields, no duplicate ids). Repository selection tests (env mode local/hybrid/remote, hybrid doesn't crash when Remote throws). Outbox tests (remote failure enqueues, retry flushes outbox).
- ✅ **App.jsx updates** - All task mutations (create, edit, delete, complete, drag move) increment revision and update updatedAt via `updateTaskSyncFields()` utility. Tasks filtered to exclude deletedAt. Wrapped with AuthProvider in main.jsx. Uses getTaskRepository(authContext) for repository selection.

**Backend integration plan:**
- **SupabaseTaskRepository**: Replace RemoteTaskRepositoryStub methods with Supabase client. Initialize Supabase client with project URL and anon key. loadTasksForUser: `supabase.from('tasks').select('*').eq('user_id', userId)`. saveTasksForUser: `supabase.from('tasks').upsert(tasks.map(t => ({ ...t, user_id: userId })))`. Add real-time subscriptions for sync.
- **FirebaseTaskRepository**: Replace RemoteTaskRepositoryStub methods with Firebase client. Initialize Firebase with config. loadTasksForUser: `db.collection('tasks').where('userId', '==', userId).get()`. saveTasksForUser: Batch write with `db.collection('tasks').doc(task.id).set({ ...task, userId })`. Add Firestore listeners for real-time sync.

**Non-goals (explicitly NOT implemented yet):**
- Real Supabase/Firebase SDK integration (stub only)
- Real OAuth UI flows (placeholder sign in only)
- Push notifications backend

### ✅ Milestone E: Complete
**Import/Export + Data Migration UX**

**Implemented:**
- ✅ **E1 Export JSON** - Created `src/data/transfer/taskTransfer.js` with `serializeTasksForExport()` function that returns JSON string with version 1, exportedAt ISO timestamp, tasks array, and meta object (app: "Eisenhower", schema: "tasks"). Export triggers browser download with filename `eisenhower-tasks-YYYY-MM-DD.json`. Toast: "Exported tasks".
- ✅ **E2 Import JSON (replace/merge)** - Created `parseImportedTasks()` function that safely parses JSON with try/catch, supports versioned object format (version 1) and legacy array format, validates tasks have id and title/name, returns `{ tasks, meta }`. Created `mergeTasks()` function that merges by id (incoming wins for same id), preserves stable ordering (existing order kept, new tasks appended at end). Added ImportConfirmDialog component with Replace and Merge actions, shows incoming task count. Replace sets tasks = incoming tasks, Merge uses mergeTasks(current, incoming). Persists via TaskStore automatically via existing debounced save. Toasts: success "Imported X tasks" / "Merged X tasks", failure "Import failed: <message>".
- ✅ **E3 Validation + error toasts** - parseImportedTasks validates JSON parsing, version support, tasks array structure, and each task has id and title/name. Throws user-friendly Error messages for invalid/corrupt inputs. Error toasts show specific error messages.
- ✅ **E4 Transfer unit tests** - Created `src/data/transfer/taskTransfer.test.js` with comprehensive tests: serialize produces valid JSON with version 1, tasks array, meta; parse supports versioned object and legacy array; parse fails gracefully on invalid JSON; mergeTasks dedupes by id and preserves order (existing order kept, new appended). Created `src/App.taskTransfer.test.jsx` integration test: export and persist after unmount/remount, Replace/Merge dialog handling, error handling for invalid files.

### ✅ Milestone F: Complete
**Account + auth-ready, user-scoped storage (stubbed, no real Supabase/Firebase yet)**

**Implemented:**
- ✅ **F1 SessionStore + UI sign-in/out (stub)** - Created `src/data/session/SessionStore.js` with `getSession()` (returns `{ isSignedIn: boolean, userId: string | null }`), `signInStub()` (creates stable random userId like `user_<uuid>` and persists to localStorage), `signOut()` (clears session but does NOT delete task data). Created `src/data/session/sessionKeys.js` for localStorage key constants. Session uses versioned schema (version 1) with migration from legacy string format. Updated SettingsMenu to use SessionStore instead of AuthProvider, shows "Signed in as <short userId>" when signed in, "Sign in (stub)" when signed out.
- ✅ **F2 User-scoped local storage keys** - Updated `src/data/storage/TaskStore.js` to support optional `storageKey` parameter in `loadTasks({ storageKey })`, `saveTasks(tasks, { storageKey })`, and `clearTasks({ storageKey })`. Maintains backward compatibility (defaults to original key if not provided). Storage keys are namespaced: anonymous user uses `tasks::anon`, signed-in user uses `tasks::<userId>`.
- ✅ **F3 Repository wiring + account switching behavior** - Created `src/data/repository/TaskRepository.js` wrapper that uses SessionStore to get current userId and namespaces TaskStore calls. Exposes same interface as TaskStore (loadTasks/saveTasks/clearTasks) but automatically scopes to current user. Updated App.jsx to use TaskRepository instead of TaskStore directly. When session changes (sign in/out), App reloads tasks from new scope and shows toast: "Signed in as <short userId>" or "Signed out". Tasks do NOT merge between scopes - switching accounts switches views completely.
- ✅ **F4 Tests for session + scope switching** - Created `src/data/session/SessionStore.test.js` with unit tests: getSession returns correct state, signInStub persists stable userId, signOut clears session, handles corrupt JSON and localStorage errors. Created `src/App.sessionScope.test.jsx` with integration tests: signing in switches storage scope (anon task disappears when signing in), signing out switches back to anon scope (signed-in task disappears), persistence across reload (task persists in signed-in scope after unmount/remount), toast notifications for sign in/out. Updated `src/App.persistence.test.jsx` to use TaskRepository instead of TaskStore directly.

**Backend integration plan:**
- **SupabaseTaskRepository**: Replace TaskRepository wrapper to use Supabase client. Initialize Supabase client with project URL and anon key. loadTasks: `supabase.from('tasks').select('*').eq('user_id', userId)`. saveTasks: `supabase.from('tasks').upsert(tasks.map(t => ({ ...t, user_id: userId })))`. Add real-time subscriptions for sync.
- **FirebaseTaskRepository**: Replace TaskRepository wrapper to use Firebase client. Initialize Firebase with config. loadTasks: `db.collection('tasks').where('userId', '==', userId).get()`. saveTasks: Batch write with `db.collection('tasks').doc(task.id).set({ ...task, userId })`. Add Firestore listeners for real-time sync.

**Non-goals (explicitly NOT implemented yet):**
- Real Supabase/Firebase SDK integration (stub only)
- Real OAuth UI flows (placeholder sign in only)
- Import anon tasks into account (explicitly deferred)
- RemoteTaskStore implementation (kept as stub)

### ✅ Milestone G: Complete
**Notification system scaffolding (local-only, backend-ready)**

**Implemented:**
- Notification preferences model with localStorage persistence (`src/notifications/notificationPreferences.js`)
  - Quiet hours (default 22:00-08:00)
  - Default times for low/medium/high frequency tiers
  - In-app reminders toggle (default ON)
  - Browser notifications toggle (default OFF, opt-in)
- Notification rules engine (`src/notifications/notificationRules.js`)
  - `deriveEffectiveFrequency`: escalates to "high" when dueDate within 4 days
  - `shouldDriftToQ1`: detects Q2 tasks with dueDate within 48h
- NotificationScheduler pure function (`src/notifications/NotificationScheduler.js`)
  - `scheduleNext`: plans notifications based on frequency tiers and quiet hours
  - Weekly patterns: Low (Sunday 18:00), Medium (Mon/Wed/Fri 09:00), High (Daily 09:00)
  - Quiet hours adjustment (pushes fire time forward if within quiet hours)
  - Stable notification IDs for deduplication
- InAppNotifier (`src/notifications/InAppNotifier.js`) - toast integration
- BrowserNotifier (`src/notifications/BrowserNotifier.js`) - optional browser Notification API
- Runtime tick in App.jsx (`src/App.jsx:410-490`)
  - Runs every 60 seconds
  - Triggers on visibility change (tab focus)
  - Fires notifications via InAppNotifier and BrowserNotifier
  - Persists fired notifications log (last 500 entries)
- Drift execution: auto-moves Q2 tasks to Q1 when dueDate within 48h
- Notification preferences UI in SettingsMenu (`src/components/SettingsMenu.jsx`)
  - Toggle in-app reminders
  - Toggle browser notifications (requests permission)
  - Quiet hours time inputs
- Comprehensive tests:
  - `src/notifications/notificationRules.test.js` - 19 tests
  - `src/notifications/NotificationScheduler.test.js` - 11 tests
  - `src/App.notifications.test.jsx` - integration tests

### Known Gaps / Polish
- **Undo for delete/complete actions** - Only undo exists for drag moves and auto-placement
- **Quadrant overflow count badges** - No badge when >5 tasks in quadrant
- **Q1 overload warnings** - No warning badge or suggestions when 8+ tasks in Q1
- **Q1 empty celebration** - Standard empty state, no confetti animation or Q2 task suggestion
- **Swipe gestures** - No swipe navigation between views (using page dots/arrow keys instead)
- **Manual reordering in Right Now** - Sorting is algorithm-based only, no drag-to-reorder

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
- ✅ **Due date picker** - Date input field in creation form (`src/components/TaskCreationOverlay.jsx`)
- ✅ **Notification frequency** - Low/Medium/High toggle buttons in form (`src/components/TaskCreationOverlay.jsx`)
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
- ✅ **Color-coded urgency** - Deadline-based when dueDate exists (green >7 days, yellow 2-7 days, red <2 days or past), otherwise quadrant-based (Red Q1, Yellow Q2/Q3, Green Q4)
- ✅ **Time estimate badges** - Shows formatted time ("Xh Ym" or "Nm") if provided
- ✅ **Deadline-based color coding** - Implemented (`src/utils/deadlineUrgency.js`): Uses `parseDueDateLocal` to normalize to local end-of-day (23:59:59.999), exact thresholds (2 days = 172,800,000 ms, 7 days = 604,800,000 ms), returns "green"/"yellow"/"red" or null. Falls back to quadrant-based urgency when no dueDate. Uses CSS variables (`--urgency-green`, `--urgency-yellow`, `--urgency-red`) in TaskBubble.
- ✅ **Task details modal** - Bottom sheet modal opens on task click, displays dueDate and notificationFrequency

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

## Milestone A — ✅ Complete

**localStorage persistence + undo wiring + tests**

See "Current Status (Today)" section above for implementation details.

---

## Milestone B — ✅ Complete

**Task Details Modal + Edit + Complete + Delete + tests**

See "Current Status (Today)" section above for implementation details.

---

## Milestone C — ✅ Complete

**Right Now View + sorting + page dots + arrow keys + tests**

See "Current Status (Today)" section above for implementation details.

---

## Milestone D

### ✅ D1: Repository seam + local persistence (Complete)

**Implemented:**
- ✅ **Repository seam + local persistence** - TaskRepository abstraction (`src/data/TaskRepository.js`) with LocalTaskRepository implementation (`src/data/LocalTaskRepository.js`) using localStorage key "eisenhower.tasks.v1". Future-proofed for Supabase/Firebase swap without touching UI/business logic. Handles parse errors gracefully (returns null, doesn't crash). Migration ensures all tasks have id, title/name, urgent, important, createdAt. App.jsx loads tasks asynchronously on mount and saves with debouncing (200ms) on task changes.

### ✅ D2: Due date + notification frequency (create + edit + persistence) (Complete)

**Implemented:**
- ✅ **normalizeTask utility** - Created `src/utils/normalizeTask.js` with `deriveDefaultFrequency` helper and `normalizeTask` function. Ensures all tasks have `dueDate` (null if missing) and `notificationFrequency` (default based on quadrant: Q1=high, Q2=medium, Q3/Q4=low). Used consistently in repository migration and task creation (`src/data/LocalTaskRepository.js`, `src/App.jsx`).
- ✅ **Task model** - Tasks support `dueDate` (string | null, stored as "YYYY-MM-DD" or ISO string) and `notificationFrequency` ("low" | "medium" | "high", always set, never null for new tasks).
- ✅ **TaskCreationOverlay** - Due date picker (native `<input type="date">` labeled "Due date") and frequency selector (Low/Medium/High pill buttons labeled "Reminder frequency"). Default frequency derived from quadrant based on urgent/important toggles (Q1=high, Q2=medium, Q3/Q4=low). "Touched" behavior: if user manually selects frequency, it does NOT auto-change when toggles change afterward (`userManuallySetFrequency` ref). Empty dueDate string normalized to null on submit. Frequency always set to concrete value (never null) on submit (`src/components/TaskCreationOverlay.jsx`).
- ✅ **TaskDetailsModal** - View mode displays "Due date" and "Reminder frequency" fields (shows "None" if missing). Edit mode allows editing both via date input and 3-button selector. Frequency buttons set value (no toggle to null). Empty dueDate string normalized to null on save (`src/components/TaskDetailsModal.jsx`).
- ✅ **Persistence** - Due date and notification frequency automatically included in persistence (no UI regression). Repository uses normalizeTask for migration and validation (`src/data/LocalTaskRepository.js`).
- ✅ **Tests** - Created `src/utils/normalizeTask.test.js` with tests for `deriveDefaultFrequency` and `normalizeTask` (default frequency derivation for all quadrants, dueDate normalization, field preservation). Extended `src/App.createTaskOverlay.test.jsx` with tests for default frequency derivation (Q1/Q2/Q3/Q4), touched behavior (user override doesn't change when toggles update), and create flow persistence. Extended `src/App.taskDetailsModal.test.jsx` with tests for edit flow persistence. All tests deterministic (no Date.now() reliance, mocked localStorage).

### ✅ D3: Deadline-based urgency colors (Complete)

**Implemented:**
- ✅ **deadlineUrgency utility** - Created `src/utils/deadlineUrgency.js` with `parseDueDateLocal` and `getDeadlineUrgency` functions. Parses dueDate as local end-of-day (23:59:59.999) to avoid timezone bugs. Exact thresholds: 2 days = 172,800,000 ms, 7 days = 604,800,000 ms. Returns "green" (> 7 days), "yellow" (2-7 days), or "red" (< 2 days or past).
- ✅ **CSS variables for urgency colors** - Added `--urgency-green`, `--urgency-yellow`, `--urgency-red` in `src/styles/tokens.css`.
- ✅ **TaskBubble updates** - Updated `src/components/TaskBubble.jsx` to use CSS variables when urgency label is provided (green/yellow/red), with fallback to hex colors for backward compatibility. Added `data-testid="task-urgency-indicator"` for testing.
- ✅ **App.jsx urgency logic** - Updated `getUrgencyFromTask` to use deadline urgency if dueDate exists, otherwise fallback to quadrant-based urgency. Same logic in `src/components/Quadrant.jsx`.
- ✅ **Deterministic tests** - Updated `src/utils/deadlineUrgency.test.js` and `src/App.deadlineUrgency.test.jsx` to use fixed "now" date (2026-01-08T12:00:00) for deterministic testing. All 22 tests passing.

**Non-goals (explicitly NOT implemented yet):**
- Push notifications scheduling/escalation
- Q2→Q1 drift
- Backend auth/sync

### ✅ D4: Future-proof persistence + portability (export/import) + schema/version hardening (Complete)

**Implemented:**
- ✅ **Repository selection seam** - Created `src/data/index.js` that exports `taskRepository` based on `VITE_TASK_REPO` env var (default: 'local' for LocalTaskRepository, 'stub' for RemoteTaskRepositoryStub). All UI code imports from `src/data` instead of concrete implementations, future-proofing for Supabase/Firebase swap.
- ✅ **RemoteTaskRepositoryStub** - Created `src/data/RemoteTaskRepositoryStub.js` with placeholder implementation throwing clear errors, includes TODOs showing where Supabase/Firebase logic will go.
- ✅ **Versioned storage schema** - Updated `src/utils/storage.js` and `src/data/LocalTaskRepository.js` to use versioned format: `{ version: 1, tasks: [...] }` instead of raw array. Migration automatically converts old array format (version 0) to version 1 on load.
- ✅ **Migration logic** - Detects old array format (version 0) and migrates to version 1, preserving all task fields including unknown fields for forward compatibility. Normalizes each task via `normalizeTask()` utility. Ensures all tasks have: id, title, urgent (boolean), important (boolean), dueDate (string|null), notificationFrequency ("low"|"medium"|"high"), estimateMinutesTotal (number|null), createdAt (ISO string/timestamp), completedAt (ISO string/timestamp|null).
- ✅ **Guardrails** - Gracefully handles corrupted JSON (returns null, doesn't crash app startup), extremely large arrays (>10,000 tasks), invalid data formats, and unknown schema versions. Never crashes app on persistence errors.
- ✅ **Export/Import functionality** - Created `src/utils/exportImport.js` with `exportTasks()`, `parseImportFile()`, and `mergeTasksById()` utilities. Export creates JSON file with `{ version: 1, exportedAt: "...", tasks: [...] }` and triggers browser download. Import accepts version 1 or version 0 (array) format, validates, migrates, normalizes, and merges by id (imported tasks overwrite existing tasks with same id). Shows toast notifications: "Exported X tasks", "Imported X tasks", or error messages.
- ✅ **Settings menu UI** - Created `src/components/SettingsMenu.jsx` with "⋯" button in top-right corner. Dropdown menu with "Export tasks", "Import tasks" (opens file picker), and "Reset local data" (with confirmation dialog) options.
- ✅ **Reset functionality** - Clears localStorage via repository helper, resets app to default demo tasks, shows toast: "Local data reset".
- ✅ **Comprehensive tests** - Extended `src/data/LocalTaskRepository.test.js` with tests for versioned schema (save/load), migration from v0 to v1, corrupted JSON handling, large array guardrails, unknown field preservation, and invalid task skipping. Created `src/utils/exportImport.test.js` with tests for export format, import parsing (version 1 and version 0), merge logic, error handling. Created `src/App.importExport.test.jsx` with App-level integration tests for export flow, import flow with file simulation, error handling, and reset with confirm/cancel.
- ✅ **App.jsx updates** - Updated to import `taskRepository` from `src/data` instead of `LocalTaskRepository` directly. Added SettingsMenu component with export/import/reset handlers wired up.

**Data Format:**
- **Version 1 schema (current):** `{ version: 1, tasks: [...] }`
- **Version 0 schema (legacy, auto-migrated):** `[...]` (array of tasks)
- **Export format:** `{ version: 1, exportedAt: "ISO string", tasks: [...] }`
- **All tasks normalized:** id (string), title (string), urgent (boolean), important (boolean), dueDate (string|null), notificationFrequency ("low"|"medium"|"high"), estimateMinutesTotal (number|null), createdAt (timestamp/ISO string), completedAt (timestamp/ISO string|null), plus any unknown fields preserved for forward compatibility.

**Non-goals (explicitly NOT implemented yet):**
- Real Supabase/Firebase integration (stub only)
- Auth, sync, or push notifications
- Remote storage persistence

**Storage seam ready for Supabase/Firebase via taskRepository selection** - Simply implement RemoteTaskRepositoryStub methods with real Supabase/Firebase client code, set `VITE_TASK_REPO=stub` (or rename env var), and all UI code will use remote storage without changes.

### ✅ D5: Storage layer abstraction (Complete)

**Implemented:**
- ✅ **TaskStore.js** - Created `src/data/storage/TaskStore.js` with interface-style module:
  - `loadTasks()`: returns `{ tasks, meta }` where meta includes version
  - `saveTasks(tasks)`: persists tasks to localStorage using key "eisenhower.tasks.v1"
  - `clearTasks()`: clears persisted data
  - Includes schema versioning (supports version 0 legacy array and version 1 versioned format)
  - Safe parse fallback: corrupt JSON returns empty tasks array instead of crashing
  - Handles localStorage errors gracefully
- ✅ **RemoteTaskStore.stub.js** - Created `src/data/storage/RemoteTaskStore.stub.js` with same function signatures as TaskStore but throws "Not configured" errors. Future-proofed for Supabase/Firebase replacement.
- ✅ **storeConfig.js** - Created `src/data/storage/storeConfig.js` with single config flag (`VITE_STORAGE_TYPE`) that chooses local vs remote (default: local). Uses ES module imports.
- ✅ **App.jsx refactor** - Refactored App.jsx to use TaskStore:
  - On app mount: calls `loadTasks()` and initializes state from `{ tasks }` result (unless `initialTasks` prop provided for tests)
  - On tasks change: calls `saveTasks(tasks)` with debounce (250ms, within 150-300ms range) to avoid spam
  - Removed dependency on repository pattern, now uses simpler TaskStore interface
  - Removed auth state dependency from load effect (storage abstraction handles this at config level)
- ✅ **Reset action** - Updated SettingsMenu "Reset local data" action to call `taskStore.clearTasks()` and reset state to default tasks.
- ✅ **Tests** - Created `src/data/storage/TaskStore.test.js` with unit tests:
  - Load tests: empty storage, version 1 format, legacy array format, corrupt JSON, invalid formats, localStorage errors
  - Save tests: normal save, empty array, invalid input, large array guardrails, localStorage errors
  - Clear tests: normal clear, localStorage errors
  - Integration tests: save/load cycle, clear/reload cycle
- ✅ **Integration test** - Updated `src/App.persistence.test.jsx`:
  - Added unmount/remount test: creates task, unmounts App, remounts App, verifies task persists and reloads
  - Updated to use TaskStore instead of LocalTaskRepository
  - All existing persistence tests updated and passing

**Storage Abstraction Benefits:**
- Simple interface: just loadTasks/saveTasks/clearTasks
- Future-proof: swap localStorage <-> Supabase/Firebase by changing config flag
- No App logic changes needed when switching storage backends
- Graceful error handling: never crashes on storage errors
- Schema versioning built-in: supports migration from version 0 to version 1

**Non-goals (explicitly NOT implemented yet):**
- Real Supabase/Firebase integration (stub throws "Not configured")
- Remote storage persistence (still localStorage-only)

---

## Next: Milestone D (Additional Features)

- [ ] **Undo for delete/complete actions**
  - [ ] Add undo toast for delete actions
  - [ ] Add undo toast for complete actions
  - [ ] Store deleted task state for restoration
  - [ ] Store completed task state for restoration
  - [ ] Wire undo handlers in App.jsx
  - [ ] Add tests for delete/complete undo

- [ ] **Quadrant overflow badges**
  - [ ] Detect when quadrant has >5 tasks
  - [ ] Display count badge in quadrant top-right
  - [ ] Badge styling and positioning
  - [ ] Add tests for badge display logic

- [ ] **Q1 overload warnings**
  - [ ] Detect when Q1 has 8+ tasks
  - [ ] Display warning badge on Q1
  - [ ] Tap warning shows suggestions modal
  - [ ] Suggestions for rescheduling/deleting/moving tasks
  - [ ] Add tests for warning display

- [ ] **Q1 empty celebration**
  - [ ] Detect when Q1 becomes empty
  - [ ] Trigger confetti animation
  - [ ] Show Q2 task suggestion ("Nice! Want to get ahead on something important?")
  - [ ] Add tests for celebration trigger

- [ ] **Swipe gestures for navigation**
  - [ ] Detect swipe right (Matrix → Right Now)
  - [ ] Detect swipe left (Right Now → Matrix)
  - [ ] Ignore swipes while dragging/scrolling
  - [ ] Add tests for swipe detection

- [ ] **Manual reordering in Right Now view**
  - [ ] Enable drag-to-reorder within Right Now list
  - [ ] Store manual order override
  - [ ] Merge manual order with algorithm sorting
  - [ ] Add tests for reordering

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
- ✅ **localStorage** - Tasks persist to localStorage via repository abstraction, loaded asynchronously on app start
- ❌ **sessionStorage** - Not implemented
- ❌ **IndexedDB** - Not implemented
- ✅ **Task persistence** - Tasks saved to localStorage via repository with debounced saves (200ms), loaded asynchronously on mount (unless initialTasks provided for tests)
- ✅ **Repository abstraction** - Future-proofed data layer (`src/data/TaskRepository.js`, `src/data/LocalTaskRepository.js`, `src/data/index.js`) allows swapping to Supabase/Firebase without touching UI/business logic via environment variable (`VITE_TASK_REPO`)
- ✅ **Versioned schema** - Storage format: `{ version: 1, tasks: [...] }` with automatic migration from legacy array format (version 0) to version 1
- ✅ **Migration support** - Backwards-compatible migration adds missing fields (dueDate, notificationFrequency, createdAt) with sensible defaults. Preserves unknown fields for forward compatibility
- ✅ **Export/Import** - Users can export tasks to JSON file and import from JSON file for portability across devices. Import merges by id (imported overwrites existing)
- ✅ **Corruption handling** - Gracefully handles corrupted JSON, invalid data, large arrays, and unknown versions (returns null, doesn't crash app)

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
- ✅ **Modify fields** - Can edit title, urgent/important, priority, estimate, dueDate, and notificationFrequency

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
- ✅ **getDeadlineUrgency utility** - Tests in `deadlineUrgency.test.js` (green/yellow/red thresholds, edge cases, date handling)

### Integration Tests
- ✅ **Task creation flow** - Tests in `App.createTaskOverlay.test.jsx`
- ✅ **Assignment countdown** - Tests in `App.assignmentCountdown.test.jsx`
- ✅ **Auto-placement** - Tests in `App.test.jsx` (Step 6 integration test)
- ✅ **Drag and drop** - Tests in `App.dragDrop.test.jsx`
- ✅ **Task movement toasts** - Tests verify toast messages
- ✅ **Time estimate calculation** - Tests verify estimateMinutesTotal calculation
- ✅ **Right Now view** - Tests in `App.rightNowView.test.jsx` (rendering, sorting, click handlers, completion, navigation)
- ✅ **Deadline urgency rendering** - Tests in `App.deadlineUrgency.test.jsx` (green/yellow/red based on dueDate, fallback to quadrant-based)
- ✅ **Repository persistence** - Tests in `App.persistence.test.jsx` (async loading, debounced saves) and `LocalTaskRepository.test.js` (migration, validation, versioning, corruption handling)
- ✅ **Export/Import functionality** - Tests in `exportImport.test.js` (export format, import parsing, merge logic) and `App.importExport.test.jsx` (App-level integration tests for export/import/reset flows)

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

**Last Updated:** 2026-01-08 (Status update: Milestones A, B, C, D1, D2, D3, D4, D5 complete - D5: Storage layer abstraction with TaskStore.js interface (loadTasks/saveTasks/clearTasks), RemoteTaskStore.stub.js for future Supabase/Firebase swap, storeConfig.js for local/remote selection (default local), App.jsx refactored to use TaskStore with debounced saves (250ms), reset action uses TaskStore.clearTasks(), unit tests for TaskStore, integration test for unmount/remount persistence. Storage abstraction future-proofs swap from localStorage to remote storage without App logic changes.)

