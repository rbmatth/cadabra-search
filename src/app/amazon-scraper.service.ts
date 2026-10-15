import { Injectable } from '@angular/core';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

import { Price, Product, RawProduct } from './product.model';

@Injectable({
  providedIn: 'root',
})
export class AmazonScraperService {
  public searchUrl = '';

  /** Returns a user-facing message if the URL is unusable, else null. */
  validateSearchUrl(searchUrl: string): string | null {
    if (!searchUrl.trim()) {
      return 'No search URL configured. Open the app with ?<search URL> appended to its address.';
    }

    let parsed: URL;
    try {
      parsed = new URL(searchUrl);
    } catch {
      return `Search URL is not a valid URL: ${searchUrl}`;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Search URL must start with http:// or https://.';
    }

    return null;
  }

  async search(query: string): Promise<Product[]> {
    const invalid = this.validateSearchUrl(this.searchUrl);
    if (invalid) throw new Error(invalid);

    const url = this.searchUrl + query;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          origin: window.location.protocol + '//' + window.location.host,
        },
      });
    } catch {
      throw new Error('Network error — check your connection or search URL.');
    }

    if (!response.ok) {
      throw new Error(`Search failed (${response.status} ${response.statusText}).`);
    }

    const body = await response.text();
    const products = this.extract(body);
    return products;
  }

  extract(body: string): Product[] {
    const $ = cheerio.load(body.replace(/\s\s+/g, '').replace(/\n/g, ''));
    const productList = $(`div[data-component-type="s-search-result"]`);

    return productList
      .toArray()
      .map((product: Element) => {
        const $product = $(product);
        const asin = product.attribs['data-asin'];

        const priceText = $product
          .find(`.a-price[data-a-color="base"] .a-offscreen`)
          .text();

        const listPriceText = $product
          .find(`.a-price[data-a-color="secondary"] .a-offscreen`)
          .text();

        const title = $product.find(`[data-cy="title-recipe"] h2 span`).text();
        const thumbnail = $product
          .find(`[data-image-source-density="1"]`)
          .attr('src');

        const sponsored = !!$product.find(`.puis-sponsored-label-text`)[0];
        const amazonChoice = !!$product.find(`span[id$="-amazons-choice"]`)[0];
        const bestSeller = !!$product.find(`span[id$="-best-seller"]`)[0];
        const amazonPrime = !!$product.find(`.s-prime`)[0];

        const ratingText = $product
          .find(`[data-cy="reviews-ratings-slot"] span`)
          .text();
        const totalReviewsText =
          $product
            .find(`[data-csa-c-slot-id="alf-reviews"] *`)
            .attr('aria-label') ?? '';

        const result: RawProduct = {
          asin,
          title,
          thumbnail,
          sponsored,
          amazonChoice,
          bestSeller,
          amazonPrime,
          priceText,
          listPriceText,
          ratingText,
          totalReviewsText,
        };

        const transformedResult = this.transform(result);
        return transformedResult;
      })
      
      .filter((p) => !isNaN(p.reviews.rating));
  }

  transform(product: RawProduct): Product {
    const NUM_REVIEWS = 100;
    const AVG_RATING = 2.25;

    const url = 'https://www.amazon.com/dp/' + product.asin;

    const price: Price = {
      discounted: false,
      current_price: extractPrice(product.priceText),
      currency: '$',
      before_price: 0,
      savings_amount: 0,
      savings_percent: 0,
    };

    if (product.listPriceText) {
      (price.before_price = extractPrice(product.listPriceText)),
        (price.discounted = true);

      const savings = price.before_price - price.current_price;
      if (savings <= 0) {
        price.discounted = false;
        price.before_price = 0;
      } else {
        price.savings_amount = +(
          price.before_price - price.current_price
        ).toFixed(2);
        price.savings_percent = +(
          (100 / price.before_price) *
          price.savings_amount
        ).toFixed(2);
      }
    }

    const reviews = {
      total_reviews: parseInt(product.totalReviewsText.replace(/\,/g, '')),
      rating: parseFloat(product.ratingText),
    };

    const score =
      (reviews.rating * reviews.total_reviews + NUM_REVIEWS * AVG_RATING) /
      (reviews.total_reviews + NUM_REVIEWS);

    const result: Product = {
      asin: product.asin,
      title: product.title,
      thumbnail: product.thumbnail,
      price,
      reviews,
      url,
      score,
      sponsored: product.sponsored,
      amazonChoice: product.amazonChoice,
      bestSeller: product.bestSeller,
      amazonPrime: product.amazonPrime,
    };

    return result;
  }
}

function extractPrice(price: string): number {
  return parseFloat(price.replaceAll(/[^\d.]/g, ''));
}
