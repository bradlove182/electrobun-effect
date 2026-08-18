import { Schema } from "effect"
import { Rpc, RpcGroup } from "effect/unstable/rpc"

export class AppRpcs extends RpcGroup.make(
    Rpc.make("AppHealth", {
        success: Schema.Boolean,
    }),
) {}
