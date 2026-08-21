import { Context, Effect } from "effect"
import { AppRpcs } from "../shared/rpc"

export class AppService extends Context.Service<
    AppService,
    {
        healthCheck: () => Effect.Effect<{ ok: true }>
    }
>()("src/shell/app/AppService") {}

export const AppHandlersLive = AppRpcs.toLayer(
    Effect.gen(function* () {
        return AppRpcs.of({
            HealthCheck: () => Effect.sync(() => ({ ok: true })),
        })
    }),
)
