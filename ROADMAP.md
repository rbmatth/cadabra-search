# Roadmap

Backlog assessed by effort and impact. Completed items are removed; see `git log` for history.

## High impact, low effort

- **Real HTML fixture** — the scraper tests use synthetic markup, so they can't detect Amazon changing its page; save a real results page into `src/app/testing/` and test against it

## Low impact, low effort

- **Bundle size** — initial bundle is ~577 kB against the 500 kB warning budget (under the 1 MB error limit); check what's driving it (Cheerio is the likely candidate)

## Medium effort

- **Search history dropdown** — recent queries in localStorage, shown on input focus; needs dropdown UI and click-outside handling
- **Debounced auto-search** — RxJS `Subject` + `debounceTime`; low urgency since Enter works fine
