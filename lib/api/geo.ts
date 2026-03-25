import { fetcher } from "./client";
import type { Country } from "@/lib/types";
import type { City } from "@/lib/types";

export const getCountries = (url: string) => fetcher<Country[]>(url);
export const getCities = (url: string) => fetcher<City[]>(url);