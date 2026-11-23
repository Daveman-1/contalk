'use client';

import {
  MessageSquare,
  Code,
  Gamepad2,
  Headphones,
  Shield,
  Flame,
  Rocket,
  Palette,
  BookOpen,
  Globe,
  Film,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const ROOM_ICON_KEYS = [
  'message',
  'code',
  'gamepad',
  'headphones',
  'shield',
  'flame',
  'rocket',
  'palette',
  'book',
  'globe',
  'film',
  'zap',
];

const ICON_MAP = {
  // Named keys
  message: MessageSquare,
  code: Code,
  gamepad: Gamepad2,
  headphones: Headphones,
  shield: Shield,
  flame: Flame,
  rocket: Rocket,
  palette: Palette,
  book: BookOpen,
  globe: Globe,
  film: Film,
  zap: Zap,

  // Legacy emoji mappings for backward-compatibility with existing database rooms
  '💬': MessageSquare,
  '💻': Code,
  '🎮': Gamepad2,
  '🎧': Headphones,
  '🕵️': Shield,
  '🕵': Shield,
  '🔥': Flame,
  '🚀': Rocket,
  '🎨': Palette,
  '📚': BookOpen,
  '🌍': Globe,
  '🎬': Film,
  '⚡': Zap,
};

export default function RoomIcon({ icon, size = 18, className = '' }) {
  const IconComponent = ICON_MAP[icon] || MessageSquare;
  return <IconComponent size={size} className={className} />;
}
