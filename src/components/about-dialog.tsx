import * as Gtk from "@gtkx/gi/gtk";
import { AdwAboutDialog } from "@gtkx/jsx/adw";

import applicationIcon from "../../assets/io.github.TB516.mixamp.svg?icon";
import { version } from "../../package.json";

/** Standard application information and project links. */
export const AboutDialog = ({ onClosed }: { readonly onClosed: () => void }) => (
  <AdwAboutDialog
    applicationName="Mixamp"
    applicationIcon={applicationIcon}
    developerName="Thomas"
    version={version}
    licenseType={Gtk.License.GPL_3_0}
    website="https://github.com/TB516/mixamp"
    issueUrl="https://github.com/TB516/mixamp/issues"
    onClosed={onClosed}
  />
);
