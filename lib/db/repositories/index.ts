/**
 * Data Access Layer - Repository Index
 * =====================================
 * Exports all repositories for easy importing.
 * Uses direct PostgreSQL connection to application schema.
 * 
 * Easy for backend developer to replace with Laravel API calls.
 */

// Products
export {
  fetchProducts,
  fetchProductById,
  fetchBarterTypes,
  fetchCategories,
  fetchBrands,
  type FetchProductsOptions,
} from "./products";

// Offers
export {
  fetchOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  type FetchOffersOptions,
} from "./offers";

// Hooks
export {
  fetchHooks,
  createHook,
  updateHook,
  deleteHook,
  type FetchHooksOptions,
} from "./hooks";

// Users
export {
  findUserByEmail,
  findUserById,
  findUserWithLocation,
  createUser,
  updateUser,
  updateLastLogin,
  findCountry,
  findCity,
  getCountries,
  getCities,
  type DbUser,
  type DbCountry,
  type DbCity,
  type UserWithLocation,
} from "./users";
