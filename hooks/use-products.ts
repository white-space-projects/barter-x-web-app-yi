import useSWR from "swr";
import { getProducts } from "@/lib/api/product";

export function useProducts() {
  return useSWR("/api/product/list", getProducts);
}