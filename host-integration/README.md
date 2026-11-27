# Host integration references

The current museum declares audio, navigation, Web Surfaces, textures, avatars and animations through `anyo.project.json`. Use the current World Loader for automatic discovery and playback. No museum-specific host adapter is required for ordinary repository loading.

The JavaScript files in this directory are historical reference implementations for trusted hosts. They are not automatically imported or executed by the Loader. Do not treat remote application code as a trusted host plugin. Navigation permission, sender checks, destination validation and session revocation remain host responsibilities.

See [world authoring](../docs/authoring.md) and [hosting](../docs/hosting.md).
