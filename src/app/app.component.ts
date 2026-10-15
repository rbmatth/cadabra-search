import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmazonScraperService } from './amazon-scraper.service';
import { ProductSearchResultComponent } from './product-search-result/product-search-result.component';
import { ActivatedRoute } from '@angular/router';
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
export class AppComponent {
  title = 'Amazon Search';
  query = '';
  products: Product[] = [];
  lastKey = '';
  loading = signal(false);
  error = signal<string | null>(null);
  searched = false;

  hideSponsored = false;
  primeOnly = false;
  minRating = 0;
  minPrice: number | null = null;
  maxPrice: number | null = null;

  private _location = inject(Location);
  private _scraper = inject(AmazonScraperService);
  private _route = inject(ActivatedRoute);

  ngOnInit() {
    const searchUrl = localStorage.getItem('searchUrl');
    if (searchUrl) {
      // console.log('searchUrl retrieved from local storage', searchUrl);
      this._scraper.searchUrl = searchUrl;
    }

    this._route.queryParams.subscribe((params) => {
      const searchUrlParam = Object.keys(params)[0];
      if (!searchUrlParam) return;

      this._scraper.searchUrl = searchUrlParam;
      this._location.go('/');

      localStorage.setItem('searchUrl', searchUrlParam);
      // console.log('searchUrl saved to local storage', searchUrlParam);
    });

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
          .filter((p) => !!p.reviews.rating)
          .sort((a, b) => b.score - a.score);

        const queryParts = this.query.split(/\s+/);
        this.products.forEach((p) => {
          p.matches = 0;
          queryParts.forEach((q) => {
            if (p.title.toLowerCase().includes(q.toLowerCase())) p.matches!++;
          });
        });

        this.products = this.products
          // .filter((p) => p.matches > 0)
          .sort((a, b) => (b.matches ?? 0) - (a.matches ?? 0));
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
    return this.products.filter((p) => {
      if (this.hideSponsored && p.sponsored) return false;
      if (this.primeOnly && !p.amazonPrime) return false;
      if (p.reviews.rating < this.minRating) return false;
      if (this.minPrice != null && !(p.price.current_price >= this.minPrice))
        return false;
      if (this.maxPrice != null && !(p.price.current_price <= this.maxPrice))
        return false;
      return true;
    });
  }

  keyUp = (event: KeyboardEvent) => {
    if (event.key == 'Enter') {
      if (document.activeElement instanceof HTMLInputElement)
        document.activeElement.blur();
      this.search();
    }
  };
}
