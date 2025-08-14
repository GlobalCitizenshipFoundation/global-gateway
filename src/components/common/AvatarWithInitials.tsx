import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarWithInitialsProps {
  name: string | null | undefined;
  src?: string | null | undefined;
  className?: string;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AvatarWithInitials = React.forwardRef<HTMLSpanElement, AvatarWithInitialsProps>(({ name, src, className }, ref) => {
  const initials = getInitials(name);
  const backgroundColor = name ? stringToColor(name) : '#ccc';

  return (
    <Avatar className={className} ref={ref}>
      <AvatarImage src={src || undefined} alt={name || 'User Avatar'} />
      <AvatarFallback style={{ backgroundColor: src ? undefined : backgroundColor, color: 'white' }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

AvatarWithInitials.displayName = 'AvatarWithInitials'; // Add display name for better debugging

export default AvatarWithInitials;