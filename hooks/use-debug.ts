/**
 * Debug hook to check what data is being loaded from APIs
 * Remove this file after debugging is complete
 */

import { useEffect, useState } from "react";

interface DebugData {
  products: { count: number; error?: string };
  offers: { count: number; error?: string };
  user: { loaded: boolean; error?: string };
  debugApi?: unknown;
}

export function useDebugData() {
  const [data, setData] = useState<DebugData>({
    products: { count: 0 },
    offers: { count: 0 },
    user: { loaded: false },
  });

  useEffect(() => {
    const fetchDebugData = async () => {
      console.log("[v0] Debug: Starting to fetch debug data...");
      
      // Check products API
      try {
        const productsRes = await fetch("/api/data/products");
        const productsData = await productsRes.json();
        console.log("[v0] Debug products response:", productsData);
        setData(prev => ({
          ...prev,
          products: { 
            count: productsData.products?.length || 0,
            error: productsData.error,
          }
        }));
      } catch (error) {
        console.error("[v0] Debug products error:", error);
        setData(prev => ({
          ...prev,
          products: { count: 0, error: String(error) }
        }));
      }

      // Check offers API
      try {
        const offersRes = await fetch("/api/data/offers");
        const offersData = await offersRes.json();
        console.log("[v0] Debug offers response:", offersData);
        setData(prev => ({
          ...prev,
          offers: { 
            count: offersData.offers?.length || 0,
            error: offersData.error,
          }
        }));
      } catch (error) {
        console.error("[v0] Debug offers error:", error);
        setData(prev => ({
          ...prev,
          offers: { count: 0, error: String(error) }
        }));
      }

      // Check debug API (bypasses RLS)
      try {
        const debugRes = await fetch("/api/debug/products");
        const debugData = await debugRes.json();
        console.log("[v0] Debug API response:", debugData);
        setData(prev => ({
          ...prev,
          debugApi: debugData,
        }));
      } catch (error) {
        console.error("[v0] Debug API error:", error);
      }
    };

    fetchDebugData();
  }, []);

  return data;
}
