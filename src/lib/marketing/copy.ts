import type { Locale } from "./locale";
import type { FeatureKey, TierId } from "./pricing-tiers";

export interface MarketingCopy {
  meta: {
    homeTitle: string;
    homeDescription: string;
    pricingTitle: string;
    pricingDescription: string;
    loginTitle: string;
    loginDescription: string;
  };
  nav: {
    pricing: string;
    login: string;
    home: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPricing: string;
    ctaLogin: string;
  };
  problem: {
    title: string;
    items: string[];
    solutionTitle: string;
    solutionText: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  howItWorks: {
    title: string;
    steps: { title: string; description: string }[];
  };
  trust: {
    title: string;
    subtitle: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
    ctaPricing: string;
    ctaContact: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    perMonth: string;
    popular: string;
    contactSales: string;
    compareTitle: string;
    tierNames: Record<TierId, string>;
    tierDescriptions: Record<TierId, string>;
    seatLine: (admin: number, sales: number | "unlimited") => string;
    featureLabels: Record<FeatureKey, string>;
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  footer: {
    tagline: string;
    rights: string;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    serverOk: string;
    backHome: string;
    noAccount: string;
    contactSales: string;
    configErrorPrefix: string;
    networkError: string;
  };
}

const COPY_BM: MarketingCopy = {
  meta: {
    homeTitle: "Zaqone CRM — CRM Jualan & WhatsApp untuk Travel",
    homeDescription:
      "Urus lead, campaign Excel, follow-up WhatsApp dan KPI pasukan jualan travel dalam satu workspace.",
    pricingTitle: "Harga — Zaqone CRM",
    pricingDescription: "Pilih pelan Starter, Pro atau Team. Hubungi sales untuk onboarding.",
    loginTitle: "Log Masuk — Zaqone CRM",
    loginDescription: "Akses dashboard admin atau sales anda.",
  },
  nav: {
    pricing: "Harga",
    login: "Log Masuk",
    home: "Laman Utama",
  },
  hero: {
    badge: "Dibina untuk pasukan jualan travel",
    title: "CRM jualan + follow-up WhatsApp dalam satu tempat",
    subtitle:
      "Upload lead dari Excel, assign kepada sales, jejak follow-up dan prestasi klik WhatsApp — tanpa spreadsheet bertabur.",
    ctaPricing: "Lihat Harga",
    ctaLogin: "Log Masuk",
  },
  problem: {
    title: "Masalah biasa pasukan sales travel",
    items: [
      "Lead dari campaign bertabur dalam Excel dan WhatsApp peribadi",
      "Follow-up tertangguh — tiada queue yang jelas untuk sales",
      "Admin sukar nampak siapa perform dan siapa perlu dibantu",
    ],
    solutionTitle: "Zaqone CRM selesaikan ini",
    solutionText:
      "Satu workspace untuk admin dan sales: campaign, lead, follow-up queue, mesej WhatsApp berjenama, dan dashboard KPI.",
  },
  features: {
    title: "Ciri yang sedia dalam produk",
    subtitle: "Bukan mockup — ini modul sebenar dalam app anda guna hari ini.",
    items: [
      {
        title: "Upload & campaign",
        description: "Import Excel/CSV, assign round-robin atau manual kepada sales.",
      },
      {
        title: "Dashboard admin",
        description: "KPI pasukan, prestasi klik WhatsApp, dan gambaran campaign.",
      },
      {
        title: "Follow-up queue",
        description: "Jadual, siapkan, dan jejak follow-up dari admin dan sales.",
      },
      {
        title: "WhatsApp berjenama",
        description: "Pretext mesej, template, dan tracking klik untuk setiap lead.",
      },
      {
        title: "My Tasks (sales)",
        description: "Senarai lead milik sales dengan status dan nota terpusat.",
      },
      {
        title: "Sasaran harian",
        description: "Matlamat follow-up harian untuk kekal konsisten.",
      },
      {
        title: "Activity & audit",
        description: "Log aktiviti lead dan audit tindakan admin.",
      },
      {
        title: "Role & keselamatan",
        description: "Akses admin vs sales dengan RLS Supabase.",
      },
    ],
  },
  howItWorks: {
    title: "Cara ia berfungsi",
    steps: [
      {
        title: "Upload campaign",
        description: "Admin muat naik fail lead dan namakan campaign.",
      },
      {
        title: "Assign kepada sales",
        description: "Lead diagihkan kepada ahli pasukan secara automatik atau manual.",
      },
      {
        title: "Follow-up WhatsApp",
        description: "Sales guna queue dan mesej berjenama untuk tutup lebih banyak deal.",
      },
    ],
  },
  trust: {
    title: "Dibina untuk operasi jualan sebenar",
    subtitle:
      "Sesuai untuk agensi travel, inbound sales, dan pasukan yang bergantung pada WhatsApp.",
  },
  finalCta: {
    title: "Sedia naik taraf operasi jualan?",
    subtitle: "Pilih pelan, hubungi sales, dan kami sediakan workspace untuk pasukan anda.",
    ctaPricing: "Bandingkan Pelan",
    ctaContact: "Hubungi Sales",
  },
  pricing: {
    title: "Harga mudah, tiada kejutan",
    subtitle: "Semua pelan termasuk onboarding manual. Bayaran dalam talian akan datang.",
    perMonth: "/bulan",
    popular: "Paling popular",
    contactSales: "Hubungi Sales",
    compareTitle: "Perbandingan ciri",
    tierNames: {
      starter: "Starter",
      pro: "Pro",
      team: "Team",
    },
    tierDescriptions: {
      starter: "Untuk solo atau pasukan kecil bermula",
      pro: "Pasukan travel kecil yang aktif follow-up",
      team: "Agensi dengan banyak sales dan audit penuh",
    },
    seatLine: (admin, sales) =>
      sales === "unlimited"
        ? `${admin} admin · sales tanpa had`
        : `${admin} admin · ${sales} sales`,
    featureLabels: {
      leadUpload: "Upload lead Excel/CSV",
      campaignAssign: "Assign campaign & round-robin",
      myTasks: "My Tasks untuk sales",
      whatsappPretext: "WhatsApp pretext & klik",
      followUpQueue: "Follow-up queue",
      dailyGoal: "Sasaran follow-up harian",
      adminKpi: "Dashboard KPI admin",
      activityLog: "Activity log",
      auditLog: "Audit log",
      exportLeads: "Export leads",
      prioritySupport: "Sokongan keutamaan",
    },
  },
  faq: {
    title: "Soalan lazim",
    items: [
      {
        q: "Bolehkah saya daftar sendiri?",
        a: "Buat masa ini onboarding manual. Hubungi sales selepas pilih pelan.",
      },
      {
        q: "Adakah sesuai untuk industri selain travel?",
        a: "Ya, terutamanya jualan berdasarkan WhatsApp dan lead dari campaign.",
      },
      {
        q: "Bila bayaran dalam talian tersedia?",
        a: "Stripe dan langganan automatik dirancang untuk fasa seterusnya.",
      },
    ],
  },
  footer: {
    tagline: "Premium sales team CRM by Zack",
    rights: "Hak cipta terpelihara.",
  },
  login: {
    title: "Log Masuk",
    subtitle: "Akses dashboard admin atau sales",
    email: "E-mel",
    password: "Kata laluan",
    submit: "Log Masuk",
    submitting: "Sedang log masuk...",
    serverOk: "Server bersambung — anda boleh log masuk.",
    backHome: "← Kembali ke laman utama",
    noAccount: "Belum ada akaun?",
    contactSales: "Hubungi sales",
    configErrorPrefix: "Setup Vercel:",
    networkError: "Tidak dapat capai server. Tunggu deploy siap, kemudian refresh.",
  },
};

const COPY_EN: MarketingCopy = {
  meta: {
    homeTitle: "Zaqone CRM — Sales CRM & WhatsApp for Travel Teams",
    homeDescription:
      "Manage leads, Excel campaigns, WhatsApp follow-ups, and sales KPIs in one workspace.",
    pricingTitle: "Pricing — Zaqone CRM",
    pricingDescription: "Choose Starter, Pro, or Team. Contact sales to get started.",
    loginTitle: "Sign In — Zaqone CRM",
    loginDescription: "Access your admin or sales dashboard.",
  },
  nav: {
    pricing: "Pricing",
    login: "Sign In",
    home: "Home",
  },
  hero: {
    badge: "Built for travel sales teams",
    title: "Sales CRM + WhatsApp follow-up in one place",
    subtitle:
      "Upload leads from Excel, assign to reps, track follow-ups and WhatsApp click performance — without scattered spreadsheets.",
    ctaPricing: "View Pricing",
    ctaLogin: "Sign In",
  },
  problem: {
    title: "Common pain points for travel sales",
    items: [
      "Leads scattered across Excel files and personal WhatsApp chats",
      "Follow-ups slip — no clear queue for each rep",
      "Managers can't see who's performing and who needs help",
    ],
    solutionTitle: "Zaqone CRM fixes this",
    solutionText:
      "One workspace for admins and sales: campaigns, leads, follow-up queue, branded WhatsApp messages, and KPI dashboards.",
  },
  features: {
    title: "Features already in the product",
    subtitle: "Not a mockup — these are real modules shipping in the app today.",
    items: [
      {
        title: "Upload & campaigns",
        description: "Import Excel/CSV and assign round-robin or manually to sales.",
      },
      {
        title: "Admin dashboard",
        description: "Team KPIs, WhatsApp click performance, and campaign overview.",
      },
      {
        title: "Follow-up queue",
        description: "Schedule, complete, and track follow-ups from admin and sales.",
      },
      {
        title: "Branded WhatsApp",
        description: "Pretext messages, templates, and click tracking per lead.",
      },
      {
        title: "My Tasks (sales)",
        description: "Owned leads with status and notes in one list.",
      },
      {
        title: "Daily goals",
        description: "Daily follow-up targets to keep reps consistent.",
      },
      {
        title: "Activity & audit",
        description: "Lead activity log and admin audit trail.",
      },
      {
        title: "Roles & security",
        description: "Admin vs sales access with Supabase RLS.",
      },
    ],
  },
  howItWorks: {
    title: "How it works",
    steps: [
      {
        title: "Upload a campaign",
        description: "Admin uploads a lead file and names the campaign.",
      },
      {
        title: "Assign to sales",
        description: "Leads are distributed automatically or manually to the team.",
      },
      {
        title: "Follow up on WhatsApp",
        description: "Reps use the queue and branded messages to close more deals.",
      },
    ],
  },
  trust: {
    title: "Built for real sales operations",
    subtitle:
      "Ideal for travel agencies, inbound sales, and teams that run on WhatsApp.",
  },
  finalCta: {
    title: "Ready to upgrade your sales ops?",
    subtitle: "Pick a plan, contact sales, and we'll set up your team workspace.",
    ctaPricing: "Compare Plans",
    ctaContact: "Contact Sales",
  },
  pricing: {
    title: "Simple pricing, no surprises",
    subtitle: "All plans include manual onboarding. Online billing coming soon.",
    perMonth: "/mo",
    popular: "Most popular",
    contactSales: "Contact Sales",
    compareTitle: "Feature comparison",
    tierNames: {
      starter: "Starter",
      pro: "Pro",
      team: "Team",
    },
    tierDescriptions: {
      starter: "For solo operators or small teams starting out",
      pro: "Active travel teams with follow-up at scale",
      team: "Agencies with many reps and full audit",
    },
    seatLine: (admin, sales) =>
      sales === "unlimited"
        ? `${admin} admin · unlimited sales`
        : `${admin} admin · ${sales} sales`,
    featureLabels: {
      leadUpload: "Excel/CSV lead upload",
      campaignAssign: "Campaign assign & round-robin",
      myTasks: "My Tasks for sales",
      whatsappPretext: "WhatsApp pretext & clicks",
      followUpQueue: "Follow-up queue",
      dailyGoal: "Daily follow-up goal",
      adminKpi: "Admin KPI dashboard",
      activityLog: "Activity log",
      auditLog: "Audit log",
      exportLeads: "Export leads",
      prioritySupport: "Priority support",
    },
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "Can I self-sign up?",
        a: "Not yet — onboarding is manual. Contact sales after choosing a plan.",
      },
      {
        q: "Is it only for travel?",
        a: "No — any WhatsApp-led sales team with campaign leads fits well.",
      },
      {
        q: "When is online payment available?",
        a: "Stripe and auto-billing are planned for a later phase.",
      },
    ],
  },
  footer: {
    tagline: "Premium sales team CRM by Zack",
    rights: "All rights reserved.",
  },
  login: {
    title: "Sign In",
    subtitle: "Access your admin or sales dashboard",
    email: "Email",
    password: "Password",
    submit: "Sign In",
    submitting: "Signing in...",
    serverOk: "Server connected — you can sign in.",
    backHome: "← Back to home",
    noAccount: "Don't have an account?",
    contactSales: "Contact sales",
    configErrorPrefix: "Setup Vercel:",
    networkError: "Cannot reach server. Wait for deploy to finish, then refresh.",
  },
};

const COPY_MAP: Record<Locale, MarketingCopy> = {
  bm: COPY_BM,
  en: COPY_EN,
};

export function getCopy(locale: Locale): MarketingCopy {
  return COPY_MAP[locale];
}
