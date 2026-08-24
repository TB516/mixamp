import * as Gtk from "@gtkx/gi/gtk";
import { rootElement } from "@gtkx/react";
import { render, screen } from "@gtkx/testing";
import { describe, expect, it } from "vitest";
import App from "../src/app.js";

describe("App", () => {
    it("renders the device refresh action", async () => {
        await render(<App />, { container: rootElement });
        const button = await screen.findByRole(Gtk.AccessibleRole.BUTTON, { name: "Refresh devices" });
        expect(button).toBeDefined();
    });
});
