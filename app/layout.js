import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationProvider } from '@/components/NotificationProvider';

export const metadata = {
  title: {
    default: 'ConTalk — Real-Time Chat, Rooms & Feed',
    template: '%s | ConTalk',
  },
  description:
    'Chat anonymously or with an account. Random Male/Female matches, topic chat rooms, DMs, and a live social feed.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
