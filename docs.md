# Project Documentation

This document provides an overview of the project's architecture, key features, and implementation details. It is intended to be a living document that evolves with the project.

## Table of Contents

*   [Project Structure](#project-structure)
*   [Vertical 0: Public Homepage & Role-Based Dashboards](#vertical-0-public-homepage--role-based-dashboards)

---

## Project Structure

The project follows a modular and domain-driven directory structure, aligning with the Next.js App Router and the Vertical Implementation Strategy (VIS).

```
/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (public)/         # Unauthenticated routes (marketing, apply, magic links)
│   │   ├── (portal)/         # Participant-facing portal routes
│   │   ├── (workbench)/      # Managers, coordinators, reviewers routes
│   │   ├── (admin)/          # Admin console routes
│   │   └── api/              # Versioned REST/GraphQL routes
│   ├── components/           # Shared UI components (including ui/ for Shadcn/UI)
│   ├── features/             # Vertical feature modules (e.g., pathway-templates, campaign-management)
│   ├── lib/                  # Utility functions, helpers (e.g., utils.ts, schemas)
│   ├── services/             # Domain services (business logic)
│   ├── integrations/         # 3rd-party connectors (Supabase, Mailgun, etc.)
│   ├── db/                   # Database schema definitions, types
│   ├── hooks/                # Reusable React hooks
│   ├── context/              # Global state/context providers
│   └── styles/               # Additional global CSS/Tailwind config (if needed)
├── public/                   # Static assets
├── supabase/                 # Supabase functions, migrations
├── postcss.config.mjs        # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── components.json           # Shadcn/UI components configuration
├── LICENSE                   # Project license
├── netlify.toml              # Netlify deployment configuration
├── .gitignore                # Git ignore rules
├── README.md                 # Project README
├── VIS.md                    # Vertical Implementation Strategy document
├── PRD.md                    # Product Requirements Document
├── AI_RULES.md               # AI Development Rules
├── M3Design.md               # Material Design 3 Specifications
├── errors.md                 # Error log
└── docs.md                   # Project documentation (this file)
```

---

## Vertical 0: Public Homepage & Role-Based Dashboards

**Objective:** To establish the foundational entry points for all users, including a public landing page and role-specific dashboards for authenticated users, with robust authentication and routing.

**Implementation Details:**

*   **Material Design 3 Styling:**
    *   The `src/app/globals.css` file has been updated to incorporate the Material Design 3 color palette, defining HSL values for both light and dark themes.
    *   `tailwind.config.ts` has been extended to map these new CSS variables to Tailwind utility classes, including primary, secondary, tertiary, destructive, card, popover, muted, accent, border, input, ring, and specific sidebar and chart colors. This ensures M3 compliance across the application's visual elements.
*   **Supabase Client Integration:**
    *   The existing `src/integrations/supabase/client.ts` is used for browser-side Supabase interactions.
    *   `@supabase/supabase-js`, `@supabase/auth-ui-react`, and `@supabase/auth-ui-shared` packages have been added to `package.json`.
*   **Session Management (`src/context/SessionContextProvider.tsx`):**
    *   A `SessionContextProvider` has been created to manage the Supabase authentication session and user state globally. It fetches the initial session and listens for authentication state changes, making `session` and `user` objects available via the `useSession` hook.
*   **Root Layout Integration (`src/app/layout.tsx`):**
    *   The `RootLayout` now wraps the application with `SessionContextProvider` to provide authentication context to all components.
    *   The `Toaster` component from `sonner` has been included for displaying consistent, non-intrusive notifications across the application.
*   **Login Page (`src/app/(public)/login/page.tsx`):**
    *   The login page now utilizes the `@supabase/auth-ui-react` component, styled with `ThemeSupa` and custom M3-compliant color variables.
    *   It includes client-side redirection logic to guide authenticated users to their respective role-based dashboards.
*   **Role-Based Dashboard Placeholders:**
    *   **`src/app/(portal)/dashboard/page.tsx`**: A placeholder for applicants, displaying a welcome message and links to their applications. It enforces that only 'applicant' roles (or higher roles that can access portal) can view it.
    *   **`src/app/(workbench)/dashboard/page.tsx`**: A placeholder for managers, reviewers, and screeners, offering a welcome and role-specific links (e.g., "Manage Campaigns," "View Assignments"). It restricts access to these specific roles.
    *   **`src/app/(admin)/dashboard/page.tsx`**: A placeholder for administrators, providing access to user management and system settings. Access is strictly limited to the 'admin' role.
    *   Each dashboard page uses `createClient` from `src/integrations/supabase/server` to perform server-side user authentication and role verification, redirecting unauthorized users.
*   **Authentication Middleware (`middleware.ts`):**
    *   A Next.js middleware has been implemented to centralize authentication and authorization logic.
    *   It protects all routes except static assets and explicitly public pages (`/`, `/login`).
    *   It redirects unauthenticated users to `/login`.
    *   It enforces role-based access control, ensuring users can only access routes corresponding to their assigned roles (e.g., only 'admin' can access `/admin` routes).
    *   It also handles redirection for logged-in users attempting to access public pages, sending them to their appropriate dashboard.
*   **Public Homepage (`src/app/(public)/page.tsx`):**
    *   The public homepage has been enhanced with a welcoming message, a description of Global Gateway's offerings (Programs, Hiring, Awards), and clear calls to action for new and returning users. It uses `Card` components and Lucide icons for a visually appealing layout.
*   **Authentication Service (`src/services/auth-service.ts`):**
    *   A utility service `authService` has been created to abstract common Supabase authentication operations like `signOut`, `getUser`, and `getSession`. This promotes reusability and keeps component logic clean.

**Next Steps:**
With Vertical 0 complete, the application now has a robust authentication system, role-based routing, and a consistent M3-compliant design foundation. The next step, following the `VIS.md` MVP build order, will be to implement **Vertical 1: Pathway Templates & Phase Configuration**. This will involve defining the database schema for pathway templates and phases, and then building the UI and backend services required for their creation and management.