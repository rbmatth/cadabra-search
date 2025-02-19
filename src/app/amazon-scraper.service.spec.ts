/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AmazonScraperService } from './amazon-scraper.service';

describe('Service: AmazonScraper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AmazonScraperService]
    });
  });

  it('should ...', inject([AmazonScraperService], (service: AmazonScraperService) => {
    expect(service).toBeTruthy();
  }));
});
