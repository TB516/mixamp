import { useAtomValue } from "@effect/atom-react";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwStatusPage } from "@gtkx/jsx/adw";
import { GtkBox, GtkLabel, GtkSpinner } from "@gtkx/jsx/gtk";
import { AsyncResult } from "effect/unstable/reactivity";

import { BalanceControl } from "../components/balance-control.tsx";
import { wirePlumberState } from "../wireplumber/index.ts";

/** Main screen backed by the current WirePlumber atom. */
export const MainScreen = () => {
  const wirePlumber = useAtomValue(wirePlumberState);

  return AsyncResult.matchWithError(wirePlumber, {
    onInitial: () => (
      <GtkBox
        orientation={Gtk.Orientation.VERTICAL}
        spacing={16}
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        hexpand
        vexpand
      >
        <GtkSpinner spinning widthRequest={32} heightRequest={32} />
        <GtkLabel cssClasses={["title-2"]}>Connecting to audio…</GtkLabel>
        <GtkLabel cssClasses={["dim-label"]}>Creating the Game and Voice outputs</GtkLabel>
      </GtkBox>
    ),
    onSuccess: ({ value }) => {
      if (!value.connected) {
        return (
          <AdwStatusPage
            iconName="audio-volume-muted-symbolic"
            title="PipeWire disconnected"
            description="Mixamp is waiting for the audio service. Reopen the app after PipeWire is running."
            hexpand
            vexpand
          />
        );
      }

      return <BalanceControl crossfade={value.crossfade} />;
    },
    onError: (error) => {
      let title = "The audio connection failed";
      let description = "Close and reopen Mixamp, then try again.";

      switch (error._tag) {
        case "WirePlumberInitializationError":
          title = "WirePlumber could not start";
          description = "Mixamp could not initialize the WirePlumber library.";
          break;
        case "WirePlumberCoreCreationError":
          title = "Could not create the audio connection";
          description = "Mixamp could not create its WirePlumber core.";
          break;
        case "WirePlumberSignalSetupError":
          title = "Could not monitor the audio connection";
          description = "Mixamp could not listen for WirePlumber connection changes.";
          break;
        case "WirePlumberConnectionError":
          title = "Could not connect to PipeWire";
          description = "Check that PipeWire is running, then close and reopen Mixamp.";
          break;
        case "WirePlumberVirtualSinkError":
          title = "Could not create the Mixamp outputs";
          description = "The Game and Voice outputs could not be added to PipeWire.";
          break;
        case "NoSuchElementError":
          title = "The audio connection ended";
          description =
            "WirePlumber stopped publishing connection state unexpectedly. Close and reopen Mixamp.";
          break;
        default:
          error satisfies never;
      }

      return (
        <AdwStatusPage
          iconName="dialog-error-symbolic"
          title={title}
          description={description}
          hexpand
          vexpand
        />
      );
    },
    onDefect: () => (
      <AdwStatusPage
        iconName="dialog-error-symbolic"
        title="Mixamp failed unexpectedly"
        description="Close and reopen the app. If this keeps happening, check the application logs."
        hexpand
        vexpand
      />
    ),
  });
};
