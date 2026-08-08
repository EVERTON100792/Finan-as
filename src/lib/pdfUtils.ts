/**
 * Convert PDF File/Blob into a crisp JPEG Base64 Image using PDF.js
 */
export async function convertPdfToJpegImage(fileOrBlob: File | Blob): Promise<string> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        try {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        } catch (e) {
          resolve();
        }
      };
      script.onerror = () => reject(new Error('Falha ao carregar motor de renderização de PDF.'));
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('Biblioteca PDF.js não disponível.');
  }

  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2.0 }); // 2x Scale for ultra-high sharpness
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) {
    throw new Error('Não foi possível inicializar canvas para o PDF.');
  }

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.92);
}
