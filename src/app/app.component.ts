import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmazonScraperService } from './amazon-scraper.service';
import { ProductSearchResultComponent } from './product-search-result/product-search-result.component';
import { Product } from './product.model';
import { LoaderComponent } from './loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ProductSearchResultComponent,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Amazon Search';
  query = '';
  products: Product[] = [];
  lastKey = '';
  loading = signal(false);
  error = signal<string | null>(null);
  searched = false;

  hideSponsored = false;
  primeOnly = false;
  sortBy: 'match' | 'rating' = 'match';
  minRating = 0;
  minPrice: number | null = null;
  maxPrice: number | null = null;

  private _location = inject(Location);
  private _scraper = inject(AmazonScraperService);

  ngOnInit() {
    const searchUrl = localStorage.getItem('searchUrl');
    if (searchUrl) {
      // console.log('searchUrl retrieved from local storage', searchUrl);
      this._scraper.searchUrl = searchUrl;
    }

    // The whole query string is the search URL (?https://example.com/s?q=).
    // Read it raw: Angular's query-param parsing would split it on ? and =.
    const searchUrlParam = this._location.path().split('?').slice(1).join('?');
    if (searchUrlParam) {
      this._location.go('/');

      const invalid = this._scraper.validateSearchUrl(searchUrlParam);
      if (invalid) {
        this.error.set(invalid);
      } else {
        this._scraper.searchUrl = searchUrlParam;
        localStorage.setItem('searchUrl', searchUrlParam);
        // console.log('searchUrl saved to local storage', searchUrlParam);
      }
    }

    // this.query = '2.5g network switch'; this.search();
  }

  async search() {
    if (this.query.length < 3) return;

    this.loading.set(true);
    this.error.set(null);
    await this._scraper
      .search(this.query)
      .then((results) => {
        this.products = results
          .filter(
            (value, index, self) =>
              index == self.findIndex((p) => p.asin == value.asin)
          )
          .filter((p) => !!p.reviews.rating);

        const queryParts = this.query.split(/\s+/);
        this.products.forEach((p) => {
          p.matches = 0;
          queryParts.forEach((q) => {
            if (p.title.toLowerCase().includes(q.toLowerCase())) p.matches!++;
          });
        });
      })
      .catch((err: Error) => {
        this.error.set(err.message);
        this.products = [];
      })
      .finally(() => {
        this.searched = true;
        this.loading.set(false);
      });
  }

  get visibleProducts(): Product[] {
    const filtered = this.products.filter((p) => {
      if (this.hideSponsored && p.sponsored) return false;
      if (this.primeOnly && !p.amazonPrime) return false;
      if (p.reviews.rating < this.minRating) return false;
      if (this.minPrice != null && !(p.price.current_price >= this.minPrice))
        return false;
      if (this.maxPrice != null && !(p.price.current_price <= this.maxPrice))
        return false;
      return true;
    });

    return filtered.sort((a, b) =>
      this.sortBy === 'match'
        ? (b.matches ?? 0) - (a.matches ?? 0) || b.score - a.score
        : b.score - a.score
    );
  }

  keyUp = (event: KeyboardEvent) => {
    if (event.key == 'Enter') {
      if (document.activeElement instanceof HTMLInputElement)
        document.activeElement.blur();
      this.search();
    }
  };
}
