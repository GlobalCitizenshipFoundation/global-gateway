import { useState } from 'react';
    import { supabase } from '@/integrations/supabase/client';
    import { useSession } from '@/contexts/auth/SessionContext';
    import { showError, showSuccess } from '@/utils/toast';
    import { Tag } from '@/types'; // Correctly import Tag

    interface UseTagManagementActionsProps {
      fetchTags<dyad-problem-report summary="34 problems">
<problem file="src/pages/forms/FormManagementPage.tsx" line="12" column="30" code="1005">'from' expected.</problem>
<problem file="src/types/index.ts" line="239" column="14" code="2552">Cannot find name 'EvaluationTemplateTag'. Did you mean 'EvaluationTemplate'?</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="54" column="10" code="7022">'selectedField' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="54" column="72" code="2448">Block-scoped variable 'selectedField' used before its declaration.</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="55" column="10" code="7022">'selectedSection' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="55" column="78" code="2448">Block-scoped variable 'selectedSection' used before its declaration.</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="222" column="19" code="2322">Type 'string' is not assignable to type '(text: string) =&gt; void'.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="12" column="30" code="1141">String literal expected.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="48" column="23" code="7006">Parameter 'prev' implicitly has an 'any' type.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="49" column="42" code="7006">Parameter 'id' implicitly has an 'any' type.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="63" column="62" code="7006">Parameter 'tagId' implicitly has an 'any' type.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="169" column="41" code="7006">Parameter 'tagId' implicitly has an 'any' type.</problem>
<problem file="src/pages/forms/FormManagementPage.tsx" line="274" column="19" code="2304">Cannot find name 'isSaving'.</problem>
<problem file="src/components/email/EmailTemplatePreviewDialog.tsx" line="10" column="13" code="2304">Cannot find name 'EvaluationCriterion'.</problem>
<problem file="src/components/email/EmailTemplatePreviewDialog.tsx" line="13" column="63" code="2339">Property 'template' does not exist on type 'EmailTemplatePreviewDialogProps'.</problem>
<problem file="src/pages/emails/EmailManagementPage.tsx" line="114" column="9" code="2322">Type '{ isOpen: boolean; onClose: () =&gt; void; template: EmailTemplate | null; }' is not assignable to type 'IntrinsicAttributes &amp; EmailTemplatePreviewDialogProps'.
  Property 'template' does not exist on type 'IntrinsicAttributes &amp; EmailTemplatePreviewDialogProps'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/send-email/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/send-email/index.ts" line="9" column="14" code="7006">Parameter 'req' implicitly has an 'any' type.</problem>
<problem file="supabase/functions/send-email/index.ts" line="28" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="29" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="43" column="27" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="46" column="31" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="47" column="30" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="48" column="33" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/send-email/index.ts" line="127" column="49" code="18046">'error' is of type 'unknown'.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="3" column="40" code="2307">Cannot find module 'https://esm.sh/@mailgun/webhook-validation@1.0.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="10" column="14" code="7006">Parameter 'req' implicitly has an 'any' type.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="16" column="41" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="51" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="52" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/inbound-webhook/index.ts" line="98" column="49" code="18046">'error' is of type 'unknown'.</problem>
</dyad-problem-report>You're right, my apologies for those lingering errors! It seems I missed a few things in the previous pass.

The main issues are:
1.  **Comments in Types:** TypeScript doesn't allow comments like `-- New date properties` directly within interface/type definitions. These need to be removed or converted to JSDoc comments.
2.  **`useState` Initialization:** When initializing `useState` with a variable that has the same name as the state variable itself (e.g., `useState(selectedField)`), it causes a "used before declaration" error. The initial value should be `null` or `undefined`.
3.  **Incorrect Prop Assignment:** In `FormBuilderPage.tsx`, `setNewFieldTooltip` was assigned `newFieldTooltip` instead of a function.
4.  **Missing `useState` Import:** In `FormManagementPage.tsx`, `useState` was imported incorrectly.
5.  **Incorrect Prop in `EmailTemplatePreviewDialog`**: The `template` prop was not correctly typed.
6.  **Edge Function Type Errors:** The Deno-related errors in the Supabase functions are still present. Adding `@ts-nocheck` at the very top of the file is the standard way to handle this for client-side compilation, as these files are compiled by Deno on the server, not by the client's TypeScript compiler.

I'll fix these now:

<dyad-write path="src/types/index.ts" description="Removing invalid comments from type definitions.">
export type Program = {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      deadline: Date;
      created_at: string;
      status: 'draft' | 'published';
      submission_button_text: string | null;
      allow_pdf_download: boolean;
      updated_at: string;
      form_id: string | null; // Link to Form
      workflow_template_id: string | null; // Link to Workflow Template
    };

    export type Form = {
      id: string;
      user_id: string;
      name: string;
      description: string | null;
      is_template: boolean;
      status: 'draft' | 'published'; // New: Status for the form itself
      created_at: string;
      updated_at: string;
      last_edited_by_user_id: string | null; // New
      last_edited_at: string | null; // New
      tags?: Tag[]; // Corrected: Associated tags are now directly Tag[]
    };

    export type ProgramStage = {
      id: string;
      program_id: string;
      name: string;
      order: number; // Changed from order_index to order
      created_at: string;
      step_type: 'form' | 'screening' | 'review' | 'resubmission' | 'decision' | 'email' | 'scheduling' | 'status' | 'recommendation';
      description: string | null; // This will now store JSON for complex types
      form_id: string | null;
      email_template_id: string | null;
      evaluation_template_id: string | null;
    };

    export type Application = {
      id: string;
      submitted_date: string;
      program_id: string;
      user_id: string;
      stage_id: string;
      full_name: string | null;
      email: string | null;
      stage_status: string | null;
      last_saved_at: string | null;
      programs: {
        title: string;
        allow_pdf_download: boolean; // Added for PDF download
        form_id: string | null; // Added form_id here
      } | null;
      program_stages: {
        name: string;
        description: string | null;
        step_type: ProgramStage['step_type'];
      } | null;
    };

    export type FormSection = {
      id: string;
      form_id: string; // Changed from program_id
      name: string;
      order: number;
      created_at: string;
      last_edited_by_user_id: string | null; // New
      last_edited_at: string | null; // New
      description: string | null; // New: Optional description for the section
      tooltip: string | null; // New: Optional tooltip for the section
      display_rules: DisplayRule[] | null; // New: Conditional logic rules for the section
      display_rules_logic_type: 'AND' | 'OR'; // New: Logic type for section rules
    };

    export type DisplayRule = {
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'is_before' | 'is_after' | 'contains_all_of' | 'contains_any_of' | 'contains_none_of';
      value: string | string[] | boolean | number | null;
      logic_type?: 'AND' | 'OR'; // For combining multiple rules
    };

    export type FormField = {
      id: string;
      form_id: string; // Changed from program_id
      section_id: string | null;
      label: string;
      field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'date' | 'phone' | 'number' | 'richtext' | 'rating';
      options: string[] | null;
      is_required: boolean;
      order: number;
      display_rules: DisplayRule[] | null;
      display_rules_logic_type: 'AND' | 'OR'; // New: Logic type for rules
      description: string | null;
      tooltip: string | null;
      placeholder: string | null; // New: Placeholder text for input fields
      last_edited_by_user_id: string | null; // New
      last_edited_at: string | null; // New
      is_anonymized: boolean; // New: For anonymization
      date_min: string | null; // ISO string for min date
      date_max: string | null; // ISO string for max date
      date_allow_past: boolean;
      date_allow_future: boolean;
      rating_min_value: number | null;
      rating_max_value: number | null;
      rating_min_label: string | null;
      rating_max_label: string | null;
    };

    export type Profile = {
      id: string;
      first_name: string | null;
      middle_name: string | null;
      last_name: string | null;
      email: string | null;
      avatar_url: string | null;
      updated_at: string;
      role: 'applicant' | 'recommender' | 'reviewer' | 'lead_reviewer' | 'creator' | 'admin' | 'super_admin';
    };

    export type EmailTemplate = {
      id: string;
      user_id: string | null;
      name: string;
      subject: string;
      body_html: string; // Changed from 'body' to 'body_html'
      is_default: boolean;
      status: 'draft' | 'published';
      created_at: string;
      updated_at: string;
      last_edited_by_user_id: string | null;
      last_edited_at: string | null;
      tags?: EmailTemplateTag[]; // New: Associated tags
    };

    export type WorkflowTemplate = {
      id: string;
      user_id: string;
      name: string;
      description: string | null;
      status: 'draft' | 'published';
      created_at: string;
      updated_at: string;
      last_edited_by_user_id: string | null;
      last_edited_at: string | null;
      tags?: WorkflowTemplateTag[]; // New: Associated tags
    };

    export type WorkflowStage = { // This type represents workflow_steps table
      id: string;
      workflow_template_id: string;
      name: string;
      description: string | null; // Can be JSON for complex types (e.g., { anonymize_identity: boolean, review_form_source_stage_order: number } for 'review')
      step_type: 'form' | 'screening' | 'review' | 'resubmission' | 'decision' | 'email' | 'scheduling' | 'status' | 'recommendation';
      order_index: number; // This is the column name in workflow_steps
      created_at: string;
      updated_at: string;
      last_edited_by_user_id: string | null;
      last_edited_at: string | null;
      form_id: string | null;
      email_template_id: string | null;
      evaluation_template_id: string | null;
    };

    export type RecommendationStageConfig = {
      form_id: string;
      min_recommenders: number;
      max_recommenders: number;
      reminder_email_template_id: string | null;
      reminder_intervals_days: number[]; // e.g., [3, 7] for 3 and 7 days before deadline
      anonymize_recommender_identity: boolean;
    };

    export type ApplicationReview = {
      id: string;
      application_id: string;
      reviewer_id: string;
      score: number | null;
      notes: string | null; // Internal notes
      created_at: string;
      updated_at: string;
      program_stage_id: string | null;
      evaluation_template_id: string | null;
      shared_feedback: string | null;
      is_feedback_shared: boolean;
      profiles?: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      } | null;
      review_scores?: ReviewScore[];
    };

    export type ReviewScore = {
      id: string;
      review_id: string;
      criterion_id: string;
      value: string | null;
      evaluation_criteria?: {
        label: string;
        criterion_type: EvaluationCriterion['criterion_type'];
      } | null;
    };

    export type ApplicationAssignment = {
      id: string;
      application_id: string;
      reviewer_id: string;
      created_at: string;
      profiles?: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        email: string | null;
      } | null;
      applications?: {
        id: string;
        full_name: string | null;
        submitted_date: string;
        program_id: string;
        programs: { title: string } | null;
        program_stages: { name: string } | null;
      } | null;
    };

    export type EvaluationTemplate = {
      id: string;
      user_id: string | null;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      status: 'draft' | 'published';
      last_edited_by_user_id: string | null;
      last_edited_at: string | null;
      tags?: EvaluationTemplateTag[]; // New: Associated tags
    };

    export type EvaluationSection = {
      id: string;
      template_id: string;
      name: string;
      description: string | null;
      order: number;
      is_public: boolean;
    };

    export type EvaluationCriterion = {
      id: string;
      template_id: string;
      section_id: string | null;
      label: string;
      description: string | null;
      criterion_type: 'numerical_score' | 'number_scale' | 'single_select' | 'short_text' | 'long_text' | 'repeater_buttons' | 'status';
      is_public: boolean;
      options: { label: string; value: string | number | null; icon?: string | null; }[] | null; // Added icon
      min_score: number | null;
      max_score: number | null;
      min_label: string | null;
      max_label: string | null;
      weight: number;
      order: number;
    };

    // New types for the tagging system
    export type Tag = {
      id: string;
      name: string;
      user_id: string | null;
      created_at: string;
      color: string; // e.g., 'blue', 'green' - references TAG_COLORS.name
      applicable_to: string[]; // e.g., ['programs', 'forms'] - references APPLICABLE_MODULES.value
    };

    export type FormTag = {
      form_id: string;
      tag_id: string;
      tags?: Tag; // For joining
    };

    export type ProgramTag = {
      program_id: string;
      tag_id: string;
      tags?: Tag; // For joining
    };

    export type WorkflowTemplateTag = {
      workflow_template_id: string;
      tag_id: string;
      tags?: Tag; // For joining
    };

    export type EmailTemplateTag = {
      email_template_id: string;
      tag_id: string;
      tags?: Tag; // For joining
    };