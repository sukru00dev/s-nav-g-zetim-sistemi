---
name: Academic Vigilance
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434751'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#747782'
  outline-variant: '#c3c6d2'
  surface-tint: '#365da3'
  primary: '#00306e'
  on-primary: '#ffffff'
  primary-container: '#1c478c'
  on-primary-container: '#97b8ff'
  inverse-primary: '#adc6ff'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#003553'
  on-tertiary: '#ffffff'
  tertiary-container: '#004d75'
  on-tertiary-container: '#6bbfff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#19458a'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#cbe6ff'
  tertiary-fixed-dim: '#90cdff'
  on-tertiary-fixed: '#001e31'
  on-tertiary-fixed-variant: '#004b72'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  success-safe: '#2E7D32'
  warning-suspicious: '#F57C00'
  error-alert: '#D93025'
  surface-background: '#F8FAFC'
  sidebar-navy: '#002147'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 260px
  header-height: 64px
  gutter: 24px
  margin-mobile: 16px
  card-padding: 20px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style
The design system is engineered for a University Exam Management & AI Monitoring environment. It balances the prestige and tradition of higher education with the cutting-edge, data-intensive requirements of AI-driven proctoring. The visual direction is **Corporate / Modern** with a high-tech edge, prioritizing clarity, trust, and rapid information processing.

The target audience consists of academic administrators and proctors who need to distinguish between routine activity and high-risk anomalies instantly. The UI evokes a sense of "digital authority"—it is calm and structured, but utilizes vibrant semantic signals to draw attention to critical events without causing visual fatigue.

## Colors
The palette is rooted in the university's identity. **Deep Navy Blue** serves as the anchor, providing a sense of stability and institutional trust. It is used primarily for structural elements like the sidebar and headers to create a "container" for content.

**Gold/Yellow** is the high-contrast accent color, reserved for primary actions, highlight states, and key achievement metrics. **Academic Blue** (#039BE5) is used for links and secondary UI interactions to differentiate from the primary brand navy. 

Semantic colors are non-negotiable for monitoring:
- **Success Green:** Indicates verified identity and "No Issues."
- **Warning Orange:** Flagged for "Suspicious Movement" or "Audio Anomalies."
- **Error Red:** Immediate intervention required for "High-Risk/Cheating Detected."

## Typography
This design system utilizes **Inter** for its systematic, utilitarian nature. The typeface's high x-height and excellent legibility make it ideal for dense data tables and real-time monitoring feeds. 

A strict hierarchy is enforced:
- **Headlines:** Bold and condensed to allow for longer student names or exam titles.
- **Labels:** Uppercase with slight letter-spacing for categorization tags and status badges.
- **Body:** Standardized at 14px (md) for the majority of data-heavy interfaces to maximize information density without sacrificing readability.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid** model. A fixed-width sidebar (Left) and header (Top) create a persistent navigation frame, while the main content area uses a fluid 12-column grid to accommodate multi-stream AI video feeds or expansive data tables.

**Breakpoints:**
- **Desktop (1280px+):** Full 12-column grid. Sidebar is always expanded.
- **Tablet (768px - 1279px):** Sidebar collapses to icons only. Grid shifts to 8 columns. Margins reduce to 20px.
- **Mobile (Up to 767px):** Single column layout. Sidebar becomes an overlay drawer. Top header remains sticky but minimizes search functionality into a single icon.

A 4px baseline rhythm is used for all internal component spacing to ensure a tight, professional finish.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** rather than heavy shadows. The primary background is a very light grey (#F8FAFC), with "cards" and white surfaces sitting atop it to indicate interactable areas.

- **Level 0 (Background):** Primary canvas.
- **Level 1 (Cards/Tables):** White background with a 1px border (#E2E8F0) and a subtle 4px blur ambient shadow.
- **Level 2 (Dropdowns/Modals):** High-contrast borders with a 12px blur shadow to indicate focus and separation from the monitoring grid.
- **AI Focus State:** When a student is "Flagged," the card elevation increases slightly, and a semi-transparent colored glow (based on the semantic risk) is applied as an outer stroke.

## Shapes
The design system uses **Rounded (8px)** corners for most containers, including cards, input fields, and video thumbnails. This softens the "technical" feel of the AI monitoring, making it feel more approachable for academic use.

Small UI elements like **Status Chips** and **Buttons** utilize a slightly more aggressive rounding or pill-shape to distinguish them from structural layouts. Icons should always be contained within a rounded-square or circular housing when used as navigation anchors.

## Components
- **Sidebar Navigation:** Navy background (#002147). Active states use a Gold (#FFD700) left-border indicator and white text. Icons should be clear, thin-stroke line art.
- **Monitoring Cards:** A compact container featuring a video stream or student photo. The footer of the card displays a "Risk Badge" (Safe/Suspicious/Alert).
- **Data Tables:** Dense layout with sticky headers. Rows alternate with a very subtle tint on hover. Status columns use high-contrast text tags (e.g., White text on Red background for "Cheating").
- **Action Buttons:**
    - *Primary:* Solid Navy or Gold for high-priority actions (e.g., "End Exam").
    - *Secondary:* Outlined with 1px border for routine tasks.
- **Input Fields:** Minimalist with 8px corner radius. Focused state uses a 2px Academic Blue (#039BE5) border.
- **Notification Toast:** Positioned top-right, utilizing semantic colors to alert the proctor of new flags without interrupting the current view.