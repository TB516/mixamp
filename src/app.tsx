import { useAtomValue } from "@effect/atom-react";
import * as Gio from "@gtkx/gi/gio";
import * as Gtk from "@gtkx/gi/gtk";
import { AdwApplication, AdwApplicationWindow, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { GMenu, GSimpleAction } from "@gtkx/jsx/gio";
import { GtkMenuButton } from "@gtkx/jsx/gtk";
import { quit } from "@gtkx/react";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";

import { backgroundState } from "./background/index.ts";
import { AboutDialog } from "./components/about-dialog.tsx";
import { HelpDialog } from "./components/help-dialog.tsx";
import { WirePlumberProvider } from "./providers/wireplumber-provider.tsx";
import { MainScreen } from "./screens/main-screen.tsx";

/** Presents Mixamp's existing window when the application is activated again. */
const presentMainWindow = (application: Gtk.Application) => {
  const window = application.getWindows()[0];
  window?.present();
};

/** Derives whether the portal has approved keeping Mixamp alive. */
const useHideOnClose = () => {
  const background = useAtomValue(backgroundState);
  return AsyncResult.getOrElse(background, () => "pending") === "allowed";
};

/** Creates the Mixamp application and its main window. */
export const App = () => {
  const hideOnClose = useHideOnClose();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <AdwApplication
      onActivate={presentMainWindow}
      onShutdown={() => Gio.Settings.sync()}
      actions={
        <>
          <GSimpleAction name="help" onActivate={() => setHelpOpen(true)} />
          <GSimpleAction name="about" onActivate={() => setAboutOpen(true)} />
          <GSimpleAction name="quit" onActivate={() => quit()} />
        </>
      }
      actionAccels={[{ detailedActionName: "app.quit", accels: ["<Primary>q"] }]}
    >
      <AdwApplicationWindow
        title="Mixamp"
        defaultWidth={560}
        defaultHeight={440}
        hideOnClose={hideOnClose}
      >
        <AdwToolbarView
          topBar={
            <AdwHeaderBar
              end={
                <GtkMenuButton
                  primary
                  iconName="open-menu-symbolic"
                  accessibleLabel="Main Menu"
                  tooltipText="Main Menu"
                  menuModel={
                    <GMenu
                      items={[
                        { label: "Help", action: "app.help" },
                        { label: "About Mixamp", action: "app.about" },
                        { label: "Quit", action: "app.quit" },
                      ]}
                    />
                  }
                />
              }
            />
          }
        >
          <WirePlumberProvider>
            <MainScreen />
          </WirePlumberProvider>
        </AdwToolbarView>
        {aboutOpen && <AboutDialog onClosed={() => setAboutOpen(false)} />}
        {helpOpen && <HelpDialog onClosed={() => setHelpOpen(false)} />}
      </AdwApplicationWindow>
    </AdwApplication>
  );
};
