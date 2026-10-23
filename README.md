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

## Activate HTML-in-Canvas in Chrome

HTML-in-Canvas is still experimental and may not be present in ordinary Chrome Stable. Chrome Canary is the most reliable option.

1. Install or open a recent Chrome Canary build.
2. Paste `chrome://flags/#canvas-draw-element` into the address bar.
3. Set **Enable the new drawElement API for Canvas** to **Enabled**.
4. Paste `chrome://flags/#enable-experimental-web-platform-features` into the address bar.
5. Set **Experimental Web Platform features** to **Enabled**.
6. Click **Relaunch** when Chrome prompts you.
7. Return to the demo and reload the page.

Chrome does not allow websites to open `chrome://` URLs directly, so the addresses must be pasted into the address bar.

When activation succeeds, the badge above the experiment reads **API active** and the effect-routing controls become available. You can also verify support in DevTools:

```js
typeof CanvasRenderingContext2D.prototype.drawElementImage === 'function'
```

The expression should return `true`. If it returns `false`, the current Chrome build does not expose the API or the flags have not taken effect.

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
