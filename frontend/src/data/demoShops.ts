import type { DemoShop } from "../types/demoShop";

/** Sample-only restaurant records. Replace this source with API results in a later issue. */
export const demoShops: DemoShop[] = [
  {
    id: "demo-cafe-mori", name: "喫茶とごはん 森の時計", address: "東京都渋谷区神南1-8-5", access: "渋谷駅から徒歩6分", lat: 35.6622, lng: 139.6991,
    photo: { pc: { l: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=700&q=80" } },
    open: "11:00〜20:00（L.O. 19:30）", close: "火曜日", genre: { name: "カフェ・喫茶", catch: "自家製ごはんと季節のケーキ" }, budget: { name: "1,001〜1,500円", average: "約1,200円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩6分", capacity: 24, reviewScore: "4.6", tags: ["ランチ", "自家製スイーツ"], imageCredit: "sample",
  },
  {
    id: "demo-trattoria-luce", name: "小皿イタリアン ルーチェ", address: "東京都渋谷区宇田川町12-3", access: "渋谷駅から徒歩4分", lat: 35.6617, lng: 139.6988,
    photo: { pc: { l: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80" } },
    open: "11:30〜15:00 / 17:00〜22:30", close: "月曜日", genre: { name: "イタリアン・フレンチ", catch: "季節野菜を楽しむ小皿料理" }, budget: { name: "2,001〜3,000円", average: "約2,600円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩4分", capacity: 32, reviewScore: "4.8", tags: ["ひとりごはん", "ワイン"], imageCredit: "sample",
  },
  {
    id: "demo-sakana-ao", name: "魚と土鍋 あお", address: "東京都渋谷区神山町4-8", access: "渋谷駅から徒歩9分", lat: 35.6651, lng: 139.6965,
    photo: { pc: { l: "https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=700&q=80" } },
    open: "11:30〜14:30 / 17:30〜22:00", close: "水曜日", genre: { name: "和食", catch: "炊きたて土鍋ごはんと旬の魚" }, budget: { name: "1,501〜2,000円", average: "約1,800円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩9分", capacity: 28, reviewScore: "4.7", tags: ["定食", "旬の食材"], imageCredit: "sample",
  },
  {
    id: "demo-spice-nook", name: "スパイス食堂 Nook", address: "東京都渋谷区松濤1-15-7", access: "渋谷駅から徒歩8分", lat: 35.6607, lng: 139.6943,
    photo: { pc: { l: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80" } },
    open: "11:00〜16:00 / 18:00〜21:30", close: "木曜日", genre: { name: "アジア・エスニック", catch: "香り豊かなスパイスカレー" }, budget: { name: "1,001〜1,500円", average: "約1,300円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩8分", capacity: 18, reviewScore: "4.5", tags: ["カレー", "ランチ"], imageCredit: "sample",
  },
  {
    id: "demo-bistro-ciel", name: "ビストロ シエル", address: "東京都渋谷区神南2-2-1", access: "渋谷駅から徒歩10分", lat: 35.6648, lng: 139.7018,
    photo: { pc: { l: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80" } },
    open: "12:00〜15:00 / 17:30〜23:00", close: "日曜日", genre: { name: "イタリアン・フレンチ", catch: "気軽に楽しむ街角ビストロ" }, budget: { name: "3,001〜4,000円", average: "約3,500円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩10分", capacity: 36, reviewScore: "4.4", tags: ["ディナー", "グラスワイン"], imageCredit: "sample",
  },
  {
    id: "demo-donburi-kichi", name: "炭火焼きと丼 吉日", address: "東京都渋谷区桜丘町16-9", access: "渋谷駅から徒歩3分", lat: 35.6577, lng: 139.7011,
    photo: { pc: { l: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85", m: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80" } },
    open: "11:00〜15:00 / 17:00〜21:00", close: "不定休", genre: { name: "焼肉・ホルモン", catch: "炭火の香ばしさを気軽な丼で" }, budget: { name: "1,001〜1,500円", average: "約1,400円" }, urls: { pc: "https://www.hotpepper.jp/" },
    distance: "徒歩3分", capacity: 20, reviewScore: "4.3", tags: ["炭火焼き", "テイクアウト"], imageCredit: "sample",
  },
];
