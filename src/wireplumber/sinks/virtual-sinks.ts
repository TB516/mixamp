import * as Wp from "@gtkx/gi/wp";
import { Effect, Scope } from "effect";

import { WirePlumberVirtualSinkError } from "../errors.js";
import { sinkDefinitions } from "./definitions.js";
import { makePlaybackNodeManager, waitForPlaybackNodes } from "./playback-nodes.js";
import type { PlaybackNodes } from "./playback-nodes.js";

/** Loads a Game or Voice sink as a PipeWire loopback module. */
const loadVirtualSink = (
  core: Wp.Core,
  definition: (typeof sinkDefinitions)[keyof typeof sinkDefinitions],
): Effect.Effect<Wp.ImplModule, WirePlumberVirtualSinkError> =>
  Effect.try({
    try: () => {
      const module = Wp.ImplModule.load(
        core,
        "libpipewire-module-loopback",
        JSON.stringify({
          "node.description": definition.name,
          "capture.props": {
            "node.name": definition.nodeName,
            "node.description": definition.name,
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

      if (!module) {
        throw new Error(`Could not load virtual sink ${definition.nodeName}`);
      }

      return module;
    },
    catch: (cause) => new WirePlumberVirtualSinkError({ cause }),
  });

/**
 * Creates Mixamp's virtual sinks.
 *
 * With no explicit playback target, WirePlumber routes each sink to the current
 * default audio output and follows changes to that default.
 */
export const makeVirtualSinks = (
  core: Wp.Core,
): Effect.Effect<PlaybackNodes, WirePlumberVirtualSinkError, Scope.Scope> =>
  Effect.gen(function* () {
    const objectManager = yield* makePlaybackNodeManager(core);

    yield* Effect.acquireRelease(loadVirtualSink(core, sinkDefinitions.game), (module) =>
      Effect.sync(() => module.unload()),
    );
    yield* Effect.acquireRelease(loadVirtualSink(core, sinkDefinitions.voice), (module) =>
      Effect.sync(() => module.unload()),
    );

    return yield* waitForPlaybackNodes(objectManager);
  });
