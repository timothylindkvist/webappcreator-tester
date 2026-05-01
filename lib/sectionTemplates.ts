// Pre-built section templates to inject directly without requiring Claude to regenerate
// the entire site JSON. Avoids max_tokens truncation for section-add requests.

const ADD_INTENT = /\b(add|insert|include|create|put in|show|display|make|build)\b/i;

type TemplateEntry = {
  pattern: RegExp;
  type: string;
  id?: string;
  build: (brandName: string) => Record<string, unknown>;
  reply: string;
};

const TEMPLATES: TemplateEntry[] = [
  {
    pattern: /\bapp.?store\b|google.?play\b|download.*(app|button)|mobile.?app.*(badge|button|download)/i,
    type: 'app-download',
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
    pattern: /\b(featured.?(in|on)|as.?seen|press|logo.?wall|partner|publication|brand)/i,
    type: 'logos',
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

export type SectionInsert = {
  type: string;
  id?: string;
  data: Record<string, unknown>;
  reply: string;
};

export function detectSectionAdd(
  message: string,
  site: Record<string, any>
): SectionInsert | null {
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

    // Skip if this section already exists (don't add duplicates)
    if (existingIds.has(targetId)) continue;
    if (!tmpl.id && existingTypes.has(tmpl.type)) continue;

    return {
      type: tmpl.type,
      id: tmpl.id,
      data: tmpl.build(brandName),
      reply: tmpl.reply,
    };
  }

  return null;
}
