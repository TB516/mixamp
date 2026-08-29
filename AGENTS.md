# Mixamp

Mixamp is a GTKX desktop app that provides separate Game and Voice PipeWire sinks through WirePlumber. Both sinks feed the current default audio output, with a Game/Voice balance control planned as the main interaction.

## Flatpak development environment

This repo has a devcontainer like tooling setup for its development environment. This is defined by the [development flatpak manifest](./flatpak//io.github.TB516.mixamp.dev.yml), and accessed by the [flatpak-dev script](./scripts/flatpak-dev). Run every development command inside the Flatpak SDK through:

```sh
./scripts/flatpak-dev run <command> [args...]
```

This includes pnpm, Node, code generation, type checking, formatting, linting, tests, builds, and app commands. A good rule of hand is if the tool version is important and it is used to run or modify the project code/dependencies, it should be run in the flatpak env.
