import { RegistryProvider, useAtomValue } from "@effect/atom-react";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwApplication, AdwApplicationWindow, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { GtkBox, GtkLabel } from "@gtkx/jsx/gtk";
import { quit } from "@gtkx/react";
import { AsyncResult } from "effect/unstable/reactivity";

import { wirePlumberState, WirePlumberConnectionMount } from "./wireplumber/index.js";

const MainWindow = () => {
  const wirePlumber = useAtomValue(wirePlumberState);
  const connectionStatus = AsyncResult.matchWithError(wirePlumber, {
    onInitial: () => "Connecting to WirePlumber…",
    onSuccess: ({ value }) => {
      if (value.connected) {
        return "WirePlumber connected";
      }

      return "WirePlumber disconnected";
    },
    onError: (error) => {
      switch (error._tag) {
        case "WirePlumberInitializationError":
          return "WirePlumber could not initialize";
        case "WirePlumberCoreCreationError":
          return "Could not create the WirePlumber core";
        case "WirePlumberSignalSetupError":
          return "Could not monitor the WirePlumber connection";
        case "WirePlumberConnectionError":
          return "Could not connect to PipeWire";
        case "WirePlumberVirtualSinkError":
          return "Could not create the game and voice audio outputs";
        case "NoSuchElementError":
          return "The WirePlumber connection stream ended unexpectedly";
      }
    },
    onDefect: () => "WirePlumber failed unexpectedly",
  });

  return (
    <AdwApplicationWindow
      title="Mixamp"
      defaultWidth={720}
      defaultHeight={480}
      onCloseRequest={quit}
    >
      <AdwToolbarView topBar={<AdwHeaderBar />}>
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          spacing={16}
          marginTop={32}
          marginBottom={32}
          marginStart={32}
          marginEnd={32}
          valign={Gtk.Align.CENTER}
          halign={Gtk.Align.CENTER}
        >
          <GtkLabel cssClasses={["title-1"]}>{connectionStatus}</GtkLabel>
        </GtkBox>
      </AdwToolbarView>
    </AdwApplicationWindow>
  );
};

/** Creates the GTK application and scopes WirePlumber to its window tree. */
export const App = () => (
  <AdwApplication>
    <RegistryProvider>
      <WirePlumberConnectionMount />
      <MainWindow />
    </RegistryProvider>
  </AdwApplication>
);

export default App;
