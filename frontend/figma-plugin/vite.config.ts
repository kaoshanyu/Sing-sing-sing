import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteSingleFile } from "vite-plugin-singlefile"
import { resolve } from "path"

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
})
