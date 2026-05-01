// Terms that return sexualized, inappropriate, or irrelevant results on LoremFlickr.
// Maps the problematic term to a specific, safe alternative.
const UNSAFE_TERMS: Record<string, string> = {
  fitness: 'fitness-facility',
  body: 'athletic-training',
  bodies: 'athletic-training',
  workout: 'workout-facility',
  gym: 'gym-equipment',
  muscle: 'weight-room',
  muscles: 'weight-room',
  bodybuilding: 'weight-room',
  physique: 'fitness-training',
  abs: 'fitness-training',
  exercise: 'exercise-equipment',
  training: 'athletic-training',
  sport: 'sports-facility',
  sports: 'sports-facility',
  yoga: 'yoga-class',
  sexy: 'fashion',
  beauty: 'beauty-salon',
};

// Sanitize a single LoremFlickr URL, replacing any unsafe keywords.
export function sanitizeImageUrl(url: string): string {
  if (!url || !url.includes('loremflickr.com')) return url;

  // https://loremflickr.com/800/600/keyword1,keyword2?lock=N
  const match = url.match(/^(https:\/\/loremflickr\.com\/\d+\/\d+\/)([^?#]+)([\?#].*)?$/);
  if (!match) return url;

  const [, base, keywords, suffix = ''] = match;
  const sanitized = keywords
    .split(',')
    .map((kw) => UNSAFE_TERMS[kw.toLowerCase().trim()] ?? kw)
    .join(',');

  return `${base}${sanitized}${suffix}`;
}

// Walk the top-level image fields of a site object and sanitize all LoremFlickr URLs.
export function sanitizeSiteImages<T extends Record<string, any>>(site: T): T {
  const s: Record<string, any> = { ...site };

  if (s.hero?.backgroundImage) {
    s.hero = { ...s.hero, backgroundImage: sanitizeImageUrl(s.hero.backgroundImage) };
  }
  if (s.media?.hero?.url) {
    s.media = { hero: { url: sanitizeImageUrl(s.media.hero.url) } };
  }
  if (Array.isArray(s.gallery?.images)) {
    s.gallery = {
      ...s.gallery,
      images: s.gallery.images.map((img: any) =>
        img?.src ? { ...img, src: sanitizeImageUrl(img.src) } : img
      ),
    };
  }

  return s as T;
}

// ── Dynamic visual keyword extraction ────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'that', 'this', 'these', 'those', 'it', 'its', 'we', 'our',
  'you', 'your', 'they', 'their', 'my', 'i', 'me', 'he', 'she', 'his', 'her',
  'us', 'them', 'which', 'who', 'what', 'when', 'where', 'how', 'why', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'than', 'then', 'too', 'very', 's', 't', 'can', 'just', 'into', 'up', 'out',
  'about', 'help', 'make', 'new', 'also', 'use', 'get', 'work', 'need', 'way',
]);

// Abstract business words that produce useless stock photo results
const ABSTRACT_TERMS = new Set([
  'platform', 'solution', 'service', 'business', 'company', 'management',
  'system', 'process', 'strategy', 'approach', 'experience', 'growth',
  'success', 'improve', 'enhance', 'optimize', 'increase', 'develop', 'create',
  'provide', 'offer', 'deliver', 'built', 'designed', 'tailored', 'world',
  'leading', 'global', 'premier', 'best', 'top', 'trusted', 'reliable',
  'innovative', 'modern', 'unique', 'brand', 'client', 'customer', 'user',
  'team', 'based', 'focused', 'driven', 'oriented',
]);

// Maps business/domain terms to specific, photogenic Unsplash search keywords
const DOMAIN_TO_VISUAL: Record<string, string> = {
  // Finance / investment
  investment: 'financial-district',
  investing: 'financial-district',
  investor: 'boardroom',
  portfolio: 'document-signing',
  trading: 'trading-floor',
  equity: 'boardroom',
  hedge: 'trading-floor',
  fund: 'conference-room',
  securities: 'trading-floor',
  wealth: 'city-skyline',
  capital: 'financial-district',
  debt: 'document-signing',
  bonds: 'trading-floor',
  credit: 'document-signing',
  finance: 'financial-district',
  financial: 'financial-district',
  accounting: 'document-signing',
  accounting_firm: 'document-signing',
  insurance: 'document-signing',
  mortgage: 'document-signing',
  loan: 'document-signing',
  bank: 'financial-district',
  banking: 'financial-district',

  // Healthcare / medical
  medical: 'medical-office',
  clinic: 'clinic',
  hospital: 'hospital-lobby',
  doctor: 'medical-office',
  patient: 'clinic',
  health: 'healthcare',
  healthcare: 'healthcare',
  wellness: 'healthcare',
  pharma: 'pharmacy',
  pharmacy: 'pharmacy',
  dental: 'dental-office',
  dentist: 'dental-office',
  therapy: 'clinic',
  therapist: 'clinic',
  nurse: 'medical-office',
  surgeon: 'hospital-lobby',

  // Tech / software
  software: 'computer',
  saas: 'startup-office',
  app: 'technology',
  application: 'workspace',
  dashboard: 'workspace',
  startup: 'startup-office',
  data: 'data-center',
  ai: 'technology',
  api: 'computer',
  code: 'computer',
  coding: 'workspace',
  developer: 'workspace',
  tech: 'technology',
  technology: 'technology',
  cyber: 'data-center',
  cloud: 'data-center',
  programming: 'workspace',

  // Food / hospitality
  restaurant: 'restaurant',
  food: 'food',
  cafe: 'coffee',
  coffee: 'espresso',
  cuisine: 'cuisine',
  dining: 'restaurant',
  bakery: 'bakery',
  catering: 'kitchen',
  chef: 'kitchen',
  pizza: 'pizza',
  sushi: 'sushi',
  italian: 'italian-food',
  menu: 'restaurant',
  bar: 'cocktail',
  cocktail: 'cocktail',

  // Fitness / sport
  gym: 'gym-equipment',
  fitness: 'fitness-facility',
  sport: 'sports-facility',
  sports: 'sports-facility',
  athletic: 'athletic-training',
  crossfit: 'gym-equipment',
  pilates: 'yoga-class',
  yoga: 'yoga-class',
  running: 'running',
  cycling: 'cycling',
  swimming: 'swimming-pool',
  personal_training: 'athletic-training',

  // Creative / media
  photography: 'photography',
  photo: 'photography',
  design: 'creative-workspace',
  creative: 'studio',
  agency: 'design-office',
  art: 'art',
  artist: 'art-studio',
  fashion: 'fashion',
  model: 'fashion',
  film: 'film',
  video: 'studio',
  music: 'recording-studio',
  podcast: 'recording-studio',

  // Retail / ecommerce
  shop: 'store-interior',
  store: 'store-interior',
  retail: 'retail',
  ecommerce: 'product',
  boutique: 'boutique',
  jewelry: 'jewelry',
  clothing: 'clothing',

  // Education
  school: 'classroom',
  university: 'university',
  education: 'classroom',
  learning: 'library',
  course: 'campus',
  academy: 'campus',
  college: 'university',
  tutoring: 'classroom',

  // Real estate
  real_estate: 'architecture',
  property: 'architecture',
  home: 'interior-design',
  house: 'architecture',
  apartment: 'interior-design',
  construction: 'construction',
  architecture: 'architecture',

  // Legal
  law: 'document-signing',
  legal: 'document-signing',
  attorney: 'boardroom',
  lawyer: 'boardroom',
  litigation: 'boardroom',

  // Travel / hospitality
  hotel: 'hotel-lobby',
  travel: 'travel',
  tourism: 'travel',
  resort: 'resort',
  vacation: 'travel',
};

/**
 * Dynamically extract visual/photogenic keywords from a site description and brand name.
 * Returns an ordered array of safe Unsplash search keywords.
 */
export function extractVisualKeywords(description: string, brand: string): string[] {
  const text = (description + ' ' + brand).toLowerCase();
  const found: string[] = [];
  const seen = new Set<string>();

  // First pass: scan for multi-word or exact domain term matches
  for (const [domain, visual] of Object.entries(DOMAIN_TO_VISUAL)) {
    const term = domain.replace(/_/g, '[ -]?');
    if (new RegExp(`\\b${term}\\b`).test(text) && !seen.has(visual)) {
      seen.add(visual);
      found.push(visual);
      if (found.length >= 6) break;
    }
  }

  if (found.length >= 3) return found.slice(0, 6);

  // Second pass: tokenize and try individual words
  const tokens = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w) && !ABSTRACT_TERMS.has(w));

  for (const token of tokens) {
    const visual = DOMAIN_TO_VISUAL[token];
    if (visual && !seen.has(visual)) {
      seen.add(visual);
      found.push(visual);
    } else if (!visual && !seen.has(token) && token.length > 4) {
      seen.add(token);
      found.push(token);
    }
    if (found.length >= 6) break;
  }

  if (found.length === 0) {
    return ['professional-office', 'business-meeting', 'modern-workspace', 'team', 'conference'];
  }

  return found.slice(0, 6);
}

/**
 * @deprecated Use extractVisualKeywords for dynamic extraction.
 * Kept for backwards compatibility — infers industry from brief using pattern matching.
 */
export function inferIndustryKeywords(brief: string, brand: string): string[] {
  return extractVisualKeywords(brief, brand);
}

/**
 * Build an array of Unsplash image objects using the given keywords.
 * Each image uses a pair of complementary keywords for better results.
 */
export function buildProfessionalImageUrls(
  keywords: string[],
  count = 6
): Array<{ src: string; alt: string; caption: string }> {
  return Array.from({ length: count }, (_, i) => {
    const kw1 = keywords[i % keywords.length];
    const kw2 = keywords[(i + 1) % keywords.length];
    // Featured endpoint returns editorial-quality images; two-stage fallback in Gallery handles failures
    const src = `https://source.unsplash.com/featured/800x600/?${kw1},${kw2}`;
    return { src, alt: kw1.replace(/-/g, ' '), caption: '' };
  });
}
