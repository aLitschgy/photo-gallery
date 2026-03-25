import type { Tag } from "./tag";

export interface GalleryImage {
  src: string;
  width: number;
  height: number;
  lexoRank: string;
  thumb?: string;
  tags?: Tag[];
}
