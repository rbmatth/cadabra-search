import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmazonScraperService } from './amazon-scraper.service';
import { ProductSearchResultComponent } from './product-search-result/product-search-result.component';
import { ActivatedRoute } from '@angular/router';
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
  products: any[] = [];
  lastKey = '';
  loading = signal(false);

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
    await this._scraper
      .search(this.query)
      .then((results) => {
        this.products = results
          .filter(
            (value, index, self) =>
              index == self.indexOf(self.find((p) => p.aisn == value.aisn))
          )
          .filter((p) => !!p.reviews.rating)
          .sort((a, b) => b.score! - a.score!);

        const queryParts = this.query.split(/\s+/);
        this.products.forEach((p) => {
          p.matches = 0;
          queryParts.forEach((q) => {
            if (p.title.toLowerCase().includes(q.toLowerCase())) p.matches++;
          });
        });

        this.products = this.products
          // .filter((p) => p.matches > 0)
          .sort((a, b) => b.matches - a.matches);
      })
      .finally(() => {
        this.loading.set(false);
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
