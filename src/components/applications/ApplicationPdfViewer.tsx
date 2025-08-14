import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { FormField, FormSection, ProgramStage } from '@/types'; // Import ProgramStage
import { formatResponseValue, shouldFieldBeDisplayed } from '@/utils/forms/formFieldUtils';
import { showError, showSuccess } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import DOMPurify from 'dompurify';

interface ApplicationPdfViewerProps {
  applicationId: string;
  programTitle: string;
  applicantFullName: string;
  applicantEmail: string;
  submittedDate: string;
  currentStageName: string;
  allResponses: { value: string | null; form_fields: FormField | null; }[];
  allFormFields: FormField[];
  formSections: FormSection[];
}

const ApplicationPdfViewer = ({
  applicationId,
  programTitle,
  applicantFullName,
  applicantEmail,
  submittedDate,
  currentStageName,
  allResponses,
  allFormFields,
  formSections,
}: ApplicationPdfViewerProps) => {
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const getFieldsForSection = (sectionId: string | null): FormField[] => {
    return allFormFields.filter((field: FormField) => field.section_id === sectionId).sort((a: FormField, b: FormField) => a.order - b.order);
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!pdfContentRef.current) {
      showError("PDF content not found.");
      return;
    }

    setIsGenerating(true);
    showSuccess("Generating PDF... This may take a moment.");

    try {
      const input = pdfContentRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Application_${applicantFullName.replace(/\s/g, '_')}_${applicationId.substring(0, 8)}.pdf`);
      showSuccess("PDF generated successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      showError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentResponsesMap: Record<string, any> = {};
  allResponses.forEach((res: { value: string | null; form_fields: FormField | null; }) => {
    if (res.form_fields?.id && res.value !== null) {
      if (res.form_fields.field_type === 'checkbox') {
        try {
          currentResponsesMap[res.form_fields.id] = JSON.parse(res.value);
        } catch {
          currentResponsesMap[res.form_fields.id] = [];
        }
      } else if (res.form_fields.field_type === 'number') {
        currentResponsesMap[res.form_fields.id] = parseFloat(res.value);
      } else {
        currentResponsesMap[res.form_fields.id] = res.value;
      }
    }
  });

  const displayedResponses = allResponses
    .filter((res: { value: string | null; form_fields: FormField | null; }) => res.form_fields && shouldFieldBeDisplayed(res.form_fields, currentResponsesMap, allFormFields))
    .sort((a: { value: string | null; form_fields: FormField | null; }, b: { value: string | null; form_fields: FormField | null; }) => (a.form_fields?.order || 0) - (b.form_fields?.order || 0));

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <>
      <Button onClick={handleDownloadPdf} disabled={isGenerating} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        {isGenerating ? 'Generating PDF...' : 'Download PDF'}
      </Button>

      <div ref={pdfContentRef} className="p-8 bg-white text-gray-900 hidden-for-pdf-capture" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', marginBottom: '10px' }}>{programTitle} Application</h1>
        <p style={{ fontSize: '12pt', color: '#555', marginBottom: '20px' }}>Submitted by {applicantFullName} ({applicantEmail}) on {new Date(submittedDate).toLocaleDateString()}</p>
        <p style={{ fontSize: '12pt', color: '#555', marginBottom: '20px' }}>Current Stage: {currentStageName}</p>

        <Separator style={{ margin: '20px 0', borderTop: '1px solid #eee' }} />

        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '15px' }}>Application Responses</h2>

        {formSections.map((section: FormSection) => {
          const fieldsInSection = getFieldsForSection(section.id).filter((field: FormField) =>
            displayedResponses.some((res: { value: string | null; form_fields: FormField | null; }) => res.form_fields?.id === field.id)
          );
          if (fieldsInSection.length === 0) return null;

          const sanitizedSectionDescription = section.description ? DOMPurify.sanitize(section.description, { USE_PROFILES: { html: true } }) : null;

          return (
            <div key={section.id} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>{section.name}</h3>
              {sanitizedSectionDescription && (
                <div style={{ fontSize: '10pt', color: '#666', marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: sanitizedSectionDescription }} />
              )}
              <dl style={{ margin: 0, padding: 0 }}>
                {fieldsInSection.map((field: FormField) => {
                  const response = displayedResponses.find((res: { value: string | null; form_fields: FormField | null; }) => res.form_fields?.id === field.id);
                  if (!response) return null;
                  const sanitizedFieldDescription = field.description ? DOMPurify.sanitize(field.description, { USE_PROFILES: { html: true } }) : null;
                  return (
                    <div key={field.id} style={{ marginBottom: '15px' }}>
                      <dt style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '3px' }}>{field.label}</dt>
                      {sanitizedFieldDescription && <dd style={{ fontSize: '9pt', color: '#666', marginBottom: '3px' }}><div dangerouslySetInnerHTML={{ __html: sanitizedFieldDescription }} /></dd>}
                      <dd style={{ fontSize: '10pt', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {formatResponseValue(response.value, field.field_type)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}

        {uncategorizedFields.filter((field: FormField) => displayedResponses.some((res: { value: string | null; form_fields: FormField | null; }) => res.form_fields?.id === field.id)).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Additional Information</h3>
            <dl style={{ margin: 0, padding: 0 }}>
              {uncategorizedFields.map((field: FormField) => {
                const response = displayedResponses.find((res: { value: string | null; form_fields: FormField | null; }) => res.form_fields?.id === field.id);
                if (!response) return null;
                const sanitizedFieldDescription = field.description ? DOMPurify.sanitize(field.description, { USE_PROFILES: { html: true } }) : null;
                return (
                  <div key={field.id} style={{ marginBottom: '15px' }}>
                    <dt style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '3px' }}>{field.label}</dt>
                    {sanitizedFieldDescription && <dd style={{ fontSize: '9pt', color: '#666', marginBottom: '3px' }}><div dangerouslySetInnerHTML={{ __html: sanitizedFieldDescription }} /></dd>}
                    <dd style={{ fontSize: '10pt', color: '#333', whiteSpace: 'pre-wrap' }}>
                      {formatResponseValue(response.value, field.field_type)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}

        {displayedResponses.length === 0 && (
          <p style={{ fontSize: '10pt', color: '#666', textAlign: 'center', padding: '20px' }}>No responses to display for this application.</p>
        )}
      </div>
    </>
  );
};

export default ApplicationPdfViewer;