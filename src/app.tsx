import { RegistryProvider } from "@effect/atom-react";
import { AdwApplication, AdwApplicationWindow, AdwHeaderBar, AdwToolbarView } from "@gtkx/jsx/adw";
import { quit } from "@gtkx/react";

import { MainScreen } from "./screens/main-screen.tsx";
import { WirePlumberConnectionMount } from "./wireplumber/index.ts";

/** Creates the Mixamp application and its main window. */
export const App = () => (
  <AdwApplication>
    <RegistryProvider>
      <WirePlumberConnectionMount />
      <AdwApplicationWindow
        title="Mixamp"
        defaultWidth={560}
        defaultHeight={440}
        onCloseRequest={quit}
      >
        <AdwToolbarView topBar={<AdwHeaderBar />}>
          <MainScreen />
        </AdwToolbarView>
      </AdwApplicationWindow>
    </RegistryProvider>
  </AdwApplication>
);
