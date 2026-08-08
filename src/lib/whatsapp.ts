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
  return `✨ *SEGURA NA MÃO DE DEUS* ✨
━━━━━━━━━━━━━━━━━━━━━━━━
🧾 *COMPROVANTE DE BAIXA & PAGAMENTO*

📝 *Descrição:* ${data.descricao}
💵 *Valor Pago:* ${formatCurrency(data.valor)}
📅 *Data do Pagamento:* ${formatDate(data.data)}

📊 *RESUMO FINANCEIRO DO MÊS:*
🟢 *Saldo Atual em Conta:* ${formatCurrency(data.saldoAtual)}
📌 *Contas Pendentes (${data.contasRestantesQtd}):* ${formatCurrency(data.contasRestantesValor)}
🏁 *Saldo Previsto no Fim do Mês:* ${formatCurrency(data.saldoPrevisto)}
━━━━━━━━━━━━━━━━━━━━━━━━
🙏 _Gerado via Segura Na Mão de Deus_ 🚀`;
}

export async function sharePaymentSummary(data: PaymentSummaryShareData): Promise<boolean> {
  const messageText = formatWhatsAppMessage(data);

  // Try Native Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Comprovante de Pagamento - Segura Na Mão de Deus',
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
