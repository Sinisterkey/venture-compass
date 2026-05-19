import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, CurrencyCode, useCurrency } from "@/contexts/CurrencyContext";
import { Globe } from "lucide-react";

export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency.code} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
      <SelectTrigger className={compact ? "h-9 w-[110px]" : "h-9 w-[120px]"} aria-label="Change currency">
        <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {Object.values(CURRENCIES).map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-medium mr-1">{c.symbol}</span>
            <span className="text-muted-foreground text-xs">{c.code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
