# Roadmap

Backlog assessed by effort and impact.

## High impact, low effort

- **Discount badge / strikethrough** — `price.discounted`, `savings_percent`, `before_price` all calculated; pure template work
- **Sponsored / Best Seller / Amazon's Choice badges** — data already extracted, zero logic needed
- **Error handling** — no try/catch on the fetch; silent failures produce a blank UI with no feedback
- **Empty/zero results state** — one `*ngIf` in template; currently shows blank
- **Price range filter** — `current_price` is already a number; two inputs + one `.filter()` call
- **Filter controls** — hide sponsored, Prime-only, min rating threshold; all flags already on the product object

## Medium impact, low effort

- **`aisn` typo** — both sides of dedup use `aisn` so it works, but rename to `asin` throughout
- **Typed interfaces** — define `Product`, `Price`, `Reviews` to eliminate `any[]` in component and service
- **Sort toggle** — switch between "best match" (query term hits) and "highest rated" (Bayesian score); both values already computed
- **Search URL validation** — simple URL parse before fetch to prevent confusing errors

## Low impact, low effort

- **ESLint** — `ng add @angular-eslint/schematics`
- **Proxy config** — `proxy.conf.json` for `ng serve` to make the CORS dependency explicit for local dev
- **GitHub Actions CI** — `ng build && ng test --watch=false` (workflow file exists at `.github/workflows/main.yml` but may be incomplete)

## Medium effort

- **Search history dropdown** — recent queries in localStorage, shown on input focus; needs dropdown UI and click-outside handling
- **Debounced auto-search** — RxJS `Subject` + `debounceTime`; low urgency since Enter works fine
