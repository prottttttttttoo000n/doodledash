import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DoodleDash — Draw, Guess, Party!',
  description:
    'A real-time multiplayer drawing and guessing party game. Sketch, guess, and have fun with friends!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen bg-bg-primary">{children}</div>
      </body>
    </html>
  );
}
