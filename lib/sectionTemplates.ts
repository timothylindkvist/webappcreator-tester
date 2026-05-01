// Pre-built section templates to inject directly without requiring Claude to regenerate
// the entire site JSON. Avoids max_tokens truncation for section-add requests.

const ADD_INTENT = /\b(add|insert|include|create|put in|show|display|make|build)\b/i;
const REMOVE_INTENT = /\b(remove|delete|get rid of|take out|drop|eliminate|hide the)\b/i;

type TemplateEntry = {
  pattern: RegExp;
  type: string;
  id?: string;
  label: string;
  build: (brandName: string) => Record<string, unknown>;
  reply: string;
};

const TEMPLATES: TemplateEntry[] = [
  {
    pattern: /\bapp.?store\b|google.?play\b|download.*(app|button)|mobile.?app.*(badge|button|download)/i,
    type: 'app-download',
    label: 'App Download',
    build: (brand) => ({
      title: 'Available on iOS & Android',
      body: `Download ${brand || 'our app'} and get started in minutes.`,
      items: [
        { title: 'App Store', description: 'iPhone & iPad' },
        { title: 'Google Play', description: 'Android' },
      ],
    }),
    reply: 'Added an App Store & Google Play download section.',
  },
  {
    pattern: /\btestimonial|review|customer.?say|what.?people.?say|client.?(quote|say|word)|social.?proof/i,
    type: 'testimonials',
    label: 'Testimonials',
    build: (brand) => ({
      title: 'What our customers say',
      items: [
        {
          quote: `${brand || 'This service'} has been a game changer for us. Highly recommended!`,
          author: 'Alex M., Founder',
        },
        {
          quote: 'Incredibly easy to use and the results speak for themselves.',
          author: 'Jordan K., CEO',
        },
        {
          quote: "We've seen real results since switching. The team is fantastic.",
          author: 'Sam P., Director',
        },
      ],
    }),
    reply: 'Added a testimonials section with 3 customer quotes. Update the quotes with real ones when ready.',
  },
  {
    pattern: /\bteam|staff|people|meet.*(us|the.?team)|our.*(team|people|crew)/i,
    type: 'team',
    label: 'Team',
    build: () => ({
      title: 'Meet the team',
      items: [
        { title: 'Alex Johnson', description: 'Co-Founder & CEO' },
        { title: 'Sam Williams', description: 'Head of Design' },
        { title: 'Jordan Chen', description: 'Lead Engineer' },
      ],
    }),
    reply: "Added a team section. Update the names and roles to match your actual team.",
  },
  {
    pattern: /\bfaq\b|frequent.*question|common.*(question|q&a)|question.*answer/i,
    type: 'faq',
    label: 'FAQ',
    build: () => ({
      title: 'Frequently asked questions',
      items: [
        {
          q: 'How do I get started?',
          a: "Simply sign up and follow the onboarding steps — you'll be up and running in minutes.",
        },
        {
          q: 'Is there a free trial?',
          a: 'Yes, we offer a 14-day free trial with no credit card required.',
        },
        {
          q: 'Can I cancel at any time?',
          a: 'Absolutely. Cancel anytime — no long-term contracts or cancellation fees.',
        },
        {
          q: 'Do you offer customer support?',
          a: 'Yes, our support team is available via email and chat Monday through Friday.',
        },
      ],
    }),
    reply: 'Added an FAQ section. Update the questions and answers to match your business.',
  },
  {
    pattern: /\bstat|number|metric|figure|result|achievement|milestone|by.the.number/i,
    type: 'stats',
    label: 'Stats',
    build: () => ({
      title: 'By the numbers',
      items: [
        { title: 'Customers', description: '10,000+' },
        { title: 'Countries', description: '40+' },
        { title: 'Uptime', description: '99.9%' },
        { title: 'Support', description: '24/7' },
      ],
    }),
    reply: 'Added a stats section. Update the numbers to reflect your actual metrics.',
  },
  {
    pattern: /\b(featured.?(in|on)|as.?seen|press|logo.?wall|partner|publication)\b/i,
    type: 'logos',
    label: 'Logos',
    build: () => ({
      title: 'As featured in',
      items: [
        { title: 'TechCrunch', description: 'Leading tech news' },
        { title: 'Forbes', description: 'Business & innovation' },
        { title: 'The Verge', description: 'Technology & culture' },
        { title: 'Wired', description: 'Technology trends' },
      ],
    }),
    reply: "Added an 'As featured in' logos section. Update the publication names as needed.",
  },
  {
    pattern: /\bnewsletter|email.?sign.?up|subscribe|mailing.?list|join.*(list|email)/i,
    type: 'newsletter',
    label: 'Newsletter',
    build: (brand) => ({
      title: 'Stay in the loop',
      body: `Get the latest updates from ${brand || 'us'} delivered to your inbox. No spam, ever.`,
      items: [],
    }),
    reply: 'Added a newsletter signup section.',
  },
  {
    pattern: /\bcontact|get.?in.?touch|reach.?(us|out)|contact.?form|inquiry/i,
    type: 'contact',
    label: 'Contact',
    build: () => ({
      title: 'Get in touch',
      body: "Have a question or want to work together? We'd love to hear from you. Drop us a message and we'll get back to you within one business day.",
      items: [
        { title: 'Email', description: 'hello@yourcompany.com' },
        { title: 'Phone', description: '+1 (555) 000-0000' },
        { title: 'Hours', description: 'Mon–Fri, 9am–6pm' },
      ],
    }),
    reply: 'Added a contact section. Update the email, phone, and hours with your real details.',
  },
];

// Also include core section types for removal detection (not all have add templates)
const ALL_SECTION_KEYWORDS: Array<{ pattern: RegExp; type: string; label: string }> = [
  ...TEMPLATES.map((t) => ({ pattern: t.pattern, type: t.type, label: t.label })),
  { pattern: /\bhero\b|\bbanner\b|\bheader\s*section\b/i, type: 'hero', label: 'Hero' },
  { pattern: /\babout\s*(us|section)?\b/i, type: 'about', label: 'About' },
  { pattern: /\bfeatures?\s*(section|list)?\b/i, type: 'features', label: 'Features' },
  { pattern: /\bgallery\s*(section)?\b/i, type: 'gallery', label: 'Gallery' },
  { pattern: /\bpricing\s*(section|plans?)?\b/i, type: 'pricing', label: 'Pricing' },
  { pattern: /\bcta\b|\bcall.to.action\b/i, type: 'cta', label: 'CTA' },
];

// ─── Add ───────────────────────────────────────────────────────────────────────

export type SectionInsert = {
  kind: 'insert';
  type: string;
  id?: string;
  data: Record<string, unknown>;
  reply: string;
};

export type SectionAlreadyExists = {
  kind: 'already-exists';
  type: string;
  label: string;
  reply: string;
};

export function detectSectionAdd(
  message: string,
  site: Record<string, any>
): SectionInsert | SectionAlreadyExists | null {
  if (!ADD_INTENT.test(message)) return null;

  const existingBlocks: Array<{ type: string; id: string }> = Array.isArray(site?.blocks)
    ? site.blocks
    : [];
  const existingTypes = new Set(existingBlocks.map((b) => b.type));
  const existingIds = new Set(existingBlocks.map((b) => b.id));

  const brandName: string = site?.brand?.name || '';

  for (const tmpl of TEMPLATES) {
    if (!tmpl.pattern.test(message)) continue;

    const targetId = tmpl.id ?? tmpl.type;

    if (existingIds.has(targetId) || (!tmpl.id && existingTypes.has(tmpl.type))) {
      return {
        kind: 'already-exists',
        type: tmpl.type,
        label: tmpl.label,
        reply: `A ${tmpl.label} section already exists. Tell me what you'd like to change about it and I'll update it.`,
      };
    }

    return {
      kind: 'insert',
      type: tmpl.type,
      id: tmpl.id,
      data: tmpl.build(brandName),
      reply: tmpl.reply,
    };
  }

  return null;
}

// ─── Remove ────────────────────────────────────────────────────────────────────

export type SectionRemove =
  | { kind: 'remove'; id: string; label: string; reply: string }
  | { kind: 'not-found'; label: string; reply: string };

export function detectSectionRemove(
  message: string,
  site: Record<string, any>
): SectionRemove | null {
  if (!REMOVE_INTENT.test(message)) return null;

  const existingBlocks: Array<{ type: string; id: string }> = Array.isArray(site?.blocks)
    ? site.blocks
    : [];

  for (const { pattern, type, label } of ALL_SECTION_KEYWORDS) {
    if (!pattern.test(message)) continue;

    const block = existingBlocks.find((b) => b.type === type || b.id === type);
    if (!block) {
      return { kind: 'not-found', label, reply: `There's no ${label} section to remove.` };
    }

    return {
      kind: 'remove',
      id: block.id,
      label,
      reply: `Removed the ${label} section.`,
    };
  }

  return null;
}
