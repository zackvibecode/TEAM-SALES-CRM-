"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface ActivePackagesButtonProps {
  href: string;
}

export function ActivePackagesButton({ href }: ActivePackagesButtonProps) {
  const { t } = useAppLocale();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/promos?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.promos)) {
          setCount(data.promos.length);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link href={href} className="btn-secondary shrink-0 gap-2 text-sm inline-flex items-center">
      <Package className="w-4 h-4 text-[#3b66ff]" />
      {t.promo.activePromos}
      {count > 0 && (
        <span
          className="min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center tabular-nums"
          style={{ background: "#3b66ff", color: "#fff" }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
