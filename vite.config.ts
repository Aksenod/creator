import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import backlogPlugin from './vite-plugin-backlog'

export default defineConfig({
  plugins: [react(), backlogPlugin()],
})
