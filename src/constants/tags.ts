export const TAG_COLORS = [
      { name: 'default', label: 'Default Gray', hex: '#9CA3AF' }, // Default gray for tags
      { name: 'blue', label: 'Blue', hex: '#3B82F6' },
      { name: 'green', label: 'Green', hex: '#22C55E' },
      { name: 'red', label: '#EF4444', hex: '#EF4444' },
      { name: 'purple', label: 'Purple', hex: '#A855F7' },
      { name: 'orange', label: 'Orange', hex: '#F97316' },
      { name: 'yellow', label: 'Yellow', hex: '#F59E0B' },
      { name: 'teal', label: 'Teal', hex: '#14B8A6' },
      { name: 'pink', label: 'Pink', hex: '#EC4899' },
      { name: 'indigo', label: 'Indigo', hex: '#6366F1' },
      { name: 'cyan', label: 'Cyan', hex: '#06B6D4' },
      { name: 'lime', label: 'Lime', hex: '#84CC16' },
      { name: 'rose', label: 'Rose', hex: '#F43F5E' },
    ];

    export const APPLICABLE_MODULES = [
      { value: 'programs', label: 'Programs' },
      { value: 'forms', label: 'Forms' },
      { value: 'workflows', label: 'Workflows' },
      { value: 'email_templates', label: 'Email Templates' },
      { value: 'evaluation_templates', label: 'Evaluation Rubrics' },
      { value: 'users', label: 'Users' },
    ];

    export const getRandomTagColorName = () => {
      const nonDefaultColors = TAG_COLORS.filter(color => color.name !== 'default');
      const randomIndex = Math.floor(Math.random() * nonDefaultColors.length);
      return nonDefaultColors[randomIndex].name;
    };