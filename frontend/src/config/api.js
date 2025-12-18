const API_BASE_URL = process.env.VUE_APP_API_URL || 
  (process.env.NODE_ENV === 'production'
    ? 'https://webreal-demo.onrender.com'  // 部署后填入
    : 'http://localhost:3000'
  );

export const config = {
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
};

export default config;