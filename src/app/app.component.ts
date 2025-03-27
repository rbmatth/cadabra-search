import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmazonScraperService } from './amazon-scraper.service';
import { ProductSearchResultComponent } from './product-search-result/product-search-result.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ProductSearchResultComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Amazon Search';
  query = '';
  products: any[] = [];
  lastKey = "";

  constructor(
    private scraper: AmazonScraperService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    document.addEventListener("keyup", this.keyUp);

    this.route.queryParams.subscribe(params => {
      this.scraper.searchUrl = Object.keys(params)[0];
    });
  }

  async search() {
    if (this.query.length < 3) return;

    this.products = await this.scraper.search(this.query);
    // this.products = sampleProducts;
    this.products = this.products
      .filter((value, index, self) => index == self.indexOf(self.find(p => p.aisn == value.aisn)))
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
  }

  keyUp = (event: KeyboardEvent) => {
    this.lastKey = `${event.key} ${event.target?.toString()}`; 
    if (event.code == 'Enter') this.search();
  }
}
