import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  define: {
    'import.meta.env.VITE_GOOGLE_API_KEY': `"${process.env.VITE_GOOGLE_API_KEY}"`,
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': `"${process.env.VITE_GOOGLE_CLIENT_ID}"`,
  },
});