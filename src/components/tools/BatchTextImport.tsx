import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";
import { downloadBatchTemplate } from "@/utils/exportUtils";
import { useGamification } from "@/hooks/useGamification";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FinanceType = Database["public"]["Enums"]["finance_type"];

interface BatchTextImportProps {
  userId: string;
  onSuccess?: () => void;
}

interface ParsedTransaction {
  id: string;
  type: string;
  typeEnum: FinanceType;
  category: string;
  value: number;
  description: string;
  date: string;
  mode: "single" | "recurring" | "installment";
  installments?: number;
  frequency?: string;
  isValid: boolean;
  errors: string[];
}

const FREQUENCY_MAP: Record<string, string> = {
  "diario": "daily",
  "diário": "daily",
  "semanal": "weekly",
  "mensal": "monthly",
  "anual": "yearly",
};

const TYPE_MAP: Record<string, FinanceType> = {
  "receita": "income",
  "despesa": "variable_expense",
  "despesa fixa": "fixed_expense",
  "despesa variavel": "variable_expense",
  "despesa variável": "variable_expense",
  "a receber": "receivable",
  "divida": "debt",
  "dívida": "debt",
};

export function BatchTextImport({ userId, onSuccess }: BatchTextImportProps) {
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const { unlockAchievement, awardPoints } = useGamification(userId);

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    
    // Try DD/MM/YYYY format
    const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try YYYY-MM-DD format
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return dateStr;
    }
    
    return "";
  };

  const parseMode = (modeStr: string): { mode: "single" | "recurring" | "installment"; installments?: number; frequency?: string } => {
    if (!modeStr) return { mode: "single" };
    
    const normalized = modeStr.toLowerCase().trim();
    
    // Check for installments (e.g., "12x", "6x")
    const installmentMatch = normalized.match(/^(\d+)x$/);
    if (installmentMatch) {
      return { 
        mode: "installment", 
        installments: parseInt(installmentMatch[1]) 
      };
    }
    
    // Check for recurring
    if (normalized === "recorrente" || normalized === "mensal") {
      return { mode: "recurring", frequency: "monthly" };
    }
    
    // Check specific frequencies
    if (FREQUENCY_MAP[normalized]) {
      return { mode: "recurring", frequency: FREQUENCY_MAP[normalized] };
    }
    
    return { mode: "single" };
  };

  const parseText = () => {
    const lines = rawText.trim().split("\n");
    if (lines.length < 2) {
      toast({
        title: "Dados insuficientes",
        description: "Cole pelo menos uma linha de cabeçalho e uma linha de dados.",
        variant: "destructive",
      });
      return;
    }

    // Skip header (first line)
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    const parsed: ParsedTransaction[] = dataLines.map((line, index) => {
      const fields = line.split("\t");
      const errors: string[] = [];
      
      const rawType = (fields[0] || "").trim();
      const category = (fields[1] || "").trim();
      const rawValue = (fields[2] || "").trim();
      const description = (fields[3] || "").trim();
      const rawDate = (fields[4] || "").trim();
      const rawMode = (fields[5] || "").trim();
      
      // Parse type
      const typeEnum = TYPE_MAP[rawType.toLowerCase()] || "variable_expense";
      
      // Parse value
      const cleanValue = rawValue.replace(/[^\d.,]/g, "").replace(",", ".");
      const value = parseFloat(cleanValue) || 0;
      
      // Parse date
      const date = parseDate(rawDate);
      
      // Parse mode
      const { mode, installments, frequency } = parseMode(rawMode);
      
      // Validations
      if (!category) errors.push("Categoria obrigatória");
      if (value <= 0) errors.push("Valor inválido");
      if (!date) errors.push("Data inválida");
      
      return {
        id: `row-${index}`,
        type: rawType || "Despesa",
        typeEnum,
        category,
        value,
        description,
        date,
        mode,
        installments,
        frequency,
        isValid: errors.length === 0,
        errors,
      };
    });

    setParsedRows(parsed);
    setShowPreview(true);
  };

  const handleSaveAll = async () => {
    const validRows = parsedRows.filter(row => row.isValid);
    
    if (validRows.length === 0) {
      toast({
        title: "Nenhuma transação válida",
        description: "Corrija os erros antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let savedCount = 0;

      for (const row of validRows) {
        if (row.mode === "single") {
          // Direct insert to finances
          const { error } = await supabase.from("finances").insert([{
            user_id: userId,
            type: row.typeEnum,
            category: row.category,
            value: row.value,
            description: row.description || null,
            date: row.date,
          }]);
          
          if (!error) savedCount++;

        } else if (row.mode === "recurring") {
          // Insert to recurring_expenses and generate entries
          const { data: recurringData, error: recurringError } = await supabase
            .from("recurring_expenses")
            .insert([{
              user_id: userId,
              category: row.category,
              description: row.description || null,
              amount: row.value,
              frequency: row.frequency || "monthly",
              start_date: row.date,
              next_due_date: row.date,
              is_active: true,
            }])
            .select()
            .single();

          if (!recurringError && recurringData) {
            // Generate 12 future entries
            const entries = [];
            const startDate = new Date(row.date);
            
            for (let i = 0; i < 12; i++) {
              const entryDate = new Date(startDate);
              if (row.frequency === "daily") {
                entryDate.setDate(entryDate.getDate() + i);
              } else if (row.frequency === "weekly") {
                entryDate.setDate(entryDate.getDate() + (i * 7));
              } else if (row.frequency === "yearly") {
                entryDate.setFullYear(entryDate.getFullYear() + i);
              } else {
                entryDate.setMonth(entryDate.getMonth() + i);
              }
              
              entries.push({
                user_id: userId,
                type: row.typeEnum,
                category: row.category,
                value: row.value,
                description: `${row.description || row.category} (Recorrente)`,
                date: entryDate.toISOString().split("T")[0],
                source_type: "recurring",
                source_id: recurringData.id,
              });
            }
            
            await supabase.from("finances").insert(entries);
            savedCount++;
          }

        } else if (row.mode === "installment" && row.installments) {
          const installmentAmount = row.value / row.installments;
          
          // Insert to installment_purchases
          const { data: installmentData, error: installmentError } = await supabase
            .from("installment_purchases")
            .insert([{
              user_id: userId,
              category: row.category,
              description: row.description || null,
              total_amount: row.value,
              installment_amount: installmentAmount,
              total_installments: row.installments,
              paid_installments: 0,
              start_date: row.date,
              is_active: true,
            }])
            .select()
            .single();

          if (!installmentError && installmentData) {
            // Generate entries for each installment
            const entries = [];
            const startDate = new Date(row.date);
            
            for (let i = 0; i < row.installments; i++) {
              const entryDate = new Date(startDate);
              entryDate.setMonth(entryDate.getMonth() + i);
              
              entries.push({
                user_id: userId,
                type: row.typeEnum,
                category: row.category,
                value: installmentAmount,
                description: `${row.description || row.category} - Parcela ${i + 1}/${row.installments}`,
                date: entryDate.toISOString().split("T")[0],
                source_type: "installment",
                source_id: installmentData.id,
              });
            }
            
            await supabase.from("finances").insert(entries);
            savedCount++;
          }
        }
      }

      toast({
        title: "Lançamentos salvos!",
        description: `${savedCount} transações foram registradas com sucesso.`,
      });

      // Gamification
      await unlockAchievement("batch_import");
      await awardPoints("batch_import", `Importou ${savedCount} lançamentos`);

      // Reset form
      setRawText("");
      setParsedRows([]);
      setShowPreview(false);
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

  const getModeLabel = (row: ParsedTransaction) => {
    if (row.mode === "recurring") return "Recorrente";
    if (row.mode === "installment") return `${row.installments}x`;
    return "Única";
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-brand-blue flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Lançamento em Lote
        </CardTitle>
        <CardDescription>
          Cole dados de planilha (Excel/Google Sheets) separados por TAB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template Button */}
        <Button
          variant="outline"
          onClick={downloadBatchTemplate}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Modelo XLS
        </Button>

        {/* Text Input Area */}
        <div className="space-y-2">
          <Label>Cole os dados da planilha aqui:</Label>
          <Textarea
            placeholder={`Tipo\tCategoria\tValor\tDescrição\tData\tTipo de Lançamento
Receita\tSalário\t5000\tSalário empresa X\t01/01/2025\tRecorrente
Despesa\tAluguel\t1500\tApartamento\t05/01/2025\tRecorrente
Despesa\tTV Nova\t3000\tTelevisão\t10/01/2025\t12x`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            💡 A primeira linha (cabeçalho) será ignorada. Use TAB para separar os campos.
          </p>
        </div>

        <Button onClick={parseText} disabled={!rawText.trim()} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Processar Dados
        </Button>

        {/* Preview Section */}
        <AnimatePresence>
          {showPreview && parsedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{validCount} válidas</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{invalidCount} com erros</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">OK</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Modo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row) => (
                        <TableRow 
                          key={row.id} 
                          className={!row.isValid ? "bg-destructive/10" : ""}
                        >
                          <TableCell>
                            {row.isValid ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="group relative">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <div className="absolute z-10 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg left-6 top-0 w-48">
                                  {row.errors.join(", ")}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{row.type}</TableCell>
                          <TableCell className="font-medium">{row.category || "-"}</TableCell>
                          <TableCell className="text-right">
                            R$ {row.value.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {row.date ? new Date(row.date + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.mode === "recurring" 
                                ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                                : row.mode === "installment"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {getModeLabel(row)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveAll} 
                disabled={loading || validCount === 0}
                className="w-full"
                size="lg"
              >
                {loading ? "Salvando..." : `Salvar ${validCount} Lançamentos`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
