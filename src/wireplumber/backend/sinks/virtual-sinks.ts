import * as Wp from "@gtkx/gi/wp";
import { Effect, Scope } from "effect";

import {
  WirePlumberPlaybackNodeTimeoutError,
  WirePlumberVirtualSinkLoadError,
} from "../../errors.ts";
import { wirePlumberSinkNames, type WirePlumberSink } from "../../types.ts";
import { sinkDefinitions } from "./definitions.ts";
import { makePlaybackNodeManager, waitForPlaybackNodes } from "./playback-nodes.ts";
import type { PlaybackNodes } from "./playback-nodes.ts";

/** Loads a Game or Voice sink as a PipeWire loopback module. */
const loadVirtualSink = (
  core: Wp.Core,
  sink: WirePlumberSink,
): Effect.Effect<Wp.ImplModule, WirePlumberVirtualSinkLoadError> =>
  Effect.gen(function* () {
    const definition = sinkDefinitions[sink];
    const name = wirePlumberSinkNames[sink];
    const module = Wp.ImplModule.load(
      core,
      "libpipewire-module-loopback",
      JSON.stringify({
        "node.description": name,
        "capture.props": {
          "node.name": definition.nodeName,
          "node.description": name,
          "media.class": "Audio/Sink",
          "audio.position": ["FL", "FR"],
        },
        "playback.props": {
          "node.name": `${definition.nodeName}.output`,
          "audio.position": ["FL", "FR"],
          "node.passive": true,
          "stream.dont-remix": true,
        },
      }),
      null,
    );

    if (module) {
      return module;
    }

    return yield* new WirePlumberVirtualSinkLoadError({
      sink,
      cause: `Wp.ImplModule.load() returned null for ${definition.nodeName}`,
    });
  });

/**
 * Creates Mixamp's virtual sinks.
 *
 * With no explicit playback target, WirePlumber routes each sink to the current
 * default audio output and follows changes to that default.
 */
export const makeVirtualSinks = (
  core: Wp.Core,
): Effect.Effect<
  PlaybackNodes,
  WirePlumberVirtualSinkLoadError | WirePlumberPlaybackNodeTimeoutError,
  Scope.Scope
> =>
  Effect.gen(function* () {
    const objectManager = yield* makePlaybackNodeManager(core);

    yield* Effect.acquireRelease(loadVirtualSink(core, "game"), (module) =>
      Effect.sync(() => {
        module.unload();
      }),
    );
    yield* Effect.acquireRelease(loadVirtualSink(core, "voice"), (module) =>
      Effect.sync(() => {
        module.unload();
      }),
    );

    return yield* waitForPlaybackNodes(objectManager);
  });
