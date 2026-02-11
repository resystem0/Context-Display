# Word Cloud Auto-Play — Next Steps

## Context
The word cloud reorganizes on click but is otherwise static. For a hero view shown to an audience, the cloud should continuously animate — auto-cycling through nodes AND gently rotating rings — so viewers passively see the full graph over time. This auto-play should be controllable from the remote.

## 1. Auto-play: node cycling + ring rotation

**In `components/visualization/WordCloudView.tsx`:**

- Add `autoPlay` prop (boolean, default false)
- **Node cycling**: `useEffect` with `setInterval` (~5s). On each tick, select the next node by weight (cycling through `weighted` array). Calls `selectNode` + `setHighlights` — the existing ring layout already reorganizes around the selected node, so the cloud reshuffles each cycle.
- **Ring rotation**: Add a `rotationOffset` state that increments via `requestAnimationFrame` (~0.1°/frame, ~6°/s). Pass this offset into `layoutRings` which adds it to the starting angle of each ring. This creates a slow continuous orbit.
- When `autoPlay` is false, both timers stop. Manual clicks still work regardless.
- When `autoPlay` is true and user clicks a node manually, pause auto-cycle for 10s then resume.

## 2. Add `autoPlay` to session state + interaction store

**`lib/server/sessionStore.ts`:**
- Add `autoPlay: boolean` to `SessionState` (default `true`)
- Allow `patchSession` to accept `autoPlay`

**`lib/graph/interactionStore.ts`:**
- Add `autoPlay: boolean` to store (default `true`)
- Add `setAutoPlay(v: boolean)` action
- Include `autoPlay` in `applyServerState`

**`lib/hooks/useSessionPolling.ts`:**
- Sync `autoPlay` from server state

## 3. Add auto-play toggle to remote controller

**`app/remote/[sessionId]/page.tsx`:**
- Add "Auto-Play" toggle button to the control grid
- Calls `api({ autoPlay: !current })` to toggle
- Button shows current state (on/off) with visual indicator

## 4. Wire auto-play prop into graph page

**`app/graph/page.tsx`:**
- Read `autoPlay` from `useGraphInteraction()`
- Pass `autoPlay` prop to `WordCloudView`

## Files to modify (5)

| File | Change |
|------|--------|
| `components/visualization/WordCloudView.tsx` | Add `autoPlay` prop, node cycling timer, ring rotation animation |
| `lib/graph/interactionStore.ts` | Add `autoPlay` state + `setAutoPlay` action |
| `lib/server/sessionStore.ts` | Add `autoPlay` to `SessionState`, allow patching it |
| `lib/hooks/useSessionPolling.ts` | Sync `autoPlay` from server |
| `app/remote/[sessionId]/page.tsx` | Add auto-play toggle button |
| `app/graph/page.tsx` | Read `autoPlay` from store, pass to WordCloudView |

## Verification
1. `npm run build` — no errors
2. `npm run lint` — passes
3. Visit `/graph` — cloud auto-cycles through nodes every ~5s with gentle ring rotation
4. Tap "Auto-Play" on remote — cycling/rotation stops on graph page
5. Tap again — resumes
6. Manual click on a node — pauses auto-cycle briefly, then resumes
