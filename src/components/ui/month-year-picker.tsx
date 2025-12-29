import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  value: string; // format: YYYY-MM
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function MonthYearPicker({ value, onChange, className }: MonthYearPickerProps) {
  const [year, month] = value.split("-");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Generate years: 3 years back, current, and 3 years forward
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  
  const handleMonthChange = (newMonth: string) => {
    onChange(`${year}-${newMonth}`);
  };
  
  const handleYearChange = (newYear: string) => {
    onChange(`${newYear}-${month}`);
  };
  
  const handlePrevMonth = () => {
    const date = new Date(parseInt(year), parseInt(month) - 2, 1);
    onChange(date.toISOString().slice(0, 7));
  };
  
  const handleNextMonth = () => {
    const date = new Date(parseInt(year), parseInt(month), 1);
    onChange(date.toISOString().slice(0, 7));
  };
  
  const handleToday = () => {
    onChange(new Date().toISOString().slice(0, 7));
  };
  
  const isCurrentMonth = parseInt(year) === currentYear && parseInt(month) === currentMonth;
  const isFuture = new Date(parseInt(year), parseInt(month) - 1, 1) > new Date();
  
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        <Select value={month} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToday}
          className="text-brand-blue"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Hoje
        </Button>
      )}
      
      {isFuture && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          Futuro
        </span>
      )}
    </div>
  );
}