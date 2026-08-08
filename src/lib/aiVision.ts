import { OCRParseResult } from '../types';

/**
 * Convert Blob or File to Base64 String
 */
export function blobToBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Call Groq Cloud or Gemini Vision AI to read Brazilian receipts with high accuracy
 */
export async function analyzeReceiptWithAiVision(
  imageSource: Blob | File | string,
  apiKeyOverride?: string
): Promise<OCRParseResult | null> {
  const activeKey =
    apiKeyOverride ||
    localStorage.getItem('ai_vision_key') ||
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '';

  if (!activeKey || !activeKey.trim()) {
    return null;
  }

  const key = activeKey.trim();

  try {
    let base64Image = '';
    if (typeof imageSource === 'string') {
      base64Image = imageSource;
    } else {
      base64Image = await blobToBase64(imageSource);
    }

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `Você é um assistente especialista em leitura visual de cupons fiscais, notas fiscais, faturas e comprovantes bancários brasileiros (PIX, cartões, recibos de papel).
Analise a imagem anexada e retorne EXATAMENTE e APENAS um objeto JSON no seguinte formato (sem explicações extras, sem markdown):
{
  "valor": 39.90,
  "data": "YYYY-MM-DD",
  "hora": "HH:MM",
  "favorecido": "Nome do Estabelecimento ou Recebedor",
  "tipo_transacao": "Cupom Fiscal / Nota Fiscal",
  "categoria_sugerida": "Saúde & Medicamentos",
  "num_transacao": "Nº Autenticação ou COO se houver"
}

REGRAS IMPORTANTES:
1. "valor": Extraia o VALOR PAGO ou VALOR A PAGAR final. Desconsidere impostos (ex: Valor Aprox dos Tributos R$ 19,22), descontos isolados ou trocos.
2. "data": Formato YYYY-MM-DD. Se o ano tiver 2 dígitos (ex: 26), considere 2026.
3. "favorecido": Nome da empresa/farmácia/mercado (ex: "COMERCIO DE MEDICAMENTOS BRAIR LTDA").
4. "categoria_sugerida": Escolha obrigatoriamente uma destas opções: "Alimentação / Mercado", "Manutenção & Reparos", "Transporte / Combustível", "Saúde & Medicamentos", "Contas da Casa (Água, Luz, Net)", "Lazer & Entretenimento", "Educação & Cursos", "Outros".`;

    if (key.startsWith('gsk_')) {
      // Groq Vision API (Llama 3.2 11B Vision)
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          response_format: { type: 'json_object' },
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image.startsWith('data:')
                      ? base64Image
                      : `data:image/jpeg;base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        console.error('Groq Vision API Error:', await res.text());
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          valor: typeof parsed.valor === 'number' ? parsed.valor : parseFloat(parsed.valor) || undefined,
          data: parsed.data,
          hora: parsed.hora,
          favorecido: parsed.favorecido,
          tipo_transacao: 'IA Groq Vision',
          categoria_sugerida: parsed.categoria_sugerida,
          num_transacao: parsed.num_transacao,
          raw_text: content,
          confidence: 99,
        };
      }
    } else {
      // Gemini 1.5 Flash Vision API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (!res.ok) {
        console.error('Gemini Vision API Error:', await res.text());
        return null;
      }

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsed = JSON.parse(textResponse);
        return {
          valor: typeof parsed.valor === 'number' ? parsed.valor : parseFloat(parsed.valor) || undefined,
          data: parsed.data,
          hora: parsed.hora,
          favorecido: parsed.favorecido,
          tipo_transacao: 'IA Gemini Vision',
          categoria_sugerida: parsed.categoria_sugerida,
          num_transacao: parsed.num_transacao,
          raw_text: textResponse,
          confidence: 99,
        };
      }
    }
  } catch (err) {
    console.error('Erro ao processar imagem via IA Vision:', err);
  }
  return null;
}
