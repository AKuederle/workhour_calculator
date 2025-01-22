import path from "path"
import react from "@vitejs/plugin-react-swc"
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/workhour_calculator/" : "/",
  plugins: [    
    TanStackRouterVite(),
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
