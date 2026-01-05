# Eisenhower Task Manager - Product Requirements Document

## 1. Product Overview

### 1.1 Vision
A task management application that helps users, particularly those with ADHD, prioritize and remember tasks using the Eisenhower Matrix system with intelligent notifications.

### 1.2 Target Audience
Primary: People with ADHD who struggle with:
- Time blindness (difficulty estimating task duration)
- Task prioritization
- Working under pressure
- Remembering tasks exist

Secondary: General productivity users seeking structured task management

### 1.3 Core Problem Statement
Users have many tasks but struggle to decide what to do in any given moment. They forget about important tasks, misjudge urgency, and only feel motivated by deadline pressure. Traditional to-do lists don't provide enough structure for prioritization.

---

## 2. Core Features (MVP)

### 2.1 Task Management

#### 2.1.1 Task Creation Flow
1. User initiates task creation via:
   - Pull-down gesture from top of screen
   - "+" button in top-right corner
2. User types task name
3. Inline form appears below with required fields:
   - **Importance toggle** (Important / Not Important)
   - **Urgency toggle** (Urgent / Not Urgent)
   - **Due date picker**
   - **Notification frequency** (Low / Medium / High buttons)
4. Once all fields completed, task becomes a draggable bubble
5. **10-second window** for user to drag bubble to desired quadrant
6. If no action within 10 seconds:
   - Bubble automatically places into correct quadrant based on importance/urgency
   - Toast notification: "Auto-placed in [Quadrant Name]" with 5-second Undo button
7. User can drag task to any quadrant at any time after placement

#### 2.1.2 Task Display
- Tasks appear as **bubble UI elements** containing only task name
- Bubbles have **color-coded deadline urgency** (implementation TBD):
  - Green: >7 days until due
  - Yellow: 2-7 days until due
  - Red: <2 days until due
- Tapping bubble opens modal with full details

#### 2.1.3 Task Details Modal
**Display:**
- Task name
- Due date
- Time estimate (if available)
- Notification frequency
- Notes/description field

**Actions:**
- **Pencil icon** (top-right) → Edit mode:
  - Modify any field
  - Delete task
  - Mark complete
- **Mark Complete** button
- **Note:** Cannot drag to different quadrant from modal; must drag from main view

#### 2.1.4 Time Estimation System
**During Creation:**
- Time estimate NOT required (reduces friction)

**After First Completion:**
- Prompt: "How long did that take?" with quick-select options (15min / 30min / 1hr / 2hr / 4hr+)

**For Subsequent Tasks:**
- App uses ML/heuristics to estimate based on:
  - Keyword similarity to past tasks
  - Average time for that quadrant
  - Default: 30 minutes if no data
- Shows estimate subtly in task details (small clock icon + "~30m")
- User can tap to adjust estimate

**Learning Features:**
- Shows comparison: "You usually take 45min for tasks like this"
- Optional toggle before starting: "I'm faster/slower today" (±50% adjustment)
- Weekly stats: "Your time estimates improved 23% this month!"

### 2.2 Eisenhower Matrix Interface

#### 2.2.1 Quadrant System
**Four Quadrants:**
- **Q1:** Urgent & Important ("🔥 Do First") - Red border, elevated shadow
- **Q2:** Important, Not Urgent ("📅 Schedule") - Blue border
- **Q3:** Urgent, Not Important ("👥 Delegate") - Yellow/orange border
- **Q4:** Not Urgent, Not Important ("🗑️ Delete") - Gray border, low opacity

#### 2.2.2 Layout - Mobile
**Main View (Proportional):**
- Q1: 50-60% of screen height, full width
- Q2, Q3, Q4: Stacked vertically below, each full width
- Entire screen scrolls vertically

**Task Assignment View (Equal):**
- During 10-second drag window: Classic 2x2 grid, all quadrants equal size
- Returns to proportional layout after assignment

#### 2.2.3 Layout - Web
**Main View (Proportional):**
- Q1: 50-60% of screen height, full width
- Q2, Q3, Q4: Horizontal row below, equal width

**Task Assignment View (Equal):**
- Same as mobile: 2x2 grid during assignment

#### 2.2.4 Quadrant Overflow
- Each quadrant independently scrollable
- **Count badge** appears when >5 tasks in quadrant
  - Floating badge in top-right corner
  - Style: Small circle with number
- Tasks do not shrink or stack/overlap

#### 2.2.5 Empty State
- Quadrant name always visible
- Example ghost bubbles showing sample tasks
- No motivational text in MVP

#### 2.2.6 Quadrant Warnings & Celebrations

**Q1 Overload (8+ tasks):**
- Warning badge appears on quadrant
- Tapping shows message: "This is a lot of urgent work. Consider:"
  - "Reschedule some tasks?"
  - "Delete tasks that don't matter?"
  - "Move some to Q2?"
- App suggests but doesn't force changes

**Q1 Empty:**
- Green checkmark appears on quadrant
- Small confetti animation
- Suggestion: "Nice! Want to get ahead on something important?" (shows top Q2 task)

### 2.3 "Right Now" View

#### 2.3.1 Purpose
Answer the question: "What should I do right now?"

#### 2.3.2 Sorting Algorithm
Tasks sorted by:
1. **Easiest to complete** (shortest time estimate)
2. **Most crucial** (within same time bracket):
   - Q1 tasks (with deadline proximity as tiebreaker)
   - Q2 tasks
   - Q3 tasks
3. **Everything else** (Q4 at bottom)

Rationale: Quick wins first (dopamine hit), then critical work, then the rest.

#### 2.3.3 Display
- Vertical list of tasks
- Shows: Task name, quadrant indicator, time estimate, due date
- Tap to open task details modal
- Mark complete directly from list
- Can drag tasks to reorder manually (overrides algo temporarily)

### 2.4 Navigation

#### 2.4.1 View Switching
- **Swipe right:** Matrix View → Right Now View
- **Swipe left:** Right Now View → Matrix View
- **Page dots** at bottom indicating current view (2 dots total)

### 2.5 Notification System

#### 2.5.1 Notification Philosophy
- Notifications are **persistent reminders**, not actionable prompts
- They exist until task is marked complete
- Designed to combat ADHD tendency to forget tasks exist

#### 2.5.2 Frequency Tiers
- **Low:** 1x per week (e.g., Sunday evening)
- **Medium:** 3x per week (e.g., Monday/Wednesday/Friday mornings)
- **High:** Daily (e.g., 9am)

#### 2.5.3 Frequency-Quadrant Relationship
**Default frequencies by quadrant:**
- Q1: High (daily)
- Q2: Medium (3x/week)
- Q3: Low (weekly)
- Q4: Low (weekly)

**When user drags task to different quadrant:**
- Notification frequency automatically adjusts to match new quadrant
- Immediate update (no confirmation dialog to reduce decision fatigue)

#### 2.5.4 Automatic Escalation
**Deadline-Based Escalation:**
- All tasks escalate to **High frequency (daily)** when deadline is within 3-4 days
- Overrides user's original frequency choice
- Rationale: Prevent important tasks from slipping through cracks

**Urgency Drift:**
- Tasks automatically move **Q2 → Q1** when deadline is within **48 hours**
- Visual: Bubble animates from Q2 to Q1
- Push notification: "📍 Task moved to Urgent: [task name] is due in 2 days"

#### 2.5.5 Notification Content
**Format:**
```
"If you want to finish your [task name], you might want to start now. It's due at [time] [today/tomorrow/date]."
```

**Behavior:**
- Most recent notification replaces previous notification (no stacking)
- Summary count badge on app icon: "You have 3 active tasks"
- Notifications persist until task marked complete

#### 2.5.6 Quiet Hours
- **Default:** 10pm - 8am (no notifications)
- Adjustable in Settings
- User can customize time window

---

## 3. User Flows

### 3.1 First-Time User Onboarding

**Onboarding Approach: Hybrid (Option C)**

1. **Explainer Cards** (3-4 swipeable screens):
   - Screen 1: "Welcome! This is the Eisenhower Matrix"
     - Brief explanation of 4 quadrants
   - Screen 2: "How Notifications Work"
     - Q1 = Daily reminders
     - Q2 = 3x/week reminders
     - Q3/Q4 = Weekly check-ins
     - "As deadlines approach, everything escalates to daily"
   - Screen 3: "Drag Tasks to Quadrants"
     - Visual showing drag gesture
     - "Tasks auto-place if you don't drag within 10 seconds"
   - Screen 4: "Tasks Move Automatically"
     - "Important tasks become urgent as deadlines approach"
     - Visual showing Q2→Q1 drift

2. **Guided Task Creation:**
   - Prompts user to create their first task
   - Walks through each field
   - Shows drag-to-quadrant with real-time guidance
   - Celebrates completion

3. **Optional Skip:**
   - "Skip Tutorial" button on every screen
   - Drops user into empty app

### 3.2 Daily Usage Flow

**Scenario: User wants to add a task**
1. Pull down from top or tap "+" button
2. Type task name
3. Fill in importance, urgency, due date, notification frequency
4. Drag bubble to preferred quadrant (or wait for auto-place)
5. Task appears in quadrant

**Scenario: User wants to see what to do now**
1. Swipe right to "Right Now" view
2. See prioritized list
3. Tap task to view details or start working
4. Mark complete when done

**Scenario: User receives notification**
1. Notification appears: "If you want to finish your prosumption project, you might want to start now. It's due at 11:59 PM tonight."
2. User taps notification → Opens app to that task's details
3. User can:
   - Mark complete
   - View in context (see quadrant)
   - Edit details
   - Ignore (notification will recur per frequency)

### 3.3 Task Lifecycle

```
Create → Categorize → Active → Complete
         ↓
    Auto-Drift (Q2→Q1 if deadline approaches)
         ↓
    Escalate Notifications (→ Daily frequency)
```

---

## 4. Technical Requirements

### 4.1 Platform Support
- **Mobile:** iOS and Android (native or cross-platform)
- **Web:** Responsive web app

### 4.2 Technology Stack Recommendations

**Cross-Platform Mobile:**
- React Native + Expo (easier push notifications)
- OR Flutter

**Web:**
- React

**Backend:**
- Firebase (handles notifications, real-time sync, authentication)
- Cloud Functions for notification scheduling

**Data Storage:**
- Firebase Firestore (real-time sync across devices)
- Local storage for offline capability

### 4.3 Key Technical Features

**Push Notifications:**
- Background processing for scheduled notifications
- Notification scheduling based on frequency + escalation rules
- Cross-device sync (notification state must sync)

**Real-Time Sync:**
- Tasks sync instantly across web and mobile
- Conflict resolution (last-write-wins)

**Offline Support:**
- User can create/edit tasks offline
- Sync when connection restored
- Queue notifications locally if offline

**Drag-and-Drop:**
- Smooth drag gesture with haptic feedback (mobile)
- Visual feedback during drag (quadrant highlights)
- Snap-to-grid animation on drop

**Time Estimation ML/Heuristics:**
- Keyword extraction from task names
- Similarity matching to historical tasks
- Statistical aggregation by quadrant
- User-specific learning over time

### 4.4 Performance Requirements
- Task creation: <200ms response time
- Drag gesture: 60fps minimum
- Notification delivery: ±5 minutes of scheduled time
- App launch: <2 seconds to interactive

### 4.5 Data Privacy
- User authentication required
- Tasks stored securely per user
- No sharing features in MVP (fully private)
- Notification content should not appear in system notifications if user disables preview

---

## 5. Design Specifications

### 5.1 Color System

**Quadrant Colors:**
- Q1 (Urgent & Important): Red (#DC2626 or similar)
- Q2 (Important, Not Urgent): Blue (#2563EB or similar)
- Q3 (Urgent, Not Important): Yellow/Orange (#F59E0B or similar)
- Q4 (Not Important, Not Urgent): Gray (#6B7280 or similar)

**Deadline Urgency Colors:**
- Green: >7 days
- Yellow: 2-7 days
- Red: <2 days

**Implementation:** Color coding method for bubbles TBD (needs visual testing)

### 5.2 Typography
- Task names: Clear, readable, 16-18px
- Quadrant labels: Bold, 14-16px
- Time estimates: Small, subtle, 12-14px
- Modal content: Scannable hierarchy

### 5.3 Iconography
- 🔥 Fire for Q1
- 📅 Calendar for Q2
- 👥 People for Q3
- 🗑️ Trash for Q4
- ⏱️ Clock for time estimates
- ✏️ Pencil for edit
- ✓ Checkmark for complete

### 5.4 Animations
- Bubble drag: Smooth follow with slight scale increase
- Auto-place: Fade + shrink + slide to quadrant
- Q2→Q1 drift: Smooth arc movement between quadrants
- Task complete: Fade out + confetti (if Q1 becomes empty)
- Undo toast: Slide up from bottom, auto-dismiss after 5s

### 5.5 Accessibility
- High contrast mode support
- Screen reader labels for all interactive elements
- Minimum touch target: 44x44px
- Keyboard navigation (web)
- Haptic feedback for drag actions (mobile)

---

## 6. Future Considerations (Post-MVP)

### 6.1 Not in Scope for MVP
- Recurring tasks / habit tracking
- Task sharing / collaboration
- Custom notification tones/styles
- Subtask breakdown for abstract goals
- Calendar integration
- Third-party integrations
- Custom notification timing (beyond Low/Med/High)
- Task templates
- Tags or categories beyond quadrants
- Search functionality
- Task history / archive view
- Data export
- Multiple notification personalities

### 6.2 Potential Phase 2 Features
- Recurring tasks (identified as valuable for ADHD users)
- Abstract goal breakdown wizard
- Time tracking integration
- Weekly review feature
- Notification personality options
- Custom quiet hours per day
- Task dependencies
- Pomodoro timer integration

---

## 7. Success Metrics

### 7.1 Engagement Metrics
- Daily active users (DAU)
- Tasks created per user per week
- Tasks completed per user per week
- Completion rate (completed / created)
- Retention (Day 1, Day 7, Day 30)

### 7.2 Feature-Specific Metrics
- % of tasks auto-placed vs. manually dragged
- Average time estimate accuracy improvement over time
- Notification response rate (% of notifications that lead to task completion within 24hrs)
- Quadrant distribution (are users actually using all 4?)
- Frequency of manual quadrant changes

### 7.3 User Satisfaction
- App store ratings
- NPS (Net Promoter Score)
- Qualitative feedback on ADHD-specific pain points
- User interviews with target audience

### 7.4 Success Criteria for MVP
- 70%+ Day 7 retention for ADHD users
- Average 5+ tasks created per active user per week
- 50%+ task completion rate
- 4+ star average rating
- Positive qualitative feedback on "helps me remember tasks" and "reduces decision fatigue"

---

## 8. Open Questions & Design Decisions Needed

### 8.1 Requires Visual Prototyping
1. **Bubble color coding implementation:** Need to test 5 options (full color, left border, dot, tint, glow) to determine best approach
2. **Quadrant size proportions:** Exact percentage split between Q1 and other quadrants (50/50? 60/40?)
3. **Task bubble sizing:** How many tasks fit on screen before scrolling needed?

### 8.2 Requires User Testing
1. **10-second auto-place window:** Is 10 seconds the right duration? Too short? Too long?
2. **Notification timing:** Are the default times (Sunday evening, Mon/Wed/Fri mornings, 9am daily) optimal?
3. **Quick-sort questions:** Is "Urgent? / Important?" clear enough, or do users need more guidance?

### 8.3 Implementation Details to Resolve
1. **Time estimate prompt timing:** After first completion only, or periodically?
2. **Notification persistence:** How long do notifications stay in notification center?
3. **Sync conflict resolution:** What happens if user edits same task on two devices simultaneously?
4. **Undo functionality:** Does undo only apply to auto-placement, or other actions too?

---

## 9. Development Phases

### Phase 1: Core MVP (Weeks 1-6)
- Task CRUD operations
- Basic Eisenhower matrix UI (single platform - mobile or web)
- Manual drag-to-quadrant
- Simple notifications (no escalation)
- Local storage only

### Phase 2: Intelligence Layer (Weeks 7-10)
- Auto-placement logic
- Notification escalation
- Automatic Q2→Q1 drift
- Time estimation system
- "Right Now" view with sorting algorithm

### Phase 3: Polish & Cross-Platform (Weeks 11-14)
- Second platform (web if started with mobile, or vice versa)
- Sync across devices
- Onboarding flow
- Animations and micro-interactions
- Empty states and edge cases

### Phase 4: Beta Testing (Weeks 15-16)
- Closed beta with ADHD users
- Gather feedback on core pain points
- Iterate on notification timing and frequency
- Refine auto-placement logic
- Fix bugs

### Phase 5: Launch Preparation (Weeks 17-18)
- App store submission
- Landing page
- Support documentation
- Analytics implementation
- Performance optimization

---

## 10. Appendix

### 10.1 Glossary
- **Bubble:** Visual representation of a task, draggable between quadrants
- **Quadrant:** One of four sections of Eisenhower Matrix (Q1, Q2, Q3, Q4)
- **Auto-place:** System automatically assigns task to quadrant after 10 seconds
- **Drift:** Automatic movement of task from Q2→Q1 as deadline approaches
- **Escalation:** Automatic increase in notification frequency as deadline approaches
- **Right Now View:** Prioritized task list sorted by algorithm

### 10.2 References
- Eisenhower Matrix: https://en.wikipedia.org/wiki/Time_management#The_Eisenhower_Method
- ADHD Time Blindness: Research on executive function challenges
- Decision Fatigue: Research on reducing cognitive load in UI design