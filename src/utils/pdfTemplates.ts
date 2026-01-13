import jsPDF from "jspdf";

// Brand colors
const BRAND_BLUE_RGB = [11, 40, 96];
const BRAND_MAGENTA_RGB = [239, 19, 124];
const BRAND_PINK_RGB = [247, 172, 179];

interface TemplateOptions {
  title: string;
  subtitle?: string;
}

// Helper to add header
const addHeader = (doc: jsPDF) => {
  doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.rect(0, 0, 210, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ECONOMIZA", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Seu Dinheiro na Mesa", 14, 28);
};

// Helper to add footer
const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.rect(0, pageHeight - 20, 210, 20, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Material exclusivo do programa Seu Dinheiro na Mesa", 14, pageHeight - 10);
  doc.text(`Página ${pageNum} de ${totalPages}`, 180, pageHeight - 10);
};

// Helper to add page title
const addPageTitle = (doc: jsPDF, title: string, subtitle?: string): number => {
  let yPos = 50;
  
  doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, yPos);
  
  if (subtitle) {
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, yPos);
  }
  
  return yPos + 15;
};

// Checklist Template
export const generateChecklistPDF = (
  items: string[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  // Draw checklist items
  items.forEach((item, index) => {
    if (yPos > 260) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Checkbox
    doc.setDrawColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.setLineWidth(0.5);
    doc.rect(14, yPos - 4, 5, 5);
    
    // Item text
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(item, 24, yPos);
    
    yPos += 10;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Guide Template (with sections)
interface GuideSection {
  title: string;
  items: string[];
}

export const generateGuidePDF = (
  sections: GuideSection[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  sections.forEach((section) => {
    if (yPos > 240) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Section title
    doc.setFillColor(BRAND_PINK_RGB[0], BRAND_PINK_RGB[1], BRAND_PINK_RGB[2]);
    doc.roundedRect(12, yPos - 6, 186, 10, 2, 2, "F");
    
    doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 16, yPos);
    yPos += 12;
    
    // Section items
    section.items.forEach((item) => {
      if (yPos > 260) {
        doc.addPage();
        addHeader(doc);
        yPos = 50;
      }
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${item}`, 18, yPos);
      yPos += 7;
    });
    
    yPos += 8;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Workbook Template (with exercises)
interface WorkbookExercise {
  title: string;
  instructions: string;
  fields: { label: string; lines: number }[];
}

export const generateWorkbookPDF = (
  exercises: WorkbookExercise[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  exercises.forEach((exercise, exerciseIndex) => {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Exercise title with number
    doc.setFillColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.roundedRect(12, yPos - 6, 186, 12, 2, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Exercício ${exerciseIndex + 1}: ${exercise.title}`, 16, yPos);
    yPos += 14;
    
    // Instructions
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(exercise.instructions, 14, yPos);
    yPos += 10;
    
    // Fields with lines
    exercise.fields.forEach((field) => {
      if (yPos > 250) {
        doc.addPage();
        addHeader(doc);
        yPos = 50;
      }
      
      doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(field.label, 14, yPos);
      yPos += 6;
      
      // Draw lines for writing
      for (let i = 0; i < field.lines; i++) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, yPos + 5, 196, yPos + 5);
        yPos += 8;
      }
      
      yPos += 5;
    });
    
    yPos += 10;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Script Template (negotiation scripts)
interface ScriptItem {
  title: string;
  script: string[];
  tips?: string[];
}

export const generateScriptPDF = (
  scripts: ScriptItem[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  scripts.forEach((scriptItem, index) => {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Script title
    doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.roundedRect(12, yPos - 6, 186, 10, 2, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Script ${index + 1}: ${scriptItem.title}`, 16, yPos);
    yPos += 14;
    
    // Script text box
    doc.setFillColor(248, 248, 248);
    const scriptText = scriptItem.script.join("\n");
    const textLines = doc.splitTextToSize(scriptText, 170);
    const boxHeight = textLines.length * 6 + 10;
    
    doc.roundedRect(14, yPos - 4, 182, boxHeight, 3, 3, "F");
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(textLines, 18, yPos + 2);
    yPos += boxHeight + 5;
    
    // Tips if available
    if (scriptItem.tips && scriptItem.tips.length > 0) {
      doc.setTextColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("💡 Dicas:", 14, yPos);
      yPos += 6;
      
      scriptItem.tips.forEach((tip) => {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${tip}`, 18, yPos);
        yPos += 5;
      });
    }
    
    yPos += 12;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Substitution Guide Template
interface SubstitutionItem {
  from: string;
  to: string;
  savings?: string;
}

export const generateSubstitutionPDF = (
  items: SubstitutionItem[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  // Table header
  doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.rect(14, yPos - 5, 182, 10, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SUBSTITUA", 20, yPos);
  doc.text("POR", 100, yPos);
  doc.text("ECONOMIA", 160, yPos);
  yPos += 10;
  
  items.forEach((item, index) => {
    if (yPos > 260) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
      
      // Repeat header
      doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
      doc.rect(14, yPos - 5, 182, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SUBSTITUA", 20, yPos);
      doc.text("POR", 100, yPos);
      doc.text("ECONOMIA", 160, yPos);
      yPos += 10;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(14, yPos - 5, 182, 10, "F");
    }
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(item.from, 20, yPos);
    
    // Arrow
    doc.setTextColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.text("→", 88, yPos);
    
    doc.setTextColor(50, 50, 50);
    doc.text(item.to, 100, yPos);
    
    if (item.savings) {
      doc.setTextColor(34, 197, 94); // Green
      doc.setFont("helvetica", "bold");
      doc.text(item.savings, 160, yPos);
    }
    
    yPos += 10;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Alert Guide Template
interface AlertLevel {
  level: string;
  color: [number, number, number];
  items: string[];
}

export const generateAlertGuidePDF = (
  levels: AlertLevel[],
  whatToDo: string[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  levels.forEach((level) => {
    if (yPos > 220) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Level header
    doc.setFillColor(level.color[0], level.color[1], level.color[2]);
    doc.roundedRect(14, yPos - 6, 182, 10, 2, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`⚠️ ${level.level}`, 20, yPos);
    yPos += 12;
    
    // Items
    level.items.forEach((item) => {
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${item}`, 20, yPos);
      yPos += 7;
    });
    
    yPos += 8;
  });
  
  // What to do section
  if (yPos > 200) {
    doc.addPage();
    addHeader(doc);
    yPos = 50;
  }
  
  doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.roundedRect(14, yPos - 6, 182, 10, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("✅ O QUE FAZER", 20, yPos);
  yPos += 12;
  
  whatToDo.forEach((item, index) => {
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${index + 1}. ${item}`, 20, yPos);
    yPos += 7;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Calendar Template
export const generateCalendarPDF = (
  weeklyTasks: string[],
  biweeklyTasks: string[],
  monthlyTasks: string[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  // Weekly tasks
  doc.setFillColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
  doc.roundedRect(14, yPos - 6, 182, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("📅 TODA SEMANA", 20, yPos);
  yPos += 14;
  
  weeklyTasks.forEach((task) => {
    doc.setDrawColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.rect(20, yPos - 4, 4, 4);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(task, 28, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Biweekly tasks
  doc.setFillColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.roundedRect(14, yPos - 6, 182, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("📅 TODA QUINZENA", 20, yPos);
  yPos += 14;
  
  biweeklyTasks.forEach((task) => {
    doc.setDrawColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.rect(20, yPos - 4, 4, 4);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(task, 28, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Monthly tasks
  doc.setFillColor(BRAND_PINK_RGB[0], BRAND_PINK_RGB[1], BRAND_PINK_RGB[2]);
  doc.roundedRect(14, yPos - 6, 182, 10, 2, 2, "F");
  doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("📅 TODO MÊS", 20, yPos);
  yPos += 14;
  
  monthlyTasks.forEach((task) => {
    doc.setDrawColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.rect(20, yPos - 4, 4, 4);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(task, 28, yPos);
    yPos += 8;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};

// Investment Guide Template
interface InvestmentStep {
  title: string;
  objective: string;
  where: string;
  why: string;
}

export const generateInvestmentGuidePDF = (
  steps: InvestmentStep[],
  options: TemplateOptions
): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc);
  let yPos = addPageTitle(doc, options.title, options.subtitle);
  
  steps.forEach((step, index) => {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc);
      yPos = 50;
    }
    
    // Step number circle
    doc.setFillColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.circle(24, yPos, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(index + 1), 22, yPos + 4);
    
    // Step title
    doc.setTextColor(BRAND_BLUE_RGB[0], BRAND_BLUE_RGB[1], BRAND_BLUE_RGB[2]);
    doc.setFontSize(12);
    doc.text(step.title, 38, yPos + 4);
    yPos += 15;
    
    // Content box
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(14, yPos - 4, 182, 35, 3, 3, "F");
    
    doc.setTextColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Objetivo:", 18, yPos + 2);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(step.objective, 42, yPos + 2);
    
    doc.setTextColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Onde:", 18, yPos + 12);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(step.where, 34, yPos + 12);
    
    doc.setTextColor(BRAND_MAGENTA_RGB[0], BRAND_MAGENTA_RGB[1], BRAND_MAGENTA_RGB[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Por quê:", 18, yPos + 22);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(step.why, 40, yPos + 22);
    
    yPos += 45;
  });
  
  // Add footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }
  
  return doc;
};
