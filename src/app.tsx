import { RegistryProvider } from "@effect/atom-react";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwApplication, AdwApplicationWindow, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { GtkBox, GtkButton, GtkLabel } from "@gtkx/jsx/gtk";
import { quit } from "@gtkx/react";
import { WirePlumberConnectionMount } from "./wireplumber/connection-mount.js";

const MainWindow = () => {
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
          <GtkLabel cssClasses={["title-1"]}>Mixamp</GtkLabel>
          <GtkLabel>PipeWire mixer controls will appear here.</GtkLabel>
          <GtkButton label="Refresh devices" />
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
