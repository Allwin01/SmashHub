// app/RemoveExtensionAttributes.tsx
'use client';

import { useEffect } from 'react';

export default function RemoveExtensionAttributes() {
  useEffect(() => {
    document.body.removeAttribute('data-new-gr-c-s-check-loaded');
    document.body.removeAttribute('data-gr-ext-installed');
  }, []);

  return null; // This component doesn't render anything
}