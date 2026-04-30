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
