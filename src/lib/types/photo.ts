import type { Tag } from "./tag";

export interface Photo {
  filename: string;
  width: number;
  height: number;
  lexoRank: string;
  tags?: Tag[];
}
