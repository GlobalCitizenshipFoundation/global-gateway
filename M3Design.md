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
The primary seed color for the application is `#880E4F`. This will drive the generation of the full M3 tonal palette.

### 2.2 Color Roles and Mapping
Colors are defined using HSL (Hue, Saturation, Lightness) values in `src/app/globals.css` and mapped to Tailwind CSS custom properties.

**Light Theme:**
*   `--background`: `0 0% 100%` (White) - Primary background for the app.
*   `--foreground`: `200 10% 10%` (Very Dark Blue-Gray) - Primary text color.
*   `--primary`: `330 80% 30%` (`#880E4F`) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `0 0% 100%` (White) - Text on primary colored elements.
*   `--primary-container`: `330 80% 90%` (Very Light Pink)
*   `--on-primary-container`: `330 80% 10%` (Dark Pink)
*   `--secondary`: `200 20% 90%` (Light Grayish Blue)
*   `--secondary-foreground`: `200 20% 20%` (Dark Grayish Blue)
*   `--secondary-container`: `200 20% 80%` (Medium Light Grayish Blue)
*   `--on-secondary-container`: `200 20% 30%` (Medium Dark Grayish Blue)
*   `--tertiary`: `280 40% 90%` (Light Purple)
*   `--tertiary-foreground`: `280 40% 20%` (Dark Purple)
*   `--card`: `0 0% 98%` (Very Light Gray) - Background for cards and elevated surfaces.
*   `--card-foreground`: `200 10% 10%` (Very Dark Blue-Gray) - Text on card surfaces.
*   `--popover`: `0 0% 95%` (Slightly Darker Light Gray) - Background for popovers.
*   `--popover-foreground`: `200 10% 20%` (Dark Gray) - Text on popovers.
*   `--muted`: `0 0% 90%` (Light Gray) - For less prominent text or elements.
*   `--muted-foreground`: `0 0% 25%` (Darker for AAA contrast) - Text on muted elements.
*   `--accent`: `330 80% 90%` (Same as primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `330 80% 10%` (Same as on primary container) - Text on accent elements.
*   `--destructive`: `0 80% 50%` (Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 100%` (White) - Text on destructive elements.
*   `--destructive-container`: `0 80% 90%` (Very Light Red)
*   `--on-destructive-container`: `0 80% 15%` (Darker Red)
*   `--border`: `0 0% 80%` (Light Gray) - Borders for components.
*   `--input`: `0 0% 70%` (Medium Gray) - Input field borders.
*   `--ring`: `330 80% 30%` (Primary color) - Focus ring color.
*   **Sidebar Colors**: Specific variables for sidebar background, foreground, primary, accent, etc., to ensure distinct theming.
    *   `--sidebar-background`: `0 0% 95%`
    *   `--sidebar-foreground`: `200 10% 20%`
    *   `--sidebar-primary`: `330 80% 30%`
    *   `--sidebar-primary-foreground`: `0 0% 100%`
    *   `--sidebar-accent`: `330 80% 90%`
    *   `--sidebar-accent-foreground`: `330 80% 10%`
    *   `--sidebar-border`: `0 0% 80%`
    *   `--sidebar-ring`: `330 80% 30%`

**Dark Theme:**
*   `--background`: `240 10% 5%` (Deep Indigo) - Primary background for the app.
*   `--foreground`: `210 20% 98%` (Light Grey) - Primary text color.
*   `--primary`: `330 80% 70%` (Lighter Pink for dark mode) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `330 80% 10%` (Dark Pink) - Text on primary colored elements.
*   `--primary-container`: `330 80% 20%` (Darker Pink)
*   `--on-primary-container`: `330 80% 90%` (Very Light Pink)
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
*   `--muted-foreground`: `210 10% 95%` (Lighter Grey) - Text on muted elements.
*   `--accent`: `330 80% 20%` (Darker primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `330 80% 90%` (Lighter primary container) - Text on accent elements.
*   `--destructive`: `0 60% 40%` (Darker Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 98%` (Off-White) - Text on destructive elements.
*   `--destructive-container`: `0 60% 20%` (Even Darker Red)
*   `--on-destructive-container`: `0 60% 90%` (Lighter Red)
*   `--border`: `240 8% 30%` (More visible border) - Borders for components.
*   `--input`: `240 8% 20%` (Darker indigo) - Input field borders.
*   `--ring`: `330 80% 70%` (Primary color) - Focus ring color.

    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 330 80% 70%;
    --sidebar-primary-foreground: 330 80% 10%;
    --sidebar-accent: 330 80% 20%;
    --sidebar-accent-foreground: 330 80% 90%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 330 80% 70%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-normal text-body-large; /* Apply base typography */
  }

  /* Generic heading and paragraph styles are removed.
     M3 typography classes (e.g., text-display-large, text-headline-medium)
     should be applied directly to elements in components. */
}

## 3. Typography

The application will use M3's defined type scale, with specific font sizes, line heights, and letter spacing. These are configured in `tailwind.config.ts` as custom `fontSize` utilities.

**Implementation Strategy:**
*   **`tailwind.config.ts`**: Defines the full M3 type scale (e.g., `display-large`, `headline-medium`, `body-small`) with precise `rem` values, `lineHeight`, and `letterSpacing`.
*   **Components**: Apply these Tailwind utility classes directly to text elements (e.g., `<h1 className="text-display-large font-bold">...</h1>`, `<p className="text-body-medium">...</p>`).
*   **`src/app/globals.css`**: Only sets a base `font-normal text-body-large` for the `body` tag. It *does not* contain `@apply` rules for specific M3 typography classes (e.g., `.text-display-large { @apply text-display-large font-bold; }`) to avoid circular dependencies. Font weights are applied directly in components alongside the size utility.

**M3 Type Scale (defined in `tailwind.config.ts`):**
*   **Display**: `display-large` (57px), `display-medium` (45px), `display-small` (36px) - Bold
*   **Headline**: `headline-large` (32px), `headline-medium` (28px), `headline-small` (24px) - Semibold
*   **Title**: `title-large` (22px), `title-medium` (16px), `title-small` (14px) - Semibold/Medium
*   **Body**: `body-large` (16px), `body-medium` (14px), `body-small` (12px) - Normal
*   **Label**: `label-large` (14px), `label-medium` (12px), `label-small` (11px) - Medium

### 3.1 Font Families
The application uses `Geist` for sans-serif and `Geist_Mono` for monospace, as defined in `src/app/layout.tsx`.

## 4. Specific Elevation and Shape

Applying precise shadow depths and corner radii as defined by M3 specifications.
*   **Border Radius**: Custom `borderRadius` values are defined in `tailwind.config.ts` (e.g., `sm: 2px`, `md: 4px`, `xl: 12px`, `2xl: 16px`). Default `lg` is `8px`.
*   **Elevation**: Achieved using Tailwind's `shadow-sm`, `shadow-md`, `shadow-lg`, etc., which should be visually consistent with M3's elevation system.

## 5. Motion

Incorporating M3-specific animations and transitions.
*   **Animations**: `tailwindcss-animate` plugin is used for predefined animations.
*   **Transitions**: Custom `transition-all` and `duration-` utilities are used for smooth state changes (e.g., hover effects on cards).

## 6. Layout & Spacing

*   **8dp Grid System**: All spacing (margins, paddings, gaps) should primarily adhere to multiples of `8px` (e.g., `p-2` for 8px, `gap-4` for 16px). Custom `spacing` values are defined in `tailwind.config.ts`.
*   **Responsiveness**: Layouts are designed desktop-first with responsive adjustments for tablet and mobile, using Tailwind's responsive prefixes (e.g., `md:`, `lg:`).

## 7. Accessibility

*   **WCAG 2.1 AAA Compliance**:
    *   **Contrast**: All text and interactive elements must meet a contrast ratio of at least 7:1 for AAA. Color variables in `globals.css` are adjusted to achieve this.
    *   **Font Sizes**: Minimum font sizes are ensured, especially for body and label text.
    *   **Keyboard Navigation**: All interactive elements must be reachable and operable via keyboard, with clear focus indicators.
    *   **ARIA Roles**: Appropriate ARIA attributes should be used for complex components to enhance screen reader compatibility.
*   **Motion**: Avoid excessive or flashing animations that could cause discomfort. Provide options to reduce motion if necessary (future consideration).