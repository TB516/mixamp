# Dependencies

## Sandbox dependencies

The CLI uses the normal application manifest, builds the dependencies, and skips the final Mixamp module.

`gtkx-test-tools.yml` groups the headless test tools. Weston depends on libinput; `setpriv` depends on libcap-ng. Each dependency's cleanup rule excludes its installed files from the packaged app. The group itself installs nothing.

## Dependency changes

Flatpak Builder checks the manifest, included module files, and their sources whenever a new sandbox starts. It rebuilds changed dependencies and reuses the cache for unchanged ones. To apply dependency changes while a sandbox is running, close its commands and editor connections, let it stop, and reconnect.

Project source changes do not require rebuilding the dependency image. Install package changes with pnpm inside the sandbox.

See [Development](development.md) for commands, editor connections, and app packaging.
