# Order Explorer

DareAISearch frontend assignment, **Problem Statement 1**: a data explorer over 12,000 orders that stays fast and never shows the wrong results.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build && npm run preview
```

Node 22+ needed. There's no backend to start. The API is mocked with MSW inside a service worker, so it works the same locally and on Vercel.

The footer has controls for the mock API: failure rate (0–100%) and whether to add the random 200ms–3s latency. Defaults are 10% failures with latency on, as the brief asks. Setting it to 100% is the quickest way to see the error states.

## What it does

| Requirement | How |
|---|---|
| No stale results | Search is debounced (350ms). Every request is aborted when the query changes, **and** responses are checked against a run id, so a late response is dropped even if abort didn't stop it. |
| State in URL | `q`, `status`, `category`, `country`, `sort`, `page`, `size` all live in the query string. The URL is the only copy of that state. Defaults are left out so `/` stays clean. |
| Large lists | Page size goes up to 1000 rows; the table body is virtualized with `@tanstack/react-virtual`, so only ~25–40 `<tr>`s exist at a time. Rows are memoized and the search box keeps its own state so typing doesn't re-render the table. |
| Honest states | Initial load → skeleton. Refetch → old rows greyed out + "Updating…" and `aria-busy`. Error → rows removed, error message + Retry. Empty → message + clear filters. Page past the end → "go to last page". |
| Partial failure | The totals bar (`/api/orders/summary`) and the "other orders from this customer" list in the drawer are separate requests. If one of those fails, the rest of the screen stays usable and just that section shows an inline error with its own Retry. |
| Accessibility | Real `<table>` with `aria-sort`, `aria-rowcount`/`aria-rowindex` (since most rows aren't in the DOM). The table body is one tab stop; arrow keys, PageUp/Down, Home/End move between rows and Enter opens one. Result counts go to a `role="status"` live region, errors use `role="alert"`. Visible focus everywhere. |
| Detail view | `/orders/:id` is a nested route rendered as a native `<dialog>` on top of the list. The list never unmounts, so scroll and filters are untouched. Deep links work, Esc/backdrop/✕ close it, and focus goes back to the row that opened it. |

## Architecture & decisions

```
src/
  api/client.js            fetch wrapper, ApiError, endpoint functions
  hooks/useRequest.js      the race-safe data hook (the core of "never stale")
  hooks/useExplorerParams  URL <-> state
  lib/params.js            parse/serialize URL params, with validation
  components/              Explorer, OrdersTable, OrderDrawer, ...
  mocks/                   data generator, query logic, MSW handlers, chaos settings
```

**URL as the single source of truth.** Filters aren't kept in `useState` with a sync to the URL. They're read straight from `useSearchParams`. That rules out a whole class of "URL says X, UI shows Y" bugs, and it makes refresh, back/forward and shared links work without extra code. `parseParams` validates everything, so a hand-edited or junk URL falls back to defaults instead of crashing.

The one exception is the search input, which keeps local state while you type and writes to the URL after the debounce. When the URL changes from outside (back button, Clear filters), the input picks it up. A ref tracks the last value it committed, so its own update coming back doesn't wipe text the user typed in the meantime. There's a test for exactly that.

**`useRequest` instead of a data-fetching library.** I considered TanStack Query. It handles most of this, but the assignment is mostly about showing that I understand the race conditions, and the hook is about 50 lines. It takes a `key` (the serialized params) and on every key change:
1. aborts the previous request with `AbortController`
2. bumps a run id; a result is applied only if it belongs to the latest run
3. keeps the previous data while loading but reports `isStale`, so the UI can grey it out
4. on error, drops the data so old rows never sit next to an error looking current

What I'd miss from React Query in a real app: caching (going back to page 1 refetches it) and background refetching.

**Pagination + virtualization rather than infinite scroll.** With infinite scroll, a URL can't easily restore "row 4,000 of a scrolled list", and you also need to handle pages failing halfway down. Server-side pages give a clean URL (`?page=12&size=500`), and virtualization keeps a 1000-row page smooth. The scroll position inside a page is also restored after a refresh (saved per query in `sessionStorage`).

**Native `<dialog>` for the drawer.** `showModal()` gives a focus trap, Esc handling and an inert background without a library. On close, if the drawer was opened from the list, I `navigate(-1)` so history doesn't fill up with list → drawer → list entries. For a deep link there's nothing to go back to, so it navigates to `/` with the same query string.

**Mock API.** Data is generated from a seeded PRNG, so `ORD-04211` is the same order for everyone (needed for shareable links). Filtering, sorting and paging live in `mocks/query.js` as plain functions, which made them easy to unit test. Sorting tie-breaks on id, otherwise paging through e.g. "status" (lots of equal values) could show the same row on two pages.

## Tradeoffs / things I'd do with more time

- No response caching. Back/forward refetches, which with up to 3s latency is noticeable. A small LRU keyed by the request key would fix it.
- Failed requests are not auto-retried. I preferred an explicit Retry over hiding failures, but one silent retry for 503s would be reasonable.
- Fixed row height (44px). Simplifies virtualization; variable-height rows would need `measureElement`.
- Tests cover logic and hooks, not the full page in a browser. jsdom has no layout, so the virtualized table renders nothing there. A Playwright test with the failure rate pinned would be the next step.
- On a small screen the table scrolls horizontally rather than switching to a card layout.
- MSW needs service workers, so the app won't start in browsers or modes where they're blocked (shows a message instead).

## Tests

```
src/hooks/useRequest.test.jsx      late response can't overwrite newer one, abort, stale flag, error clears data, retry
src/components/SearchBox.test.jsx  debounce commits once, URL sync both ways, Enter flushes without double commit
src/lib/params.test.js             URL round-trip, defaults omitted, junk values fall back
src/mocks/query.test.js            server-side filter/sort, stable paging with ties, page past the end
```

The Enter test caught a real bug: the pending debounce timer fired a second, duplicate commit after Enter had already committed the value.

## Sources & references

- MSW docs – browser integration, `http`, `delay`: https://mswjs.io/docs
- TanStack Virtual – `useVirtualizer`, `paddingStart`/`scrollPaddingStart`: https://tanstack.com/virtual/latest
- React Router – `useSearchParams`, nested routes, `navigate(-1)`: https://reactrouter.com
- React docs – "You might not need an effect" (resetting state when a prop changes, used for the table's active row): https://react.dev/learn/you-might-not-need-an-effect
- MDN – `<dialog>` and `showModal()`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- MDN – `AbortController`: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- WAI-ARIA APG – sortable table and grid keyboard patterns: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
- Mulberry32 PRNG (seeded fake data)
- Free tier: Vercel for hosting

## AI usage

_Fill this in: which tools you used, what for, and the share link to the chat, as the brief asks._
