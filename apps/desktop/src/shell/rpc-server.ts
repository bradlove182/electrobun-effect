import type { FromClientEncoded, FromServerEncoded } from "effect/unstable/rpc/RpcMessage"
import { Context, Effect, Layer, Queue, Stream } from "effect"
import { RpcSerialization, RpcServer } from "effect/unstable/rpc"

export interface RpcServerPort {
    on: ((event: "message", listener: (event: { data: string | Uint8Array }) => void) => void)
        & ((event: "close", listener: () => void) => void)
    off: (event: "message", listener: (event: { data: string | Uint8Array }) => void) => void
    postMessage: (message: string | Uint8Array) => void
    start: () => void
    close: () => void
}

export class RpcPortHandoff extends Context.Service<
    RpcPortHandoff,
    {
        readonly bind: (port: RpcServerPort) => void
    }
>()("src/shell/rpc-server/RpcPortHandoff") { }

interface ActivePort {
    readonly port: RpcServerPort
    readonly id: number
    readonly parser: RpcSerialization.Parser
    readonly handler: (event: { data: string | Uint8Array }) => void
}

export const layerRpcRpcServer: Layer.Layer<RpcServer.Protocol | RpcPortHandoff> = Layer.unwrap(
    Effect.gen(function* () {
        const portInbox = yield* Queue.make<RpcServerPort>()

        const protocol = Layer.effect(
            RpcServer.Protocol,
            RpcServer.Protocol.make(Effect.fnUntraced(function* (writeRequest) {
                const serialization = yield* RpcSerialization.RpcSerialization
                const disconnects = yield* Queue.make<number>()
                const inbound = yield* Queue.make<readonly [number, FromClientEncoded]>()
                let nextCliendId = 0
                let current: ActivePort | null = null

                const bindPort = (newPort: RpcServerPort): void => {
                    if (current) {
                        current.port.off("message", current.handler)
                        current.port.close()
                        Queue.offerUnsafe(disconnects, current.id)
                    }
                    const id = nextCliendId++
                    const parser = serialization.makeUnsafe()
                    const handler = (event: { data: string | Uint8Array }): void => {
                        try {
                            for (const message of parser.decode(event.data)) {
                                Queue.offerUnsafe(inbound, [id, message as FromClientEncoded])
                            }
                        }
                        catch {
                            // drop malformed frame — never throw in host callback
                        }
                    }
                    newPort.on("message", handler)
                    newPort.on("close", () => Queue.offerUnsafe(disconnects, id))
                    newPort.start()
                    current = { port: newPort, id, parser, handler }
                }

                yield* Effect.forkScoped(
                    Stream.fromQueue(inbound).pipe(
                        Stream.runForEach(([id, message]) =>
                            id === current?.id ? writeRequest(id, message) : Effect.void,
                        ),
                    ),
                )

                yield* Effect.forkScoped(
                    Stream.fromQueue(portInbox).pipe(
                        Stream.runForEach(port => Effect.sync(() => bindPort(port))),
                    ),
                )

                yield* Effect.addFinalizer(() =>
                    Effect.sync(() => {
                        if (current) {
                            current.port.off("message", current.handler)
                            current.port.close()
                        }
                    }))

                const send = (clientId: number, response: FromServerEncoded): Effect.Effect<void> =>
                    Effect.sync(() => {
                        if (current?.id === clientId) {
                            const encoded = current.parser.encode(response)
                            if (encoded !== undefined) {
                                current.port.postMessage(encoded)
                            }
                        }
                    })

                return {
                    disconnects,
                    send,
                    end: () => Effect.void,
                    clientIds: Effect.sync(() => new Set(current ? [current.id] : [])),
                    initialMessage: Effect.succeedNone,
                    supportsAck: true,
                    supportsTransferables: false,
                    supportsSpanPropagation: false,
                }
            })),
        )

        const handoff = Layer.succeed(RpcPortHandoff, {
            bind: (port) => {
                Queue.offerUnsafe(portInbox, port)
            },
        })

        return Layer.merge(protocol, handoff)
    }),
).pipe(Layer.provide(RpcSerialization.layerMsgPack))
