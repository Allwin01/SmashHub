// lib/api.ts
export const signup = async (userData: Record<string, any>) => {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  
    const result = await res.json();
  
    if (!res.ok) throw new Error(result.message || 'Signup failed');
    return result;
  };
  