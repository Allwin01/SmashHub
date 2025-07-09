// frontend/utils/saveSidebarTheme.ts
export const saveSidebarTheme = async (sidebarColor: string, token: string) => {
    try {
      const response = await fetch('http://localhost:5050/api/user/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sidebarColor })
      });
  
      if (!response.ok) {
        throw new Error(`Failed to save theme: ${response.status}`);
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Theme save error:', error);
      return { success: false, error };
    }
  };
  