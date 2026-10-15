# CadabraSearch

A small Angular web app that searches Amazon and shows the results in a cleaner, more useful way: ratings are weighted by review count, discounts and badges are visible at a glance, and you can filter and sort the list.

It has no backend. The browser fetches an Amazon search results page, and the app extracts the products from the HTML with [Cheerio](https://cheerio.js.org/).

## Features

- **Smarter ranking** — products are scored with a Bayesian average of rating and review count, so a 4.9★ product with 3 reviews doesn't outrank a 4.6★ one with thousands.
- **Sort** — "Best match" (query terms found in the title, then score) or "Highest rated".
- **Filters** — hide sponsored results, Prime only, minimum rating, and a price range.
- **At-a-glance details** — price, list price and savings percentage, Prime marker, and Best Seller / Amazon's Choice / Sponsored badges.
- **Clean results** — duplicates (by ASIN) and unrated products are dropped.
- **Clear feedback** — network errors, bad responses, an invalid search URL and empty results each show a message.
- **Mobile friendly** — responsive layout with an icon search button on small screens.

## Configuring the search URL

The app doesn't know where to fetch results from until you give it a search URL. Open it with the URL as the query string:

```
https://<your-host>/cadabra-search/?https://example.com/s?k=
```

Everything after the first `?` is used as-is, and the search text is appended to it. The URL must be `http(s)` and is saved in your browser's localStorage, so you only need to do this once.

The URL has to return Amazon's search results HTML **and** allow cross-origin requests from the app, because the fetch happens in the browser and Amazon doesn't send CORS headers. In practice that means a CORS-enabled proxy in front of Amazon, which you provide.

## Development

Requires Node 22 (what CI uses) and npm.

```bash
npm ci
npm start
```

Then open the app with a proxied search URL. The dev server forwards `/amazon/*` to `https://www.amazon.com` (see `proxy.conf.js`), which avoids CORS locally:

```
http://localhost:4200/?http://localhost:4200/amazon/s?k=
```

Set `SEARCH_PROXY_TARGET` to forward somewhere else. Amazon may show a bot check to automated requests, in which case no products are found.

### Commands

| Command | What it does |
| --- | --- |
| `npm start` | Dev server at http://localhost:4200 with the proxy |
| `npm run build` | Production build into `dist/` (base href `/cadabra-search/`) |
| `npm test` | Karma/Jasmine in watch mode |
| `npm run test:ci` | One headless test run, as CI does |
| `npm run lint` | ESLint (angular-eslint) |

Tests run the scraper against synthetic HTML in `src/app/testing/`. If Amazon changes its markup, update the selectors in `amazon-scraper.service.ts` and the fixture together.

## Deployment

Pushing to `main` runs lint, tests and the build, then deploys to GitHub Pages (`.github/workflows/main.yml`). Pull requests run the same checks but don't deploy.

## Project layout

```
src/app/
├── amazon-scraper.service.ts   # fetch, URL validation, Cheerio extraction, scoring
├── product.model.ts            # Product, Price, Reviews types
├── app.component.*             # search box, filters, sorting
├── product-search-result/      # product card
├── loader/                     # loading spinner
└── testing/                    # test fixtures
```

See [`CLAUDE.md`](CLAUDE.md) for architecture notes and [`ROADMAP.md`](ROADMAP.md) for what's planned.

## Disclaimer

This project scrapes a third-party site whose markup can change without notice and whose terms may restrict automated access. It's a personal project, not affiliated with or endorsed by Amazon.
