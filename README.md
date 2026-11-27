# AETERNUM

A virtual museum of art, science and philosophy, built with Anyo and Sekai64. Designed by BLCK LAB.

Explore thirteen galleries, the entrance hall and the grand promenade, with 72 unique exhibited artworks, guided tours, an artwork viewer, soundscapes and optional playable avatars.

**Version:** `1.0.0` · Anyo World `0.9` · World revision `34`.

## Explore

Open this repository in Anyo World Loader (use Anyo World Loader 0.7.0 or a compatible host with world-owned characters and optional avatar support). AETERNUM starts in first person; press **I** to choose a character, **M** for the directory, **N** for soundscapes and **E** to interact with exhibits.

For a local world server, use Node.js 22.12+ or 24:

```sh
npm install
npm run dev
```

Run the Loader separately, then open `http://127.0.0.1:4173/?registryRoot=http%3A%2F%2F127.0.0.1%3A4174%2F` (default ports).

## Documentation

- [Visitor guide](docs/explore.md)
- [World authoring](docs/authoring.md)
- [Hosting and deployment](docs/hosting.md)
- [Content credits and rights](docs/rights.md)

## Development

```sh
npm run check
```

The canonical entry is `world.anyo.json`, alongside `anyo.project.json`. The museum owns its assets, characters, animation catalogs and Web Surface applications. The Loader owns playback, navigation permissions and rendering.

Stable release preparation does not establish content redistribution rights. Before tagging or distributing this release, confirm the content-rights audit and remaining production/device review gates. See [content rights](docs/rights.md).
