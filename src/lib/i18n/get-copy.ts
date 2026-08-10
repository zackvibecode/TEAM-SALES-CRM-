import type { Locale } from "./locale";
import { enCommon } from "./en/common";
import { enNav } from "./en/nav";
import { enPromo } from "./en/promo";
import { enAdmin } from "./en/admin";
import { enSales } from "./en/sales";
import { enFollowUp } from "./en/followUp";
import { enRotator } from "./en/rotator";
import { enActivity } from "./en/activity";
import { enSalesFollowUp } from "./en/salesFollowUp";
import { bmCommon } from "./bm/common";
import { bmNav } from "./bm/nav";
import { bmPromo } from "./bm/promo";
import { bmAdmin } from "./bm/admin";
import { bmSales } from "./bm/sales";
import { bmFollowUp } from "./bm/followUp";
import { bmRotator } from "./bm/rotator";
import { bmActivity } from "./bm/activity";
import { bmSalesFollowUp } from "./bm/salesFollowUp";

export interface AppCopy {
  common: typeof enCommon;
  nav: typeof enNav;
  promo: typeof enPromo;
  admin: typeof enAdmin;
  sales: typeof enSales;
  followUp: typeof enFollowUp;
  rotator: typeof enRotator;
  activity: typeof enActivity;
  salesFollowUp: typeof enSalesFollowUp;
}

const COPY: Record<Locale, AppCopy> = {
  en: {
    common: enCommon,
    nav: enNav,
    promo: enPromo,
    admin: enAdmin,
    sales: enSales,
    followUp: enFollowUp,
    rotator: enRotator,
    activity: enActivity,
    salesFollowUp: enSalesFollowUp,
  },
  bm: {
    common: bmCommon,
    nav: bmNav,
    promo: bmPromo,
    admin: bmAdmin,
    sales: bmSales,
    followUp: bmFollowUp,
    rotator: bmRotator,
    activity: bmActivity,
    salesFollowUp: bmSalesFollowUp,
  },
};

export function getAppCopy(locale: Locale): AppCopy {
  return COPY[locale];
}
