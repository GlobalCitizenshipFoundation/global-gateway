import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  options: string[];
  value: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ options, value, onValueChange, disabled, className, ...props }, ref) => {
    const handleCheckedChange = (option: string, checked: boolean) => {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = checked
        ? [...currentValues, option]
        : currentValues.filter(v => v !== option);
      onValueChange(newValues);
    };

    return (
      <div ref={ref} className={className} {...props}>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`checkbox-group-${option}-${index}`}
                checked={value.includes(option)}
                onCheckedChange={(checked) => handleCheckedChange(option, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={`checkbox-group-${option}-${index}`}>{option}</Label>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

export default CheckboxGroup;