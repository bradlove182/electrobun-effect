import { Effect, Layer } from "effect"
import { RpcServer } from "effect/unstable/rpc"
import { AppRpcs } from "../shared/rpc"
import { AppHandlersLive } from "./app"
import { Config } from "./config"
import { layerRpcRpcServer } from "./rpc-server"
import { Window } from "./window"

const Live = RpcServer.layer(AppRpcs, { disableFatalDefects: true }).pipe(
    Layer.provide(AppHandlersLive),
    Layer.provideMerge(layerRpcRpcServer),
)

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
