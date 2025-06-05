/*

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}  

// app/layout.tsx


import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    const body = document.body;
    if (body) {
      body.removeAttribute('data-new-gr-c-s-check-loaded');
      body.removeAttribute('data-gr-ext-installed');
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

*/

// app/layout.tsx (Server Component)
import RemoveExtensionAttributes from './RemoveExtensionAttributes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RemoveExtensionAttributes /> {/* 👈 Client-side logic */}
        {children}
      </body>
    </html>
  );
}