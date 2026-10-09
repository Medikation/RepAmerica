"use client";

import { useState } from "react";

/** One-click Buy for the homepage hat rail: POSTs {variantId, quantity: 1} to /api/checkout and follows the Stripe redirect
 *  (same path as the product page's BuyForm, minus the variant picker — every hat is a single default variant). */
export default function HatBuyButton({ variantId, label, className }: { variantId: number; label: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buy = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId, quantity: 1 }) });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Something went wrong.");
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className={className} onClick={buy} disabled={busy} aria-busy={busy}>
        {busy ? "One moment…" : label}
      </button>
      {error && <span className="ra-hat-rail__error" role="alert">{error}</span>}
    </>
  );
}
