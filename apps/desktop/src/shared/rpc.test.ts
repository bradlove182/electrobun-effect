import { describe, expect, it } from "bun:test"
import { Effect, Schema } from "effect"
import { RpcSerialization } from "effect/unstable/rpc"
import { AppRpcs } from "./rpc"

class AppHealthCheck extends Schema.Class<AppHealthCheck>("AppHealthCheck")({}) {}

describe("AppRpc contract", () => {
    it("exposes the expected RPC tags (inventory / drift guard", () => {
        const tags = new Set(AppRpcs.requests.keys())
        const expected = ["AppHealthCheck"] as const
        for (const tag of expected) {
            expect(tags.has(tag)).toBe(true)
        }
        expect(tags.size).toBe(expected.length)
    })

    it("MsgPack round-trips a native Uint8Array byte-equal (binary path)", async () =>
        await Effect.runPromise(
            Effect.gen(function* () {
                const serialization = yield* RpcSerialization.RpcSerialization
                const parser = serialization.makeUnsafe()
                const bytes = new Uint8Array([0, 1, 2, 254, 255])

                const encoded = parser.encode({ payload: bytes })
                expect(encoded).toBeInstanceOf(Uint8Array)

                const decoded = parser.decode(encoded as Uint8Array)
                expect(decoded).toHaveLength(1)
                const out = decoded[0] as { payload: Uint8Array }
                expect(out.payload).toBeInstanceOf(Uint8Array)
                expect(Array.from(out.payload)).toEqual(Array.from(bytes))
            }).pipe(Effect.provide(RpcSerialization.layerMsgPack)),
        ))

    it("round trips a AppHealthCheck through encode => MsgPack => decode", async () =>
        await Effect.runPromise(
            Effect.gen(function* () {
                const serialization = yield* RpcSerialization.RpcSerialization
                const parser = serialization.makeUnsafe()
                const request = { tag: "AppHealthCheck", payload: {} }

                const wire = yield* Schema.encode(AppHealthCheck)({})
                const packed = parser.encode(wire)
                const [unpacked] = parser.decode(packed as Uint8Array)
                const decoded = yield* Schema.decodeUnknownSync(AppHealthCheck)(unpacked)

                expect(decoded).toStrictEqual(request)
            }),
        ))
})
