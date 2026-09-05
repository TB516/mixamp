import * as Gio from "@gtkx/gi/gio";
import { Context, Effect, Layer, Ref } from "effect";

import schema from "../../data/io.github.TB516.mixamp.gschema.xml";

/** Remembered application settings, independent of any audio connection. */
type SettingsService = {
  /** Last successful audio balance, initially loaded from GSettings. */
  readonly balance: Effect.Effect<number>;
  /** Remembers and persists a balance after the audio update succeeds. */
  readonly rememberBalance: (balance: number) => Effect.Effect<void>;
};

/** Effect service key for application settings. */
export class Settings extends Context.Service<Settings, SettingsService>()("mixamp/Settings") {}

/** Creates session state backed by GSettings, retaining updates if saving is rejected. */
export const settingsLayer = Layer.effect(
  Settings,
  Effect.gen(function* () {
    const settings = Gio.Settings.new(schema.id);
    const balance = yield* Ref.make(settings.getDouble("balance"));

    return {
      balance: Ref.get(balance),
      rememberBalance: (value: number) =>
        Effect.gen(function* () {
          yield* Ref.set(balance, value);

          const saved = settings.setDouble("balance", value);
          if (saved) {
            return;
          }

          yield* Effect.logWarning("Could not save balance to GSettings; kept for this session.");
        }),
    };
  }),
);
