import { TestBed } from '@angular/core/testing';

import { AmazonScraperService } from './amazon-scraper.service';
import { RawProduct } from './product.model';
import {
  DISCOUNTED_PRIME_BEST_SELLER,
  FULL_PAGE,
  page,
  UNRATED,
} from './testing/search-results.fixture';

const bayesian = (rating: number, reviews: number) =>
  (rating * reviews + 100 * 2.25) / (reviews + 100);

describe('AmazonScraperService', () => {
  let service: AmazonScraperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmazonScraperService);
  });

  describe('extract', () => {
    it('returns only rated search results, in page order', () => {
      const products = service.extract(FULL_PAGE);

      expect(products.map((p) => p.asin)).toEqual([
        'B0AAAAAAAA',
        'B0BBBBBBBB',
        'B0CCCCCCCC',
      ]);
    });

    it('returns nothing for a page without results', () => {
      expect(service.extract('<html><body>Captcha</body></html>')).toEqual([]);
    });

    it('drops products without a rating', () => {
      expect(service.extract(page(UNRATED))).toEqual([]);
    });

    it('extracts basic fields and builds the product URL', () => {
      const [p] = service.extract(page(DISCOUNTED_PRIME_BEST_SELLER));

      expect(p.asin).toBe('B0AAAAAAAA');
      expect(p.title).toBe('Acme 2.5G Network Switch');
      expect(p.thumbnail).toBe('https://example.com/thumb.jpg');
      expect(p.url).toBe('https://www.amazon.com/dp/B0AAAAAAAA');
    });

    it('parses rating and a comma-separated review count', () => {
      const [p] = service.extract(page(DISCOUNTED_PRIME_BEST_SELLER));

      expect(p.reviews).toEqual({ rating: 4.5, total_reviews: 1234 });
    });

    it('detects Prime and Best Seller badges', () => {
      const [p] = service.extract(page(DISCOUNTED_PRIME_BEST_SELLER));

      expect(p.amazonPrime).toBeTrue();
      expect(p.bestSeller).toBeTrue();
      expect(p.sponsored).toBeFalse();
      expect(p.amazonChoice).toBeFalse();
    });

    it('detects Sponsored and Amazon\'s Choice badges', () => {
      const sponsored = service.extract(FULL_PAGE)[1];

      expect(sponsored.sponsored).toBeTrue();
      expect(sponsored.amazonChoice).toBeTrue();
      expect(sponsored.amazonPrime).toBeFalse();
      expect(sponsored.bestSeller).toBeFalse();
    });

    it('computes the discount from current and list price', () => {
      const [p] = service.extract(page(DISCOUNTED_PRIME_BEST_SELLER));

      expect(p.price).toEqual({
        current_price: 30,
        currency: '$',
        discounted: true,
        before_price: 40,
        savings_amount: 10,
        savings_percent: 25,
      });
    });

    it('parses prices containing thousands separators', () => {
      const p = service.extract(FULL_PAGE)[1];

      expect(p.price.current_price).toBe(1299.5);
      expect(p.price.discounted).toBeFalse();
    });

    it('does not treat an equal list price as a discount', () => {
      const p = service.extract(FULL_PAGE)[2];

      expect(p.price.discounted).toBeFalse();
      expect(p.price.before_price).toBe(0);
      expect(p.price.savings_amount).toBe(0);
    });

    it('applies the Bayesian score', () => {
      const [p] = service.extract(page(DISCOUNTED_PRIME_BEST_SELLER));

      expect(p.score).toBeCloseTo(bayesian(4.5, 1234), 10);
    });
  });

  describe('transform', () => {
    const raw: RawProduct = {
      asin: 'B0TESTTEST',
      title: 't',
      sponsored: false,
      amazonChoice: false,
      bestSeller: false,
      amazonPrime: false,
      priceText: '$10.00',
      listPriceText: '$15.00',
      ratingText: '4.0 out of 5 stars',
      totalReviewsText: '900 ratings',
    };

    it('pulls the score towards the prior for few reviews', () => {
      const few = service.transform({ ...raw, totalReviewsText: '1 ratings' });
      const many = service.transform({ ...raw, totalReviewsText: '5,000 ratings' });

      expect(few.score).toBeLessThan(many.score);
      expect(few.score).toBeCloseTo(bayesian(4, 1), 10);
    });

    it('rounds savings to two decimals', () => {
      const p = service.transform({ ...raw, priceText: '$9.99', listPriceText: '$14.99' });

      expect(p.price.savings_amount).toBe(5);
      expect(p.price.savings_percent).toBe(33.36);
    });

    it('produces a NaN rating when none is present, so extract can drop it', () => {
      const p = service.transform({ ...raw, ratingText: '', totalReviewsText: '' });

      expect(p.reviews.rating).toBeNaN();
    });
  });

  describe('validateSearchUrl', () => {
    it('accepts http and https URLs', () => {
      expect(service.validateSearchUrl('https://example.com/search?q=')).toBeNull();
      expect(service.validateSearchUrl('http://localhost:8080/s?k=')).toBeNull();
    });

    it('rejects an empty or blank URL', () => {
      expect(service.validateSearchUrl('')).toContain('No search URL configured');
      expect(service.validateSearchUrl('   ')).toContain('No search URL configured');
    });

    it('rejects text that is not a URL', () => {
      expect(service.validateSearchUrl('example.com/search?q=')).toContain('not a valid URL');
    });

    it('rejects non-http protocols', () => {
      expect(service.validateSearchUrl('ftp://example.com/')).toContain('http:// or https://');
      expect(service.validateSearchUrl('javascript:alert(1)')).toContain('http:// or https://');
    });
  });

  describe('search', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      service.searchUrl = 'https://example.com/search?q=';
      fetchSpy = spyOn(window, 'fetch');
    });

    it('fetches searchUrl + query and extracts the results', async () => {
      fetchSpy.and.resolveTo(new Response(FULL_PAGE));

      const products = await service.search('switch');

      expect(fetchSpy.calls.mostRecent().args[0]).toBe(
        'https://example.com/search?q=switch'
      );
      expect(products.length).toBe(3);
    });

    it('rejects without fetching when the search URL is invalid', async () => {
      service.searchUrl = '';

      await expectAsync(service.search('x')).toBeRejectedWithError(
        /No search URL configured/
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects with a readable message on a network failure', async () => {
      fetchSpy.and.rejectWith(new TypeError('Failed to fetch'));

      await expectAsync(service.search('x')).toBeRejectedWithError(
        'Network error — check your connection or search URL.'
      );
    });

    it('rejects with the status on a non-2xx response', async () => {
      fetchSpy.and.resolveTo(
        new Response('', { status: 503, statusText: 'Service Unavailable' })
      );

      await expectAsync(service.search('x')).toBeRejectedWithError(
        'Search failed (503 Service Unavailable).'
      );
    });
  });
});
