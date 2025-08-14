import React from 'react';
import * as icons from 'lucide-react';

// A curated list of icons available for selection.
// To add more icons, simply add their names (in PascalCase) here.
export const availableIcons = {
  Activity: icons.Activity,
  Award: icons.Award,
  BadgeCheck: icons.BadgeCheck,
  Book: icons.Book,
  Briefcase: icons.Briefcase,
  Building: icons.Building,
  Calendar: icons.Calendar,
  Check: icons.Check,
  CheckCircle: icons.CheckCircle,
  ClipboardCheck: icons.ClipboardCheck,
  Clock: icons.Clock,
  Coins: icons.Coins,
  Compass: icons.Compass,
  Contact: icons.Contact,
  Edit: icons.Edit,
  FileText: icons.FileText,
  Flag: icons.Flag,
  Gavel: icons.Gavel,
  GraduationCap: icons.GraduationCap,
  Handshake: icons.Handshake,
  Heart: icons.Heart,
  HelpCircle: icons.HelpCircle,
  Home: icons.Home, // Added Home icon
  Hourglass: icons.Hourglass,
  House: icons.House, // Existing House icon
  Inbox: icons.Inbox,
  Info: icons.Info,
  Key: icons.Key,
  Lightbulb: icons.Lightbulb,
  Link: icons.Link,
  Mail: icons.Mail,
  MapPin: icons.MapPin,
  Medal: icons.Medal,
  MessageSquare: icons.MessageSquare,
  Paperclip: icons.Paperclip,
  Pencil: icons.Pencil,
  Pin: icons.Pin,
  Plus: icons.Plus,
  Send: icons.Send,
  Settings: icons.Settings,
  Share2: icons.Share2,
  Shield: icons.Shield,
  Star: icons.Star,
  Tag: icons.Tag,
  Target: icons.Target,
  ThumbsUp: icons.ThumbsUp,
  ThumbsDown: icons.ThumbsDown,
  Timer: icons.Timer,
  Trash2: icons.Trash2,
  TrendingUp: icons.TrendingUp,
  Trophy: icons.Trophy,
  User: icons.User,
  UserCheck: icons.UserCheck,
  UserPlus: icons.UserPlus,
  Users: icons.Users,
  X: icons.X,
  XCircle: icons.XCircle,
  Wrench: icons.Wrench,
  ArrowRight: icons.ArrowRight,
};

export type IconName = keyof typeof availableIcons;

interface DynamicIconProps extends Omit<icons.LucideProps, 'name'> {
  name: IconName | string | null | undefined;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  if (!name || !(name in availableIcons)) {
    return <icons.HelpCircle {...props} />; // Fallback icon
  }

  const LucideIcon = availableIcons[name as IconName];
  return <LucideIcon {...props} />;
};

export default DynamicIcon;