import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <header>
            <h1>Daily Tens Clone</h1>
          </header>
          <main>{children}</main>
          <footer>
            <p>&copy; {new Date().getFullYear()} Daily Tens Clone. Made for Fabiana </p>
          </footer>
        </div>
      </body>
    </html>
  );
}