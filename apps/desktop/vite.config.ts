import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { DEV_SERVER_PORT } from "./src/shared/dev"

export default defineConfig({
    plugins: [solid()],
    root: "src/ui",
    build: {
        outDir: "../../dist",
        emptyOutDir: true,
    },
    server: {
        port: DEV_SERVER_PORT,
        strictPort: true,
    },
})
