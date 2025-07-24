// utils/playerStats.ts

interface Match {
    category: string;
    result: string;
    partner: string;
  }
  
  export function calculateStats(matches: Match[]) {
    let totalMatches = matches.length;
    let totalWins = matches.filter(m => m.result === 'Win').length;
  
    let xdWins = 0;
    let mdWins = 0;
    const partnerWinCount: Record<string, number> = { md: {}, xd: {} };
  
    matches.forEach(m => {
      if (m.result === 'Win') {
        if (m.category === 'XD') {
          xdWins++;
          partnerWinCount.xd[m.partner] = (partnerWinCount.xd[m.partner] || 0) + 1;
        }
        if (m.category === 'MD') {
          mdWins++;
          partnerWinCount.md[m.partner] = (partnerWinCount.md[m.partner] || 0) + 1;
        }
      }
    });
  
    const bestMdPartner = Object.entries(partnerWinCount.md).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const bestXdPartner = Object.entries(partnerWinCount.xd).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
    return {
      totalMatches,
      totalWins,
      xdWins,
      mdWins,
      bestMdPartner,
      bestXdPartner,
    };
  }
  