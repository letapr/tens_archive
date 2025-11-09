'use client';

import './globals.css';
import Header from '../components/Header';
import { GameProvider } from '../context/GameContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          <div>
            <Header />
            <main>{children}</main>
            <footer>
              <p>{new Date().getFullYear()} Daily Tens Clone. Made with love for Fabiana </p>
            </footer>
          </div>
        </GameProvider>
      </body>
    </html>
  );
}