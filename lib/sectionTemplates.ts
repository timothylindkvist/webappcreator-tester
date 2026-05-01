// Pre-built section templates injected directly without requiring Claude to regenerate
// the entire site JSON — avoids max_tokens truncation for structural operations.

const ADD_INTENT = /\b(add|insert|include|create)\b/i;
const REMOVE_INTENT = /\b(remove|delete|get rid of|take out|drop|eliminate|hide the)\b/i;

type TemplateEntry = {
  pattern: RegExp;
  type: string;
  label: string;
  build: (brandName: string) => Record<string, unknown>;
  reply: string;
};

const TEMPLATES: TemplateEntry[] = [
  {
    pattern: /\bapp.?store\b|google.?play\b|download.*(app|button)|mobile.?app.*(badge|button|download)|app.?download\b|download.?section\b|mobile.?download\b|store.?badge\b/i,
    type: 'app-download',
    label: 'App Download',
    build: (brand) => ({
      title: 'Take it with you',
      body: `Download ${brand || 'our app'} and get started in minutes.`,
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
    pattern: /\bteam\b|staff\b|meet.*(us|the.?team)|our.*(team|people|crew)/i,
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
    pattern: /\bstat\b|number\b|metric\b|figure\b|achievement\b|milestone\b|by.the.number/i,
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
    pattern: /\bnewsletter\b|email.?sign.?up|subscribe\b|mailing.?list|join.*(list|email)/i,
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
    pattern: /\bcontact\b|get.?in.?touch|reach.?(us|out)|contact.?form|inquiry/i,
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

// Extended keyword list used for removal detection (includes core sections that have no add template)
const ALL_SECTION_KEYWORDS: Array<{ pattern: RegExp; type: string; label: string }> = [
  ...TEMPLATES.map((t) => ({ pattern: t.pattern, type: t.type, label: t.label })),
  { pattern: /\bhero\s*(section|block)?\b/i, type: 'hero', label: 'Hero' },
  { pattern: /\babout\s*(us|section)?\b/i, type: 'about', label: 'About' },
  { pattern: /\bfeatures?\s*(section|list)?\b/i, type: 'features', label: 'Features' },
  { pattern: /\bgallery\s*(section)?\b/i, type: 'gallery', label: 'Gallery' },
  { pattern: /\bpricing\s*(section|plans?)?\b/i, type: 'pricing', label: 'Pricing' },
  { pattern: /\bcta\b|\bcall.to.action\b/i, type: 'cta', label: 'CTA' },
];

// ─── Multi-command support ─────────────────────────────────────────────────────

export type OpEvent = { name: string; args: Record<string, unknown> };

export type CollectedOps = {
  events: OpEvent[];
  replies: string[];
  /** The portion of the original message that templates didn't cover; pass to Claude if non-empty. */
  nonTemplateInstruction: string;
};

/** Split "do X and also do Y" into ["do X", "do Y"] */
function splitInstructions(message: string): string[] {
  return message
    .split(/,?\s+and(?:\s+also)?\s+|,?\s+also\s+|\s+additionally\s+|\s+plus\s+|;\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/**
 * Scan the full message for ALL template-matchable operations (adds and removes) and
 * return them together with any leftover sub-instructions that need Claude.
 *
 * Call once per incoming chat message — replaces the old detectSectionAdd /
 * detectSectionRemove single-match functions.
 */
export function collectAllOps(message: string, site: Record<string, any>): CollectedOps {
  const existingBlocks: Array<{ type: string; id: string }> = Array.isArray(site?.blocks)
    ? site.blocks
    : [];

  // Track which types/ids are "live" during this pass so a single message can't add + re-add
  const liveTypes = new Set(existingBlocks.map((b) => b.type));
  const liveIds = new Set(existingBlocks.map((b) => b.id));

  const brandName: string = site?.brand?.name || '';

  const events: OpEvent[] = [];
  const replies: string[] = [];
  const nonTemplateParts: string[] = [];

  const parts = splitInstructions(message);
  // If splitting produced nothing (e.g. very short message), treat the whole message as one part
  const instructions = parts.length > 0 ? parts : [message];

  for (const part of instructions) {
    let handled = false;

    // ── Remove detection ────────────────────────────────────────────────
    if (REMOVE_INTENT.test(part)) {
      for (const { pattern, type, label } of ALL_SECTION_KEYWORDS) {
        if (!pattern.test(part)) continue;
        const block = existingBlocks.find((b) => b.type === type || b.id === type);
        if (block) {
          events.push({ name: 'deleteSection', args: { id: block.id } });
          replies.push(`Removed the ${label} section.`);
          liveTypes.delete(type);
          liveIds.delete(block.id);
        } else {
          replies.push(`There's no ${label} section to remove.`);
        }
        handled = true;
        break;
      }
    }

    // ── Add detection ───────────────────────────────────────────────────
    if (!handled && ADD_INTENT.test(part)) {
      for (const tmpl of TEMPLATES) {
        if (!tmpl.pattern.test(part)) continue;
        const targetId = tmpl.type; // templates always use type as id

        if (liveIds.has(targetId) || liveTypes.has(tmpl.type)) {
          replies.push(
            `A ${tmpl.label} section already exists. Tell me what you'd like to change about it.`
          );
        } else {
          events.push({
            name: 'insertSection',
            args: { type: tmpl.type, id: targetId, data: tmpl.build(brandName) },
          });
          replies.push(tmpl.reply);
          liveTypes.add(tmpl.type);
          liveIds.add(targetId);
        }
        handled = true;
        break;
      }
    }

    if (!handled) {
      nonTemplateParts.push(part);
    }
  }

  return {
    events,
    replies,
    nonTemplateInstruction: nonTemplateParts.join(' and '),
  };
}
