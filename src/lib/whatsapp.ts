import { formatCurrency, formatDate } from './utils';

export interface PaymentSummaryShareData {
  descricao: string;
  valor: number;
  data: string;
  saldoAtual: number;
  contasRestantesValor: number;
  contasRestantesQtd: number;
  saldoPrevisto: number;
}

export function formatWhatsAppMessage(data: PaymentSummaryShareData): string {
  return `*MEU FINANCEIRO - COMPROVANTE DE PAGAMENTO* 📄✨

🔹 *Descrição:* ${data.descricao}
💰 *Valor:* ${formatCurrency(data.valor)}
📅 *Data:* ${formatDate(data.data)}

📊 *RESUMO FINANCEIRO DO MÊS:*
🟢 *Saldo Atual:* ${formatCurrency(data.saldoAtual)}
📌 *Contas Restantes (${data.contasRestantesQtd}):* ${formatCurrency(data.contasRestantesValor)}
🏁 *Saldo Previsto no Fim do Mês:* ${formatCurrency(data.saldoPrevisto)}

_Gerado via Meu Financeiro_ 🚀`;
}

export async function sharePaymentSummary(data: PaymentSummaryShareData): Promise<boolean> {
  const messageText = formatWhatsAppMessage(data);

  // Try Native Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Comprovante de Pagamento - Meu Financeiro',
        text: messageText,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share API falhou, abrindo WhatsApp via URL:', err);
      } else {
        return false;
      }
    }
  }

  // Direct Fallback to WhatsApp URL
  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
  return true;
}
