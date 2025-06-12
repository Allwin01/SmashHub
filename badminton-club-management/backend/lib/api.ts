export const login = async (credentials: { username: string; password: string }) => {
  const res = await fetch('http://localhost:5050/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return res.json();
};

export const signup = async (userData: {
  username: string;
  password: string;
  role: string;
}) => {
  const res = await fetch('http://localhost:5050/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return res.json();
};