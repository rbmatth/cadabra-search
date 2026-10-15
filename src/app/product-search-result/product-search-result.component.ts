import { CommonModule } from '@angular/common';
import { Product } from '../product.model';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-product-search-result',
  imports: [CommonModule],
  templateUrl: './product-search-result.component.html',
  styleUrls: ['./product-search-result.component.css'],
})
export class ProductSearchResultComponent {
  @Input({ required: true }) product!: Product;
}
