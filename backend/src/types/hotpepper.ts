export const HOTPEPPER_RANGES = [1, 2, 3, 4, 5] as const;
export type HotPepperRange = (typeof HOTPEPPER_RANGES)[number];

export interface ShopPhoto {
  pc?: { l?: string; m?: string; s?: string };
}

export interface HotPepperShop {
  id: string;
  name: string;
  address: string;
  access: string;
  lat: number;
  lng: number;
  urls?: { pc?: string };
  photo?: ShopPhoto;
  open?: string;
  close?: string;
  genre?: { name?: string; catch?: string };
  budget?: { name?: string; average?: string };
}

export interface HotPepperApiError {
  code: number | string;
  message: string;
}

export interface HotPepperResults {
  api_version: string;
  results_available: number;
  results_returned: number;
  results_start: number;
  shop?: HotPepperShop[] | HotPepperShop;
  error?: HotPepperApiError | HotPepperApiError[];
}

export interface HotPepperApiResponse {
  results: HotPepperResults;
}

export interface ShopSearchQuery {
  lat: number;
  lng: number;
  range: HotPepperRange;
  start: number;
  count: number;
}

export interface ShopSearchResponse {
  shops: HotPepperShop[];
  pagination: {
    total: number;
    returned: number;
    start: number;
    count: number;
  };
}

export class HotPepperServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
    public readonly code = "HOTPEPPER_UPSTREAM_ERROR",
  ) {
    super(message);
    this.name = "HotPepperServiceError";
  }
}
