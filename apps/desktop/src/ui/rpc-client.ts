import type { FromClientEncoded, FromServerEncoded } from "effect/unstable/rpc/RpcMessage"
import { Effect, Layer, Queue, Stream } from "effect"
import { RpcClient, RpcSerialization } from "effect/unstable/rpc"

export interface RpcClientPort {
    onmessage: ((event: { data: string | Uint8Array }) => void) | null
    postMessage: (message: string | Uint8Array) => void
    start: () => void
    close: () => void
}

export function makeRpcClientProtocol(port: RpcClientPort) {
    return RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse) {
            const serialization = yield* RpcSerialization.RpcSerialization
            const parser = serialization.makeUnsafe()
            const inbound = yield* Queue.make<FromServerEncoded>()

            port.onmessage = (event) => {
                try {
                    for (const decoded of parser.decode(event.data)) {
                        Queue.offerUnsafe(inbound, decoded as FromServerEncoded)
                    }
                }
                catch {
                    // drop malformed frame
                }
            }

            yield* Effect.addFinalizer(() => {
                return Effect.sync(() => {
                    port.onmessage = null
                    port.close()
                })
            })
            port.start()

            yield* Effect.forkScoped(
                Stream.fromQueue(inbound).pipe(Stream.runForEach((message) => {
                    return writeResponse(0, message)
                })),
            )

            const send = (_clientId: number, request: FromClientEncoded) =>
                Effect.sync(() => {
                    const encoded = parser.encode(request)
                    if (encoded !== undefined) {
                        port.postMessage(encoded)
                    }
                })

            return {
                send,
                supportsAck: true,
                supportsTransferables: false,
            }
        }),
    )
}

export function layerRpcClient(port: RpcClientPort): Layer.Layer<RpcClient.Protocol> {
    return Layer.effect(RpcClient.Protocol, makeRpcClientProtocol(port)).pipe(
        Layer.provide(RpcSerialization.layerMsgPack),
    )
}
