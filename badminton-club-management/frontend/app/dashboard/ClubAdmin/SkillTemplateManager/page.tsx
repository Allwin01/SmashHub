'use client';
import { useEffect, useState } from 'react';
import SkillTemplateManager from '@/components/SkillTemplateManager';

export default function SkillTemplatePage() {
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    setClubId(decoded.clubId); // ✅ assuming your JWT includes clubId
  }, []);

  if (!clubId) return <p>⏳ Loading Club Info...</p>;

  return (
    <div className="p-4">
      <SkillTemplateManager clubId={clubId} />
    </div>
  );
}
