// Minimal HTML modelled on Amazon's search results markup, containing only
// what AmazonScraperService selects on. If Amazon changes its markup, update
// the selectors in the service and mirror the change here.

const result = (inner: string, asin: string) =>
  `<div data-component-type="s-search-result" data-asin="${asin}">${inner}</div>`;

const title = (text: string) =>
  `<div data-cy="title-recipe"><h2><span>${text}</span></h2></div>`;

const image = `<img data-image-source-density="1" src="https://example.com/thumb.jpg">`;

const price = (color: 'base' | 'secondary', text: string) =>
  `<span class="a-price" data-a-color="${color}"><span class="a-offscreen">${text}</span></span>`;

const rating = (stars: string, count: string) =>
  `<div data-cy="reviews-ratings-slot"><span>${stars} out of 5 stars</span></div>` +
  `<div data-csa-c-slot-id="alf-reviews"><a aria-label="${count} ratings"><span>${count}</span></a></div>`;

/** Discounted, Prime, Best Seller; 1,234 reviews at 4.5 stars. */
export const DISCOUNTED_PRIME_BEST_SELLER = result(
  title('Acme 2.5G Network Switch') +
    image +
    '<span id="B0AAAAAAAA-best-seller"></span>' +
    rating('4.5', '1,234') +
    price('base', '$30.00') +
    price('secondary', '$40.00') +
    '<i class="s-prime"></i>',
  'B0AAAAAAAA'
);

/** Sponsored + Amazon's Choice, no list price, no Prime. */
export const SPONSORED_CHOICE = result(
  title('Globex 8-Port Switch') +
    image +
    '<span class="puis-sponsored-label-text">Sponsored</span>' +
    '<span id="B0BBBBBBBB-amazons-choice"></span>' +
    rating('4.0', '56') +
    price('base', '$1,299.50'),
  'B0BBBBBBBB'
);

/** List price is not above the current price, so it is not a discount. */
export const FAKE_DISCOUNT = result(
  title('Initech Cable') +
    image +
    rating('3.8', '10') +
    price('base', '$20.00') +
    price('secondary', '$20.00'),
  'B0CCCCCCCC'
);

/** No ratings at all; extract() must drop it. */
export const UNRATED = result(
  title('Umbrella Unrated Gadget') + image + price('base', '$5.00'),
  'B0DDDDDDDD'
);

/** Not a search result; extract() must ignore it. */
export const NOT_A_RESULT = '<div data-component-type="s-ad-banner">Ad</div>';

export const page = (...items: string[]) =>
  `<html><body><div class="s-main-slot">${items.join('')}</div></body></html>`;

export const FULL_PAGE = page(
  DISCOUNTED_PRIME_BEST_SELLER,
  NOT_A_RESULT,
  SPONSORED_CHOICE,
  UNRATED,
  FAKE_DISCOUNT
);
