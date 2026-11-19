import type { Shop } from "./shop";

export interface DemoShop extends Shop {
  distance: string;
  capacity: number;
  reviewScore: string;
  tags: string[];
  imageCredit: "sample";
}
