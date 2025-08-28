# AI Development Rules

This document outlines the technology stack and specific library usage guidelines for this Next.js application. Adhering to these rules will help maintain consistency, improve collaboration, and ensure the AI assistant can effectively understand and modify the codebase.

## Product Requirement Document VERY <!IMPORTANT!>

As you execute the plan strictly follow: 


1. Please refer to the 'PRD.md' file for Product Requirements.

2. Refer to 'Architecture.md' file to understand the app architecture and refer to the 'VIS.md' file For Vertical Implementation Strategy.

To accelerate development, you may reference the features from @Global Gateway App 3.0, but do not copy code directly (as it may be corrupt or error-prone). Instead, use it only as a functional benchmark.

3. Provide a short summary of what you have done and what you intend to do next at the end of  every execution. This would allow me to correct you before you proceeding or ask you to keep going.

4. After implementing every vertical successfully please document it in 'docs.md' file according to the predefined conventions. Remember you don't need to repeat info that already exists in project files, rather describe the implementation--and point to the file where the implementation can be found--so that it can be referenced by human.

5. Log errors should be documented in the 'errors.md' file and not in the 'docs.md' file. You will have to refer to the errors file when asked.

6. You do not have permission to edit, modify, or delete any aspect of AI_RULES.md' or 'PRD.md' files.

## Design

Strictly enforce achieving full Material Design 3 specifications and compliance going beyond just using the base components. Therefore involve the below but not limited to:

Dynamic Color Theming: Implementing a system where colors adapt based on a primary seed color, generating a full palette of tonal colors.
Specific Elevation and Shape: Applying precise shadow depths and corner radii as defined by M3 specifications.
Typography: Using M3's defined type scale (e.g., display, headline, title, body, label with specific sizes and weights).
Motion: Incorporating M3-specific animations and transitions.

Refer toM3Design.md to strictly enforce Material Design 3 Specifications.

## Tech Stack Overview

The application is built using the following core technologies:

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Components**: Shadcn/UI - A collection of re-usable UI components built with Radix UI and Tailwind CSS.
*   **Styling**: Tailwind CSS - A utility-first CSS framework for rapid UI development.
*   **Icons**: Lucide React - A comprehensive library of simply beautiful SVG icons.
*   **Forms**: React Hook Form for managing form state and validation, typically with Zod for schema validation.
*   **State Management**: Primarily React Context API and built-in React hooks (`useState`, `useReducer`).
*   **Notifications/Toasts**: Sonner for displaying non-intrusive notifications.
*   **Charts**: Recharts for data visualization.
*   **Animation**: `tailwindcss-animate` and animation capabilities built into Radix UI components.

## Library Usage Guidelines

To ensure consistency and leverage the chosen stack effectively, please follow these rules:

1.  **UI Components**:
    *   **Primary Choice**: Always prioritize using components from the `src/components/ui/` directory (Shadcn/UI components).
    *   **Custom Components**: If a required component is not available in Shadcn/UI, create a new component in `src/components/` following Shadcn/UI's composition patterns (i.e., building on Radix UI primitives and styled with Tailwind CSS).
    *   **Avoid**: Introducing new, third-party UI component libraries without discussion.

2.  **Styling**:
    *   **Primary Choice**: Exclusively use Tailwind CSS utility classes for all styling.
    *   **Global Styles**: Reserve `src/app/globals.css` for base Tailwind directives, global CSS variable definitions, and minimal base styling. Avoid adding component-specific styles here.
    *   **CSS-in-JS**: Do not use CSS-in-JS libraries (e.g., Styled Components, Emotion).

3.  **Icons**:
    *   **Primary Choice**: Use icons from the `lucide-react` library.

4.  **Forms**:
    *   **Management**: Use `react-hook-form` for all form logic (state, validation, submission).
    *   **Validation**: Use `zod` for schema-based validation with `react-hook-form` via `@hookform/resolvers`.

5.  **State Management**:
    *   **Local State**: Use React's `useState` and `useReducer` hooks for component-level state.
    *   **Shared/Global State**: For state shared between multiple components, prefer React Context API.
    *   **Complex Global State**: If application state becomes significantly complex, discuss the potential introduction of a dedicated state management library (e.g., Zustand, Jotai) before implementing.

6.  **Routing**:
    *   Utilize the Next.js App Router (file-system based routing in the `src/app/` directory).

7.  **API Calls & Data Fetching**:
    *   **Client-Side**: Use the native `fetch` API or a simple wrapper around it.
    *   **Server-Side (Next.js)**: Leverage Next.js Route Handlers (in `src/app/api/`) or Server Actions for server-side logic and data fetching.

8.  **Animations**:
    *   Use `tailwindcss-animate` plugin and the animation utilities provided by Radix UI components.

9.  **Notifications/Toasts**:
    *   Use the `Sonner` component (from `src/components/ui/sonner.tsx`) for all toast notifications.

10. **Charts & Data Visualization**:
    *   Use `recharts` and its associated components (e.g., `src/components/ui/chart.tsx`) for displaying charts.

11. **Utility Functions**:
    *   General-purpose helper functions should be placed in `src/lib/utils.ts`.
    *   Ensure functions are well-typed and serve a clear, reusable purpose.

12. **Custom Hooks**:
    *   Custom React hooks should be placed in the `src/hooks/` directory (e.g., `src/hooks/use-mobile.tsx`).

13. **TypeScript**:
    *   Write all new code in TypeScript.
    *   Strive for strong typing and leverage TypeScript's features to improve code quality and maintainability. Avoid using `any` where possible.


# UI/UX Integration in VIS
1. Design Principles

Material Design 3 (M3) Compliance: Utilize dynamic color theming, elevation, shape, and typography from M3 for all components.

Modern & Intuitive: Soft shadows, motion, and rounded corners to create a friendly and professional interface.

Consistency: Uniform spacing, component sizing, and iconography across Pathways, Phases, Campaigns, Dashboards, and User Management.

Accessibility: Maintain WCAG 2.1 AA compliance, with M3 tokens for high contrast and readability.

Responsiveness & Adaptivity: Desktop-first with responsive layouts; adaptive UI for tablet and mobile where feasible.

2. Navigation & Layout

Top App Bar + Navigation Drawer: Persistent navigation with clear section labeling: Programs, Campaigns, Pathways, Users, Dashboards.

Breadcrumbs & Tabs: Show hierarchy and allow quick switching between Campaign > Campaign Phase > Applications.

Adaptive Multi-View Layouts: Kanban, Table/List, Calendar, and Dashboard views with modern M3-style cards and elevation effects.

3. Module UI/UX

User Profiles & Management:

Profile cards with M3 surfaces, role tags, and visual status indicators.

Search, filters, and bulk actions with M3 input fields and chips.

Pathways & Phases:

Visual builder with drag-and-drop using M3 surfaces, elevation cues, and motion feedback.

Phase configuration panels with M3 dialogs and expandable panels.

Color-coded phase distinction (applicant-facing vs internal-only) with dynamic theming.

Campaigns & Campaign Phases:

Dashboard cards with progress indicators and motion-based transitions.

Expand/collapse campaign phases using M3 list components and chevron animations.

Forms / Emails / Scheduling / Status:

Form builder with M3 input fields, validation messages, and outlined/filled variants.

Email composer previews using M3 surfaces with elevation.

Scheduling calendar with interactive cards, conflict detection, and drag-drop.

Recommendations:

Invite interface using M3 dialogs and chips for recommenders.

Status indicators with badges and color-coded submission states.

Dashboards & Insights:

Dynamic M3 cards with charts, tables, and clickable metrics linking to filtered views.

Toasts and snackbars for alerts on stalled applications or pending actions.

4. Interaction & Feedback

Motion & Animation: Elevation shifts, fade-ins, and smooth transitions for draggable elements.

Hover & Focus States: Clear visual feedback for accessibility and usability.

Inline Feedback: Modals, snackbars, and tooltips for errors, success, and system prompts.

5. Implementation Notes

Use a component-based framework for reusable elements as outlined in the 'AI_RULES.md' file.

API-driven UI updates for real-time reflection of phase changes, form submissions, and campaign progress.

MVP prioritization: focus on functional M3 components first, then polish with motion and advanced theming.

By following these guidelines, we can build a more robust, maintainable, and consistent application.