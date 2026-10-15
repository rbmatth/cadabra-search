# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CadabraSearch is an Angular 19 web application that searches Amazon products and displays results with pricing, ratings, and other product details. It uses web scraping via the Cheerio library to extract product information from Amazon search results.

**Repository**: https://github.com/rbmatth/cadabra-search

## Tech Stack

- **Framework**: Angular 19 (latest, using standalone APIs)
- **Language**: TypeScript 5.6 with strict mode enabled
- **Testing**: Karma (test runner) + Jasmine (testing framework)
- **Build Tool**: Angular CLI 19
- **Web Scraping**: Cheerio 1.0
- **State Management**: RxJS 7.8 (Reactive Extensions)
- **Styling**: Plain CSS (no preprocessing, responsive design with media queries)

## Project Structure

```
src/
├── main.ts                          # Bootstrap entry point
├── index.html                       # HTML shell
├── styles.css                       # Global styles (minimal)
└── app/
    ├── app.component.ts             # Root component - search UI, filters, sorting
    ├── app.component.html           # Search bar + filter bar + results list layout
    ├── app.component.css            # Responsive search container styling
    ├── app.config.ts                # Angular application config
    ├── app.routes.ts                # Routing (currently empty, no sub-routes)
    ├── amazon-scraper.service.ts    # Core scraping service (Cheerio-based extraction + scoring + search URL validation)
    ├── product.model.ts             # Product, Price, Reviews, RawProduct interfaces
    ├── testing/                     # Test-only helpers
    │   └── search-results.fixture.ts  # Synthetic Amazon results HTML for scraper specs
    ├── loader/                      # Loading spinner component
    │   ├── loader.component.ts
    │   ├── loader.component.html
    │   └── loader.component.css
    └── product-search-result/       # Individual product card component
        ├── product-search-result.component.ts
        ├── product-search-result.component.html
        └── product-search-result.component.css

Repo root: karma.conf.js (test runner config), eslint.config.js, proxy.conf.js (dev-server proxy), ROADMAP.md (backlog)
```

## Key Architecture Patterns

### Search Flow
1. User enters query in AppComponent search input
2. `AppComponent.search()` calls `AmazonScraperService.search(query)`
3. Service fetches HTML from a configurable search URL and extracts product data using Cheerio
4. Results are deduplicated by ASIN and filtered for ratings; each gets a query-match count
5. `AppComponent.visibleProducts` applies the user's filters and sort on every change (no re-fetch)
6. Results are rendered as a list of ProductSearchResultComponent cards

### Scraping & Data Transformation
The `AmazonScraperService` validates the search URL (`validateSearchUrl`: must be a parseable `http(s)` URL) before fetching, then does two-step processing:
- **Extract Phase**: Parses HTML DOM selectors to find: ASIN, title, thumbnail, price (current/list), ratings, review count, badges (Prime, Best Seller, Amazon's Choice, Sponsored)
- **Transform Phase**: Normalizes extracted data into a structured format with:
  - Price object (current, discounted, savings)
  - Reviews object (rating, total_reviews)
  - Bayesian scoring (combines product rating with review count to surface highly-rated products with substantial reviews)

### State Management
- Uses Angular signals (`signal()`) for reactive UI state (loading and error state)
- AppComponent manages the full product list, search query, and filter/sort settings (`hideSponsored`, `primeOnly`, `minRating`, `minPrice`/`maxPrice`, `sortBy`); filters persist between searches
- No global state container; component-level state via signals and RxJS subscriptions
- LocalStorage persists search URL across sessions

### Filters, Sorting & Badges
- `visibleProducts` (getter on AppComponent) filters the stored `products` by sponsored/Prime/min rating/price range, then sorts a copy; products with no readable price are dropped when a price bound is set
- Sort modes: `match` (query-term hits, then Bayesian score; default) and `rating` (Bayesian score only)
- Product cards show Best Seller, Amazon's Choice and Sponsored badges, plus list price and savings for discounted items

### Responsive Design
- Media queries for portrait/landscape orientation
- Mobile-optimized search button (emoji icon "🔍" on mobile, text on desktop)
- Flexible product card layout (row in landscape, column in portrait)

## Common Development Commands

### Development Server
```bash
npm start
# Runs `ng serve` at http://localhost:4200/
# Auto-reloads on file changes
```

### Local development against Amazon (CORS)
The browser fetches the search URL directly, so a cross-origin URL needs CORS headers. `npm start` proxies `/amazon/*` to `https://www.amazon.com` via `proxy.conf.js` (override with `SEARCH_PROXY_TARGET`), so locally open:
```
http://localhost:4200/?http://localhost:4200/amazon/s?k=
```

### Build for Production
```bash
npm run build
# Generates `dist/` directory with base-href=/cadabra-search/
# Optimized build with tree-shaking, minification
```

### Testing
```bash
npm test
# Runs Karma with Jasmine
# Watch mode by default

# Run single test:
npm test -- --include='**/amazon-scraper.service.spec.ts'
```

### Lint and CI test run
```bash
npm run lint      # ESLint (angular-eslint)
npm run test:ci   # single headless Karma run, as CI does
```

### Watch Mode (development builds)
```bash
npm run watch
# Rebuilds on changes without running dev server
```

### Code Quality
- **Linting**: ESLint via angular-eslint (`eslint.config.js`); run `npm run lint`. CI runs it before the tests
- **Type Checking**: Enabled via `tsconfig.json` with strict mode
  - `strict: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
- **Angular Compiler Strict Mode**: Enabled
  - `strictInjectionParameters: true`, `strictInputAccessModifiers: true`, `strictTemplates: true`

## Search URL Configuration
The app accepts search URL via URL query parameter:
```
?https://example.com/search?q=
```
The whole query string is used verbatim as the search URL (it is read raw, because Angular's query-param parsing would split it on `?` and `=`), and it must be an `http(s)` URL.
This is stored in localStorage for persistence. The AppComponent initializes search URL from localStorage or query params on init.

## Important Implementation Details

### Bayesian Score Calculation
The service applies a Bayesian average to balance ratings with review count:
```typescript
const NUM_REVIEWS = 100;  // Prior belief weight
const AVG_RATING = 2.25;  // Prior average rating
score = (rating * total_reviews + NUM_REVIEWS * AVG_RATING) / (total_reviews + NUM_REVIEWS)
```
This prevents low-review products from ranking too high.

### Deduplication & Filtering
Products are deduplicated by ASIN (Amazon Standard Identification Number) to handle multiple listings of the same product. Results are filtered to only include products with valid ratings.

### Query Matching
Each product gets a `matches` count of query terms found in its title (case-insensitive). The default "Best match" sort orders by that count, then by Bayesian score.

## Deployment

Push to `main` automatically builds and deploys to GitHub Pages via `.github/workflows/main.yml`. There is no manual deploy step. CI runs `npm run lint`, `npm run test:ci` (headless Chrome via `karma.conf.js`) and then `ng build`; a failing test fails the build job, which blocks the deploy.

## Testing

- Karma runs tests in Chrome; spec files follow Angular conventions (`*.spec.ts`)
- `amazon-scraper.service.spec.ts` runs the extract/transform/search paths against synthetic HTML in `src/app/testing/search-results.fixture.ts`. If Amazon's markup changes, update the service selectors and the fixture together.
- `app.component.spec.ts` covers filtering and sorting (`visibleProducts`); `product-search-result.component.spec.ts` covers the card, badges and prices
- Headless run: `npm run test:ci` (uses the `ChromeHeadlessCI` launcher in `karma.conf.js`, which adds `--no-sandbox`; set `CHROME_BIN` if Chrome isn't on the default path)

## Build Budgets

- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

## Conventions

- All components use standalone APIs (`imports: []`), no NgModules

