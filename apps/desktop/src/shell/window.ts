import { Context, Effect, Layer, Schema } from "effect"
import { BrowserWindow, Updater } from "electrobun/bun"
import { DEV_SERVER_URL } from "../shared/dev"
import { Config } from "./config"

// eslint-disable-next-line unicorn/throw-new-error
export class WindowError extends Schema.TaggedError<WindowError>()(
    "WindowError",
    { message: Schema.String },
) {}

export class Window extends Context.Service<
    Window,
    {
        start: () => Effect.Effect<BrowserWindow, WindowError>
    }
>()("src/shell/window/Window") {
    static layer = Layer.effect(
        Window,
        Effect.gen(function* () {
            const config = yield* Config

            const start = Effect.fn("Window.start")(function* () {
                const title = yield* config.getTitle()

                const channel = yield* Effect.tryPromise({
                    try: async () => await Updater.localInfo.channel(),
                    catch: () => new WindowError({ message: "Failed to get Updater.localInfo.channel." }),
                })

                const url = yield* Effect.tryPromise({
                    try: async () => {
                        if (channel !== "dev") {
                            return "views://mainview/index.html"
                        }

                        await fetch(DEV_SERVER_URL, { method: "HEAD" })

                        return DEV_SERVER_URL
                    },
                    catch: () => new WindowError({ message: "Vite dev server not running. Run 'bun run dev:hmr' for HMR support." }),
                })

                yield* Effect.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)

                return new BrowserWindow({
                    title,
                    url,
                    frame: {
                        width: 900,
                        height: 700,
                        x: 200,
                        y: 200,
                    },
                })
            })

            return { start }
        }),
    )
}
