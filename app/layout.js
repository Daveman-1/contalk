import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationProvider } from '@/components/NotificationProvider';

export const metadata = {
  title: 'ConTalk — Real-Time Chat, Rooms & Feed',
  description: 'Chat anonymously or with an account. Random Male/Female matches, topic chat rooms, DMs, and a live social feed.',
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
