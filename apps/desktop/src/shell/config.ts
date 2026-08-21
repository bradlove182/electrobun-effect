import { Context, Effect, Layer } from "effect"

export class Config extends Context.Service<
    Config,
    {
        getTitle: () => Effect.Effect<string>
    }
>()("src/shell/config/Config") {
    static layer = Layer.effect(
        Config,
        Effect.gen(function* () {
            const getTitle = Effect.fn("Config.getTitle")(function* () {
                return "Solid App"
            })

            return {
                getTitle,
            }
        }),
    )
}
