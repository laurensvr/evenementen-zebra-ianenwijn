import './globals.css';

export const metadata = {
  title: 'Wine Label Printer',
  description: 'Print wine labels for tasting events',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="/BrowserPrint-3.1.250.min.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
} 