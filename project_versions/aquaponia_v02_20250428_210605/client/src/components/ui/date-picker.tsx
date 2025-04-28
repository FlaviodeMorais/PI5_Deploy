import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  className?: string;
}

export function DatePicker({ date, setDate, label, className }: DatePickerProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm text-gray-300">{label}</label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-[#1e293b] border border-white/5 hover:bg-white/10",
              !date && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecionar data...</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#1e293b] border border-white/5">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            locale={ptBR}
            className="bg-[#1e293b]"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
