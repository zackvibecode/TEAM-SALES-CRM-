import type { Metadata } from "next";
import { LoginForm } from "@/components/marketing/LoginForm";
import { getCopy } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: getCopy("en").meta.loginTitle,
  description: getCopy("en").meta.loginDescription,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
