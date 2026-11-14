import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api calls are proxied to the FastAPI server, so phones on the same Wi-Fi
// can open http://<laptop-ip>:5173 and everything just works.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
