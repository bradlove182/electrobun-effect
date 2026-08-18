import type { ElectrobunConfig } from "electrobun"

export default {
    app: {
        name: "solid-app",
        identifier: "solidapp.electrobun.dev",
        version: "0.0.1",
    },
    build: {
        bun: {
            entrypoint: "src/shell/index.ts",
        },
        copy: {
            "dist/index.html": "views/ui/index.html",
            "dist/assets": "views/ui/assets",
        },
        watchIgnore: ["dist/**"],
        mac: {
            bundleCEF: false,
        },
        linux: {
            bundleCEF: false,
        },
        win: {
            bundleCEF: false,
        },
    },
} satisfies ElectrobunConfig
