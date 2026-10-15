import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { AmazonScraperService } from './amazon-scraper.service';
import { Product } from './product.model';

const product = (
  asin: string,
  o: Partial<Omit<Product, 'price'>> & { cost?: number } = {}
): Product => {
  const { cost, ...rest } = o;
  return {
    asin,
    title: asin,
    price: {
      current_price: cost ?? 10,
      currency: '$',
      discounted: false,
      before_price: 0,
      savings_amount: 0,
      savings_percent: 0,
    },
    reviews: { rating: 4, total_reviews: 100 },
    url: '',
    score: 4,
    sponsored: false,
    amazonChoice: false,
    bestSeller: false,
    amazonPrime: false,
    ...rest,
  };
};

describe('AppComponent', () => {
  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    app = TestBed.createComponent(AppComponent).componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('has the app title', () => {
    expect(app.title).toEqual('Amazon Search');
  });

  describe('search URL from the query string', () => {
    const create = (rawQuery: string) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AppComponent],
        providers: [
          provideRouter([]),
          provideLocationMocks(),
        ],
      });
      TestBed.inject(Location).go('/?' + rawQuery);
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
    };

    beforeEach(() => localStorage.removeItem('searchUrl'));
    afterEach(() => localStorage.removeItem('searchUrl'));

    it('stores a valid URL and uses it for searching', () => {
      create('https://example.com/search?q=');

      expect(TestBed.inject(AmazonScraperService).searchUrl).toBe(
        'https://example.com/search?q='
      );
      expect(localStorage.getItem('searchUrl')).toBe('https://example.com/search?q=');
    });

    it('shows an error and does not store an invalid URL', () => {
      const component = create('not a url');

      expect(component.error()).toContain('not a valid URL');
      expect(localStorage.getItem('searchUrl')).toBeNull();
      expect(TestBed.inject(AmazonScraperService).searchUrl).toBe('');
    });
  });

  describe('visibleProducts', () => {
    beforeEach(() => {
      app.products = [
        product('plain', { score: 3, matches: 1, cost: 10 }),
        product('sponsored', { sponsored: true, score: 4, matches: 1, cost: 20 }),
        product('prime', { amazonPrime: true, score: 5, matches: 0, cost: 30 }),
        product('lowrated', {
          reviews: { rating: 2.5, total_reviews: 50 },
          score: 2,
          matches: 2,
          cost: 40,
        }),
      ];
    });

    const asins = () => app.visibleProducts.map((p) => p.asin);

    it('defaults to best match: query hits, then score', () => {
      expect(asins()).toEqual(['lowrated', 'sponsored', 'plain', 'prime']);
    });

    it('sorts by score when set to highest rated', () => {
      app.sortBy = 'rating';

      expect(asins()).toEqual(['prime', 'sponsored', 'plain', 'lowrated']);
    });

    it('hides sponsored products', () => {
      app.hideSponsored = true;

      expect(asins()).not.toContain('sponsored');
      expect(asins().length).toBe(3);
    });

    it('keeps only Prime products', () => {
      app.primeOnly = true;

      expect(asins()).toEqual(['prime']);
    });

    it('applies the minimum rating', () => {
      app.minRating = 3;

      expect(asins()).not.toContain('lowrated');
    });

    it('applies the price range inclusively', () => {
      app.minPrice = 20;
      app.maxPrice = 30;

      expect(asins().sort()).toEqual(['prime', 'sponsored']);
    });

    it('excludes products without a price when a price bound is set', () => {
      app.products.push(product('noprice', { cost: NaN }));
      app.minPrice = 0;

      expect(asins()).not.toContain('noprice');
    });

    it('does not reorder the underlying product list', () => {
      const before = app.products.map((p) => p.asin);
      app.sortBy = 'rating';
      expect(app.visibleProducts.length).toBe(4);

      expect(app.products.map((p) => p.asin)).toEqual(before);
    });
  });
});
