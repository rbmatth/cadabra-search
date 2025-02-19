import { Injectable } from '@angular/core';
import * as cheerio from 'cheerio';

@Injectable({
  providedIn: 'root',
})
export class AmazonScraperService {
  public searchUrl = '';

  async search(query: string): Promise<any[]> {
    const url = this.searchUrl + query;

    const response = await fetch(url, {
      headers: {
        origin: window.location.protocol + '//' + window.location.host,
      },
    });
    const body = await response.text();
    const products = this.extract(body);
    return products;
  }

  extract(body: string) {
    const $ = cheerio.load(body.replace(/\s\s+/g, '').replace(/\n/g, ''));
    const productList = $(`div[data-component-type="s-search-result"]`);

    return productList
      .toArray()
      .map((product: any) => {
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

        const result = {
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
      .filter((p: any) => !isNaN(p.reviews.rating));
  }

  transform(product: any) {
    const NUM_REVIEWS = 100;
    const AVG_RATING = 2.25;

    const url = 'https://www.amazon.com/dp/' + product.asin;

    const price = {
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

    const result = {
      dto: product,
      aisn: product.asin,
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
