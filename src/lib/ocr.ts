import { createWorker } from 'tesseract.js';
import { OCRParseResult } from '../types';

export async function processReceiptOCR(
  fileOrImage: File | Blob | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<OCRParseResult> {
  const worker = await createWorker('por+eng');

  try {
    if (onProgress) onProgress(10, 'Iniciando motor Tesseract OCR...');

    const ret = await worker.recognize(fileOrImage);
    const text = ret.data.text;
    const confidence = ret.data.confidence;

    if (onProgress) onProgress(80, 'Analisando dados do comprovante...');

    const result = parseReceiptText(text, confidence);
    if (onProgress) onProgress(100, 'Processamento concluído!');

    await worker.terminate();
    return result;
  } catch (error) {
    await worker.terminate();
    console.error('Erro no Tesseract OCR:', error);
    throw error;
  }
}

export function parseReceiptText(rawText: string, confidence: number = 90): OCRParseResult {
  const text = rawText.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let valor: number | undefined;
  let data: string | undefined;
  let hora: string | undefined;
  let favorecido: string | undefined;
  let banco: string | undefined;
  let tipo_transacao: string | undefined = 'PIX / Transferência';
  let num_transacao: string | undefined;

  // 1. Extrair Valor
  const valorRegex = /(?:R\$\s*|VALOR\s*:?\s*R\$\s*|TOTAL\s*:?\s*R\$\s*|VALOR PAGO\s*:?\s*R\$\s*)([\d\.\,]+)/i;
  const valorMatch = text.match(valorRegex);
  
  if (valorMatch && valorMatch[1]) {
    valor = cleanAmount(valorMatch[1]);
  } else {
    // Procurar o maior valor no padrão de moeda R$ XX,XX ou XX,XX
    const matches = text.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g);
    if (matches && matches.length > 0) {
      const parsedValues = matches.map(m => cleanAmount(m)).filter(v => v > 0);
      if (parsedValues.length > 0) {
        valor = Math.max(...parsedValues);
      }
    }
  }

  // 2. Extrair Data (DD/MM/YYYY)
  const dataRegex = /\b(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})\b/;
  const dataMatch = text.match(dataRegex);
  if (dataMatch) {
    const [, day, month, year] = dataMatch;
    data = `${year}-${month}-${day}`;
  } else {
    const dataCurtaRegex = /\b(\d{2})[\/\.-](\d{2})[\/\.-](\d{2})\b/;
    const dataCurtaMatch = text.match(dataCurtaRegex);
    if (dataCurtaMatch) {
      const [, day, month, yearShort] = dataCurtaMatch;
      data = `20${yearShort}-${month}-${day}`;
    }
  }

  // 3. Extrair Hora (HH:MM:SS ou HH:MM)
  const horaRegex = /\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/;
  const horaMatch = text.match(horaRegex);
  if (horaMatch) {
    hora = horaMatch[0];
  }

  // 4. Extrair Favorecido / Destinatário / Recebedor
  const favorecidoRegex = /(?:FAVORECIDO|DESTINATARIO|RECEBEDOR|NOME DO RECEBEDOR|PARA|NOME)\s*:?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,40})/i;
  const favMatch = text.match(favorecidoRegex);
  if (favMatch && favMatch[1]) {
    favorecido = favMatch[1].trim();
  }

  // 5. Extrair Banco
  const bancosConhecidos = [
    'Nubank', 'Itaú', 'Itau', 'Bradesco', 'Banco do Brasil', 'BB', 
    'Santander', 'Banco Inter', 'Inter', 'Caixa', 'C6 Bank', 'C6', 
    'Sicoob', 'Sicredi', 'Stone', 'PagBank', 'PagSeguro', 'Mercado Pago', 'PicPay'
  ];

  for (const b of bancosConhecidos) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
      banco = b;
      break;
    }
  }

  // 6. Tipo de Transação
  if (/pix/i.test(text)) {
    tipo_transacao = 'PIX';
  } else if (/boleto/i.test(text)) {
    tipo_transacao = 'Pagamento de Boleto';
  } else if (/ted|doc|transfer[eê]ncia/i.test(text)) {
    tipo_transacao = 'Transferência Bancária';
  } else if (/cart[aã]o|cr[eé]dito|d[eé]bito/i.test(text)) {
    tipo_transacao = 'Cartão de Crédito / Débito';
  }

  // 7. Número da Transação / Autenticação
  const numRegex = /(?:AUTENTICA[CÇ][AÃ]O|ID DA TRANSA[CÇ][AÃ]O|TRANSA[CÇ][AÃ]O|NSU|CODIGO)\s*:?\s*([A-Z0-9\.-]{6,40})/i;
  const numMatch = text.match(numRegex);
  if (numMatch && numMatch[1]) {
    num_transacao = numMatch[1].trim();
  }

  return {
    valor,
    data,
    hora,
    favorecido,
    banco,
    tipo_transacao,
    num_transacao,
    raw_text: text,
    confidence,
  };
}

function cleanAmount(str: string): number {
  const cleanStr = str
    .replace(/[^\d,\.]/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.');
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 0 : val;
}
