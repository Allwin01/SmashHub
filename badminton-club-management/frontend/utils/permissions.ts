// utils/permissions.ts
export const initializePermissions = (user) => ({
    ...user,
    permissions: user.permissions ?? {
      pegBoard: false,
      playerProfile: false,
      attendance: false,
      finance: false,
      captainSquad: false
    }
  });
  

  export function filterParentUsers(players) {
    return players.filter(
      (p) => p.age < 18 || ['Junior club member', 'Coaching only'].includes(p.playerType)
    );
  }
  
  export function filterMemberUsers(players) {
    return players.filter(
      (p) => p.age >= 18 || ['Club Member', 'Adult club member'].includes(p.playerType)
    );
  }
  
  export function filterAdminUsers(players) {
    return players.filter(
      (p) => p.age >= 18 || ['Club Member', 'Adult club member'].includes(p.playerType)
    );
  }
  