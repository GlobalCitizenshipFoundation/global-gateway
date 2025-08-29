# Material Design 3 (M3) Design Specifications

*(Material Design 3 + WCAG 2.1 Compliant)*

This document outlines the strict Material Design 3 (M3) specifications to be followed for all UI/UX design and implementation within the Global Gateway application. It serves as a comprehensive guide to ensure consistency, accessibility, and a modern aesthetic across the platform.

---

# 📁  Design Sistem Table of Content

```
Global Gateway Design System
│
├── Foundations
│   ├── Color
│   ├── Typography
│   ├── Shape & Elevation
│   ├── Layout & Spacing
│   ├── Iconography & Imagery
│
├── Components
│   ├── Actions
│   ├── Inputs & Forms
│   ├── Navigation
│   ├── Surfaces
│   ├── Data Display
│   ├── Feedback
│
├── Interaction
│
├── Motion
│
├── Accessibility
│
├── Patterns
│   ├── Workflows & Pipelines
│   ├── Dashboards
│   ├── Profiles
│   ├── Search & Filters
│   ├── Multi-Step Flows
│
├── Content & Language
│
├── Theming & Customization
│
├── Testing & QA
│
└── Governance & Contribution
```

---

## 🌱 Foundations

### Colors

* Brand seed (`#E91E63`)
* Light & dark palettes (tokens: primary, secondary, tertiary, error, neutral)
* Contrast validation rules (WCAG AA)
* Usage rules (primary actions, background surfaces, accents, status colors)

### Typography

* Font family (Inter / Roboto Flex)
* Type scale table (Display → Headline → Title → Body → Label)
* Usage guidelines (case, readability, accessibility)

### Shape & Elevation

* Corner radius levels (4, 8, 16, 50%)
* Elevation tokens (0–5)
* Shadows & overlays in dark theme

### Layout & Spacing

* 8px baseline grid
* Breakpoints: xs (360), sm (600), md (960), lg (1280), xl (1600)
* Responsive behavior (navigation, cards, forms, dashboards)
* Density modes: comfortable vs compact (for data-heavy screens)

### Iconography & Imagery

* Icon set: Material Symbols (outlined/filled usage)
* Avatar rules (shapes, initials fallback, alt text)
* Illustrations/imagery: style, do’s/don’ts
* Fallbacks when icons/images disabled

---

## 🎛️ Components

### Actions

* Buttons (primary, secondary, tonal, FAB, icon buttons)
* Chips (filter, input, choice, action)
* Toggles (switches, checkboxes, radio buttons)

### Inputs & Forms

* Text fields (filled/outlined, states, validation)
* Selects, dropdowns, comboboxes
* Date pickers, file uploaders
* Form grouping (progressive disclosure, multi-step)
* Validation: live, on blur, on submit

### Navigation

* Top app bar
* Navigation drawer (permanent, modal)
* Bottom navigation (mobile)
* Breadcrumbs
* Tabs & segmented controls

### Surfaces

* Cards (anatomy, content structure)
* Sheets (modal, bottom, side)
* Dialogs (modal, alert, confirmation)
* Banners, snackbars, tooltips

### Data Display

* Tables (sortable, filterable, sticky headers)
* Lists (single/multi-line, with avatars/icons)
* Badges, progress indicators
* Charts (bar, line, pie → with accessible text fallback)

### Feedback

* States: success, warning, error, info
* Loaders (spinners, skeletons, shimmer)
* Notification hierarchy (toast → snackbar → banner → modal)

---

## ⚙️ Interaction Design

### Universal Interaction Rules

* Touch targets ≥ 44x44px
* Focus states (2px ring, brand color)
* Hover/pressed/disabled states
* Keyboard navigation patterns (tab, enter, space, arrow)

### Navigation Behavior

* Responsive drawer → collapses on smaller screens
* Skip links for accessibility
* Search & filter flows

### Forms Interaction

* Error handling (inline, summary, aria-describedby)
* Multi-step forms (with progress indicator)
* Save/resume flows

### Bulk & Workflow Actions

* Multi-select + bulk actions (approve, reject, move)
* Drag & drop with keyboard alternatives
* Audit trails (logging and activity history)

---

## 🎞️ Motion

### Motion Tokens

* Durations: short (80–120ms), medium (200–240ms), long (320–400ms)
* Easing: decelerate in, accelerate out

### Motion Patterns

* Navigation transitions
* State changes (ripple, color, scale)
* Hierarchy (elevation + scaling)
* Kanban card reordering

### Accessibility

* Respect `prefers-reduced-motion`
* Replace translations with opacity fades

---

## ♿ Accessibility (WCAG 2.1 AA)

### Contrast & Color

* All text meets ≥ 4.5:1
* Non-text UI elements ≥ 3:1
* Color not sole means of communication

### Keyboard & Screen Reader

* Logical tab order
* Focus visible at all times
* ARIA roles for all interactive components

### Dynamic Content

* `aria-live` for updates
* Alerts for critical feedback
* Announce validation errors

### Multilingual & RTL Support

* RTL mirroring (Arabic, Hebrew)
* Multi-script typography (CJK, Devanagari)
* Date/time/currency localization

---

## 📊 Patterns

### Workflows & Pipelines (Recruiting / Fellowship)

* Kanban-style boards (list/listitem roles)
* Drag & drop with keyboard equivalents
* Announcements (“Moved to Interview, position 2”)

### Dashboards

* Grid layout with resizable widgets
* Chart accessibility (summaries + export to table)
* User customization (add/remove widgets)

### Profiles

* Profile card anatomy (avatar, name, pronouns, metadata)
* Editable fields inline (Save/Cancel patterns)
* Multi-language name handling

### Search & Filters

* Faceted search
* Clear all filters pattern
* Accessible advanced search

### Multi-Step Flows

* Progress trackers
* Save & resume drafts
* Confirmation/review screens

---

## ✍️ Content & Language

* Voice & tone (professional, inclusive, plain language)
* Labels & microcopy (short, action-oriented)
* Error messaging (actionable, non-blaming)
* Writing for accessibility (avoid jargon, expand acronyms)
* Localization guardrails (avoid cultural references, idioms)

---

## 🎨 Theming & Customization

* Multi-tenant theming (logo, accent colors)
* Guardrails (cannot change contrast ratios, core type scale)
* Token system (export as CSS vars, JSON, Figma tokens)
* Branding tiers:

  * Core theme (enforced accessibility)
  * Tenant theme (logos, accents, illustrations)

---

## 🧪 Testing & QA

### Automated Testing

* Lighthouse CI (≥ 90 accessibility score)
* axe-core integration
* Contrast checker across all tokens

### Manual Testing

* Keyboard-only navigation
* Screen reader (NVDA, JAWS, VoiceOver)
* RTL + localization testing

### Performance & Resilience

* Progressive enhancement (offline save drafts)
* Lazy loading dashboards, prefetch forms
* Low-bandwidth image handling

---

## 🏛 Governance & Contribution

* Versioning system (tokens/components)
* Change approval workflow (design council, dev review)
* Contribution model (how to propose changes)
* Documentation updates required with each release
* Tooling: Figma library, Storybook components, token sync pipeline


# Perfect — let’s formalize the **Expressive Design Tactics** as an **addendum for the AI instruction SSOT**, written in a **DRY (Don’t Repeat Yourself) style**, so that repeated principles are abstracted and referenced across components. This will make it **directly actionable for AI-driven interface generation**.

---

# 🌟 Addendum: Expressive Design Tactics for AI Instruction SSOT

**Purpose:**
Guide the AI-builder in creating interfaces that emphasize hierarchy, clarity, and delight, using expressive techniques aligned with Material 3 principles. Each tactic is a reusable axis that can be applied across components, layouts, and workflows.

---

## 1. Expressive Axes

These **axes define how AI can make UI elements expressive**. Apply consistently across all screens/components while avoiding redundancy.

| Axis                      | Description                                               | Key Rules                                                                                                                                 | Examples / Notes                                                  |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Shape**                 | Use component/container shapes to communicate importance. | - Mix rounded & square corners for contrast. <br> - Larger shapes = higher emphasis. <br> - Break surrounding style to attract attention. | Cards in workflows, hero FABs, avatar containers.                 |
| **Color**                 | Emphasize actions/content with contrast & tone.           | - Primary/high-contrast tones for main actions. <br> - Secondary/tertiary for supporting info. <br> - Avoid blending elements.            | Buttons, alerts, highlighted dashboard metrics.                   |
| **Typography**            | Guide attention with type size, weight, spacing.          | - Larger/heavier = higher emphasis. <br> - Combine with color and shape. <br> - Maintain hierarchy per type scale.                        | Headlines, key buttons, metric labels.                            |
| **Content Containment**   | Group related content for clarity.                        | - Use visual grouping (cards, containers). <br> - Ample spacing for critical content. <br> - Logical container hierarchy.                 | Candidate profile cards, fellowship application sections.         |
| **Motion**                | Use fluid, natural motion to signal hierarchy/state.      | - Micro-animations for feedback (tap, drag/drop). <br> - Motion should clarify, not distract. <br> - Respect reduced-motion preference.   | Dragging Kanban cards, expanding FAB menus, form transitions.     |
| **Component Flexibility** | Adapt components to context (device, environment).        | - Responsive layout adaptation. <br> - Components may shift based on viewport. <br> - Apply canonical layouts where needed.               | FAB placement on mobile vs desktop, toolbar actions on tablet.    |
| **Hero Moments**          | Combine axes to create focal points.                      | - Use 1–2 hero moments per screen. <br> - Combine shape, color, typography, motion, containment. <br> - Emphasize critical interactions.  | Approve candidate action, key dashboard metric, award submission. |

---

## 2. DRY Implementation Principles

1. **Abstract axes from components**

   * Do not hard-code emphasis per component.
   * Use **Shape / Color / Typography / Motion / Containment / Flexibility / Hero** as reusable variables.

2. **Composable rules**

   * Components inherit axes; e.g., a FAB automatically applies **Shape + Color + Motion**.
   * Hero moment = composite application of 3+ axes.

3. **Minimal repetition**

   * Only define expressive specifics that differ from default tokens.
   * Example: Extended FAB uses base FAB axes + extra Typography and Motion rules.

4. **Context-sensitive adaptation**

   * Device size → layout + component shifts.
   * Critical actions → higher emphasis axes automatically applied.

---

## 3. Component Mapping to Expressive Axes

| Component               | Shape                    | Color                    | Typography              | Motion                | Containment | Flexibility       | Hero Potential |
| ----------------------- | ------------------------ | ------------------------ | ----------------------- | --------------------- | ----------- | ----------------- | -------------- |
| App Bar                 | Elevation, rounded edges | Surface/primary tone     | Title emphasis          | Slide/scroll motion   | Optional    | Responsive        | Medium         |
| Button Group (New)      | Rounded/rect combo       | Primary vs secondary     | Weight & size hierarchy | Ripple/press          | Grouped     | Layout adapt      | Medium         |
| Common Buttons          | Standardized             | Primary/high-contrast    | Label emphasis          | Press scale           | N/A         | Flexible          | Medium         |
| Extended FAB            | Rounded                  | Primary container        | Icon + label hierarchy  | Expand/collapse       | N/A         | Mobile vs Desktop | High           |
| FAB Menu (New)          | Circular                 | Accent tone              | N/A                     | Expand animation      | Contained   | Context-aware     | High           |
| Icon Buttons            | Shape consistency        | Accent on hover          | N/A                     | Press/ripple          | Optional    | Flexible          | Medium         |
| Loading Indicator (New) | Circular/line shape      | Accent tone optional     | N/A                     | Spinner/shimmer       | N/A         | Contextual        | Low            |
| Navigation Bar          | Rectangular tabs         | Active/Inactive color    | Label emphasis          | Highlight animation   | Container   | Responsive        | Medium         |
| Navigation Rail         | Rectangular tabs         | Active/Inactive color    | Label emphasis          | Highlight animation   | Container   | Responsive        | Medium         |
| Progress Indicators     | Circular/linear          | Accent colors for states | Optional text           | Fill animation        | N/A         | Context-aware     | Medium         |
| Sliders                 | Rounded thumb            | Primary tone             | Label optional          | Drag motion           | Contained   | Responsive        | Medium         |
| Split Button (New)      | Rectangular + dropdown   | Primary vs secondary     | Label hierarchy         | Press animation       | Grouped     | Context-aware     | High           |
| Toolbars (New)          | Container shape          | Surface/primary          | Label emphasis          | Scroll/hide animation | N/A         | Adaptive          | Medium         |

> Notes: All expressive axes apply **cumulatively** when multiple tactics are relevant (e.g., hero moment).

---

## 4. Hero Moment Guidelines

* **Max 1–2 per screen**
* **Combine axes:** Shape + Color + Typography ± Motion ± Containment
* **Prioritize:** Emotionally impactful, primary tasks, or critical decision points.
* **AI-builder rule:** Apply dynamic scaling and emphasis automatically when hero moment triggered.

---

## 5. Examples

**Tablet:**

* Kanban dashboard: Card elevation + subtle motion + color emphasis for hero candidate.
* Metrics panel: Highlight top metric with primary color + larger typography + card container.

**Phone:**

* FAB menu: Circular shape + expand motion + accent color for critical action.
* Bottom nav: Active tab highlighted with color + motion ripple + shape accent.

---

## ✅ Summary for AI Instructions

1. Treat **Expressive Axes as reusable variables**; assign them dynamically.
2. Apply **minimal repetition**: base component rules + context-specific overrides.
3. Hero moments = **composite application of axes**.
4. Respect **device, accessibility, and context constraints** (WCAG 2.1, motion reduction, RTL, density).
5. Allow **experimentation**: shapes, color, typography, motion can vary while respecting system constraints.

---