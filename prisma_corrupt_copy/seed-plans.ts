// prisma/seed-plans.ts
// Full Plan catalog seed for the Web x Hunter CRM (Manage + Plan detail pages).
// Run:  npx tsx prisma/seed-plans.ts
//
// NOTE: target / pitch / objection / upsell / costMin / costMax come from the
// INTERNAL pricing guide. These are internal-only. Never expose in any
// client-facing view or public API if this CRM is hosted.
//
// features is a JSON string (SQLite has no array type) — parse on read.

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const plans = [
  // ─────────────────────────  WORDPRESS  ─────────────────────────
  {
    name: "WordPress Starter",
    category: "WordPress",
    sellPrice: 7999,
    regularPrice: 15000,
    breakPrice: 4999,
    delivery: "10–15 days",
    active: true,
    sortOrder: 1,
    tagline: "First professional website for local & small businesses.",
    costMin: 2000,
    costMax: 4000,
    features: JSON.stringify([
      "5 Pages Website (Home, About, Services, Blog, Contact)",
      "Blog / News Section (WordPress native)",
      "Premium WP Theme (Astra/Kadence/OceanWP)",
      "4 Plugins (Yoast SEO, WP Super Cache, CF7, Smush)",
      "Responsive Design",
      "Contact Form (Contact Form 7)",
      "Basic On-Page SEO",
      "Speed Optimised",
      "Free SSL Certificate",
      "Social Media Links",
      "3 Month Tech Support",
    ]),
    target: "Small shops, salons, tutors, local service businesses — first website ever.",
    pitch:
      "We give you a complete 5-page professional website with domain & SSL for Rs. 7,999 — one flat price, nothing extra.",
    objection:
      "“Is this a template?” → Premium theme, but 100% customised to your brand. No two sites look alike.",
    upsell: "Show 2 live portfolio examples before they decide.",
  },
  {
    name: "WordPress Business",
    category: "WordPress",
    sellPrice: 17999,
    regularPrice: 32000,
    breakPrice: 11999,
    delivery: "15–20 days",
    active: true,
    sortOrder: 2,
    tagline: "Most Popular — proper website with blog for growing SMBs.",
    costMin: 6000,
    costMax: 10000,
    features: JSON.stringify([
      "15 Pages Website",
      "Blog + Portfolio Section",
      "Theme + Custom Skin",
      "8 Plugins (Yoast, WP Rocket Lite, WPForms, Smush, MonsterInsights)",
      "Responsive Design",
      "Contact + WhatsApp Chat",
      "Full On-Page SEO",
      "Google Analytics (GA4)",
      "Speed + Performance (Cloudflare CDN)",
      "1 Year Free Domain",
      "1 Year Free Hosting",
      "5 Free Email IDs (Zoho)",
      "3 Month Tech Support",
    ]),
    target: "Growing SMBs, doctors, lawyers, consultants, gyms.",
    pitch:
      "We include domain, hosting, 5 email IDs, SEO setup AND 3-month support — all in one price. Most agencies charge these separately.",
    objection:
      "“Other guy offered cheaper” → Ask: does it include domain + hosting + email + SEO? Ours does.",
    upsell: "Add Google My Business setup for Rs. 1,500 extra.",
  },
  {
    name: "WordPress Professional",
    category: "WordPress",
    sellPrice: 32999,
    regularPrice: 55000,
    breakPrice: 21999,
    delivery: "20–25 days",
    active: true,
    sortOrder: 3,
    tagline: "Corporate-scale site, enterprise-grade at a startup price.",
    costMin: 12000,
    costMax: 18000,
    features: JSON.stringify([
      "30 Pages Website",
      "Blog + Portfolio + Services",
      "Fully Custom WP Design (Elementor Pro)",
      "15 Plugins (SEO, forms, speed, Wordfence, backup)",
      "Advanced Forms & Automation",
      "SEO + Schema Markup (Rank Math)",
      "Analytics + Search Console",
      "Core Web Vitals Tuning",
      "1 Year Free Domain",
      "1 Year Free Cloud Hosting",
      "10 Free Email IDs",
      "Social Media Integration",
      "3 Month Tech Support",
    ]),
    target: "Established companies, hospitals, real estate firms, educational institutes.",
    pitch:
      "30 pages, cloud hosting, 10 email IDs, full SEO with schema, Core Web Vitals — enterprise-grade at a startup price.",
    objection:
      "“Can we trust a smaller agency?” → Prepare 2–3 case studies. Show GSC/PageSpeed reports.",
    upsell: "Offer a free website audit of their current site, then sell the fix.",
  },

  // ─────────────────────────  SHOPIFY  ─────────────────────────
  {
    name: "Shopify Standard",
    category: "Shopify",
    sellPrice: 11999,
    regularPrice: 29999,
    breakPrice: 7999,
    delivery: "15 days",
    active: true,
    sortOrder: 4,
    tagline: "First store for Instagram/WhatsApp sellers.",
    costMin: 500,
    costMax: 8500,
    features: JSON.stringify([
      "15 Pages Website",
      "20 Products Listed",
      "15 Product Categories",
      "4 Plugins / Extensions",
      "Premium Theme",
      "Payment Integration (Razorpay/Cashfree/PayU)",
      "Speed Optimisation",
      "Responsive Design",
      "Hosting Setup (Shopify-managed)",
      "Social Media Icons",
      "Opt-in Form",
    ]),
    target: "First-time sellers — Instagram/WhatsApp sellers wanting a proper store.",
    pitch:
      "Shopify handles payments, inventory, and shipping built-in. You get a store ready to sell in 15 days.",
    objection:
      "Tell client upfront: Shopify charges ~Rs. 1,700/mo subscription. Transparency builds trust.",
    upsell: "List 20 more products for Rs. 2,000 extra after launch.",
  },
  {
    name: "Shopify Premium",
    category: "Shopify",
    sellPrice: 24999,
    regularPrice: 49999,
    breakPrice: 16999,
    delivery: "18 days",
    active: true,
    sortOrder: 5,
    tagline: "Most Popular — agency-quality store at startup price.",
    costMin: 5500,
    costMax: 10500,
    features: JSON.stringify([
      "25 Pages Website",
      "30 Products Listed",
      "25 Product Categories",
      "6 Plugins / Extensions",
      "Premium Theme (Impulse/Prestige/Dawn)",
      "Payment Integration (Razorpay + UPI + Wallets)",
      "Speed Optimisation (PageSpeed 80+)",
      "Responsive Design",
      "Hosting Setup + SSL",
      "Social Media Icons",
      "Opt-in Form (pop-up + inline)",
    ]),
    target: "Active businesses with 20–100 SKUs — clothing, electronics, beauty, home decor.",
    pitch:
      "Premium theme, 30 products, full payment setup, reviews app — your store will look like a Rs. 50k job for Rs. 24,999.",
    objection:
      "“Why not WooCommerce?” → Shopify is faster to launch, no server maintenance, built-in fraud protection.",
    upsell: "Monthly retainer for product uploads + ads management (Rs. 3,000–8,000/mo).",
  },
  {
    name: "Shopify Platinum",
    category: "Shopify",
    sellPrice: 49999,
    regularPrice: 64999,
    breakPrice: 34999,
    delivery: "20 days",
    active: true,
    sortOrder: 6,
    tagline: "A brand store, not just a website — for serious D2C brands.",
    costMin: 10000,
    costMax: 18000,
    features: JSON.stringify([
      "50 Pages Website",
      "50 Products Listed",
      "35 Product Categories",
      "10 Plugins / Extensions (reviews, bundles, upsell, subscriptions, loyalty)",
      "Premium Theme (Prestige/Symmetry/Turbo)",
      "Payment Integration (gateway + COD + EMI)",
      "Speed Optimisation (PageSpeed 90+)",
      "Responsive Design",
      "Hosting Setup (Shopify Plus-ready, CDN)",
      "Social Media Icons + Open Graph",
      "Opt-in Form (pop-up, exit-intent, embedded)",
    ]),
    target: "Serious D2C brands — clothing labels, cosmetics brands, supplement companies.",
    pitch:
      "50 products, 35 collections, 10 apps, full speed optimisation — this is a brand store, not just a website.",
    objection:
      "Share a competitor's store and say: We'll build something at this level or better.",
    upsell: "Rs. 8,000–15,000/mo retainer — new arrivals, banners, campaign pages, app management.",
  },

  // ─────────────────────────  CUSTOM CODED  ─────────────────────────
  {
    name: "Landing Page",
    category: "Custom",
    sellPrice: 7999,
    regularPrice: 12000,
    breakPrice: 4999,
    delivery: "7–10 days",
    active: true,
    sortOrder: 7,
    tagline: "One high-converting page for a single campaign goal.",
    costMin: 1500,
    costMax: 2500,
    features: JSON.stringify([
      "Single Page Website (long-scroll)",
      "High-Converting Design",
      "Click-to-WhatsApp Button",
      "Email Query Form (Formspree/EmailJS)",
      "Responsive Design",
      "Free SSL Certificate",
      "Basic SEO Setup",
      "Speed Optimised",
      "Social Media Links",
      "3 Month Tech Support",
    ]),
    target: "Coaches, course sellers, event promoters, app launchers — single campaign goal.",
    pitch:
      "One page, designed to convert visitors into enquiries. Fast to build, fast to launch.",
    objection: "Show Google PageSpeed score of a past landing page — speed = trust.",
    upsell: "“Want 5 pages instead? Upgrade to Basic Website for Rs. 7,000 more.”",
  },
  {
    name: "Basic Website",
    category: "Custom",
    sellPrice: 14999,
    regularPrice: 20000,
    breakPrice: 9999,
    delivery: "15–20 days",
    active: true,
    sortOrder: 8,
    tagline: "5 hand-coded pages — clean, fast, credible.",
    costMin: 1500,
    costMax: 3000,
    features: JSON.stringify([
      "5 Pages Website",
      "Portfolio / Showcase Gallery",
      "Contact Form (PHP mailer/Formspree)",
      "Responsive Design",
      "Free SSL Certificate",
      "Basic SEO Setup (sitemap to GSC)",
      "Social Media Links",
      "Google Maps Integration",
      "Speed Optimised",
      "1 Year Free Domain",
      "3 Month Tech Support",
    ]),
    target: "Freelancers, photographers, interior designers, small offices — need a portfolio.",
    pitch:
      "5 professionally coded pages, domain included, Google Maps, contact form — everything to look credible online.",
    objection:
      "Our code is clean and fast — not a drag-and-drop builder like Wix or Squarespace.",
    upsell: "Monthly blog writing service (Rs. 2,000–4,000/mo) to grow SEO traffic.",
  },
  {
    name: "Custom Coded E-Commerce",
    category: "Custom",
    sellPrice: 50000,
    regularPrice: 60000,
    breakPrice: 35000,
    delivery: "2–3 months",
    active: true,
    sortOrder: 9,
    tagline: "Best Value — own your store, no platform fees.",
    costMin: 8000,
    costMax: 15000,
    features: JSON.stringify([
      "30 Pages Website (cart, checkout, dashboard)",
      "50 Product Categories",
      "50 Product Listings",
      "1 Year Free Domain",
      "1 Year Free Cloud Hosting (VPS)",
      "10 Free Email IDs",
      "Free SSL Certificate",
      "Payment Gateway (Razorpay/Cashfree)",
      "Auto Invoice Generator",
      "Wallet System + OTP",
      "1 Year Free Tech Support",
    ]),
    target: "Businesses that tried Shopify but want no monthly fees + full ownership.",
    pitch:
      "Fully custom code — no platform lock-in, no monthly fees, no transaction charges. You own everything.",
    objection:
      "Wallet + OTP is a strong differentiator — not many agencies offer this at this price. Lead with it.",
    upsell: "Get 50% advance before starting. Big project — protect your time.",
  },
  {
    name: "Multivendor Platform",
    category: "Custom",
    sellPrice: 100000,
    regularPrice: 150000,
    breakPrice: 75000,
    delivery: "4–7 months",
    active: true,
    sortOrder: 10,
    tagline: "Amazon/Meesho-style marketplace — vendor self-register + commission.",
    costMin: 15000,
    costMax: 30000,
    features: JSON.stringify([
      "40 Pages Website (admin, vendor, buyer)",
      "Multiple Categories (hierarchical)",
      "Multiple Product Listings (per vendor)",
      "1 Year Free Domain",
      "1 Year Free Cloud Hosting",
      "20 Free Email IDs",
      "Dynamic Multi-Vendor System",
      "Payment Gateway (commission split)",
      "Auto Invoice Generator (buyer/vendor/platform)",
      "Wallet System + OTP",
      "1 Year Free Tech Support",
    ]),
    target: "Entrepreneurs wanting an Amazon/Meesho-style marketplace.",
    pitch:
      "Custom-built multivendor platform — vendors self-register, manage products, and you earn commission on every sale.",
    objection:
      "“My cousin can do it for Rs. 20,000” → A working multivendor platform is 200–300 hours. Rs. 20k is a template. Build it right.",
    upsell:
      "Always 40% upfront / 40% mid-milestone / 20% delivery. Maintenance Rs. 8,000–15,000/mo after free year.",
  },
];

async function main() {
  console.log("Seeding plan catalog…");
  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: p });
      console.log(`  updated  ${p.name}`);
    } else {
      await prisma.plan.create({ data: p });
      console.log(`  created  ${p.name}`);
    }
  }
  console.log(`Done — ${plans.length} plans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });