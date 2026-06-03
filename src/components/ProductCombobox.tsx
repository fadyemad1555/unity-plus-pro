import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ProductOption = {
  id: string;
  name_en: string;
  name_ar?: string | null;
  price?: number | string | null;
  cost?: number | string | null;
};

export function ProductCombobox({
  products, value, onChange, placeholder = "اختر منتج...",
}: {
  products: ProductOption[];
  value: string | null;
  onChange: (p: ProductOption) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = products.find(p => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? (selected.name_ar || selected.name_en) : placeholder}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
        <Command>
          <div className="flex items-center border-b px-3"><Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="بحث عن منتج..." className="h-10 border-0 focus:ring-0" />
          </div>
          <CommandList className="max-h-60">
            <CommandEmpty>لا توجد منتجات</CommandEmpty>
            <CommandGroup>
              {products.map(p => {
                const label = `${p.name_ar || p.name_en}`;
                return (
                  <CommandItem
                    key={p.id}
                    value={`${p.name_ar ?? ""} ${p.name_en}`}
                    onSelect={() => { onChange(p); setOpen(false); }}
                  >
                    <Check className={cn("me-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{label}</span>
                    {p.price != null && <span className="text-xs text-muted-foreground ms-2">{Number(p.price).toFixed(2)}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
