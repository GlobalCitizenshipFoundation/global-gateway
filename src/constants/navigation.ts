export const NAVIGATION_ITEMS = [
  {
    // title: "General", // Removed 'General' heading
    links: [
      { label: "Home", path: "/", icon: "Home" },
      { label: "My Submissions", path: "/dashboard", icon: "FileText", roles: ["applicant", "reviewer", "lead_reviewer", "creator", "admin", "super_admin"] },
      // { label: "Profile", path: "/profile", icon: "User", roles: ["applicant", "reviewer", "lead_reviewer", "creator", "admin", "super_admin"] }, // Removed Profile
    ],
  },
  {
    title: "Reviewer Tools",
    links: [
      { label: "Reviewer Dashboard", path: "/reviewer/dashboard", icon: "ClipboardCheck", roles: ["reviewer", "lead_reviewer", "creator", "admin", "super_admin"] },
    ],
  },
  {
    title: "Creator Tools",
    links: [
      { label: "Programs", path: "/creator/dashboard", icon: "Award", roles: ["creator", "admin", "super_admin"] }, // Removed 'Manage'
      { label: "Forms", path: "/creator/forms", icon: "FileText", roles: ["creator", "admin", "super_admin"] }, // Removed 'Manage'
      { label: "Workflows", path: "/creator/workflows", icon: "GitPullRequest", roles: ["creator", "admin", "super_admin"] }, // Removed 'Manage'
      { label: "Email Templates", path: "/creator/emails", icon: "Mail", roles: ["creator", "admin", "super_admin"] }, // Removed 'Manage'
      { label: "Evaluation Rubrics", path: "/creator/evaluation-templates", icon: "Scale", roles: ["creator", "admin", "super_admin"] }, // Removed 'Manage'
    ],
  },
  {
    title: "Admin Tools",
    links: [
      { label: "User Management", path: "/admin/user-management", icon: "Users", roles: ["admin", "super_admin"] },
      { label: "Tags Manager", path: "/admin/tags", icon: "Tag", roles: ["admin", "super_admin"] }, // Renamed
    ],
  },
  {
    title: "Super Admin",
    links: [
      { label: "Account Deletion", path: "/admin/account-deletion", icon: "Trash2", roles: ["super_admin"] },
    ],
  },
];