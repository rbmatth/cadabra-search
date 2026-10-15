export interface Price {
  current_price: number;
  currency: string;
  discounted: boolean;
  before_price: number;
  savings_amount: number;
  savings_percent: number;
}

export interface Reviews {
  rating: number;
  total_reviews: number;
}

export interface RawProduct {
  asin: string;
  title: string;
  thumbnail?: string;
  sponsored: boolean;
  amazonChoice: boolean;
  bestSeller: boolean;
  amazonPrime: boolean;
  priceText: string;
  listPriceText: string;
  ratingText: string;
  totalReviewsText: string;
}

export interface Product {
  asin: string;
  title: string;
  thumbnail?: string;
  price: Price;
  reviews: Reviews;
  url: string;
  score: number;
  sponsored: boolean;
  amazonChoice: boolean;
  bestSeller: boolean;
  amazonPrime: boolean;
  matches?: number;
}
