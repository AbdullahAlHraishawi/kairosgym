
# Refine Swipe Navigation

Make swipe between tabs feel native and stop fighting horizontal scrollers (filter chips, carousels).

## What changes

Only `src/components/mobile-shell.tsx`. No other file touched. No visual redesign.

### 1. Smart gesture detection

On `touchstart`, walk up from `e.target` to the shell root and check each ancestor with `Element.scrollWidth > clientWidth` AND a computed `overflow-x` of `auto` / `scroll`. If found → mark gesture as "scroll-owned" and never start a tab swipe.

Also opt out via a `data-no-swipe` attribute, which we can apply to anything custom later (charts, sliders) without code changes here. The chip rows in `workout.index.tsx` already use horizontal overflow, so they'll be auto-detected — no edits needed there.

### 2. Direction lock

First 8–10px of movement decides intent:
- |dx| > |dy| AND |dx| > 8 → horizontal gesture, take it
- |dy| > |dx| → vertical scroll, release for the rest of the touch
- else keep sampling

Once direction is locked horizontal, call `e.preventDefault()` on `touchmove` (listener registered with `{ passive: false }` via `useEffect` + `ref`, since React's synthetic touch handlers are passive) so the browser doesn't also try to scroll.

### 3. Finger-following transform

Replace the current "detect end → navigate" model with a live drag:
- Track `dragX` in a `ref` + apply via `element.style.transform = translate3d(...)` directly (no React re-renders during drag → 60fps).
- The `<main>` container translates with the finger.
- At edges (first tab swiping right, last tab swiping left), apply rubber-band: `displayed = sign * sqrt(|dx|) * k` so it resists but still moves a little.

### 4. Velocity + threshold completion

On `touchend`, decide commit vs. cancel:
- Commit if `|dx| > width * 0.25` OR `|velocity| > 0.5 px/ms` (sampled over last ~80ms).
- Else snap back to 0.

Animate to target with a CSS transition (`transform 260ms cubic-bezier(0.22, 1, 0.36, 1)`), then on `transitionend` call `navigate({ to: TAB_ORDER[next] })` and reset transform to 0 (the new page mounts at rest position).

For the snap-back case, same easing, no navigation.

### 5. Bottom nav untouched

`BottomNav` keeps working as-is — taps bypass the touch handler entirely. Both coexist.

### 6. Edge cases

- Multi-touch (`touches.length > 1`) → cancel gesture.
- Touch cancelled by system → snap back.
- Route change during animation → clear pending transitions.

## Technical notes

```text
touchstart
  ├─ inside [data-no-swipe] or horizontally-scrollable ancestor? → ignore
  └─ record startX, startY, startTime

touchmove (first 10px)
  ├─ |dy| dominates → release (vertical scroll wins)
  └─ |dx| dominates → lock horizontal, preventDefault from now on

touchmove (locked)
  ├─ at edge → rubber-band displacement
  └─ else → translate main by dx (live, via ref.style.transform)

touchend
  ├─ |dx| > 25% width OR |v| > 0.5 px/ms → animate to ±width, then navigate
  └─ else → animate back to 0
```

No new dependencies. Framer Motion not needed — direct DOM transform + one CSS transition is lighter and avoids re-renders.

## Out of scope

- No cross-fade / parallax of the incoming page (would need shared layout — out of scope; current single-page mount stays).
- No changes to routes, filters, or any UI.
- No changes to `bottom-nav.tsx`.
