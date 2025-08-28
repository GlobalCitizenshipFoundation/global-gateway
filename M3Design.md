# Material Design 3 (M3) Design Specifications

This document outlines the strict Material Design 3 (M3) specifications to be followed for all UI/UX design and implementation within the Global Gateway application. It serves as a comprehensive guide to ensure consistency, accessibility, and a modern aesthetic across the platform.

## 1. Core Principles

All UI/UX elements must adhere to the following M3 principles:
*   **Human-centered**: Design for real users and their needs.
*   **Personalization**: Support dynamic theming and user preferences.
*   **Expressive and adaptable**: Flexible enough to work across various contexts and devices.
*   **Accessible**: Ensure usability for all, including those with disabilities.

## 2. Dynamic Color Theming

The application will implement a system where colors adapt based on a primary seed color, generating a full palette of tonal colors.

### 2.1 Primary Seed Color
The primary seed color for the application is `#004D40`. This will drive the generation of the full M3 tonal palette.

### 2.2 Color Roles and Mapping
Colors are defined using HSL (Hue, Saturation, Lightness) values in `src/app/globals.css` and mapped to Tailwind CSS custom properties.

**Light Theme:**
*   `--background`: `0 0% 100%` (White) - Primary background for the app.
*   `--foreground`: `0 0% 10%` (Near Black) - Primary text color.
*   `--primary`: `172 100% 15%` (`#004D40`) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `0 0% 100%` (White) - Text on primary colored elements.
*   `--primary-container`: `172 100% 90%` (Very Light Teal)
*   `--on-primary-container`: `172 100% 10%` (Darker Teal)
*   `--secondary`: `200 20% 90%` (Light Grayish Blue)
*   `--secondary-foreground`: `200 20% 20%` (Dark Grayish Blue)
*   `--secondary-container`: `200 20% 80%` (Medium Light Grayish Blue)
*   `--on-secondary-container`: `200 20% 30%` (Medium Dark Grayish Blue)
*   `--tertiary`: `280 40% 90%` (Light Purple)
*   `--tertiary-foreground`: `280 40% 20%` (Dark Purple)
*   `--card`: `0 0% 98%` (Very Light Gray) - Background for cards and elevated surfaces.
*   `--card-foreground`: `0 0% 10%` (Near Black) - Text on card surfaces.
*   `--popover`: `0 0% 95%` (Slightly Darker Light Gray) - Background for popovers.
*   `--popover-foreground`: `0 0% 20%` (Dark Gray) - Text on popovers.
*   `--muted`: `0 0% 90%` (Light Gray) - For less prominent text or elements.
*   `--muted-foreground`: `0 0% 40%` (Medium Gray) - Text on muted elements.
*   `--accent`: `172 100% 90%` (Same as primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `172 100% 10%` (Same as on primary container) - Text on accent elements.
*   `--destructive`: `0 80% 50%` (Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 100%` (White) - Text on destructive elements.
*   `--destructive-container`: `0 80% 90%` (Very Light Red)
*   `--on-destructive-container`: `0 80% 15%` (Darker Red)
*   `--border`: `0 0% 80%` (Light Gray) - Borders for components.
*   `--input`: `0 0% 70%` (Medium Gray) - Input field borders.
*   `--ring`: `172 100% 15%` (Primary color) - Focus ring color.
*   **Sidebar Colors**: Specific variables for sidebar background, foreground, primary, accent, etc., to ensure distinct theming.
    *   `--sidebar-background`: `0 0% 95%`
    *   `--sidebar-foreground`: `0 0% 20%`
    *   `--sidebar-primary`: `172 100% 15%`
    *   `--sidebar-primary-foreground`: `0 0% 100%`
    *   `--sidebar-accent`: `172 100% 90%`
    *   `--sidebar-accent-foreground`: `172 100% 10%`
    *   `--sidebar-border`: `0 0% 80%`
    *   `--sidebar-ring`: `172 100% 15%`

**Dark Theme:**
*   `--background`: `240 10% 5%` (Deep Indigo) - Primary background for the app.
*   `--foreground`: `210 20% 98%` (Light Grey) - Primary text color.
*   `--primary`: `172 100% 70%` (Lighter Teal for dark mode) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `172 100% 10%` (Dark Teal) - Text on primary colored elements.
*   `--primary-container`: `172 100% 20%` (Darker Teal)
*   `--on-primary-container`: `172 100% 90%` (Very Light Teal)
*   `--secondary`: `200 20% 30%` (Dark Grayish Blue)
*   `--secondary-foreground`: `200 20% 80%` (Light Grayish Blue)
*   `--secondary-container`: `200 20% 40%` (Medium Dark Grayish Blue)
*   `--on-secondary-container`: `200 20% 70%` (Medium Light Grayish Blue)
*   `--tertiary`: `280 40% 30%` (Dark Purple)
*   `--tertiary-foreground`: `280 40% 80%` (Light Purple)
*   `--card`: `240 10% 10%` (Slightly lighter indigo) - Background for cards and elevated surfaces.
*   `--card-foreground`: `210 20% 98%` (Light Grey) - Text on card surfaces.
*   `--popover`: `240 10% 15%` (Slightly lighter indigo) - Background for popovers.
*   `--popover-foreground`: `210 20% 90%` (Lighter Grey) - Text on popovers.
*   `--muted`: `240 8% 25%` (Lighter muted background) - For less prominent text or elements.
*   `--muted-foreground`: `210 10% 85%` (Lighter Grey) - Text on muted elements.
*   `--accent`: `172 100% 20%` (Darker primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `172 100% 90%` (Lighter primary container) - Text on accent elements.
*   `--destructive`: `0 60% 40%` (Darker Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 98%` (Off-White) - Text on destructive elements.
*   `--destructive-container`: `0 60% 20%` (Even Darker Red)
*   `--on-destructive-container`: `0 60% 90%` (Lighter Red)
*   `--border`: `240 8% 30%` (More visible border) - Borders for components.
*   `--input`: `240 8% 20%` (Darker indigo) - Input field borders.
*   `--ring`: `172 100% 70%` (Primary color) - Focus ring color.

    --chart-1: 336 70% 60%;
    --chart-2: 200 50% 70%;
    --chart-3: 280 50% 70%;
    --chart-4: 40 70% 80%;
    --chart-5: 300 60% 70%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 172 100% 70%;
    --sidebar-primary-foreground: 172 100% 10%;
    --sidebar-accent: 172 100% 20%;
    --sidebar-accent-foreground: 172 100% 90%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 172 100% 70%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

## 3. Typography

The M3 type scale will be strictly applied, ensuring a clear hierarchy and readability. This includes specific font sizes, weights, and line heights for display, headline, title, body, and label categories.

*   **Accessibility:** Ensure sufficient contrast ratios for all text against its background (WCAG 2.1 AA minimum). Use semantic HTML elements to convey meaning to assistive technologies. Text should be resizable up to 200% without loss of content or functionality.

## 4. Shape and Elevation

M3 emphasizes distinct shapes and elevation to convey hierarchy and interactivity.

*   **Shape:** Components will use rounded corners, with default radii of 4dp or 8dp, and larger radii for elevated surfaces like cards or sheets.
*   **Elevation:** Precise shadow depths will be applied to distinguish surfaces. Higher elevation indicates greater importance or an active state (e.g., a dialog over content).
*   **Accessibility:** Elevation changes should be subtle enough not to cause disorientation. Visual cues for interactive elements should not rely solely on elevation; color and state changes are also critical.

## 5. Motion

M3 motion principles will be used to guide user attention, provide feedback, and enhance the user experience.

*   **Purposeful Motion:** Animations should be meaningful, not just decorative. They should clarify relationships between elements, indicate state changes, and provide a sense of direct manipulation.
*   **Consistent Duration & Easing:** Use M3-defined easing curves and consistent durations for similar interactions to create a predictable experience.
*   **Transitions:** Smooth transitions for opening/closing menus, expanding/collapsing sections, and navigating between pages.
*   **Accessibility:** Provide options for users to reduce or disable animations (e.g., respecting `prefers-reduced-motion` media query). Motion should not cause motion sickness or cognitive overload. Important information should not be conveyed solely through motion.

## 6. Layout and Spacing

The M3 8dp grid system will be the foundation for all layouts, ensuring consistent spacing and alignment.

*   **Responsive Grid:** Implement a responsive grid system that adapts to different screen sizes (desktop, tablet, mobile) using dynamic breakpoints.
*   **Balanced Margins & Paddings:** Ensure consistent and balanced spacing around components and content to prevent a "cramped" or "lopsided" appearance.
*   **Keylines:** Align elements to keylines for visual consistency and hierarchy.
*   **Touch Targets:** All interactive elements (buttons, links, form fields) must have a minimum touch target size of 48x48dp for accessibility on touch devices.
*   **Accessibility:** Ensure content reflows gracefully on smaller screens without requiring horizontal scrolling. Maintain logical reading order.

## 7. Interactive Components

All interactive elements will strictly adhere to M3 specifications for their appearance, states, and behavior.

### 7.1 Buttons
*   **Types:** Implement Elevated, Filled, Tonal, Outlined, and Text buttons.
*   **States:** Clearly define visual states for default, hover, focus, pressed, and disabled.
    *   **Hover (Web):** Subtle background color change, slight elevation increase for Elevated/Filled buttons.
    *   **Focus (Web & Mobile):** Visible focus ring (using `--ring` color) around the button for keyboard navigation.
    *   **Pressed (Web & Mobile):** Ripple effect, slight decrease in elevation.
    *   **Disabled:** Reduced opacity, desaturated colors, non-interactive.
*   **Accessibility:** Ensure sufficient contrast for all button states. Buttons must be keyboard navigable and have descriptive `aria-label` attributes if their text content is not fully descriptive.

### 7.2 Forms (Text Fields, Dropdowns, Checkboxes, Radio Buttons, Switches, Date Pickers)
*   **Text Fields:** Outlined or filled variants with floating labels, clear affordances, and animated focus states.
    *   **Helper/Error Text:** Follow M3 typography scale, with clear visual distinction for error states (e.g., destructive color).
    *   **States:** Visual changes for active, focused, error, and disabled states.
*   **Dropdown / Select:** Consistent styling with text fields, clear indication of current selection.
*   **Checkbox & Radio Buttons:** M3-compliant visual styles, proper label alignment.
*   **Switch Component:** Clear on/off visual states.
*   **Date Picker:** Inline or dialog variants, adhering to M3 calendar design.
*   **Accessibility:**
    *   All form fields must have associated `<label>` elements.
    *   Error messages must be programmatically associated with their respective fields and clearly visible.
    *   Keyboard navigation (Tab key) must move focus logically through fields.
    *   Sufficient contrast for borders, text, and icons in all states.
    *   Provide clear instructions for input formats.

### 7.3 Navigation (Top App Bar, Navigation Drawer, Breadcrumbs, Tabs)
*   **Top App Bar:** Consistent height, dynamic color changes on scroll, clear branding and actions.
*   **Navigation Drawer:** M3-style drawer with appropriate elevation, clear section labeling, and smooth open/close motion.
*   **Breadcrumbs & Tabs:** Clear hierarchy, active state indication, and smooth transitions between tabs.
*   **Accessibility:**
    *   Navigation elements must be keyboard navigable.
    *   Current page/section should be clearly indicated (e.g., `aria-current="page"`).
    *   Navigation drawers should be dismissible via Escape key.
    *   Sufficient contrast for all navigation items.

## 8. Interaction & Feedback Across Web and Mobile

Interactions will be designed to feel natural and intuitive, adapting to the input method and device.

### 8.1 Input Modalities
*   **Web (Mouse/Keyboard):**
    *   **Hover States:** Provide subtle visual feedback on interactive elements (buttons, links, cards) to indicate interactivity.
    *   **Focus States:** A clear, high-contrast focus ring (using `--ring` color) must be visible around all interactive elements when navigated via keyboard. This is critical for WCAG 2.1 AA compliance.
    *   **Keyboard Navigation:** All interactive elements must be reachable and operable via keyboard (Tab, Enter, Space keys).
*   **Mobile (Touch/Gestures):**
    *   **Touch Feedback:** Visual ripple effects or subtle background changes on tap to confirm interaction.
    *   **Gestures:** Implement M3-aligned gestures where appropriate (e.g., swipe to dismiss, drag-and-drop with elevation cues and motion feedback).
    *   **Touch Targets:** All interactive elements must meet the 48x48dp minimum touch target size.

### 8.2 Feedback Mechanisms
*   **Toasts & Snackbars (Sonner):**
    *   **Purpose:** Non-intrusive, temporary messages for success, error, or informational feedback.
    *   **M3 Styling:** Adhere to M3 specifications for placement (bottom of screen, not obscuring content), typography, and color (e.g., destructive color for errors).
    *   **Motion:** Subtle fade-in/fade-out animations.
    *   **Accessibility:** Should be announced by screen readers (e.g., using `aria-live="polite"`). Should not disappear too quickly for users to read (minimum 5 seconds for short messages).
*   **Dialogs & Modals:**
    *   **Purpose:** For critical information, user confirmation, or complex input.
    *   **M3 Styling:** Elevated surface, clear title, body, and action buttons.
    *   **Motion:** Smooth fade-in/scale-up animation from the center.
    *   **Accessibility:** Must trap keyboard focus within the dialog. Dismissible via Escape key. Content should be announced by screen readers upon opening.
*   **Inline Validation:**
    *   **Purpose:** Immediate feedback on form input errors.
    *   **M3 Styling:** Error text below the field, field border/label color changes to destructive color.
    *   **Accessibility:** Error messages must be programmatically linked to the input field (e.g., `aria-describedby`).

### 8.3 Adaptive Interactions
*   **Drag-and-Drop:**
    *   **M3 Cues:** Use elevation shifts, subtle background changes, and motion feedback to indicate draggable items and valid drop targets.
    *   **Accessibility:** Provide keyboard-operable alternatives for drag-and-drop functionality.
*   **Expand/Collapse:**
    *   **M3 Cues:** Use chevron icons with rotation animations, smooth height transitions for content.
    *   **Accessibility:** Clearly indicate expanded/collapsed state using `aria-expanded` attribute.

## 9. Module UI/UX (M3 & Accessibility Integrated)

### 9.1 User Profiles & Management
*   **Profile Cards:** M3 surfaces with appropriate elevation, role tags using M3-compliant badges, and visual status indicators.
*   **Search, Filters, Bulk Actions:** M3 input fields, chips for filters, and M3 buttons for actions.
*   **Accessibility:** Ensure all interactive elements are keyboard navigable. Status indicators should have text alternatives for screen readers.

### 9.2 Pathways & Phases
*   **Visual Builder:** Drag-and-drop functionality for phases using M3 surfaces, elevation cues, and motion feedback.
*   **Phase Configuration Panels:** M3 dialogs and expandable panels for settings.
*   **Color-coded Distinction:** Use dynamic theming for color-coded phase distinction (applicant-facing vs. internal-only), ensuring sufficient contrast.
*   **Accessibility:** Provide keyboard alternatives for drag-and-drop. Ensure all configuration options are accessible via keyboard.

### 9.3 Campaigns & Campaign Phases
*   **Dashboard Cards:** M3 cards with progress indicators and motion-based transitions.
*   **Expand/Collapse:** M3 list components with chevron animations for campaign phases.
*   **Accessibility:** Progress indicators should have `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes.

### 9.4 Forms / Emails / Scheduling / Status
*   **Form Builder:** M3 input fields, validation messages, and outlined/filled variants.
*   **Email Composer Previews:** M3 surfaces with elevation.
*   **Scheduling Calendar:** Interactive cards, conflict detection, and drag-drop functionality.
*   **Accessibility:** All form builder elements must adhere to form accessibility guidelines (Section 7.2). Calendar interactions should be keyboard navigable.

### 9.5 Recommendations
*   **Invite Interface:** M3 dialogs and chips for recommenders.
*   **Status Indicators:** Badges and color-coded submission states, ensuring contrast.
*   **Accessibility:** Dialogs must be accessible. Status indicators should have descriptive text.

### 9.6 Dashboards & Insights
*   **Dynamic M3 Cards:** Charts, tables, and clickable metrics linking to filtered views.
*   **Accessibility:** Charts should have text descriptions or data tables as alternatives. Tables must be properly structured with headers.

## 10. Security & Permissions

Internal tools and decisions must be completely hidden from applicants and only visible to authorized recruiters or hiring managers. This is a functional requirement, but also impacts UI/UX by ensuring unauthorized elements are not even rendered.

---

This comprehensive set of guidelines ensures that Material Design 3 principles and WCAG 2.1 AA accessibility are deeply embedded in every design decision, from color and typography to interactive elements and motion, across both web and mobile experiences.

---

**Summary of what has been done:**
I have updated the `M3Design.md` file to include comprehensive guidelines on Material Design 3 aligned interactions across web and mobile experiences. This new content details input modalities (mouse/keyboard, touch/gestures), feedback mechanisms (toasts, dialogs, inline validation), and adaptive interactions (drag-and-drop, expand/collapse), all while explicitly integrating WCAG 2.1 AA accessibility requirements. The primary color HSL values for `#004D40` have also been re-verified and corrected.

**What I intend to do next:**
With the detailed design principles now firmly established, I will proceed with implementing **Vertical 1: Pathway Templates & Phase Configuration**. This will involve defining the database schema for pathway templates and phases in Supabase, and then building the UI and backend services for their creation and management, ensuring all RLS policies are correctly applied and the UI strictly adheres to the newly defined M3 and accessibility guidelines.