import { Context, Effect, Layer } from "effect"
import {
    DEV_SERVER_PORT,
    DEV_SERVER_URL,
} from "../shared/dev"

export class Config extends Context.Service<
    Config,
    {
        getTitle: () => Effect.Effect<string>
        getPort: () => Effect.Effect<typeof DEV_SERVER_PORT>
        getUrl: () => Effect.Effect<typeof DEV_SERVER_URL>
    }
>()("Config") {
    static layer = Layer.effect(
        Config,
        Effect.gen(function* () {
            const getTitle = Effect.fn("Config.getTitle")(function* () {
                return "Solid App"
            })
            const getPort = Effect.fn("Config.getPort")(function* () {
                return DEV_SERVER_PORT
            })
            const getUrl = Effect.fn("Config.getUrl")(function* () {
                return DEV_SERVER_URL
            })

            return {
                getTitle,
                getPort,
                getUrl,
            }
        }),
    )
}
