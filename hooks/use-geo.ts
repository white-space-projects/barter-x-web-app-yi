import useSWR from 'swr';
import { getCountries } from "@/lib/api/geo";
import { getCities } from "@/lib/api/geo";

export function useCountries() {
  const { data, ...rest } = useSWR("/api/geo/countries", getCountries, {
    revalidateOnFocus: false,            
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    //dedupingInterval: 1000 * 60 * 60, // 1 hour cache
  });

  return {
    countries: data || [],
    ...rest,
  };
}

export function useCities(countryCode?: string) {
  console.log(countryCode)
  const { data, ...rest } = useSWR(
    countryCode ? `/api/geo/cities?country=${countryCode}` : null, getCities
  );
  
  return {
    cities: data || [],
    ...rest,
  };
}