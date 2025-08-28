Global Gateway – Enhanced Vertical Implementation Strategy (VIS)
1. VIS Overview

The VIS ensures end-to-end, vertically sliced increments that are independently testable and deliver usable functionality to internal and external users. Each vertical includes:

Modules / Features

Impacted User Roles

Data & Integration Requirements

MVP Priority

Acceptance Criteria

Dependencies (added for clarity)

Principles:

Vertical over horizontal: Each slice delivers UI → API → DB → RBAC functionality.

Role-first design: Incremental delivery is organized by impacted user personas.

Modularity & Reuse: Phases, templates, dashboards, and email workflows are reusable components.

Automation: Phase triggers, notifications, and status updates are automated whenever possible.

Auditability & Security: All actions are logged; external contributors use secure links.

2. Vertical Modules & Implementation
Vertical 1: Pathway Templates & Phase Configuration

Objective: Build foundation for reusable Pathways and configurable Phases.

Modules / Features:

Pathway Builder (create/edit Pathways, drag-and-drop Phases)

Phase Types: Form, Screening, Review, Resubmission, Decision, Email, Scheduling, Status, Recommendation

Deep copy functionality for Campaigns

Role-based Phase access

Phase configuration options (forms, rubrics, email templates)

User Roles Impacted: Creators, Managers

Data & Integration Requirements:

Form Builder integration

Email Composer + Mailgun API

Phase status table

MVP Priority: High

Acceptance Criteria:

Templates can be created, saved, edited

Phases are configurable and reorderable

Deep copy works correctly for Campaigns

Role-based permissions enforced

Dependencies: None (foundation layer)

Vertical 2: Campaign Management & Campaign Phases

Objective: Launch live campaigns from Pathways with deep-copied Phases.

Modules / Features:

Campaign creation UI

Apply Pathway Templates → deep copy Phases to Campaign

Campaign Dashboard (Kanban + Table views)

Participant assignment via Packages

Multi-level progress tracking

User Roles Impacted: Creators, Managers, Participants

Data & Integration Requirements:

Track Phase status per participant

Store deep-copied Phase configurations

MVP Priority: High

Acceptance Criteria:

Campaign creation replicates Pathway Phases correctly

Participant assignments instantiate Campaign Phases

Progress tracked in real-time

Dependencies: Vertical 1

Vertical 3: Packages & Individual Assignments

Objective: Manage collections of Pathways for guided participant workflows.

Modules / Features:

Package creation UI

Assign Packages to individuals

Deep copy Phases per participant

Track progress per participant

User Roles Impacted: Creators, Managers

Data & Integration Requirements:

Map Packages → Pathways → Campaign Phases

MVP Priority: Medium-High

Acceptance Criteria:

Packages can be created, assigned

Assignment deep-copies Phases correctly

Individual progress trackable and isolated

Dependencies: Vertical 1, Vertical 2

Vertical 4: Participant Interaction & Notifications

Objective: Enable participants to progress through Phases with guided workflows.

Modules / Features:

Form submission & resubmission

Recommendation requests

Dashboard showing Phase status

Automated email notifications per Phase

User Roles Impacted: Participants, External Evaluators

Data & Integration Requirements:

Mailgun for emails

Secure form and rubric submission

Phase status tracking

MVP Priority: High

Acceptance Criteria:

Participants complete and submit forms

Resubmissions function correctly

Recommendations can be sent and tracked

Emails trigger automatically per Phase

Dependencies: Vertical 1, Vertical 2

Vertical 5: Review & Decision Phases

Objective: Enable evaluation and decision-making.

Modules / Features:

Reviewer dashboard (assigned submissions)

Scorecards / rubric evaluations

Internal comments and notes

Decision Phase with outcome recording + notifications

User Roles Impacted: Managers, External Evaluators

Data & Integration Requirements:

Secure evaluator access

Track scores, comments, decisions

Mailgun email triggers

MVP Priority: High

Acceptance Criteria:

Evaluators score and comment

Managers view aggregated scores

Decisions recorded and communicated

Dependencies: Vertical 1, Vertical 2, Vertical 4

Vertical 6: Dashboard & Insights

Objective: Provide actionable insights into workflows.

Modules / Features:

Multi-view dashboards (Kanban, Table, List)

Progress tracking per Phase, Campaign, Participant

Analytics on completion, delays, and scores

Exportable reports

User Roles Impacted: Creators, Managers

Data & Integration Requirements:

Aggregate Phase and Campaign data

Real-time updates

Filtering and sorting

MVP Priority: Medium-High

Acceptance Criteria:

Dashboards show real-time progress

Multi-view options function correctly

Reports can be exported

Dependencies: Vertical 2, Vertical 4, Vertical 5

Vertical 7: Security & Access Control

Objective: Enforce RBAC, auditability, and secure participation.

Modules / Features:

Role-based access per Phase and Campaign

Activity logging

Secure external links for evaluators/recommenders

Anonymization options for bias-aware review

User Roles Impacted: All

Data & Integration Requirements:

RBAC system

Secure endpoints for external users

MVP Priority: High

Acceptance Criteria:

Users see only allowed data

Actions logged for audit

External evaluators restricted to assigned data

Dependencies: Parallel; ongoing across all Verticals

3. Implementation Notes

Deep Copy Strategy: Maintain complete configuration when copying Templates → Campaigns → Packages.

Multi-view Dashboards: Real-time, interactive, Kanban/Table/List for different roles.

Automation: Trigger emails, Phase updates, and notifications automatically.

Integration: Mailgun, internal Form Builder, Email Composer, future HRIS/CRM APIs.

Audit & Compliance: Immutable logs for all actions with timestamps and role context.

4. MVP Build Order / Timeline

Vertical 1: Pathway Templates & Phase Configuration

Vertical 2: Campaign Management & Campaign Phases

Vertical 4: Participant Interaction & Notifications

Vertical 5: Review & Decision Phases

Vertical 3: Packages & Individual Assignments

Vertical 6: Dashboard & Insights

Vertical 7: Security & Access Control (continuous across all)

Each vertical is self-contained but incrementally builds upon previous slices for end-to-end MVP validation.