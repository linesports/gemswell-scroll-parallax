# Project Instructions

## Scroll Timing

- Treat the scroll animation as one ordered timeline. When a timing change delays one element, move every later dependent timing later by the same intent instead of allowing it to overlap the next element.
- For the Gemswell logo-build section, preserve the sequence: intro message, first story panel, second story panel, metric trio, web fade-out, surfboard return/fade-out, final white logo.
- If there is not enough room at the end of the normalized scroll range, extend the section scroll height or rebalance the full timeline before compressing later elements into overlaps.
- The final surfboard/table exit is controlled in `src/App.jsx` by `returnStart`, `returnEnd`, `returnProgress`, `sceneProgress = 1 - returnProgress`, and `boardOpacity = 1 - returnProgress`. Do not confuse this with the initial entrance, controlled by `introEnd` and the pre-return `sceneProgress` mapping.
- Do not add hold time after late elements by only increasing `.logo-build` `min-height`: that changes the physical duration of the entire normalized ScrollTrigger timeline, including the initial surfboard/table animation. To add space after the metric trio, move the late-stage normalized timing points (`metric-*`, `webFade*`, `returnStart`, `finalLogoStart`) or introduce an explicit remap so earlier phases keep their physical duration.
- The current fix uses `mapScrollProgress(rawProgress)` in `src/App.jsx`: `rawProgress` is physical scroll, while mapped `progress` is visual timeline progress. This allows `.logo-build` to be taller while preserving the physical duration of earlier phases and assigning the added physical scroll to the late hold/exit after the metric trio.
- When matching or extending `Membresia`, recalculate its actual fade-out end before placing the metric trio. With the mirrored `panelTwoProgress` path, no metric item should start until after `Membresia` has reached opacity 0 plus a small gap; then shift `metric-*`, `metric-out-*`, and `exitRawStart` together.
