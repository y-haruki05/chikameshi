export interface ShopPhoto {
  pc?: { l?: string; m?: string; s?: string };
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  access: string;
  lat: number;
  lng: number;
  urls?: { pc?: string };
  photo?: ShopPhoto;
  capacity?: number;
  open?: string;
  close?: string;
  genre?: { name?: string; catch?: string };
  budget?: { name?: string; average?: string };
}

export interface ShopSearchResponse {
  shops: Shop[];
  pagination: {
    total: number;
    returned: number;
    start: number;
    count: number;
  };
}

export interface ApiError {
  error: { code: string; message: string };
}
