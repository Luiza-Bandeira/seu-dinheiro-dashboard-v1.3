import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Brand colors
const BRAND_BLUE = "#0B2860";
const BRAND_MAGENTA = "#ef137c";

interface ExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string | number }[];
}

export const exportToPDF = (data: ExportData, filename: string) => {
  const doc = new jsPDF();
  
  // Header with brand
  doc.setFillColor(11, 40, 96); // BRAND_BLUE
  doc.rect(0, 0, 210, 30, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ECONOMIZA", 14, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Seu Dinheiro na Mesa", 14, 24);
  
  // Title
  doc.setTextColor(11, 40, 96);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 14, 45);
  
  if (data.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(data.subtitle, 14, 52);
  }
  
  // Summary cards
  if (data.summary && data.summary.length > 0) {
    let yPos = data.subtitle ? 60 : 55;
    const cardWidth = 45;
    
    data.summary.forEach((item, index) => {
      const xPos = 14 + (index % 4) * (cardWidth + 5);
      if (index > 0 && index % 4 === 0) {
        yPos += 25;
      }
      
      doc.setFillColor(247, 247, 247);
      doc.roundedRect(xPos, yPos, cardWidth, 20, 2, 2, "F");
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, xPos + 3, yPos + 7);
      
      doc.setFontSize(11);
      doc.setTextColor(11, 40, 96);
      doc.setFont("helvetica", "bold");
      doc.text(String(item.value), xPos + 3, yPos + 15);
      doc.setFont("helvetica", "normal");
    });
    
    yPos += 30;
    
    // Table
    autoTable(doc, {
      head: [data.headers],
      body: data.rows,
      startY: yPos,
      headStyles: {
        fillColor: [11, 40, 96],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [247, 247, 247],
      },
      styles: {
        fontSize: 9,
      },
    });
  } else {
    // Table without summary
    autoTable(doc, {
      head: [data.headers],
      body: data.rows,
      startY: data.subtitle ? 58 : 52,
      headStyles: {
        fillColor: [11, 40, 96],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [247, 247, 247],
      },
      styles: {
        fontSize: 9,
      },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} - Economiza © ${new Date().getFullYear()}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }
  
  doc.save(`${filename}.pdf`);
};

export const exportToCSV = (data: ExportData, filename: string) => {
  const csvContent = [
    data.headers.join(","),
    ...data.rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        // Escape quotes and wrap in quotes if contains comma
        if (cellStr.includes(",") || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    ),
  ].join("\n");
  
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const exportToXLSX = (data: ExportData, filename: string) => {
  const wsData = [data.headers, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = data.headers.map((_, i) => ({
    wch: Math.max(
      data.headers[i].length,
      ...data.rows.map(row => String(row[i]).length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, data.title.slice(0, 31));
  
  // Add summary sheet if exists
  if (data.summary && data.summary.length > 0) {
    const summaryData = data.summary.map(item => [item.label, item.value]);
    const summaryWs = XLSX.utils.aoa_to_sheet([["Indicador", "Valor"], ...summaryData]);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Resumo");
  }
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("pt-BR");
};
