# Project Errors Documentation

Write clean, modular, and reusable code following the vertical implementation plan. Log any errors in JSON ( source_module, error_type, error_message, proposed_solution, confidence_level, memory_flag). Learn from errors (memory_flag = True) but flag low-confidence solutions. Validate each step and ensure role-based, incremental functionality.

# Error Log
```json
{
  "source_module": "Supabase RLS Policy",
  "error_type": "SQL Parsing Error",
  "error_message": "Failed to execute SQL query: ERROR: 42P01: missing FROM-clause entry for table \"new\"",
  "details": "This error consistently occurs when attempting to use `NEW` within any subquery (e.g., `EXISTS`, `IN`, or direct subselects) in the `WITH CHECK` clause of an `INSERT` RLS policy on Supabase. The parser seems to misinterpret `NEW` as a table name within the subquery context, despite it being a special variable for the row being inserted. This prevents direct ownership validation of related entities (like `pathway_template_id` referencing `creator_id` in `pathway_templates`) at the RLS level for `INSERT` operations.",
  "proposed_solution": "Implement a simplified RLS policy that avoids subqueries with `NEW` (e.g., `NEW.pathway_template_id IS NOT NULL`). Crucially, enforce full ownership and authorization checks at the API layer (Next.js Route Handlers) before performing the database insert. This shifts the primary security enforcement for this specific scenario from RLS to the application logic.",
  "confidence_level": "High",
  "memory_flag": true
}