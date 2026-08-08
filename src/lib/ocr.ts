import { createWorker } from 'tesseract.js';
import { OCRParseResult } from '../types';
import { analyzeReceiptWithAiVision } from './aiVision';

export async function tryExtractQrCodeData(imageSource: File | Blob | string): Promise<Partial<OCRParseResult> | null> {
  try {
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      let imgElement: HTMLImageElement | null = null;

      if (typeof imageSource === 'string') {
        imgElement = new Image();
        imgElement.src = imageSource;
        await new Promise(r => imgElement!.onload = r);
      } else {
        const url = URL.createObjectURL(imageSource);
        imgElement = new Image();
        imgElement.src = url;
        await new Promise(r => imgElement!.onload = r);
        URL.revokeObjectURL(url);
      }

      if (imgElement) {
        const barcodes = await barcodeDetector.detect(imgElement);
        if (barcodes && barcodes.length > 0) {
          const qrText = barcodes[0].rawValue;
          console.log('✨ QR Code Lido com Sucesso:', qrText);
          
          const qrData: Partial<OCRParseResult> = {
            num_transacao: qrText,
            tipo_transacao: 'NFC-e / Cupom Fiscal (QR Code Lido)',
          };

          // Extrair valor da URL do QR Code NFC-e (vVal=XX.XX ou |XX.XX| ou vPag=XX.XX)
          const valMatch = qrText.match(/(?:vVal|vPag|valor|val)=([\d\.]+)/i) || qrText.match(/\|([\d]{1,4}\.\d{2})\|/);
          if (valMatch && valMatch[1]) {
            const parsed = parseFloat(valMatch[1]);
            if (!isNaN(parsed) && parsed > 0) {
              qrData.valor = parsed;
            }
          }

          // Extrair data do QR Code NFC-e (dhEmi=YYYY-MM-DD ou AAAAMMDD)
          const dataMatch = qrText.match(/(?:dhEmi|data)=20(\d{2})[_\-]?(\d{2})[_\-]?(\d{2})/i);
          if (dataMatch) {
            qrData.data = `20${dataMatch[1]}-${dataMatch[2]}-${dataMatch[3]}`;
          }

          return qrData;
        }
      }
    }
  } catch (e) {
    console.warn('BarcodeDetector não suportado ou erro ao ler QR Code:', e);
  }
  return null;
}

export async function processReceiptOCR(
  fileOrImage: File | Blob | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<OCRParseResult> {
  // 1. Tentar leitura com Inteligência Artificial Vision (Groq / Gemini) em primeiro lugar
  try {
    if (onProgress) onProgress(5, 'Consultando Inteligência Artificial (IA Vision)...');
    const aiResult = await analyzeReceiptWithAiVision(fileOrImage);
    if (aiResult && aiResult.valor && aiResult.valor > 0) {
      if (onProgress) onProgress(100, 'Leitura IA concluída com 100% de precisão!');
      return aiResult;
    }
  } catch (aiErr) {
    console.warn('IA Vision não configurada ou sem chave, utilizando processamento nativo:', aiErr);
  }

  // 2. Motor Nativo (QR Code + Tesseract OCR)
  const worker = await createWorker('por+eng');

  try {
    if (onProgress) onProgress(15, 'Lendo QR Code e imagens...');
    const qrResult = await tryExtractQrCodeData(fileOrImage);

    if (onProgress) onProgress(30, 'Iniciando motor Tesseract OCR...');

    const ret = await worker.recognize(fileOrImage);
    const text = ret.data.text;
    const confidence = ret.data.confidence;

    if (onProgress) onProgress(80, 'Analisando dados do comprovante...');

    const result = parseReceiptText(text, confidence);

    // Se detectou dados 100% exatos no QR Code, mesclar no resultado final
    if (qrResult) {
      if (qrResult.valor && qrResult.valor > 0) {
        result.valor = qrResult.valor;
      }
      if (qrResult.data) {
        result.data = qrResult.data;
      }
      if (qrResult.tipo_transacao) {
        result.tipo_transacao = qrResult.tipo_transacao;
      }
    }

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
  let categoria_sugerida: string | undefined;

  // Detectar se é Cupom Fiscal / Nota Fiscal / Recibo Físico
  const isCupomFiscal = /cupom\s*fiscal|nfc-?e|sat|extrato\s*n|nota\s*fiscal|danfe|comprovante\s*de\s*venda|recibo\s*de\s*compra/i.test(text);
  if (isCupomFiscal) {
    tipo_transacao = 'Cupom Fiscal / Nota Fiscal';
  }

  // 1. Extrair Valor - Prioridade Máxima para "VALOR A PAGAR" e "VALOR PAGO"
  // Filtrar linhas de tributos/impostos para nunca contaminar a leitura do valor real
  const linesWithoutTaxes = lines.filter(l => !/tributo|imposto|lei\s*12|ibpt|federal|estadual|municipal/i.test(l));

  // Estratégia A: Escanear linhas contendo frases exatas como "VALOR A PAGAR", "VALOR PAGO" ou "TOTAL A PAGAR"
  for (let i = 0; i < linesWithoutTaxes.length; i++) {
    const line = linesWithoutTaxes[i];
    if (/\b(?:valor\s+a\s+pagar|valor\s+pago|total\s+a\s+pagar|total\s+pago|liquido\s+a\s+pagar|valor\s+liquido)\b/i.test(line)) {
      // Procurar valores no formato 00,00 nesta linha ou nas próximas 3 linhas
      for (let j = i; j < Math.min(i + 4, linesWithoutTaxes.length); j++) {
        const numbers = linesWithoutTaxes[j].match(/\b\d{1,4}[\,\.]\d{2}\b/g);
        if (numbers && numbers.length > 0) {
          const candidate = cleanAmount(numbers[numbers.length - 1]);
          if (candidate > 0) {
            valor = candidate;
            break;
          }
        }
      }
      if (valor && valor > 0) break;
    }
  }

  // Estratégia B: Se não encontrou por frase exata em linha, testar por Regex Multilinha Estrita
  if (!valor || valor === 0) {
    const patternsValor = [
      /(?:VALOR\s+A\s+PAGAR|VALOR\s+PAGO|TOTAL\s+A\s+PAGAR|VALOR\s+L[IÍ]QUIDO)[\s\S]{0,60}?([\d]{1,4}[\,\.][\d]{2})/i,
      /(?:VALOR\s+TOTAL|TOTAL\s+R\$|VALOR\s+RECEBIDO)[\s\S]{0,60}?([\d]{1,4}[\,\.][\d]{2})/i,
      /R\$\s*([\d]{1,4}[\,\.][\d]{2})/i,
    ];

    for (const pattern of patternsValor) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const parsedVal = cleanAmount(match[1]);
        if (parsedVal > 0) {
          valor = parsedVal;
          break;
        }
      }
    }
  }

  // Fallback C: Procurar o valor no padrão de moeda R$ XX,XX ou XX,XX excluindo impostos
  if (!valor || valor === 0) {
    const textWithoutTaxes = linesWithoutTaxes.join('\n');
    const matches = textWithoutTaxes.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g);
    if (matches && matches.length > 0) {
      const parsedValues = matches.map(m => cleanAmount(m)).filter(v => v > 0);
      if (parsedValues.length > 0) {
        valor = Math.max(...parsedValues);
      }
    }
  }

  // 2. Extrair Data (DD/MM/YYYY ou YYYY-MM-DD)
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
      // Validar ano de 2 dígitos razoável (20 a 30)
      const yrNum = parseInt(yearShort, 10);
      const fullYear = yrNum >= 20 && yrNum <= 35 ? `20${yearShort}` : `2026`;
      data = `${fullYear}-${month}-${day}`;
    }
  }

  // 3. Extrair Hora (HH:MM:SS ou HH:MM)
  const horaRegex = /\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/;
  const horaMatch = text.match(horaRegex);
  if (horaMatch) {
    hora = horaMatch[0];
  }

  // 4. Extrair Favorecido / Nome do Estabelecimento Comercial
  const favorecidoRegex = /(?:FAVORECIDO|DESTINATARIO|RECEBEDOR|NOME DO RECEBEDOR|PARA|RAZ[AÃ]O SOCIAL|ESTABELECIMENTO|LOJA|NOME)\s*:?\s*([A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.\-]{3,40})/i;
  const favMatch = text.match(favorecidoRegex);
  if (favMatch && favMatch[1]) {
    favorecido = favMatch[1].trim();
  } else {
    // Para cupons fiscais e notas físicas, o nome do estabelecimento fica nas primeiras linhas
    const boilerplatePatterns = /cupom|fiscal|extrato|nfc-?e|sat|cnpj|ie|im|danfe|comprovante|autentica|via|cliente|documento|auxiliar|consumidor/i;
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      if (line.length >= 3 && !boilerplatePatterns.test(line) && !/^\d+$/.test(line)) {
        const cleaned = line.replace(/[^\w\s\.\-À-ÖØ-öø-ÿ]/gi, '').substring(0, 40).trim();
        if (cleaned.length >= 4) {
          favorecido = cleaned;
          break;
        }
      }
    }
  }

  // 5. Extrair Banco (se for comprovante bancário)
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
  } else if (isCupomFiscal) {
    tipo_transacao = 'Cupom Fiscal / Nota Fiscal';
  }

  // 7. Número da Transação / Autenticação
  const numRegex = /(?:AUTENTICA[CÇ][AÃ]O|ID DA TRANSA[CÇ][AÃ]O|TRANSA[CÇ][AÃ]O|NSU|CODIGO|COO|SAT)\s*:?\s*([A-Z0-9\.-]{4,40})/i;
  const numMatch = text.match(numRegex);
  if (numMatch && numMatch[1]) {
    num_transacao = numMatch[1].trim();
  }

  // 8. Auto-Categorização Inteligente com base no texto lido
  const lowerText = text.toLowerCase();

  if (/supermercado|mercado|hortifruti|carrefour|assai|atacadao|extra|pao de acucar|sacolao|padaria|panificadora|açougue|acougue|lanchonete|restaurante|mcdonald|burger|pizza|sorvet|alimento|ifood|hipermercado|atacadista/i.test(lowerText)) {
    categoria_sugerida = 'Alimentação / Mercado';
  } else if (/oficina|mecanica|mecânica|conserto|auto\s*pe[çc]as|troca\s*de\s*oleo|pneu|funilaria|reparo|autoeletrica/i.test(lowerText)) {
    categoria_sugerida = 'Manutenção & Reparos';
  } else if (/posto|shell|ipiranga|petrobras|combustivel|gasolina|etanol|diesel|estacionamento|pedagio|uber|99pop/i.test(lowerText)) {
    categoria_sugerida = 'Transporte / Combustível';
  } else if (/farmacia|drogaria|drogasil|pague\s*menos|droga|medico|médico|hospital|laboratorio|exame|dentista|clinica|remedio|medicamento/i.test(lowerText)) {
    categoria_sugerida = 'Saúde & Medicamentos';
  } else if (/enel|light|cemig|copel|sabesp|sanepar|aluguel|condominio|internet|claro|vivo|tim|oi|energia|luz|agua/i.test(lowerText)) {
    categoria_sugerida = 'Contas da Casa (Água, Luz, Net)';
  } else if (/cinema|teatro|show|netflix|spotify|steam|ingresso|parque|lazer|viagem|hotel/i.test(lowerText)) {
    categoria_sugerida = 'Lazer & Entretenimento';
  } else {
    categoria_sugerida = 'Alimentação / Mercado';
  }

  return {
    valor,
    data,
    hora,
    favorecido,
    banco,
    tipo_transacao,
    num_transacao,
    categoria_sugerida,
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
