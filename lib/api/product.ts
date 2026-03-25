import { fetcher } from "./client";
import type { Product } from "@/lib/types";

const mapProduct = (p: any) : Product => ({
    productId: p.product_id,
    title: p.model,
    category: p.category,
    subcategory: p.subCategory,
    brand: p.brand,
    productType : "cross-product",
    model: p.model,
    imageUrl: p.image_url,
    offerCount: p.offerCount || 0,
});

export const getProducts = async (url:string): Promise<Product[]> => {
  const data = await fetcher<any[]>(url);
  return data.map(mapProduct);
};