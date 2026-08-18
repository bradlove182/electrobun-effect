import { Effect, Layer } from "effect"
import { Config } from "./config"
import { Window } from "./window"

const program = Effect.gen(function* () {
    const windowService = yield* Window

    return yield* windowService.start()
})

const programLayer = Window.layer.pipe(
    Layer.provide(Config.layer),
)

Effect.runFork(program.pipe(
    Effect.provide(programLayer),
    Effect.catchTag("WindowError", error => Effect.logError(`Window error: ${error.message}`)),
))
