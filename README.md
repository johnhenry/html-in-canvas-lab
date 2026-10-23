# HTML-in-Canvas Lab

Focused experiments for Chromium's experimental HTML-in-Canvas API.

## Experiment 001: Nested effects

The demo renders real HTML through three nested Canvas 2D layers. Each layer can independently apply pixelation, a pointer-driven fisheye, or animated psychedelic color separation.

As observed on October 23, 2026:

- Nested rendering and post-processing effects compose successfully across canvas boundaries.
- A real DOM button in the deepest layer renders, but pointer clicks do not reach it after HTML-in-Canvas is activated.
- The same button works in the ordinary-DOM fallback.

This suggests that recursive painting works while recursive hit-test geometry does not. Because the API is experimental, this may be a Chromium implementation bug or an unsupported edge of the current proposal.

## Run locally

```sh
npm start
```

Open `http://localhost:4173`.

To activate the experiment, use a compatible Chromium build and enable:

```text
chrome://flags/#canvas-draw-element
```

The site provides a readable ordinary-DOM fallback in browsers without `drawElementImage()`.

## Structure

- `index.html` — experiment interface and findings
- `index.mjs` — nested rendering, effect routing, and feature detection
- `styles.css` — presentation and responsive layout
- `server.mjs` — dependency-free local static server

## Status

HTML-in-Canvas is experimental. Results are observations of a changing implementation, not compatibility guarantees.

## License

MIT
