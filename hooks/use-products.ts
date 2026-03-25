import { MOCK_PRODUCTS } from "@/lib/mock-data";

export function useProducts() {
  // Bypass API and return mock data directly
  return {
    data: MOCK_PRODUCTS,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: () => Promise.resolve(MOCK_PRODUCTS),
  };
}
