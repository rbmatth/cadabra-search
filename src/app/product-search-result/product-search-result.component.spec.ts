import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Product } from '../product.model';
import { ProductSearchResultComponent } from './product-search-result.component';

const product = (overrides: Partial<Product> = {}): Product => ({
  asin: 'B0AAAAAAAA',
  title: 'Acme Switch',
  thumbnail: 'https://example.com/t.jpg',
  price: {
    current_price: 30,
    currency: '$',
    discounted: false,
    before_price: 0,
    savings_amount: 0,
    savings_percent: 0,
  },
  reviews: { rating: 4.5, total_reviews: 1234 },
  url: 'https://www.amazon.com/dp/B0AAAAAAAA',
  score: 4.4,
  sponsored: false,
  amazonChoice: false,
  bestSeller: false,
  amazonPrime: false,
  ...overrides,
});

describe('ProductSearchResultComponent', () => {
  let fixture: ComponentFixture<ProductSearchResultComponent>;

  const render = (p: Product): HTMLElement => {
    fixture = TestBed.createComponent(ProductSearchResultComponent);
    fixture.componentRef.setInput('product', p);
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSearchResultComponent],
    }).compileComponents();
  });

  it('shows title, rating, review count and price', () => {
    const el = render(product());

    expect(el.querySelector('.title')?.textContent).toContain('Acme Switch');
    expect(el.textContent).toContain('4.5');
    expect(el.textContent).toContain('1,234');
    expect(el.querySelector('.current-price')?.textContent).toContain('$30.00');
  });

  it('shows no badges for a plain product', () => {
    const el = render(product());

    expect(el.querySelector('.badges')).toBeNull();
    expect(el.querySelector('.prime')).toBeNull();
    expect(el.querySelector('.list-price')).toBeNull();
  });

  it('shows each badge that applies', () => {
    const el = render(
      product({ bestSeller: true, amazonChoice: true, sponsored: true })
    );

    expect(el.querySelector('.best-seller')?.textContent).toContain('Best Seller');
    expect(el.querySelector('.amazon-choice')?.textContent).toContain("Amazon's Choice");
    expect(el.querySelector('.sponsored')?.textContent).toContain('Sponsored');
  });

  it('shows only the badges that apply', () => {
    const el = render(product({ bestSeller: true }));

    expect(el.querySelector('.best-seller')).not.toBeNull();
    expect(el.querySelector('.amazon-choice')).toBeNull();
    expect(el.querySelector('.sponsored')).toBeNull();
  });

  it('shows list price and savings for a discounted product', () => {
    const base = product();
    const el = render(
      product({
        price: {
          ...base.price,
          discounted: true,
          before_price: 40,
          savings_amount: 10,
          savings_percent: 25,
        },
      })
    );

    expect(el.querySelector('.list-price')?.textContent).toContain('$40.00');
    expect(el.querySelector('.savings')?.textContent).toContain('-25%');
  });

  it('shows the Prime marker', () => {
    const el = render(product({ amazonPrime: true }));

    expect(el.querySelector('.prime')).not.toBeNull();
  });
});
