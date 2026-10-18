/**
 * PDF Text Extractor Helper
 * Uses bundled Mozilla PDF.js to extract text from prescription PDFs directly in browser/extension.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PdfReader = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Extracts text from a File, Blob, or ArrayBuffer using pdfjsLib
   * @param {File|Blob|ArrayBuffer|Uint8Array} fileOrBuffer
   * @param {string} [customWorkerSrc]
   * @returns {Promise<{ text: string, numPages: number, isScannedLikely: boolean }>}
   */
  async function extractTextFromPdf(fileOrBuffer, customWorkerSrc) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library is not loaded. Please ensure pdf.min.js is included.');
    }

    // Configure worker path
    if (customWorkerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = customWorkerSrc;
    } else if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
        } catch (e) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.js';
        }
      } else if (typeof window !== 'undefined' && window.location) {
        // In browser relative context
        pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdf.worker.min.js';
      }
    }

    let data;
    if (fileOrBuffer instanceof ArrayBuffer) {
      data = fileOrBuffer;
    } else if (fileOrBuffer instanceof Uint8Array) {
      data = fileOrBuffer.buffer;
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      data = await fileOrBuffer.arrayBuffer();
    } else {
      throw new Error('Invalid input: Expected a File, Blob, or ArrayBuffer.');
    }

    const loadingTask = pdfjsLib.getDocument({ data: data });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    let fullText = '';
    let totalItems = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Preserve line breaks based on Y-coordinates of text items
      let lastY = null;
      let pageLines = [];
      let currentLine = '';

      for (const item of textContent.items) {
        totalItems++;
        const currentY = item.transform ? Math.round(item.transform[5]) : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? ' ' : '') + item.str;
        }
        lastY = currentY;
      }
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }

      fullText += pageLines.join('\n') + '\n';
    }

    const cleanedText = fullText.trim();
    const isScannedLikely = totalItems < 10 || cleanedText.length < 20;

    return {
      text: cleanedText,
      numPages: numPages,
      isScannedLikely: isScannedLikely
    };
  }

  return {
    extractTextFromPdf
  };
}));
