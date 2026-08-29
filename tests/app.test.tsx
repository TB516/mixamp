import * as Gtk from "@gtkx/gi/gtk";
import { rootElement } from "@gtkx/react";
import { render, screen } from "@gtkx/testing";
import { describe, expect, it } from "vitest";

import { App } from "../src/app.tsx";

describe("App", () => {
  it("renders the main window", async () => {
    await render(<App />, { container: rootElement });
    const window = await screen.findByRole(Gtk.AccessibleRole.WINDOW, { name: "Mixamp" });
    expect(window).toBeDefined();
  });
});
