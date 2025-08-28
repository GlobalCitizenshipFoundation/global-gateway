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

### 2.1 Color Roles and Mapping
Colors are defined using HSL (Hue, Saturation, Lightness) values in `src/app/globals.css` and mapped to Tailwind CSS custom properties.

**Light Theme:**
*   `--background`: `0 0% 100%` (White) - Primary background for the app.
*   `--foreground`: `0 0% 10%` (Near Black) - Primary text color.
*   `--primary`: `336 80% 40%` (`#AD1457`) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `0 0% 100%` (White) - Text on primary colored elements.
*   `--primary-container`: `336 80% 90%` (Very Light Pink/Red)
*   `--on-primary-container`: `336 80% 15%` (Darker Pink/Red)
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
*   `--accent`: `336 80% 90%` (Same as primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `336 80% 15%` (Same as on primary container) - Text on accent elements.
*   `--destructive`: `0 80% 50%` (Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 100%` (White) - Text on destructive elements.
*   `--destructive-container`: `0 80% 90%` (Very Light Red)
*   `--on-destructive-container`: `0 80% 15%` (Darker Red)
*   `--border`: `0 0% 80%` (Light Gray) - Borders for components.
*   `--input`: `0 0% 70%` (Medium Gray) - Input field borders.
*   `--ring`: `336 80% 40%` (Primary color) - Focus ring color.
*   **Sidebar Colors**: Specific variables for sidebar background, foreground, primary, accent, etc., to ensure distinct theming.
    *   `--sidebar-background`: `0 0% 95%`
    *   `--sidebar-foreground`: `0 0% 20%`
    *   `--sidebar-primary`: `336 80% 40%`
    *   `--sidebar-primary-foreground`: `0 0% 100%`
    *   `--sidebar-accent`: `336 80% 90%`
    *   `--sidebar-accent-foreground`: `336 80% 15%`
    *   `--sidebar-border`: `0 0% 80%`
    *   `--sidebar-ring`: `336 80% 40%`

**Dark Theme:**
*   `--background`: `240 10% 5%` (Deep Indigo) - Primary background for the app.
*   `--foreground`: `210 20% 98%` (Light Grey) - Primary text color.
*   `--primary`: `336 80% 70%` (Lighter Pink/Red for dark mode) - Key interactive elements, buttons, primary accents.
*   `--primary-foreground`: `336 80% 10%` (Dark Pink/Red) - Text on primary colored elements.
*   `--primary-container`: `336 80% 20%` (Darker Pink/Red)
*   `--on-primary-container`: `336 80% 90%` (Very Light Pink/Red)
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
*   `--accent`: `336 80% 20%` (Darker primary container) - Hover/active states for interactive elements.
*   `--accent-foreground`: `336 80% 90%` (Lighter primary container) - Text on accent elements.
*   `--destructive`: `0 60% 40%` (Darker Red) - Error states, destructive actions.
*   `--destructive-foreground`: `0 0% 98%` (Off-White) - Text on destructive elements.
*   `--destructive-container`: `0 60% 20%` (Even Darker Red)
*   `--on-destructive-container`: `0 60% 90%` (Lighter Red)
*   `--border`: `240 8% 30%` (More visible border) - Borders for components.
*   `--input`: `240 8% 20%` (Darker indigo) - Input field borders.
*   `--ring`: `336 80% 70%` (Primary color) - Focus ring color.

    --chart-1: 336 70% 60%;
    --chart-2: 200 50% 70%;
    --chart-3: 280 50% 70%;
    --chart-4: 40 70% 80%;
    --chart-5: 300 60% 70%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 336 80% 70%;
    --sidebar-primary-foreground: 336 80% 10%;
    --sidebar-accent: 336 80% 20%;
    --sidebar-accent-foreground: 336 80% 90%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 336 80% 70%;
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