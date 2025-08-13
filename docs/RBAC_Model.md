# Global Gateway: Role-Based Access Control (RBAC) Model

This document outlines the different user roles within the Global Gateway platform and their corresponding permissions and restrictions. The model is divided into external participants and internal team roles, with a clear hierarchy for internal team members.

---

## Part 1: External Participant Roles

### 1. Role: Applicant

**Core Purpose:** To apply for programs.

**Key Permissions:**
*   **Discover & Apply:** Can view published programs, create applications, and submit them.
*   **Track Application Progress:** Can view the current stage of their application (e.g., "Submitted," "Under Review," "Finalist Review," "Decision Made"). This provides transparency into the process.
*   **Manage Profile:** Can edit their own user profile.
*   **Invite Recommenders:** Can send unique links for Recommenders to complete forms.

**Key Restrictions:**
*   Cannot see internal details like reviewer notes, scores, or who is assigned to their application.

### 2. Role: Recommender

**Core Purpose:** To provide a recommendation for a specific applicant via a unique link.

**Key Permissions:**
*   Can view and fill out the single recommendation form they were invited to.

**Key Restrictions:**
*   No login or account required. Access is limited to the single-use, secure link.
*   Cannot view the main application or any other part of the platform.

---

## Part 2: Internal Team Roles

This section details the updated hierarchy for the internal team, from most restricted to most powerful.

### 3. Role: Reviewer (or Assessor)

**Core Purpose:** To provide an isolated, unbiased evaluation of assigned submissions.

**Key Permissions:**
*   Can view a dashboard of only the submissions explicitly assigned to them.
*   Can view the full content of their assigned applications.
*   Can add private notes and scores/ratings to their assigned submissions.

**Key Restrictions:**
*   **Strict Data Isolation:** Cannot see notes, scores, or any feedback from other Reviewers on the same submission. This is critical to prevent groupthink and ensure independent assessments.
*   Cannot change the status or stage of a submission.
*   Cannot manage programs, forms, or users.

### 4. Role: Lead Reviewer

**Core Purpose:** To oversee the assessment process for a group of submissions, build consensus, and manage the review stage.

**Key Permissions:**
*   All Reviewer permissions.
*   **Full Review Visibility:** Can view all notes and scores from all other Reviewers on submissions they are assigned to lead. This allows them to identify discrepancies and guide the decision-making process.
*   Can make the final "Accept" or "Decline" decision (this is typically reserved for the Creator/Admin).

**Key Restrictions:**
*   Cannot edit the program or its application form.
*   Cannot manage users or team members.

### 5. Role: Creator

**Core Purpose:** To create, configure, and manage the entire lifecycle of their own programs.

**Key Permissions:**
*   **Program Management:** Can create, edit, and manage their own programs and associated forms.
*   **Submission Oversight:** Can view all submissions for their programs.
*   **Team Assignment:** Can assign Reviewers and Lead Reviewers to submissions within their programs.
*   **Final Decision Making:** Can make the final decision to accept or decline submissions.

**Key Restrictions:**
*   Cannot view or manage programs or submissions created by other Creators.
*   Cannot manage platform-wide users or settings.

### 6. Role: Admin

**Core Purpose:** To have global oversight of all content and manage the internal team (excluding other Admins).

**Key Permissions:**
*   **Global Content Access:** Can view and manage all programs, forms, and submissions across the platform.
*   **User Management:** Can invite, manage, and remove users with roles up to Creator.

**Key Restrictions:**
*   Cannot manage other Admins or Super Admins.
*   Cannot access top-level platform settings.

### 7. Role: Super Admin

**Core Purpose:** To have unrestricted control over the entire platform, its configuration, and all users.

**Key Permissions:**
*   All Admin permissions.
*   **Top-Level User Management:** Can manage any user, including other Admins and Super Admins.
*   **Platform Configuration:** Manages billing, security, and integrations.
*   **Account Deletion:** The only role that can process account deletion requests.
*   **Impersonation:** Can temporarily view the platform as any other user role for testing and debugging.

**Key Restrictions:**
*   None.