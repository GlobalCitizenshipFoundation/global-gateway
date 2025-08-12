import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateFormId, newFormName, newFormDescription, userId, isTemplate } = await req.json();

    if (!userId || !newFormName) {
      return new Response(JSON.stringify({ error: 'Missing userId or newFormName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Start a transaction for atomicity
    const { data: newFormData, error: newFormError } = await supabaseAdmin.from("forms").insert({
      user_id: userId,
      name: newFormName,
      is_template: isTemplate,
      status: 'draft', // New forms are always draft initially
      description: newFormDescription,
    }).select('id').single();

    if (newFormError || !newFormData) {
      throw new Error(`Failed to create new form: ${newFormError?.message}`);
    }

    const newFormId = newFormData.id;

    if (templateFormId) {
      // Fetch sections and fields from the template
      const { data: templateSections, error: sectionsError } = await supabaseAdmin
        .from('form_sections')
        .select('*')
        .eq('form_id', templateFormId)
        .order('order', { ascending: true });

      const { data: templateFields, error: fieldsError } = await supabaseAdmin
        .from('form_fields')
        .select('*')
        .eq('form_id', templateFormId)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        // Rollback new form creation if template content cannot be loaded
        await supabaseAdmin.from('forms').delete().eq('id', newFormId);
        throw new Error(`Failed to load template content: ${sectionsError?.message || fieldsError?.message}`);
      }

      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = templateSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newFormId,
          name: section.name,
          order: section.order,
        };
      });

      const newFieldsToInsert = templateFields.map(field => ({
        id: crypto.randomUUID(),
        form_id: newFormId,
        section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
        label: field.label,
        field_type: field.field_type,
        options: field.options,
        is_required: field.is_required,
        order: field.order,
        display_rules: field.display_rules,
        help_text: field.help_text,
        description: field.description,
        tooltip: field.tooltip,
      }));

      // Insert new sections and fields
      const { error: insertSectionsError } = await supabaseAdmin.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabaseAdmin.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        // Rollback new form creation if content insertion fails
        await supabaseAdmin.from('forms').delete().eq('id', newFormId);
        throw new Error(`Failed to copy template content: ${insertSectionsError?.message || insertFieldsError?.message}`);
      }
    }

    return new Response(JSON.stringify({ newFormId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});