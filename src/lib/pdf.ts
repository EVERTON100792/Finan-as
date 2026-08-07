import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Recipe, Expense, Bill, CreditCard, UserProfile } from '../types';
import { formatCurrency, formatDate } from './utils';

export interface PDFReportData {
  title: string;
  subtitle: string;
  periodText: string;
  profile: UserProfile;
  recipes: Recipe[];
  expenses: Expense[];
  bills: Bill[];
  cards: CreditCard[];
}

export async function generateFinancialPDFReport(data: PDFReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.06, 0.72, 0.51); // emerald-500 #10b981
  const darkColor = rgb(0.06, 0.09, 0.16); // slate-950 #0f172a
  const grayColor = rgb(0.4, 0.45, 0.55); // slate-500
  const lightGray = rgb(0.95, 0.96, 0.98);

  let y = height - 40;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: y - 50,
    width: width,
    height: 70,
    color: darkColor,
  });

  page.drawText('MEU FINANCEIRO', {
    x: 30,
    y: y,
    size: 20,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText('RELATÓRIO FINANCEIRO PESSOAL', {
    x: 30,
    y: y - 20,
    size: 10,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, {
    x: width - 230,
    y: y - 20,
    size: 9,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 80;

  // Report Title & Period
  page.drawText(data.title.toUpperCase(), {
    x: 30,
    y: y,
    size: 14,
    font: fontBold,
    color: darkColor,
  });

  page.drawText(data.periodText, {
    x: 30,
    y: y - 16,
    size: 10,
    font: fontRegular,
    color: grayColor,
  });

  y -= 45;

  // Key Financial Metrics Summary Box
  const totalReceitas = data.recipes.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalDespesas = data.expenses.reduce((sum, e) => sum + Number(e.valor), 0);
  const balanco = totalReceitas - totalDespesas;

  page.drawRectangle({
    x: 30,
    y: y - 55,
    width: width - 60,
    height: 65,
    color: lightGray,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  // Card 1: Receitas
  page.drawText('TOTAL RECEITAS', { x: 45, y: y, size: 8, font: fontBold, color: grayColor });
  page.drawText(formatCurrency(totalReceitas), { x: 45, y: y - 18, size: 12, font: fontBold, color: rgb(0.06, 0.72, 0.51) });

  // Card 2: Despesas
  page.drawText('TOTAL DESPESAS', { x: 210, y: y, size: 8, font: fontBold, color: grayColor });
  page.drawText(formatCurrency(totalDespesas), { x: 210, y: y - 18, size: 12, font: fontBold, color: rgb(0.93, 0.27, 0.27) });

  // Card 3: Saldo / Balanço
  page.drawText('BALANÇO DO PERÍODO', { x: 385, y: y, size: 8, font: fontBold, color: grayColor });
  page.drawText(formatCurrency(balanco), { 
    x: 385, 
    y: y - 18, 
    size: 12, 
    font: fontBold, 
    color: balanco >= 0 ? rgb(0.06, 0.72, 0.51) : rgb(0.93, 0.27, 0.27) 
  });

  y -= 85;

  // Receitas Table
  if (data.recipes.length > 0) {
    page.drawText('RECEITAS REGISTRADAS', { x: 30, y: y, size: 11, font: fontBold, color: darkColor });
    y -= 15;

    // Table Header
    page.drawRectangle({ x: 30, y: y - 15, width: width - 60, height: 20, color: darkColor });
    page.drawText('Data', { x: 40, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Descrição', { x: 120, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Categoria', { x: 300, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Valor (R$)', { x: 460, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });

    y -= 20;

    data.recipes.slice(0, 10).forEach((rec, idx) => {
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }

      if (idx % 2 === 1) {
        page.drawRectangle({ x: 30, y: y - 12, width: width - 60, height: 16, color: lightGray });
      }

      page.drawText(formatDate(rec.data), { x: 40, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(truncateText(rec.descricao, 30), { x: 120, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(truncateText(rec.categoria, 20), { x: 300, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(formatCurrency(rec.valor), { x: 460, y: y - 8, size: 8, font: fontBold, color: rgb(0.06, 0.72, 0.51) });

      y -= 18;
    });

    y -= 15;
  }

  // Despesas Table
  if (data.expenses.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }

    page.drawText('DESPESAS REGISTRADAS', { x: 30, y: y, size: 11, font: fontBold, color: darkColor });
    y -= 15;

    // Table Header
    page.drawRectangle({ x: 30, y: y - 15, width: width - 60, height: 20, color: darkColor });
    page.drawText('Data', { x: 40, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Descrição', { x: 120, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Categoria', { x: 280, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Forma Pgto', { x: 390, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Valor (R$)', { x: 470, y: y - 10, size: 8, font: fontBold, color: rgb(1, 1, 1) });

    y -= 20;

    data.expenses.slice(0, 15).forEach((exp, idx) => {
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }

      if (idx % 2 === 1) {
        page.drawRectangle({ x: 30, y: y - 12, width: width - 60, height: 16, color: lightGray });
      }

      page.drawText(formatDate(exp.data), { x: 40, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(truncateText(exp.descricao, 25), { x: 120, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(truncateText(exp.categoria, 18), { x: 280, y: y - 8, size: 8, font: fontRegular, color: darkColor });
      page.drawText(exp.forma_pagamento.toUpperCase(), { x: 390, y: y - 8, size: 8, font: fontRegular, color: grayColor });
      page.drawText(formatCurrency(exp.valor), { x: 470, y: y - 8, size: 8, font: fontBold, color: rgb(0.93, 0.27, 0.27) });

      y -= 18;
    });
  }

  // Footer on bottom page
  page.drawText('Meu Financeiro - Aplicativo de Gestão Financeira Pessoal', {
    x: 30,
    y: 20,
    size: 8,
    font: fontRegular,
    color: grayColor,
  });

  return await pdfDoc.save();
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
