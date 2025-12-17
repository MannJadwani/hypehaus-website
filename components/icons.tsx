import {
  Home,
  Ticket,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Settings,
  History,
  LogOut,
  Share2,
  MapPin,
  Clock,
  Send,
  Plus,
  Minus,
  Grid,
  Music,
  Laptop,
  Drama,
  Palette,
  Dumbbell,
  Camera,
  Edit,
  Check,
  Sparkle,
  type LucideProps,
} from 'lucide-react';

export type IconName =
  | 'home'
  | 'ticket'
  | 'heart'
  | 'user'
  | 'search'
  | 'menu'
  | 'x'
  | 'chevron-right'
  | 'chevron-left'
  | 'settings'
  | 'history'
  | 'logout'
  | 'share'
  | 'map-pin'
  | 'clock'
  | 'send'
  | 'plus'
  | 'minus'
  | 'grid'
  | 'music'
  | 'laptop'
  | 'theater'
  | 'palette'
  | 'sports'
  | 'camera'
  | 'edit'
  | 'check'
  | 'sparkle';

const iconMap = {
  home: Home,
  ticket: Ticket,
  heart: Heart,
  user: User,
  search: Search,
  menu: Menu,
  x: X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  settings: Settings,
  history: History,
  logout: LogOut,
  share: Share2,
  'map-pin': MapPin,
  clock: Clock,
  send: Send,
  plus: Plus,
  minus: Minus,
  grid: Grid,
  music: Music,
  laptop: Laptop,
  theater: Drama,
  palette: Palette,
  sports: Dumbbell,
  camera: Camera,
  edit: Edit,
  check: Check,
  sparkle: Sparkle,
} as const;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}
