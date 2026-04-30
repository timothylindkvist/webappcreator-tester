export type PatternId = 'dark-grid' | 'dot-matrix' | 'gradient-mesh' | 'light-minimal';

export const VALID_PATTERNS = new Set<string>([
  'dark-grid',
  'dot-matrix',
  'gradient-mesh',
  'light-minimal',
]);

// true = needs white text; false = use dark/foreground text
export const PATTERN_LIGHT_TEXT: Record<PatternId, boolean> = {
  'dark-grid': true,
  'dot-matrix': true,
  'gradient-mesh': true,
  'light-minimal': false,
};

export const PATTERN_LABELS: Record<PatternId, string> = {
  'dark-grid': 'Dark Grid',
  'dot-matrix': 'Dot Matrix',
  'gradient-mesh': 'Gradient Mesh',
  'light-minimal': 'Light Minimal',
};

export function patternForBusiness(brief: string): PatternId {
  const t = brief.toLowerCase();

  if (
    /law|legal|accountan|financ|bank|insuranc|medical|clinic|hospital|dental|funeral|grief|estate plan|compliance|government|nonprofit|counsell|therapist|health care|elder care|disability|mental health/i.test(
      t
    )
  ) {
    return 'light-minimal';
  }

  if (
    /saas|software|startup|tech |machine learn|ai \b|web3|crypto|fintech|digital agency|creative agency|design studio|product studio/i.test(
      t
    )
  ) {
    return 'gradient-mesh';
  }

  if (
    /photograph|cinema|film|music studio|record label|podcast|media brand|art studio|fine art/i.test(
      t
    )
  ) {
    return 'dot-matrix';
  }

  // Default — suits fitness, food, events, lifestyle, general businesses
  return 'dark-grid';
}
