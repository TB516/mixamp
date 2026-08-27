import { RegistryProvider, useAtomValue } from "@effect/atom-react";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwApplication, AdwApplicationWindow, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { GtkBox, GtkLabel } from "@gtkx/jsx/gtk";
import { quit } from "@gtkx/react";
import { AsyncResult } from "effect/unstable/reactivity";

import { wirePlumberConnection } from "./wireplumber/atoms/connection.js";
import { WirePlumberConnectionMount } from "./wireplumber/connection-mount.js";

const MainWindow = () => {
  const connection = useAtomValue(wirePlumberConnection);
  const connectionStatus = AsyncResult.matchWithError(connection, {
    onInitial: () => "Connecting to WirePlumber…",
    onSuccess: ({ value }) => {
      if (value.connected) {
        return "WirePlumber connected";
      }

      return "WirePlumber disconnected";
    },
    onError: (error) => `WirePlumber connection failed: ${error._tag}`,
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
