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
    ├── app.component.ts             # Root component - search UI + result management
    ├── app.component.html           # Search bar + results list layout
    ├── app.component.css            # Responsive search container styling
    ├── app.config.ts                # Angular application config
    ├── app.routes.ts                # Routing (currently empty, no sub-routes)
    ├── amazon-scraper.service.ts    # Core scraping service (Cheerio-based extraction + scoring)
    ├── loader/                      # Loading spinner component
    │   ├── loader.component.ts
    │   ├── loader.component.html
    │   └── loader.component.css
    └── product-search-result/       # Individual product card component
        ├── product-search-result.component.ts
        ├── product-search-result.component.html
        └── product-search-result.component.css
```

## Key Architecture Patterns

### Search Flow
1. User enters query in AppComponent search input
2. `AppComponent.search()` calls `AmazonScraperService.search(query)`
3. Service fetches HTML from a configurable search URL and extracts product data using Cheerio
4. Results are deduplicated by ASIN, filtered for ratings, sorted by relevance score
5. Results are rendered as a list of ProductSearchResultComponent cards

### Scraping & Data Transformation
The `AmazonScraperService` does two-step processing:
- **Extract Phase**: Parses HTML DOM selectors to find: ASIN, title, thumbnail, price (current/list), ratings, review count, badges (Prime, Best Seller, Amazon's Choice, Sponsored)
- **Transform Phase**: Normalizes extracted data into a structured format with:
  - Price object (current, discounted, savings)
  - Reviews object (rating, total_reviews)
  - Bayesian scoring (combines product rating with review count to surface highly-rated products with substantial reviews)

### State Management
- Uses Angular signals (`signal()`) for reactive UI state (loading state)
- AppComponent manages product list and search query
- No global state container; component-level state via signals and RxJS subscriptions
- LocalStorage persists search URL across sessions

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

### Watch Mode (development builds)
```bash
npm run watch
# Rebuilds on changes without running dev server
```

### Code Quality
- **Linting**: Not configured
- **Type Checking**: Enabled via `tsconfig.json` with strict mode
  - `strict: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
- **Angular Compiler Strict Mode**: Enabled
  - `strictInjectionParameters: true`, `strictInputAccessModifiers: true`, `strictTemplates: true`

## Search URL Configuration
The app accepts search URL via URL query parameter:
```
?https://example.com/search?q=
```
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
Search results are sorted by how many query terms appear in the product title (case-insensitive), then by Bayesian score.

## Dependencies to Know

- **@angular/platform-browser-dynamic**: Bootstraps standalone Angular app
- **cheerio**: Server-side DOM parsing (used in browser context for HTML extraction)
- **rxjs**: Reactive programming for async operations and observables
- **zone.js**: Angular change detection zone management

## Testing

- Karma runs tests in Chrome; spec files follow Angular conventions (`*.spec.ts`)
- Current test suites are minimal stubs

## Performance & Build Budgets

Angular build configured with size budgets:
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

Ensure new features don't exceed these limits.

## Known Patterns & Conventions

- **Standalone Components**: All components use standalone APIs (`imports: []`), no NgModules
- **Async Patterns**: Uses `async/await` in service, signals for loading state
- **Template Binding**: Two-way binding with `[(ngModel)]`, event binding with `(keyup)`, property binding with `[property]`
- **CSS**: Plain CSS with media queries for responsiveness; no CSS variables or preprocessors configured

