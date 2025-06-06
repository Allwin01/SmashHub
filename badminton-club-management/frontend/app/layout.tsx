// app/layout.tsx
import '../styles/globals.css';
import { ReactNode } from "react";
import TransitionOverlay from "@/components/TransitionOverlay"; // we create this next

export const metadata = {
  title: "SmashHub",
  description: "Badminton club management platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TransitionOverlay />
        {children}
      </body>
    </html>
  );
}

/* 
// app/layout.tsx (Server Component)
import RemoveExtensionAttributes from './RemoveExtensionAttributes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RemoveExtensionAttributes /> {/* 👈 Client-side logic */
 /*     {children}
      </body>
    </html>
  );
}


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