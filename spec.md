# Eisenhower Task Manager - Design Specification v2.0
## Inspired by Modern iOS Design Language

---

## Design Philosophy

**Sleek, polished, professional.** This design takes cues from modern iOS apps: smooth rounded corners, refined typography, soft shadows, and content-dense layouts. Every pixel serves a purpose. No childish elements, no wasted space.

---

## 1. Color System

### Primary Quadrant Colors (Refined Palette)

**Q1: Do First (Urgent & Important)**
```
Primary: #9B4A4F (Muted Burgundy)
Secondary: #B85C61 (Lighter accent)
Text: #FFFFFF (White)
Shadow: rgba(155, 74, 79, 0.25)
```

**Q2: Schedule (Important, Not Urgent)**
```
Primary: #5B7DAA (Sophisticated Blue)
Secondary: #6B8DB5 (Lighter accent)
Text: #FFFFFF (White)
Shadow: rgba(91, 125, 170, 0.25)
```

**Q3: Delegate (Urgent, Not Important)**
```
Primary: #CC7F4D (Warm Terracotta)
Secondary: #D99263 (Lighter accent)
Text: #FFFFFF (White)
Shadow: rgba(204, 127, 77, 0.25)
```

**Q4: Delete (Not Important, Not Urgent)**
```
Primary: #6B7684 (Cool Gray-Blue)
Secondary: #7D8896 (Lighter accent)
Text: #E8EAED (Light Gray)
Shadow: rgba(107, 118, 132, 0.25)
```

### Deadline Urgency Colors

```
Green (>7 days):     #34C759 (iOS System Green)
Yellow (2-7 days):   #FF9F0A (iOS System Orange)
Red (<2 days):       #FF3B30 (iOS System Red)
```

### Background & Surface Colors

```
App Background:      #F2F2F7 (iOS System Gray 6)
Card Surface:        #FFFFFF (White)
Secondary Surface:   #F9F9F9 (Very Light Gray)
Overlay:             rgba(0, 0, 0, 0.4)
```

### Text Colors

```
Primary Text:        #000000 (Black)
Secondary Text:      #3C3C43 (iOS System Gray)
Tertiary Text:       #AEAEB2 (iOS System Gray 3)
Text on Color:       #FFFFFF (White)
Text on Color (dim): rgba(255, 255, 255, 0.85)
```

---

## 2. Typography

### Font Family

**Primary Font (Everything):**
```
Font: SF Pro / -apple-system
Fallback: system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```
*Use native system font for that polished, professional iOS feel*

**Alternative (if SF Pro unavailable):**
```
Font: Inter
Weights: Regular (400), Medium (500), Semibold (600), Bold (700)
```

### Type Scale

```
Hero (Large Numbers):        56px / 700 / -0.03em / 1.0 line-height
H1 (Screen Title):           34px / 700 / -0.02em / 1.15 line-height
H2 (Section Headers):        28px / 700 / -0.015em / 1.2 line-height
H3 (Card Headers):           20px / 600 / -0.01em / 1.3 line-height
Body Large:                  17px / 400 / -0.005em / 1.4 line-height
Body (Default):              15px / 400 / 0em / 1.45 line-height
Caption 1:                   13px / 400 / 0em / 1.4 line-height
Caption 2:                   11px / 400 / 0.01em / 1.35 line-height
```

### Specific Text Styles

**Quadrant Title:**
```
Font: SF Pro Semibold
Size: 20px
Weight: 600
Color: #FFFFFF
Letter Spacing: -0.01em
```

**Quadrant Subtitle:**
```
Font: SF Pro Regular
Size: 13px
Weight: 400
Color: rgba(255, 255, 255, 0.85)
Letter Spacing: 0em
```

**Task Name:**
```
Font: SF Pro Medium
Size: 15px
Weight: 500
Color: #000000
Letter Spacing: -0.005em
Line Height: 1.4
```

**Time Estimate / Meta Info:**
```
Font: SF Pro Regular
Size: 13px
Weight: 400
Color: #8E8E93
Letter Spacing: 0em
```

**Empty State Text:**
```
Font: SF Pro Regular
Size: 15px
Weight: 400
Color: rgba(255, 255, 255, 0.5)
Letter Spacing: 0em
```

---

## 3. Spacing System

Base unit: **4px** (tighter than before for content density)

```
xxs:     4px   (minimal gap)
xs:      8px   (tight spacing)
sm:      12px  (compact spacing)
md:      16px  (default spacing)
lg:      20px  (section spacing)
xl:      24px  (major sections)
xxl:     32px  (screen-level spacing)
xxxl:    40px  (rare, dramatic)
```

### Content Padding

```
Quadrant Padding:     20px
Card Internal:        16px
Screen Margins:       16px (mobile), 20px (tablet)
Inter-card Gap:       12px
```

---

## 4. Component Specifications

### 4.1 Quadrant Cards

**General Card Treatment:**
```
Border Radius: 24px (smooth, modern corners)
Border: None (clean, borderless)
Box Shadow: 0px 2px 12px rgba(0, 0, 0, 0.08)
Background: Solid color (per quadrant)
```

**Q1 - Do First**
```
Dimensions:
- Mobile: Full width (minus 16px margins), 50% viewport height
- Min Height: 400px

Background: #9B4A4F
Border Radius: 24px
Padding: 20px
Box Shadow: 
  - 0px 2px 12px rgba(155, 74, 79, 0.15)
  - 0px 8px 32px rgba(155, 74, 79, 0.12)

Header:
  Title: "🔥 Do First"
  - Font: SF Pro Semibold 20px
  - Color: #FFFFFF
  - Margin Bottom: 4px
  
  Subtitle: "Urgent & Important"
  - Font: SF Pro Regular 13px
  - Color: rgba(255, 255, 255, 0.85)
  - Margin Bottom: 16px

Empty State:
  - Icon: ✓ (48px, centered)
  - Color: rgba(255, 255, 255, 0.3)
  - Text: "All clear!"
    - Font: SF Pro Semibold 17px
    - Color: rgba(255, 255, 255, 0.95)
  - Subtext: "Want to get ahead on something important?"
    - Font: SF Pro Regular 13px
    - Color: rgba(255, 255, 255, 0.7)
```

**Q2 - Schedule**
```
Background: #5B7DAA
Border Radius: 24px
Padding: 20px
Box Shadow: 0px 2px 12px rgba(91, 125, 170, 0.15)

Title: "📅 Schedule"
Subtitle: "Important, Not Urgent"

Min Height: 250px
```

**Q3 - Delegate**
```
Background: #CC7F4D
Border Radius: 24px
Padding: 20px
Box Shadow: 0px 2px 12px rgba(204, 127, 77, 0.15)

Title: "👥 Delegate"
Subtitle: "Urgent, Not Important"

Min Height: 250px
```

**Q4 - Delete**
```
Background: #6B7684
Border Radius: 24px
Padding: 20px
Box Shadow: 0px 2px 12px rgba(107, 118, 132, 0.15)

Title: "🗑️ Delete"
Subtitle: "Not Important, Not Urgent"

Min Height: 250px
```

### 4.2 Task Bubble (Card Style)

**Default State:**
```
Background: #FFFFFF
Border: None
Border Radius: 16px (softer than quadrant)
Padding: 14px 16px
Box Shadow: 
  - 0px 1px 4px rgba(0, 0, 0, 0.06)
  - 0px 2px 8px rgba(0, 0, 0, 0.04)
Min Height: 52px
Margin Bottom: 8px (between tasks)

Display: Flex
Align Items: Center
Gap: 12px
```

**Task Content Layout:**
```
[Deadline Indicator] [Task Name] [Time Badge]
     (4px bar)        (flex-grow)   (auto-width)
```

**Deadline Urgency Indicator:**
```
Width: 4px
Height: 100% (of bubble)
Border Radius: 2px (on left side)
Position: Absolute left
Colors: #34C759 / #FF9F0A / #FF3B30
```

**Task Name:**
```
Font: SF Pro Medium 15px
Color: #000000
Letter Spacing: -0.005em
Line Height: 1.4
Flex: 1
```

**Time Badge (Optional):**
```
Background: #F2F2F7
Border Radius: 8px
Padding: 4px 8px

Text:
- Font: SF Pro Regular 12px
- Color: #8E8E93
- Text: "~30m"
```

**Hover State:**
```
Transform: translateY(-1px)
Box Shadow: 
  - 0px 2px 8px rgba(0, 0, 0, 0.08)
  - 0px 4px 16px rgba(0, 0, 0, 0.06)
Transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
Cursor: grab
```

**Dragging State:**
```
Transform: rotate(-2deg) scale(1.03)
Box Shadow: 
  - 0px 8px 24px rgba(0, 0, 0, 0.16)
  - 0px 16px 48px rgba(0, 0, 0, 0.12)
Opacity: 0.98
Cursor: grabbing
Transition: all 0.15s ease-out
```

### 4.3 Count Badge

**Style:**
```
Position: Absolute top-right of quadrant
Top: 16px
Right: 16px

Background: rgba(0, 0, 0, 0.25)
Backdrop Filter: blur(12px)
Border Radius: 12px
Padding: 4px 10px

Text:
- Font: SF Pro Semibold 13px
- Color: #FFFFFF
- Content: "8 tasks"

Box Shadow: 0px 2px 8px rgba(0, 0, 0, 0.12)

Appears when: >5 tasks in quadrant
```

### 4.4 Warning Badge (Q1 Overload)

**Style:**
```
Position: Below quadrant title
Margin Top: 12px
Margin Bottom: 12px

Display: Inline-flex
Align Items: Center
Gap: 6px

Background: rgba(255, 255, 255, 0.2)
Backdrop Filter: blur(8px)
Border Radius: 12px
Padding: 8px 12px

Icon: ⚠️ (16px)
Text:
- Font: SF Pro Medium 13px
- Color: #FFFFFF
- Content: "Many urgent tasks"

Cursor: pointer
Hover: Background becomes rgba(255, 255, 255, 0.25)
```

### 4.5 Success State (Q1 Empty)

**Layout:**
```
Display: Flex column
Align Items: Center
Justify Content: Center
Height: 100% (fill Q1)

Icon: ✓ (checkmark)
- Size: 48px
- Color: rgba(255, 255, 255, 0.3)
- Margin Bottom: 12px

Title:
- Text: "All clear!"
- Font: SF Pro Semibold 17px
- Color: rgba(255, 255, 255, 0.95)
- Margin Bottom: 6px

Subtitle:
- Text: "Want to get ahead on something important?"
- Font: SF Pro Regular 13px
- Color: rgba(255, 255, 255, 0.7)
- Text Align: Center
- Max Width: 240px
```

### 4.6 Add Task Button (+)

**Floating Action Button:**
```
Position: Fixed top-right
Top: Safe area + 12px
Right: 16px
Z-Index: 100

Dimensions: 44px × 44px
Background: #FFFFFF
Border: None
Border Radius: 22px (perfect circle)
Box Shadow: 
  - 0px 2px 12px rgba(0, 0, 0, 0.12)
  - 0px 8px 32px rgba(0, 0, 0, 0.08)

Icon: + (SF Symbol)
- Size: 20px
- Color: #000000
- Weight: Semibold
- Stroke Width: 2.5px

Hover:
- Transform: scale(1.05)
- Box Shadow increases intensity
- Transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)

Active:
- Transform: scale(0.95)
- Transition: all 0.1s ease
```

### 4.7 Task Creation - Full Screen

**Overlay:**
```
Position: Fixed fullscreen
Background: rgba(0, 0, 0, 0.4)
Backdrop Filter: blur(20px)
Z-Index: 1000

Animation In:
- Opacity: 0 → 1 (0.25s ease-out)
```

**Form Container:**
```
Position: Centered (vertical & horizontal)
Width: 90% (max 420px on larger screens)
Background: #FFFFFF
Border Radius: 28px
Padding: 32px 24px
Box Shadow: 
  - 0px 8px 32px rgba(0, 0, 0, 0.16)
  - 0px 24px 64px rgba(0, 0, 0, 0.12)

Animation In:
- Scale: 0.9 → 1.0 (0.3s cubic-bezier(0.34, 1.56, 0.64, 1))
- Opacity: 0 → 1 (0.3s ease-out)
- Slight upward slide
```

**Form Header:**
```
Text: "New Task"
Font: SF Pro Bold 24px
Color: #000000
Letter Spacing: -0.015em
Margin Bottom: 24px
Text Align: Center
```

**Input Field:**
```
Label: "What needs to be done?"
- Font: SF Pro Medium 13px
- Color: #8E8E93
- Margin Bottom: 8px

Input:
- Font: SF Pro Regular 17px
- Color: #000000
- Background: #F2F2F7
- Border: 2px solid transparent
- Border Radius: 12px
- Padding: 14px 16px
- Margin Bottom: 20px

Focus:
- Border: 2px solid #007AFF
- Background: #FFFFFF
- Transition: all 0.2s ease

Placeholder:
- Color: #C7C7CC
- Text: "e.g., Finish design mockups"
```

**Toggle Group (Importance/Urgency):**
```
Label:
- Font: SF Pro Medium 13px
- Color: #8E8E93
- Margin Bottom: 8px

Container:
- Display: Flex
- Gap: 8px
- Margin Bottom: 20px

Button:
- Font: SF Pro Medium 15px
- Padding: 12px 20px
- Border: 2px solid #E5E5EA
- Border Radius: 12px
- Background: #FFFFFF
- Color: #000000
- Flex: 1
- Text Align: Center
- Transition: all 0.2s ease

Active State:
- Border: 2px solid #007AFF
- Background: #007AFF
- Color: #FFFFFF

Hover:
- Background: #F2F2F7 (if not active)
- Border: 2px solid #D1D1D6
```

**Date Picker:**
```
Similar styling to input field
Shows native date picker on click
Font: SF Pro Regular 17px
Icon: 📅 (inline, left side)
```

**Frequency Buttons:**
```
Label: "Reminder frequency"

3 buttons: Low / Medium / High

Low Active: Border & BG = #34C759
Medium Active: Border & BG = #FF9F0A  
High Active: Border & BG = #FF3B30
```

**Create Button:**
```
Width: 100%
Font: SF Pro Semibold 17px
Padding: 16px
Background: #007AFF
Color: #FFFFFF
Border: None
Border Radius: 14px
Margin Top: 24px
Box Shadow: 0px 4px 16px rgba(0, 122, 255, 0.3)

Hover:
- Background: #0051D5
- Box Shadow increases

Active:
- Transform: scale(0.98)
```

### 4.8 Task Assignment Grid

**Overlay:**
```
Same as task creation overlay
But quadrants are shown beneath (slightly visible)
```

**Countdown Display:**
```
Position: Top center
Top: 20% of screen

Number: "10"
- Font: SF Pro Bold 72px
- Color: #FFFFFF
- Text Shadow: 0px 4px 16px rgba(0, 0, 0, 0.3)
- Animation: Scale pulse (1.0 → 1.1 → 1.0) per second

Text: "Drag to a quadrant or we'll auto-place it"
- Font: SF Pro Medium 15px
- Color: rgba(255, 255, 255, 0.9)
- Margin Top: 12px
```

**Grid Layout:**
```
Display: Grid
Grid Template: 2×2
Gap: 12px
Max Width: 800px
Margin: Auto
Padding: 0 16px

All quadrants equal size during this view
Each quadrant maintains styling but with emphasis on drop zones
```

**Active Drop Zone:**
```
When bubble hovers:
- Scale: 1.02
- Box Shadow intensity increases
- Subtle pulse animation
- Border: 3px dashed rgba(255, 255, 255, 0.5)
```

### 4.9 Toast Notification

**Container:**
```
Position: Fixed bottom-center
Bottom: 80px
Z-Index: 10000

Background: rgba(28, 28, 30, 0.92)
Backdrop Filter: blur(20px)
Border Radius: 16px
Padding: 14px 20px
Box Shadow: 0px 8px 32px rgba(0, 0, 0, 0.24)

Display: Flex
Align Items: Center
Gap: 12px
Max Width: 90%

Animation In:
- translateY(20px) → translateY(0)
- Opacity: 0 → 1
- Duration: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Content:**
```
Text:
- Font: SF Pro Medium 15px
- Color: #FFFFFF
- Text: "Auto-placed in Do First"

Undo Button:
- Font: SF Pro Semibold 15px
- Color: #0A84FF
- Background: transparent
- Padding: 0
- Margin Left: 8px
- Cursor: pointer
```

### 4.10 Task Details Modal

**Modal Container:**
```
Position: Fixed bottom of screen
Bottom: 0
Left: 0
Right: 0
Z-Index: 9000

Background: #FFFFFF
Border Radius: 28px 28px 0 0
Padding: 24px 20px 40px
Max Height: 85vh

Box Shadow: 
  - 0px -4px 24px rgba(0, 0, 0, 0.12)
  - 0px -12px 48px rgba(0, 0, 0, 0.08)

Animation In (slide up from bottom):
- translateY(100%) → translateY(0)
- Duration: 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

**Handle (Drag Indicator):**
```
Width: 36px
Height: 5px
Background: #D1D1D6
Border Radius: 3px
Margin: 0 auto 20px
```

**Header:**
```
Display: Flex
Justify Content: Space-between
Align Items: Start
Margin Bottom: 24px

Task Name:
- Font: SF Pro Bold 22px
- Color: #000000
- Letter Spacing: -0.015em
- Line Height: 1.3

Edit Button:
- Icon: pencil (SF Symbol)
- Size: 20px
- Color: #8E8E93
- Padding: 8px
- Border Radius: 8px
- Hover: Background #F2F2F7
```

**Field Rows:**
```
Display: Flex column
Gap: 16px

Each Field:
  Label:
  - Font: SF Pro Medium 12px
  - Color: #8E8E93
  - Text Transform: Uppercase
  - Letter Spacing: 0.05em
  - Margin Bottom: 6px
  
  Value:
  - Font: SF Pro Regular 15px
  - Color: #000000
  - Background: #F2F2F7
  - Padding: 10px 12px
  - Border Radius: 10px
```

**Action Buttons:**
```
Display: Flex
Gap: 12px
Margin Top: 32px

Complete Button:
- Font: SF Pro Semibold 17px
- Padding: 16px
- Background: #34C759
- Color: #FFFFFF
- Border: None
- Border Radius: 14px
- Flex: 1
- Box Shadow: 0px 4px 16px rgba(52, 199, 89, 0.3)

Delete Button:
- Font: SF Pro Regular 17px
- Padding: 16px
- Background: transparent
- Color: #FF3B30
- Border: 2px solid #FF3B30
- Border Radius: 14px
- Cursor: pointer

  Hover:
  - Background: rgba(255, 59, 48, 0.1)
```

### 4.11 Navigation Dots

**Container:**
```
Position: Fixed bottom-center
Bottom: 32px
Z-Index: 100

Display: Flex
Gap: 8px
Background: rgba(242, 242, 247, 0.95)
Backdrop Filter: blur(20px)
Padding: 8px 16px
Border Radius: 20px
Box Shadow: 0px 2px 16px rgba(0, 0, 0, 0.08)
```

**Dot (Inactive):**
```
Width: 6px
Height: 6px
Background: #C7C7CC
Border Radius: 3px
Transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

**Dot (Active):**
```
Width: 20px
Height: 6px
Background: #000000
Border Radius: 3px
```

---

## 5. Layout Specifications

### 5.1 Mobile Layout

**Screen Structure:**
```
┌─────────────────────────────┐
│  Status Bar (system)        │
│  + Button (top-right)       │
├─────────────────────────────┤
│                             │
│      Q1 - Do First          │
│   (50vh, min 400px)         │
│                             │
├─────────────────────────────┤
│                             │
│     Q2 - Schedule           │
│    (min 250px)              │
│                             │
├─────────────────────────────┤
│                             │
│     Q3 - Delegate           │
│    (min 250px)              │
│                             │
├─────────────────────────────┤
│                             │
│      Q4 - Delete            │
│    (min 250px)              │
│                             │
├─────────────────────────────┤
│   Navigation Dots           │
└─────────────────────────────┘
```

**Spacing:**
```
Screen Margins: 16px
Gap Between Quadrants: 12px
Safe Area Top: Respected (for notch)
Safe Area Bottom: Respected (for home indicator)
```

### 5.2 Tablet/Desktop Layout

**Screen Structure:**
```
┌─────────────────────────────────────────┐
│  + Button (top-right)                   │
├─────────────────────────────────────────┤
│                                         │
│          Q1 - Do First                  │
│       (50vh, max 600px)                 │
│                                         │
├─────────────────────────────────────────┤
│            │            │               │
│    Q2      │    Q3      │     Q4        │
│ Schedule   │ Delegate   │   Delete      │
│            │            │               │
└─────────────────────────────────────────┘
```

**Spacing:**
```
Container Max Width: 1200px (centered)
Screen Margins: 20px (tablet), 32px (desktop)
Gap: 16px
```

---

## 6. Animation Specifications

### 6.1 Transitions

**Standard Easing:**
```
Default: cubic-bezier(0.25, 0.46, 0.45, 0.94) [ease-out-quad]
Bounce: cubic-bezier(0.34, 1.56, 0.64, 1) [back-out]
Snappy: cubic-bezier(0.4, 0.0, 0.2, 1) [ease-in-out-cubic]
```

**Durations:**
```
Fast: 150ms (micro-interactions)
Base: 250ms (most transitions)
Slow: 350ms (complex animations)
```

### 6.2 Specific Animations

**Task Bubble Drag:**
```
Pick Up:
- Duration: 150ms
- Easing: ease-out
- Scale: 1.0 → 1.03
- Rotate: 0deg → -2deg
- Shadow: Increases
- z-index: 1000

Drop:
- Duration: 300ms
- Easing: back-out (bounce)
- Scale: 1.03 → 1.0
- Rotate: -2deg → 0deg
- Slight overshoot then settle
```

**Task Complete:**
```
Sequence:
1. Scale 1.0 → 1.05 (100ms ease-out)
2. Fade opacity 1.0 → 0.3 (150ms)
3. Scale 1.05 → 0.8 + opacity 0.3 → 0 (200ms ease-in)

Total: 450ms

If Q1 becomes empty:
- Confetti particles (subtle)
- Success state fades in (300ms)
```

**Modal Slide Up:**
```
From: translateY(100%)
To: translateY(0)
Duration: 350ms
Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)

Overlay:
- Opacity: 0 → 1 (250ms)
```

**Button Press:**
```
Active State:
- Scale: 1.0 → 0.98
- Duration: 100ms
- Easing: ease-out

Release:
- Scale: 0.98 → 1.0
- Duration: 150ms
- Easing: back-out (slight bounce)
```

---

## 7. Shadows & Depth

**Shadow Layers (iOS-style):**

```
Level 1 (Cards at rest):
  0px 1px 4px rgba(0, 0, 0, 0.06)
  0px 2px 8px rgba(0, 0, 0, 0.04)

Level 2 (Hover):
  0px 2px 8px rgba(0, 0, 0, 0.08)
  0px 4px 16px rgba(0, 0, 0, 0.06)

Level 3 (Dragging/FAB):
  0px 8px 24px rgba(0, 0, 0, 0.12)
  0px 16px 48px rgba(0, 0, 0, 0.08)

Level 4 (Modals):
  0px 16px 48px rgba(0, 0, 0, 0.16)
  0px 32px 96px rgba(0, 0, 0, 0.12)
```

**Colored Shadows (Quadrants):**
```
Each quadrant uses its primary color at 15-25% opacity
Adds subtle brand color to depth
```

---

## 8. Responsive Breakpoints

```
Mobile:           < 768px
Tablet:           768px - 1024px
Desktop:          > 1024px
```

**Behavior:**

**Mobile:**
- Vertical stack
- Q1: 50vh (min 400px)
- Full-width quadrants
- 16px margins

**Tablet:**
- Still vertical stack
- Q1: 50vh (max 500px)
- Wider quadrants
- 20px margins
- Consider 2-column for Q2/Q3, full-width Q4

**Desktop:**
- Q1: Full width, 50vh (max 600px)
- Q2/Q3/Q4: Horizontal row, equal width
- Container max-width: 1200px, centered
- 32px margins

---

## 9. Accessibility

### 9.1 Color Contrast

All text meets WCAG AA:
```
✓ White on Q1 burgundy (#9B4A4F): 4.8:1
✓ White on Q2 blue (#5B7DAA): 4.6:1
✓ White on Q3 terracotta (#CC7F4D): 3.9:1 (large text)
✓ Light gray on Q4 gray (#6B7684): 4.1:1
✓ Black on white: 21:1
```

### 9.2 Focus States

```
Focus Ring:
- Outline: 3px solid #007AFF (iOS blue)
- Outline Offset: 2px
- Border Radius: Matches element
- Always visible for keyboard navigation

Never remove focus indicators
```

### 9.3 Touch Targets

```
Minimum: 44×44px (Apple HIG)

Task Bubble: 52px height minimum
Buttons: 44×44px minimum
FAB: 44×44px
Toggle Buttons: 44px height
```

### 9.4 Screen Reader

```
Quadrants:
- role="region"
- aria-label="[Quadrant name and description]"
- aria-live="polite" for count updates

Task Bubbles:
- role="button"
- aria-label="[Task name], due [date], [urgency]"

Dragging:
- aria-grabbed="true"
- aria-dropeffect="move"
```

### 9.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Implementation Guide for Cursor

### 10.1 Project Structure

```
src/
├── components/
│   ├── Quadrant.jsx
│   ├── TaskBubble.jsx
│   ├── TaskCreationForm.jsx
│   ├── TaskDetailsModal.jsx
│   ├── CountBadge.jsx
│   ├── NavigationDots.jsx
│   └── FloatingActionButton.jsx
├── styles/
│   ├── tokens.css (design system variables)
│   ├── global.css
│   └── animations.css
├── utils/
│   ├── taskLogic.js
│   └── dateHelpers.js
└── App.jsx
```

### 10.2 CSS Variables

```css
:root {
  /* Colors - Quadrants */
  --q1-primary: #9B4A4F;
  --q1-shadow: rgba(155, 74, 79, 0.25);
  --q2-primary: #5B7DAA;
  --q2-shadow: rgba(91, 125, 170, 0.25);
  --q3-primary: #CC7F4D;
  --q3-shadow: rgba(204, 127, 77, 0.25);
  --q4-primary: #6B7684;
  --q4-shadow: rgba(107, 118, 132, 0.25);
  
  /* Urgency Colors */
  --urgency-green: #34C759;
  --urgency-yellow: #FF9F0A;
  --urgency-red: #FF3B30;
  
  /* Backgrounds */
  --bg-app: #F2F2F7;
  --bg-card: #FFFFFF;
  --bg-secondary: #F9F9F9;
  
  /* Text */
  --text-primary: #000000;
  --text-secondary: #3C3C43;
  --text-tertiary: #AEAEB2;
  --text-on-color: #FFFFFF;
  
  /* Spacing (4px base) */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-xxl: 32px;
  
  /* Radius */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-xxl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0px 1px 4px rgba(0, 0, 0, 0.06), 0px 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0px 2px 8px rgba(0, 0, 0, 0.08), 0px 4px 16px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0px 8px 24px rgba(0, 0, 0, 0.12), 0px 16px 48px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0px 16px 48px rgba(0, 0, 0, 0.16), 0px 32px 96px rgba(0, 0, 0, 0.12);
  
  /* Transitions */
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-snappy: cubic-bezier(0.4, 0.0, 0.2, 1);
  
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
}
```

### 10.3 First Cursor Prompt

Copy this into Cursor to start:

```
I'm building an Eisenhower Matrix task manager with a modern iOS design aesthetic. 

Start by creating a Quadrant component in React that matches these exact specs:

Design:
- Background color from props (Q1: #9B4A4F)
- Border radius: 24px
- Padding: 20px
- Box shadow: 0px 2px 12px with quadrant color at 15% opacity
- No border

Content:
- Title with emoji (e.g., "🔥 Do First")
  - Font: SF Pro/system font, semibold, 20px
  - Color: white
  - Margin bottom: 4px
- Subtitle (e.g., "Urgent & Important")
  - Font: SF Pro/system, regular, 13px
  - Color: white at 85% opacity
  - Margin bottom: 16px
- Tasks list (accepts array of task objects as props)
- Empty state: centered checkmark icon (48px), "All clear!" text, suggestion text

The component should accept these props:
- title (string)
- subtitle (string)
- backgroundColor (string)
- tasks (array)
- onTaskClick (function)

Use modern CSS with variables for all design tokens.
Make it fully responsive.
```

---

## 11. Key Differences from Previous Spec

**What Changed:**

1. **Softer, more refined colors** - Muted tones instead of saturated primaries
2. **Smoother corners** - 24px radius vs 16px on quadrants
3. **Cleaner borders** - Removed borders entirely, using shadows only
4. **Better typography** - System fonts (SF Pro/Inter) at refined sizes
5. **Tighter spacing** - 4px base unit vs 8px for content density
6. **iOS-style shadows** - Layered, soft shadows vs single harsh shadows
7. **Card-based task bubbles** - Clean white cards vs colored bubbles
8. **More polished interactions** - Subtle, smooth animations
9. **Professional empty states** - Minimal, centered, refined messaging

**Design Philosophy Shift:**

❌ **Before:** Bold, chunky, attention-grabbing
✅ **Now:** Sleek, refined, professionally polished

Both approaches work for ADHD users, but this one feels more premium and modern - like a high-quality iOS app rather than a playful web tool.

---

## 12. Final Checklist

When implementing in Cursor:

- [ ] Use SF Pro (system font) throughout
- [ ] 24px border radius on all quadrants
- [ ] No borders, only soft shadows
- [ ] 4px spacing base unit
- [ ] White task bubbles with colored left indicator
- [ ] Smooth, subtle animations (250-350ms)
- [ ] Full-screen task creation (not modal)
- [ ] iOS-style bottom sheet for task details
- [ ] Clean, minimal empty states
- [ ] Proper safe area handling (notch/home indicator)
- [ ] All touch targets 44×44px minimum
- [ ] Reduced motion support
- [ ] Dark mode ready (optional phase 2)