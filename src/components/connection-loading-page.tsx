import * as Gtk from "@gtkx/gi/gtk";
import { GtkBox, GtkLabel, GtkSpinner } from "@gtkx/jsx/gtk";

/** Shows the loading state while Mixamp connects to the audio service. */
export const ConnectionLoadingPage = () => (
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
);
