import * as Gtk from "@gtkx/gi/gtk";
import { AdwDialog, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { GtkBox, GtkLabel, GtkScrolledWindow } from "@gtkx/jsx/gtk";

/** Short instructions for setting up and using Mixamp. */
const sections = [
  {
    title: "Route your audio",
    paragraphs: [
      "In each app's audio settings, choose:",
      "Games → Mixamp Game\nChat → Mixamp Voice",
      "Both play through your system's default output.",
    ],
    note: "Game and chat audio must come from separate app outputs for Mixamp to balance them.",
  },
  {
    title: "Adjust the balance",
    paragraphs: [
      "Move toward Game to lower Voice, or toward Voice to lower Game. Choose Center to restore both to full volume.",
    ],
    note: "Percentages show the balance position. Your balance is saved automatically.",
  },
  {
    title: "Close or quit",
    paragraphs: [
      "With background permission, closing the window keeps audio running. Open Mixamp to return.",
      "Choose Quit to stop routing and remove the Mixamp outputs.",
    ],
    note: "Without background permission, closing the window also quits Mixamp.",
  },
  {
    title: "Reconnect audio",
    paragraphs: [
      "If the audio connection fails, choose Reconnect once PipeWire is running again. Mixamp restores your balance.",
    ],
  },
];

/** Presents usage guidance without leaving the balance screen. */
export const HelpDialog = ({ onClosed }: { readonly onClosed: () => void }) => (
  <AdwDialog title="Using Mixamp" contentWidth={460} contentHeight={540} onClosed={onClosed}>
    <AdwToolbarView topBar={<AdwHeaderBar />}>
      <GtkScrolledWindow hscrollbarPolicy={Gtk.PolicyType.NEVER} vexpand>
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          spacing={24}
          marginStart={24}
          marginEnd={24}
          marginTop={16}
          marginBottom={24}
        >
          {sections.map(({ title, paragraphs, note }) => (
            <GtkBox key={title} orientation={Gtk.Orientation.VERTICAL} spacing={10}>
              <GtkLabel label={title} xalign={0} wrap cssClasses={["heading"]} />
              {paragraphs.map((text) => (
                <GtkLabel key={text} label={text} xalign={0} wrap />
              ))}
              {note && <GtkLabel label={note} xalign={0} wrap cssClasses={["dim-label"]} />}
            </GtkBox>
          ))}
        </GtkBox>
      </GtkScrolledWindow>
    </AdwToolbarView>
  </AdwDialog>
);
