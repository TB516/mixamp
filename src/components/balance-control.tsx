import { useAtom } from "@effect/atom-react";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwClamp } from "@gtkx/jsx/adw";
import { GtkBox, GtkButton, GtkImage, GtkLabel, GtkSpinner } from "@gtkx/jsx/gtk";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Atom } from "effect/unstable/reactivity";

import type {
  WirePlumberCrossfadeError,
  WirePlumberCrossfadeRollbackError,
  WirePlumberSinkGainError,
} from "../wireplumber/errors.ts";
import type { WirePlumberState } from "../wireplumber/types.ts";
import { BalanceSlider } from "./balance-slider.tsx";

/** Balance controls shown when the audio connection is ready. */
export const BalanceControl = ({
  crossfade,
  sinks,
  crossfadeAtom,
}: {
  readonly crossfade: number;
  readonly sinks: WirePlumberState["sinks"];
  readonly crossfadeAtom: Atom.AtomResultFn<
    number,
    number,
    WirePlumberCrossfadeError | WirePlumberSinkGainError | WirePlumberCrossfadeRollbackError
  >;
}) => {
  const [crossfadeResult, setCrossfade] = useAtom(crossfadeAtom);
  const operationMessage = AsyncResult.matchWithError(crossfadeResult, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: (error) => {
      switch (error._tag) {
        case "WirePlumberCrossfadeError":
        case "WirePlumberSinkGainError":
          return "The balance could not be changed. Your previous setting is still active.";
        case "WirePlumberCrossfadeRollbackError":
          return "The balance update was incomplete. The Game and Voice levels may be out of sync.";
        default:
          return error satisfies never;
      }
    },
    onDefect: () => "The balance control failed unexpectedly.",
  });

  return (
    <AdwClamp
      orientation={Gtk.Orientation.HORIZONTAL}
      maximumSize={560}
      tighteningThreshold={520}
      hexpand
      vexpand
      valign={Gtk.Align.CENTER}
    >
      <GtkBox
        orientation={Gtk.Orientation.VERTICAL}
        spacing={26}
        marginTop={28}
        marginBottom={28}
        marginStart={24}
        marginEnd={24}
      >
        <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={8} halign={Gtk.Align.CENTER}>
          <GtkImage
            iconName="audio-volume-high-symbolic"
            pixelSize={18}
            valign={Gtk.Align.CENTER}
            cssClasses={["success"]}
          />
          <GtkLabel cssClasses={["success"]}>Mixamp ready</GtkLabel>
          {crossfadeResult.waiting && <GtkSpinner spinning valign={Gtk.Align.CENTER} />}
        </GtkBox>

        <GtkLabel cssClasses={["title-2"]}>Balance</GtkLabel>

        <BalanceSlider
          value={crossfade}
          sinks={sinks}
          resetToken={
            crossfadeResult._tag === "Failure" && !crossfadeResult.waiting ? crossfadeResult : null
          }
          onChange={setCrossfade}
        />

        <GtkButton
          label="Center"
          halign={Gtk.Align.CENTER}
          sensitive={crossfade !== 0}
          widthRequest={112}
          onClicked={() => setCrossfade(0)}
        />

        {operationMessage && (
          <GtkLabel wrap justify={Gtk.Justification.CENTER} cssClasses={["error"]}>
            {operationMessage}
          </GtkLabel>
        )}
      </GtkBox>
    </AdwClamp>
  );
};
