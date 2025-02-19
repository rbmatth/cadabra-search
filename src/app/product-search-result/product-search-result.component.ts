import { CommonModule } from '@angular/common';
import { Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-search-result',
  imports: [CommonModule],
  templateUrl: './product-search-result.component.html',
  styleUrls: ['./product-search-result.component.css'],
})
export class ProductSearchResultComponent {
  @Input() product: any;

  constructor() {}
}
