import React from 'react'; // Explicit React import
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string; // Added placeholder prop
}

const RichTextEditor = ({ value, onChange, readOnly = false, disabled = false, className, placeholder }: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      readOnly={readOnly}
      className={className}
      placeholder={placeholder} // Pass the placeholder prop to ReactQuill
      bounds={'.app'} // This helps contain the toolbar within the app
    />
  );
};

export default RichTextEditor;