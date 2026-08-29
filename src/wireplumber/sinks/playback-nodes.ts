import * as GLib from "@gtkx/gi/glib";
import * as Wp from "@gtkx/gi/wp";
import { Effect } from "effect";

import { WirePlumberVirtualSinkError } from "../errors.js";
import { sinkDefinitions } from "./definitions.js";

/** Game and Voice playback nodes routed to the default output. */
export type PlaybackNodes = {
  /** Game playback node. */
  readonly game: Wp.Node;
  /** Voice playback node. */
  readonly voice: Wp.Node;
};

/** Creates a WirePlumber interest for a virtual sink's playback node. */
const makePlaybackNodeInterest = (nodeName: string) => {
  const interest = Wp.ObjectInterest.newType(Wp.Node);
  interest.addConstraint(
    Wp.ConstraintType.PW_GLOBAL_PROPERTY,
    "node.name",
    Wp.ConstraintVerb.EQUALS,
    GLib.Variant.newString(`${nodeName}.output`),
  );
  return interest;
};

/** Creates an object manager that tracks the Game and Voice playback nodes. */
export const makePlaybackNodeManager = (
  core: Wp.Core,
): Effect.Effect<Wp.ObjectManager, WirePlumberVirtualSinkError> =>
  Effect.try({
    try: () => {
      const objectManager = Wp.ObjectManager.new();
      objectManager.addInterestFull(makePlaybackNodeInterest(sinkDefinitions.game.nodeName));
      objectManager.addInterestFull(makePlaybackNodeInterest(sinkDefinitions.voice.nodeName));
      objectManager.requestObjectFeatures(
        Wp.Node,
        Wp.ProxyFeatures.PIPEWIRE_OBJECT_FEATURES_MINIMAL,
      );
      core.installObjectManager(objectManager);
      return objectManager;
    },
    catch: (cause) => new WirePlumberVirtualSinkError({ cause }),
  });

/** Looks up a virtual sink's playback node by name. */
const lookupPlaybackNode = (objectManager: Wp.ObjectManager, nodeName: string) => {
  // lookupFull takes ownership of the interest, so each lookup needs a new one.
  const object = objectManager.lookupFull(makePlaybackNodeInterest(nodeName));
  return object instanceof Wp.Node ? object : null;
};

/** Waits for the Game and Voice playback nodes to become available. */
export const waitForPlaybackNodes = (
  objectManager: Wp.ObjectManager,
): Effect.Effect<PlaybackNodes, WirePlumberVirtualSinkError> =>
  Effect.callback<PlaybackNodes, WirePlumberVirtualSinkError>((resume) => {
    let handlerId: number | undefined;

    const checkForNodes = () => {
      try {
        const game = lookupPlaybackNode(objectManager, sinkDefinitions.game.nodeName);
        const voice = lookupPlaybackNode(objectManager, sinkDefinitions.voice.nodeName);

        if (!game || !voice) {
          return;
        }

        if (handlerId !== undefined) {
          objectManager.disconnect(handlerId);
          handlerId = undefined;
        }

        resume(Effect.succeed({ game, voice }));
      } catch (cause) {
        if (handlerId !== undefined) {
          objectManager.disconnect(handlerId);
          handlerId = undefined;
        }

        resume(Effect.fail(new WirePlumberVirtualSinkError({ cause })));
      }
    };

    try {
      handlerId = objectManager.connect("objects-changed", checkForNodes);
      checkForNodes();
    } catch (cause) {
      resume(Effect.fail(new WirePlumberVirtualSinkError({ cause })));
    }

    return Effect.sync(() => {
      if (handlerId !== undefined) {
        objectManager.disconnect(handlerId);
      }
    });
  }).pipe(
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () =>
        Effect.fail(
          new WirePlumberVirtualSinkError({
            cause: "Timed out waiting for the virtual sink playback nodes",
          }),
        ),
    }),
  );
