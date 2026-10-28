# 卷中人间

An interactive web game inside Zhang Zeduan's *Along the River During the Qingming Festival*. Eight fictional townspeople are linked by small acts of kindness; the player carries each gift to the next person, then removes anyone from the painting to see what the street loses.

## Run

```sh
pnpm install
pnpm build
pnpm preview
```

Open http://127.0.0.1:4173. Progress is stored in `localStorage`.

## Artwork

The 38414×1800 public-domain image comes from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Alongtheriver_QingMing.jpg). The painting belongs to the Palace Museum, Beijing. Names, dialogue and relationships are fictional.

Regenerate the WebP tiles and portraits (requires `cwebp`):

```sh
pnpm tiles -- path/to/Alongtheriver_QingMing.jpg
```

Portrait crops and character positions live in `src/world.ts`. For a higher-resolution source, update `W` and `H` in `scripts/tiles.mjs` and `src/scroll.ts`.
