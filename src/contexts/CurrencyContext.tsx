import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CurrencyCode = "ZMW" | "USD" | "EUR" | "GBP" | "NGN" | "KES" | "ZAR";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  ZMW: { code: "ZMW", symbol: "K",   label: "Zambian Kwacha (ZMW)" },
  USD: { code: "USD", symbol: "$",   label: "US Dollar (USD)" },
  EUR: { code: "EUR", symbol: "€",   label: "Euro (EUR)" },
  GBP: { code: "GBP", symbol: "£",   label: "British Pound (GBP)" },
  NGN: { code: "NGN", symbol: "₦",   label: "Nigerian Naira (NGN)" },
  KES: { code: "KES", symbol: "KSh", label: "Kenyan Shilling (KES)" },
  ZAR: { code: "ZAR", symbol: "R",   label: "South African Rand (ZAR)" },
};

interface CurrencyContextValue {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  format: (amount: number | string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = "ngo-bridge.currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored && stored in CURRENCIES ? stored : "ZMW") as CurrencyCode;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const currency = CURRENCIES[code];

  const format = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === "") return `${currency.symbol}0`;
    const n = typeof amount === "string" ? Number(amount) : amount;
    if (Number.isNaN(n)) return `${currency.symbol}0`;
    return `${currency.symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setCode, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
