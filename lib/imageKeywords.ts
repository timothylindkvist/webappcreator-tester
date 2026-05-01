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

// ── Professional image keyword inference ──────────────────────────────────────

// Industry → specific, safe LoremFlickr keyword pairs that reliably return
// relevant, professional results.
const INDUSTRY_IMAGE_KEYWORDS: Record<string, string[]> = {
  finance: [
    'financial-district',
    'boardroom',
    'trading-floor',
    'document-signing',
    'city-skyline',
    'conference-room',
  ],
  tech: ['technology', 'computer', 'software', 'startup-office', 'data-center', 'workspace'],
  healthcare: ['medical-office', 'clinic', 'healthcare', 'hospital-lobby', 'pharmacy'],
  food: ['food', 'restaurant', 'coffee', 'cuisine', 'kitchen', 'espresso'],
  fitness: [
    'gym-equipment',
    'fitness-facility',
    'athletic-training',
    'sports-facility',
    'weight-room',
  ],
  creative: ['photography', 'studio', 'creative-workspace', 'design-office', 'art'],
  retail: ['retail', 'shopping', 'store-interior', 'product', 'fashion'],
  education: ['university', 'classroom', 'campus', 'library', 'students'],
};

/**
 * Infer the best image keyword set from a site brief and brand name.
 * Returns an array of safe LoremFlickr keywords ordered by relevance.
 */
export function inferIndustryKeywords(brief: string, brand: string): string[] {
  const text = (brief + ' ' + brand).toLowerCase();

  if (
    /\b(invest|debt|fund|equity|asset|capital|portfolio|hedge|trading|securities|financial|private equity|wealth management|credit|bonds?|fixed income)\b/.test(
      text
    )
  ) {
    return INDUSTRY_IMAGE_KEYWORDS.finance;
  }
  if (
    /\b(medical|clinic|doctor|hospital|patient|wellness|pharma|healthcare|dental|therapy|surgeon|nurse)\b/.test(
      text
    )
  ) {
    return INDUSTRY_IMAGE_KEYWORDS.healthcare;
  }
  if (
    /\b(restaurant|food|cafe|coffee|cuisine|dining|bakery|catering|chef|kitchen|bistro|eatery)\b/.test(
      text
    )
  ) {
    return INDUSTRY_IMAGE_KEYWORDS.food;
  }
  if (/\b(gym|fitness|sport|athletic|training facility|crossfit|pilates)\b/.test(text)) {
    return INDUSTRY_IMAGE_KEYWORDS.fitness;
  }
  if (
    /\b(photographer|photography|portfolio|creative agency|art studio|gallery|fashion|design studio)\b/.test(
      text
    )
  ) {
    return INDUSTRY_IMAGE_KEYWORDS.creative;
  }
  if (/\b(shop|store|retail|ecommerce|fashion|boutique|brand)\b/.test(text)) {
    return INDUSTRY_IMAGE_KEYWORDS.retail;
  }
  if (/\b(school|university|education|learning|course|academy|college|campus)\b/.test(text)) {
    return INDUSTRY_IMAGE_KEYWORDS.education;
  }
  if (/\b(saas|software|platform|api|dashboard|startup|tech company|app)\b/.test(text)) {
    return INDUSTRY_IMAGE_KEYWORDS.tech;
  }

  // Default: generic professional office photography
  return ['professional-office', 'business-meeting', 'modern-workspace', 'team', 'conference'];
}

/**
 * Build an array of LoremFlickr image objects using the given keywords.
 * Each image uses a pair of complementary keywords for better results.
 */
export function buildProfessionalImageUrls(
  keywords: string[],
  count = 6
): Array<{ src: string; alt: string; caption: string }> {
  return Array.from({ length: count }, (_, i) => {
    const kw1 = keywords[i % keywords.length];
    const kw2 = keywords[(i + 1) % keywords.length];
    // Use lock values starting at 100 to avoid collision with auto-generated images
    const src = `https://loremflickr.com/800/600/${kw1},${kw2}?lock=${100 + i}`;
    return { src, alt: kw1.replace(/-/g, ' '), caption: '' };
  });
}
