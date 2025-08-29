# Codebase Refactoring
Analyze the codebase and identify, big files (250 or more lines of code)

Then, for each, analyse dependencies and refactor into smaller modular components with expert precision, so as to not break any parts of the application.

# Authentication and Cookies 

Remember to check if your current solution adheres to this request I made earlier:

When building the application, user login sessions should feel smooth and seamless, without screen flickers or sudden logouts. To achieve this:

Sessions must be checked on the server first. This way, when a user visits a page, the system already knows if they are signed in before anything is shown. The page should never flash “logged out” and then update to “logged in.”

Cookies should be used to quietly remember the user. These cookies should be read and refreshed in the background so the user stays signed in across pages without having to log in again.

The navigation and page content should display the correct state immediately. If the user is logged in, their name or account should appear right away. If they are logged out, the system should show that consistently.

Real-time updates should feel natural. If a user logs out or switches accounts, the page should update smoothly without needing a reload or causing errors.

The overall experience should make authentication invisible — users should just see the right content without distractions, blinking, or error messages.


# Screening Phase

Purpose:
This phase allows recruiters to perform initial screening of applications, deciding which candidates proceed to later stages while collaborating internally. Applicants are not exposed to internal processes—they only see that their application is in the screening phase.

1. Views Available to Recruiters
A. Pipeline / Dashboard View

Columns for phases (Screening, Review, Decision)

Applicant cards showing:

Applicant name and role applied for

Key eligibility information (e.g., minimum qualifications)

Screening status (Pending / Accepted / On Hold / Denied)

Quick action buttons for screening decisions

Drag-and-drop functionality to move applicants between phases internally

Participation overview: Shows which applicants have participated in which workflows/phases of the pathway

B. List / Table View

Sortable columns:

Applicant name, date applied, qualifications, status

Filters:

Eligibility check passed/failed

Keywords from resume or application fields

Bulk actions:

Accept, Hold, Deny for multiple applicants at once

Internal-only data:

Checklist repeater, collaborative notes, and audit trails visible only to internal users

C. Applicant Detail View

When a recruiter clicks an applicant:

Applicant Info

Contact info, resume, cover letter, portfolio links

Internal Decision Tools (hidden from applicants):

Checklist Repeater

Multiple checklists for qualifications, skills, or criteria

Repeatable items to track compliance or requirements

Collaborative Notes / Comments

Team members can leave notes on an applicant

Full audit trail of edits, timestamps, and authors

Screening Action Buttons

Accept / Hold / Deny (moves applicant internally)

Workflow Participation

Visibility into applicant participation across all phases in the pathway

Helps recruiters see if an applicant has engaged in prior or parallel workflows

2. Applicant View

Sees only application status: “Your application is under review / screening phase”

Cannot access checklists, internal notes, or screening decisions

No exposure to internal workflow or team activity

3. Status & Metrics Panel

Internal summary for recruiters:

Total applicants in screening

Acceptance rate, hold rate, denial rate

Time taken per applicant for screening

Graphical dashboard: Kanban, list, or calendar views of workflow progress

4. UI/UX Considerations

Material Design 3 elements:

Cards for applicants with inline action buttons

Clean toggles and tags for statuses

Icons for actions (e.g., user icon for applicants, shield icon for internal decisions)

Inline internal tools:

Checklist repeater and collaborative notes appear in expandable sections

Audit trail accessible via hover or click

Responsive layout: Desktop optimized with optional simplified mobile view

Security & Permissions:

Internal tools and decisions completely hidden from applicants

Only visible to authorized recruiters or hiring managers

✅ Summary:
The Screening Phase is applicant-facing only in status, while recruiters get full internal decision tools (checklist repeaters, collaborative notes with audit trails, screening action buttons) and can track participation across the full workflow. This ensures both transparency for internal teams and privacy for applicants.

# Error Handling

First, fix the issue where API requests (e.g. /api/pathway-templates) fail with 401 Unauthorized even though the user session exists. Ensure that:

The Supabase access token is correctly passed from the client to API routes.

API routes properly validate the token using @supabase/auth-helpers-nextjs or secure headers.

Sessions refresh reliably and expired tokens are handled gracefully.

Once the 401 issue is resolved, implement user-friendly error handling pages for different error codes:

401 Unauthorized → Show "You are not authorized to view this page. Please log in again." with a Login button.

403 Forbidden → Show "You don’t have permission to access this page." with an option to contact support.

404 Not Found → Show "The page you are looking for does not exist." with a Home/Dashboard button.

500 Internal Server Error → Show "Something went wrong on our end." with a Retry button and a support link.

Apply best practices:

Use consistent UI components matching the app’s theme.

Ensure accessibility (ARIA roles, descriptive text).

Provide clear, actionable next steps (login, home, retry, support).

Handle both client-side fetch errors and Next.js route-level errors gracefully.

# Material Design

1. Use this as the primary color #880E4F and enforce material design color system while ensuring accessibility guidelines across the theme toggles.

2. Design and implement all interactive elements in the web application according to Google’s Material Design 3 specifications, ensuring consistent usage of motion, states, and feedback across components. Apply Material 3 principles to buttons, forms, navigation, dialogs, and transitions, maintaining accessibility and a cohesive user experience throughout the app.

## layout

Create a responsive form template that strictly follows Google’s Material Design 3 (M3) guidelines. The form should demonstrate best practices for input fields, labels, helper text, and validation states.

Requirements:

Layout & Spacing: Use M3’s 8dp grid system with balanced padding/margins. Ensure spacing between fields supports readability and touch targets (minimum 48x48dp).

Text Fields: Implement outlined or filled text fields with floating labels, clear affordances, and animated focus states. Include optional helper/error text following M3’s typography scale.

Color & Theming: Use Material Design 3’s dynamic color system with primary, secondary, and surface tones. Support light and dark themes.

Components:

Text fields (single-line + multi-line)

Dropdown / Select field

Checkbox & Radio buttons (with proper label alignment)

Switch component

Date picker (inline or dialog, per M3 specs)

Buttons (Elevated, Filled, and Tonal, with rounded corners and elevation states)

Accessibility: Ensure proper contrast ratios, accessible labels, and error handling.

Elevation & Surfaces: Apply elevation appropriately to distinguish the form surface (e.g., card or sheet) from the background.

Responsiveness: On desktop, form should center with max-width constraints; on mobile, form should span edge-to-edge with consistent padding.

Future Considerations:

Adaptive Layouts: Optimize for larger screens with multi-column form layouts.

Progress Indicators: Add stepper or progress bar support for multi-step forms.

Validation UX: Provide real-time validation feedback with subtle animations.

Assistive Features: Consider voice input, autocomplete, and smart defaults.

Error Handling: Support toast/snackbar messages for global form errors.

Customization: Allow easy theming with Material You’s dynamic color system.

Integration Patterns: Plan for embedding the form in modals, bottom sheets, or full-screen flows.

Deliver a polished, modern, and aesthetically balanced form template that embodies the latest Material Design 3 principles while being future-proof and scalable.

/ ***  / 

### Layout for forms

Redesign this layout to follow Google’s Material Design 3 (M3) guidelines, ensuring balance, alignment, and spacing. The current issue is that the left side feels crammed into the corner, while the right side has too much empty space. Improve the layout by:

Applying M3’s responsive grid system (using 8dp spacing and dynamic breakpoints).

Ensuring balanced margins and paddings on both sides to avoid lopsided spacing.

Using consistent hierarchy and alignment (titles, content, and actions should align to keylines).

Incorporating surface elevation, tonal colors, and rounded corners (default 4dp or 8dp) for visual hierarchy.

Optimizing for readability, accessibility, and aesthetic balance across desktop and mobile breakpoints.

If applicable, use M3 components (cards, buttons, navigation rails, or navigation drawers) instead of ad-hoc elements.

Output should be a clean, modern, and visually balanced layout that aligns with Material Design 3 principles.

/ *** /

# PRD God Prompt

Role: You are an AI full-stack developer tasked with building a modular, API-driven platform for managing Programs, Campaigns, Pathways, Phases, Users, and Third-Party interactions. Reference VIS, PRD, and AI Rules as canonical sources for nomenclature, logic, and workflows.


# THOUGHT EXERCISE

## Home Page and Campaigns

1. I would like to create a landing page for anyone visiting my domain, as you can see we only have dynamic pages and only '/login' is static.

I want to have the static landing page '/"

The idea is to keep it minimal and in line with my current design and thinking.

Very minimal with clean hero, a section to showcase featured campaigns (We can have a toggle in campaigns to choose if we want these campaigns to be made public.

Then a clear footer to talk about Global Gateway being our internal platform to engage in Global Certification and Accreditation at the Global Citizenship Foundation.

The Portal is globalcertification.org the Global Gateway is hosted on my.globalcertification.org

2. Great, maybe this Campaign pages can be added to Vertical 2 of the VIS.md document.

You have not got the schema right. A pathway template is a template and has no connection other than it turning a template into an instance (Instance like a template are editable, however once a template is turned into a campaign, it only has a mention stating "campaign created using {template name}[Template Name + URL]. Only if a template is linked then any changes to a template will create one way changes in the campaign, but if it is not actively linked, then a campaign changes. But any change to a campaign has no change to a template. I hope this is clear.

#