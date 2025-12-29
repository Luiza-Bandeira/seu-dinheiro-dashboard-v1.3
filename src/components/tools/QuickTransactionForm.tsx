import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Plus, Receipt, RefreshCw, CreditCard } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";

type FinanceType = Database["public"]["Enums"]["finance_type"];

interface QuickTransactionFormProps {
  userId: string;
  onSuccess?: () => void;
  showTitle?: boolean;
  compact?: boolean;
}

type TransactionMode = "single" | "recurring" | "installment";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48];

export function QuickTransactionForm({ 
  userId, 
  onSuccess, 
  showTitle = true,
  compact = false 
}: QuickTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<TransactionMode>("single");
  
  // Core fields
  const [type, setType] = useState<string>("income");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Recurring fields
  const [frequency, setFrequency] = useState("monthly");
  const [endDate, setEndDate] = useState("");
  
  // Installment fields
  const [totalInstallments, setTotalInstallments] = useState(12);

  const resetForm = () => {
    setType("income");
    setCategory("");
    setValue(0);
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setMode("single");
    setFrequency("monthly");
    setEndDate("");
    setTotalInstallments(12);
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!category || value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha categoria e valor.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "single") {
        const { error } = await supabase.from("finances").insert([{
          user_id: userId,
          type: type as FinanceType,
          category,
          value,
          description: description || null,
          date,
        }]);

        if (error) throw error;

        toast({
          title: "Transação adicionada!",
          description: "Sua entrada financeira foi registrada.",
        });

      } else if (mode === "recurring") {
        // Salvar na recurring_expenses para gestão
        const { data: recurringData, error: recurringError } = await supabase
          .from("recurring_expenses")
          .insert([{
            user_id: userId,
            category,
            description: description || null,
            amount: value,
            frequency,
            start_date: date,
            end_date: endDate || null,
            next_due_date: date,
            is_active: true,
          }])
          .select()
          .single();

        if (recurringError) throw recurringError;

        // Calcular quantos lançamentos gerar baseado na frequência
        const recurringEntries = [];
        const startDateObj = new Date(date);
        const endDateObj = endDate ? new Date(endDate) : null;
        const frequencyLabel = FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label || "Mensal";
        
        // Gerar lançamentos para os próximos 12 meses (ou até end_date)
        let currentDate = new Date(startDateObj);
        let count = 0;
        const maxEntries = 12; // Máximo de 12 lançamentos futuros
        
        while (count < maxEntries) {
          // Verificar se passou da data fim
          if (endDateObj && currentDate > endDateObj) break;
          
          recurringEntries.push({
            user_id: userId,
            type: "fixed_expense" as FinanceType,
            category,
            value,
            description: `${description || category} (Recorrente - ${frequencyLabel})`,
            date: currentDate.toISOString().split("T")[0],
            source_type: "recurring",
            source_id: recurringData.id,
          });
          
          // Avançar para a próxima data baseado na frequência
          if (frequency === "daily") {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (frequency === "weekly") {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (frequency === "monthly") {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (frequency === "yearly") {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
          }
          
          count++;
        }

        const { error: financeError } = await supabase.from("finances").insert(recurringEntries);

        if (financeError) throw financeError;

        toast({
          title: "Despesa recorrente adicionada!",
          description: `${category} - ${count} lançamentos gerados (${frequencyLabel.toLowerCase()}).`,
        });

      } else if (mode === "installment") {
        const installmentAmount = value / totalInstallments;

        // Salvar na installment_purchases para gestão
        const { data: installmentData, error: installmentError } = await supabase
          .from("installment_purchases")
          .insert([{
            user_id: userId,
            category,
            description: description || null,
            total_amount: value,
            installment_amount: installmentAmount,
            total_installments: totalInstallments,
            paid_installments: 0,
            start_date: date,
            is_active: true,
          }])
          .select()
          .single();

        if (installmentError) throw installmentError;

        // Gerar lançamentos para CADA parcela na finances
        const installmentEntries = [];
        const startDate = new Date(date);
        
        for (let i = 0; i < totalInstallments; i++) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          installmentEntries.push({
            user_id: userId,
            type: "fixed_expense" as FinanceType,
            category,
            value: installmentAmount,
            description: `${description || category} - Parcela ${i + 1}/${totalInstallments}`,
            date: installmentDate.toISOString().split("T")[0],
            source_type: "installment",
            source_id: installmentData.id,
          });
        }

        const { error: financeError } = await supabase.from("finances").insert(installmentEntries);

        if (financeError) throw financeError;

        toast({
          title: "Compra parcelada adicionada!",
          description: `${category} em ${totalInstallments}x de R$ ${installmentAmount.toFixed(2)}. Lançamentos gerados para os próximos ${totalInstallments} meses.`,
        });
      }

      resetForm();
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const installmentPreview = mode === "installment" && value > 0 
    ? value / totalInstallments 
    : 0;

  const content = (
    <div className="space-y-4">
      {/* Transaction Type */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="fixed_expense">Despesa Fixa</SelectItem>
            <SelectItem value="variable_expense">Despesa Variável</SelectItem>
            <SelectItem value="receivable">A Receber</SelectItem>
            <SelectItem value="debt">Dívida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Core Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Input
            placeholder="Ex: Salário, Aluguel"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={value || ""}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          placeholder="Descrição opcional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Data</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Transaction Mode Selection */}
      <div className="space-y-3 pt-2">
        <Label className="text-muted-foreground">Tipo de Lançamento (opcional)</Label>
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as TransactionMode)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          <Label
            htmlFor="mode-single"
            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              mode === "single" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="single" id="mode-single" />
            <Receipt className="h-4 w-4" />
            <span className="text-sm font-medium">Única</span>
          </Label>
          <Label
            htmlFor="mode-recurring"
            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              mode === "recurring" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="recurring" id="mode-recurring" />
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Recorrente</span>
          </Label>
          <Label
            htmlFor="mode-installment"
            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              mode === "installment" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="installment" id="mode-installment" />
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-medium">Parcelada</span>
          </Label>
        </RadioGroup>
      </div>

      {/* Conditional Fields */}
      <AnimatePresence mode="wait">
        {mode === "recurring" && (
          <motion.div
            key="recurring-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-2">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Fim (opcional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {mode === "installment" && (
          <motion.div
            key="installment-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2 pb-2">
              <div className="space-y-2">
                <Label>Número de Parcelas</Label>
                <Select 
                  value={String(totalInstallments)} 
                  onValueChange={(v) => setTotalInstallments(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map(num => (
                      <SelectItem key={num} value={String(num)}>{num}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {installmentPreview > 0 && (
                <div className="p-4 bg-accent/20 rounded-xl border border-accent/30">
                  <p className="text-sm text-muted-foreground mb-1">Valor de cada parcela:</p>
                  <p className="text-xl font-bold text-brand-blue">
                    {totalInstallments}x de R$ {installmentPreview.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Lançamento
      </Button>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="rounded-2xl">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Lançamento
          </CardTitle>
          <CardDescription>
            Registre transações únicas, recorrentes ou parceladas
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "" : "pt-6"}>
        {content}
      </CardContent>
    </Card>
  );
}
