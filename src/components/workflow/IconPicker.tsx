import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import DynamicIcon, { availableIcons, IconName } from '@/components/common/DynamicIcon';
import { ScrollArea } from '../ui/scroll-area';

interface IconPickerProps {
  value?: string | null;
  onChange: (icon: IconName) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const iconList = Object.keys(availableIcons) as IconName[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value ? (
            <>
              <DynamicIcon name={value} className="h-4 w-4 mr-2" />
              {value}
            </>
          ) : (
            'Select an icon'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-auto">
        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-1">
            {iconList.map((iconName) => (
              <Button
                key={iconName}
                variant="ghost"
                size="icon"
                onClick={() => onChange(iconName)}
                className={value === iconName ? 'bg-accent' : ''}
              >
                <DynamicIcon name={iconName} className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};