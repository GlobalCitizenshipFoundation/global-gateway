# Material Design 3 (M3) Design Specifications

This document outlines the strict Material Design 3 (M3) specifications to be followed for all UI/UX design and implementation within the Global Gateway application. It serves as a comprehensive guide to ensure consistency, accessibility, and a modern aesthetic across the platform.

📖 Global Gateway Design System (SSOT)

(Material Design 3 + WCAG 2.1 Compliant)

🌱 Foundations
Colors

Brand seed (#E91E63), Brand extension (#880E4F)

Light & dark palettes (tokens: primary, secondary, tertiary, error, neutral)

Contrast validation rules (WCAG AA)

Usage rules (primary actions, background surfaces, accents, status colors)

Typography

Font family (Inter / Roboto Flex)

Type scale table (Display → Headline → Title → Body → Label)

Usage guidelines (case, readability, accessibility)

Shape & Elevation

Corner radius levels (4, 8, 16, 50%)

Elevation tokens (0–5)

Shadows & overlays in dark theme

Layout & Spacing

8px baseline grid

Breakpoints: xs (360), sm (600), md (960), lg (1280), xl (1600)

Responsive behavior (navigation, cards, forms, dashboards)

Density modes: comfortable vs compact (for data-heavy screens)

Iconography & Imagery

Icon set: Material Symbols (outlined/filled usage)

Avatar rules (shapes, initials fallback, alt text)

Illustrations/imagery: style, do’s/don’ts

Fallbacks when icons/images disabled

🎛️ Components
Actions

Buttons (primary, secondary, tonal, FAB, icon buttons)

Chips (filter, input, choice, action)

Toggles (switches, checkboxes, radio buttons)

Inputs & Forms

Text fields (filled/outlined, states, validation)

Selects, dropdowns, comboboxes

Date pickers, file uploaders

Form grouping (progressive disclosure, multi-step)

Validation: live, on blur, on submit

Navigation

Top app bar

Navigation drawer (permanent, modal)

Bottom navigation (mobile)

Breadcrumbs

Tabs & segmented controls

Surfaces

Cards (anatomy, content structure)

Sheets (modal, bottom, side)

Dialogs (modal, alert, confirmation)

Banners, snackbars, tooltips

Data Display

Tables (sortable, filterable, sticky headers)

Lists (single/multi-line, with avatars/icons)

Badges, progress indicators

Charts (bar, line, pie → with accessible text fallback)

Feedback

States: success, warning, error, info

Loaders (spinners, skeletons, shimmer)

Notification hierarchy (toast → snackbar → banner → modal)

⚙️ Interaction Design
Universal Interaction Rules

Touch targets ≥ 44x44px

Focus states (2px ring, brand color)

Hover/pressed/disabled states

Keyboard navigation patterns (tab, enter, space, arrow)

Navigation Behavior

Responsive drawer → collapses on smaller screens

Skip links for accessibility

Search & filter flows

Forms Interaction

Error handling (inline, summary, aria-describedby)

Multi-step forms (with progress indicator)

Save/resume flows

Bulk & Workflow Actions

Multi-select + bulk actions (approve, reject, move)

Drag & drop with keyboard alternatives

Audit trails (logging and activity history)

🎞️ Motion
Motion Tokens

Durations: short (80–120ms), medium (200–240ms), long (320–400ms)

Easing: decelerate in, accelerate out

Motion Patterns

Navigation transitions

State changes (ripple, color, scale)

Hierarchy (elevation + scaling)

Kanban card reordering

Accessibility

Respect prefers-reduced-motion

Replace translations with opacity fades

♿ Accessibility (WCAG 2.1 AA)
Contrast & Color

All text meets ≥ 4.5:1

Non-text UI elements ≥ 3:1

Color not sole means of communication

Keyboard & Screen Reader

Logical tab order

Focus visible at all times

ARIA roles for all interactive components

Dynamic Content

aria-live for updates

Alerts for critical feedback

Announce validation errors

Multilingual & RTL Support

RTL mirroring (Arabic, Hebrew)

Multi-script typography (CJK, Devanagari)

Date/time/currency localization

📊 Patterns
Workflows & Pipelines (Recruiting / Fellowship)

Kanban-style boards (list/listitem roles)

Drag & drop with keyboard equivalents

Announcements (“Moved to Interview, position 2”)

Dashboards

Grid layout with resizable widgets

Chart accessibility (summaries + export to table)

User customization (add/remove widgets)

Profiles

Profile card anatomy (avatar, name, pronouns, metadata)

Editable fields inline (Save/Cancel patterns)

Multi-language name handling

Search & Filters

Faceted search

Clear all filters pattern

Accessible advanced search

Multi-Step Flows

Progress trackers

Save & resume drafts

Confirmation/review screens

✍️ Content & Language

Voice & tone (professional, inclusive, plain language)

Labels & microcopy (short, action-oriented)

Error messaging (actionable, non-blaming)

Writing for accessibility (avoid jargon, expand acronyms)

Localization guardrails (avoid cultural references, idioms)

🎨 Theming & Customization

Multi-tenant theming (logo, accent colors)

Guardrails (cannot change contrast ratios, core type scale)

Token system (export as CSS vars, JSON, Figma tokens)

Branding tiers:

Core theme (enforced accessibility)

Tenant theme (logos, accents, illustrations)

🧪 Testing & QA
Automated Testing

Lighthouse CI (≥ 90 accessibility score)

axe-core integration

Contrast checker across all tokens

Manual Testing

Keyboard-only navigation

Screen reader (NVDA, JAWS, VoiceOver)

RTL + localization testing

Performance & Resilience

Progressive enhancement (offline save drafts)

Lazy loading dashboards, prefetch forms

Low-bandwidth image handling

🏛 Governance & Contribution

Versioning system (tokens/components)

Change approval workflow (design council, dev review)

Contribution model (how to propose changes)

Documentation updates required with each release

Tooling: Figma library, Storybook components, token sync pipeline
