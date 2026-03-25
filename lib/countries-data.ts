/**
 * Supported countries data
 * This is used for user registration and offer location
 * Only users from these countries can use the platform
 */

export type CountryData = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  cities: string[];
};

// Supported countries (33 total)
export const COUNTRIES_DATA: CountryData[] = [
  // Founding Members
  {
    code: "US",
    name: "United States",
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington DC", "Boston", "Nashville", "Detroit", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Atlanta", "Miami", "New Orleans", "Cleveland", "Minneapolis", "Orlando"],
  },
  {
    code: "CA",
    name: "Canada",
    cities: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "St. John's", "Barrie", "Kelowna", "Abbotsford", "Sudbury", "Kingston", "Sherbrooke", "Trois-Rivieres", "Guelph", "Moncton", "Brantford", "Thunder Bay", "Saint John"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    cities: ["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool", "Bristol", "Sheffield", "Edinburgh", "Cardiff", "Leicester", "Bradford", "Coventry", "Nottingham", "Kingston upon Hull", "Newcastle upon Tyne", "Stoke-on-Trent", "Southampton", "Derby", "Portsmouth", "Brighton", "Plymouth", "Wolverhampton", "Reading", "Aberdeen", "Swansea", "Belfast", "Dundee", "Oxford", "Cambridge"],
  },
  {
    code: "FR",
    name: "France",
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Etienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nimes", "Villeurbanne", "Clermont-Ferrand", "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens", "Limoges", "Perpignan", "Metz", "Besancon"],
  },
  {
    code: "BE",
    name: "Belgium",
    cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liege", "Bruges", "Namur", "Leuven", "Mons", "Mechelen", "Aalst", "La Louviere", "Kortrijk", "Hasselt", "Ostend", "Sint-Niklaas", "Tournai", "Genk", "Seraing", "Roeselare"],
  },
  {
    code: "NL",
    name: "Netherlands",
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "Hoofddorp", "Maastricht", "Leiden", "Dordrecht", "Zoetermeer", "Zwolle", "Deventer", "Delft", "Alkmaar"],
  },
  {
    code: "LU",
    name: "Luxembourg",
    cities: ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz", "Echternach", "Rumelange", "Grevenmacher"],
  },
  {
    code: "IT",
    name: "Italy",
    cities: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Venice", "Catania", "Verona", "Messina", "Padua", "Trieste", "Brescia", "Taranto", "Parma", "Prato", "Modena", "Reggio Calabria", "Reggio Emilia", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara"],
  },
  {
    code: "PT",
    name: "Portugal",
    cities: ["Lisbon", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Coimbra", "Funchal", "Setubal", "Almada", "Queluz", "Agualva-Cacem", "Aveiro", "Evora", "Faro", "Guimaraes", "Leiria", "Viseu", "Portimao", "Matosinhos", "Barreiro"],
  },
  {
    code: "NO",
    name: "Norway",
    cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Sandnes", "Tromso", "Sarpsborg", "Skien", "Alesund", "Sandefjord", "Haugesund", "Tonsberg", "Moss", "Porsgrunn", "Bodø", "Arendal", "Hamar"],
  },
  {
    code: "DK",
    name: "Denmark",
    cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Silkeborg", "Naestved", "Fredericia", "Viborg", "Koege", "Holstebro", "Taastrup", "Slagelse", "Hillerod"],
  },
  {
    code: "IS",
    name: "Iceland",
    cities: ["Reykjavik", "Kopavogur", "Hafnarfjordur", "Akureyri", "Reykjanesbaer", "Gardabaer", "Mosfellsbaer", "Arborg", "Akranes", "Selfoss"],
  },
  // Additional Members (1952-1999)
  {
    code: "GR",
    name: "Greece",
    cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Trikala", "Chalkida", "Serres", "Alexandroupoli", "Kavala", "Katerini", "Kalamata", "Agrinio", "Chania", "Lamia", "Komotini", "Rhodes", "Drama"],
  },
  {
    code: "TR",
    name: "Turkey",
    cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Mersin", "Diyarbakir", "Kayseri", "Eskisehir", "Sanliurfa", "Denizli", "Samsun", "Malatya", "Kahramanmaras", "Trabzon", "Van", "Erzurum", "Batman", "Elazig", "Sivas", "Manisa", "Balikesir"],
  },
  {
    code: "DE",
    name: "Germany",
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Dusseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Munster", "Mannheim", "Karlsruhe", "Augsburg", "Wiesbaden", "Gelsenkirchen", "Aachen", "Monchengladbach", "Braunschweig", "Kiel", "Chemnitz"],
  },
  {
    code: "ES",
    name: "Spain",
    cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Malaga", "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Cordoba", "Valladolid", "Vigo", "Gijon", "Hospitalet", "Vitoria-Gasteiz", "La Coruna", "Granada", "Elche", "Oviedo", "Santa Cruz de Tenerife", "Badalona", "Cartagena", "Terrassa", "Jerez de la Frontera", "Sabadell", "Mostoles", "Alcala de Henares", "Pamplona"],
  },
  {
    code: "CZ",
    name: "Czech Republic",
    cities: ["Prague", "Brno", "Ostrava", "Pilsen", "Liberec", "Olomouc", "Ceske Budejovice", "Hradec Kralove", "Usti nad Labem", "Pardubice", "Zlin", "Havirov", "Kladno", "Most", "Opava", "Frydek-Mistek", "Karvina", "Jihlava", "Teplice", "Decin"],
  },
  {
    code: "HU",
    name: "Hungary",
    cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pecs", "Gyor", "Nyiregyhaza", "Kecskemet", "Szekesfehervar", "Szombathely", "Szolnok", "Tatabanya", "Kaposvar", "Bekescsaba", "Zalaegerszeg", "Veszprem", "Eger", "Nagykanizsa", "Dunaujvaros", "Hodmezovasarhely"],
  },
  {
    code: "PL",
    name: "Poland",
    cities: ["Warsaw", "Krakow", "Lodz", "Wroclaw", "Poznan", "Gdansk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice", "Bialystok", "Gdynia", "Czestochowa", "Radom", "Torun", "Sosnowiec", "Rzeszow", "Kielce", "Gliwice", "Olsztyn", "Zabrze", "Bielsko-Biala", "Bytom", "Zielona Gora", "Rybnik", "Ruda Slaska", "Opole", "Tychy", "Gorzow Wielkopolski", "Plock"],
  },
  // Additional Members (2004)
  {
    code: "BG",
    name: "Bulgaria",
    cities: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen", "Pernik", "Yambol", "Haskovo", "Pazardzhik", "Blagoevgrad", "Veliko Tarnovo", "Vratsa", "Gabrovo", "Vidin", "Kazanlak"],
  },
  {
    code: "EE",
    name: "Estonia",
    cities: ["Tallinn", "Tartu", "Narva", "Parnu", "Kohtla-Jarve", "Viljandi", "Rakvere", "Maardu", "Sillamae", "Kuressaare", "Valga", "Voru", "Paide", "Johvi", "Haapsalu"],
  },
  {
    code: "LV",
    name: "Latvia",
    cities: ["Riga", "Daugavpils", "Liepaja", "Jelgava", "Jurmala", "Ventspils", "Rezekne", "Valmiera", "Ogre", "Jekabpils", "Tukums", "Cesis", "Salaspils", "Kuldiga", "Bauska"],
  },
  {
    code: "LT",
    name: "Lithuania",
    cities: ["Vilnius", "Kaunas", "Klaipeda", "Siauliai", "Panevezys", "Alytus", "Marijampole", "Mazeikiai", "Jonava", "Utena", "Kedainiai", "Telsiai", "Visaginas", "Taurage", "Ukmerge"],
  },
  {
    code: "RO",
    name: "Romania",
    cities: ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta", "Craiova", "Brasov", "Galati", "Ploiesti", "Oradea", "Braila", "Arad", "Pitesti", "Sibiu", "Bacau", "Targu Mures", "Baia Mare", "Buzau", "Botosani", "Satu Mare", "Ramnicu Valcea", "Suceava", "Drobeta-Turnu Severin", "Piatra Neamt", "Targu Jiu"],
  },
  {
    code: "SK",
    name: "Slovakia",
    cities: ["Bratislava", "Kosice", "Presov", "Zilina", "Nitra", "Banska Bystrica", "Trnava", "Martin", "Trencin", "Poprad", "Prievidza", "Zvolen", "Povazska Bystrica", "Nove Zamky", "Michalovce"],
  },
  {
    code: "SI",
    name: "Slovenia",
    cities: ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik", "Jesenice", "Nova Gorica", "Domzale", "Skofja Loka", "Murska Sobota"],
  },
  // Additional Members (2009-2020)
  {
    code: "HR",
    name: "Croatia",
    cities: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Slavonski Brod", "Karlovac", "Varazdin", "Sibenik", "Sisak", "Vinkovci", "Velika Gorica", "Dubrovnik", "Bjelovar", "Koprivnica", "Pozega", "Dakovo", "Vukovar", "Solin"],
  },
  {
    code: "AL",
    name: "Albania",
    cities: ["Tirana", "Durres", "Vlore", "Shkoder", "Elbasan", "Fier", "Korce", "Berat", "Lushnje", "Kavaje", "Pogradec", "Gjirokaster", "Lezhe", "Kukes", "Sarande"],
  },
  {
    code: "ME",
    name: "Montenegro",
    cities: ["Podgorica", "Niksic", "Herceg Novi", "Pljevlja", "Bijelo Polje", "Cetinje", "Bar", "Budva", "Berane", "Ulcinj", "Kotor", "Tivat", "Rozaje", "Danilovgrad", "Plav"],
  },
  {
    code: "MK",
    name: "North Macedonia",
    cities: ["Skopje", "Bitola", "Kumanovo", "Prilep", "Tetovo", "Ohrid", "Veles", "Stip", "Kocani", "Gostivar", "Kavadarci", "Strumica", "Kicevo", "Struga", "Gevgelija"],
  },
  // Additional Members (2023-2024)
  {
    code: "FI",
    name: "Finland",
    cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyvaskyla", "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hameenlinna", "Vaasa", "Seinajoki", "Rovaniemi", "Mikkeli", "Kotka", "Salo"],
  },
  {
    code: "SE",
    name: "Sweden",
    cities: ["Stockholm", "Gothenburg", "Malmo", "Uppsala", "Vasteras", "Orebro", "Linkoping", "Helsingborg", "Jonkoping", "Norrkoping", "Lund", "Umea", "Gavle", "Boras", "Sodertalje", "Eskilstuna", "Halmstad", "Vaxjo", "Karlstad", "Sundsvall", "Ostersund", "Trollhattan", "Lulea", "Kalmar", "Kristianstad"],
  },
  // India
  {
    code: "IN",
    name: "India",
    cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Pune", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kochi", "Chandigarh", "Guwahati", "Solapur", "Hubli-Dharwad", "Mysore"],
  },
];

/**
 * Get all country names sorted alphabetically
 */
export function getCountryNames(): string[] {
  return COUNTRIES_DATA.map((c) => c.name).sort();
}

/**
 * Get cities for a specific country
 */
export function getCitiesForCountry(countryName: string): string[] {
  const country = COUNTRIES_DATA.find((c) => c.name === countryName);
  return country ? country.cities.sort() : [];
}

/**
 * Get country code by name
 */
export function getCountryCode(countryName: string): string | null {
  const country = COUNTRIES_DATA.find((c) => c.name === countryName);
  return country ? country.code : null;
}

/**
 * Get country name by code
 */
export function getCountryByCode(code: string): CountryData | null {
  return COUNTRIES_DATA.find((c) => c.code === code) || null;
}

/**
 * Check if a country is supported
 */
export function isCountrySupported(countryName: string): boolean {
  return COUNTRIES_DATA.some((c) => c.name.toLowerCase() === countryName.toLowerCase());
}

/**
 * Check if a country code is supported
 */
export function isCountryCodeSupported(code: string): boolean {
  return COUNTRIES_DATA.some((c) => c.code === code);
}

/**
 * Find closest matching country name (for auto-detected names that might differ slightly)
 */
export function findClosestCountry(detectedCountry: string): CountryData | null {
  const normalized = detectedCountry.toLowerCase().trim();
  
  // Direct match
  let match = COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase() === normalized || c.code.toLowerCase() === normalized
  );
  if (match) return match;
  
  // Partial match
  match = COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase().includes(normalized) || normalized.includes(c.name.toLowerCase())
  );
  if (match) return match;
  
  // Common aliases
  const aliases: Record<string, string> = {
    "usa": "US",
    "america": "US",
    "united states of america": "US",
    "uk": "GB",
    "great britain": "GB",
    "england": "GB",
    "scotland": "GB",
    "wales": "GB",
    "northern ireland": "GB",
    "holland": "NL",
    "czechia": "CZ",
    "hellas": "GR",
    "turkiye": "TR",
    "eire": "IE",
    "deutschland": "DE",
    "espana": "ES",
    "italia": "IT",
    "france": "FR",
    "polska": "PL",
    "magyarorszag": "HU",
    "hrvatska": "HR",
    "slovenija": "SI",
    "slovensko": "SK",
    "lietuva": "LT",
    "latvija": "LV",
    "eesti": "EE",
    "suomi": "FI",
    "sverige": "SE",
    "norge": "NO",
    "danmark": "DK",
    "island": "IS",
    "portugal": "PT",
    "belgie": "BE",
    "belgique": "BE",
    "osterreich": "AT",
    "schweiz": "CH",
    "bharat": "IN",
  };
  
  const aliasCode = aliases[normalized];
  if (aliasCode) {
    return COUNTRIES_DATA.find((c) => c.code === aliasCode) || null;
  }
  
  return null;
}
