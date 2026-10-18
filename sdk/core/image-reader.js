/**
 * Image Prescription Reader (PNG, JPG, JPEG up to 5MB)
 * Validates size, generates thumbnails, pre-processes contrast on Canvas, and extracts text via OCR.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ImageReader = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  /**
   * Validates whether file is an allowed image or PDF within 5 MB
   */
  function validateFile(file) {
    if (!file) {
      throw new Error('No file provided.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File size is ${sizeMb} MB. Maximum allowed size is 5 MB.`);
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);

    if (!isPdf && !isImage) {
      throw new Error('Unsupported file type. Please upload a PDF, PNG, or JPG/JPEG photo.');
    }

    return {
      isPdf,
      isImage,
      sizeBytes: file.size,
      name: file.name
    };
  }

  /**
   * Generates a preview Data URL for image files
   */
  function getImagePreviewUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Pre-processes an image on an off-screen HTML5 Canvas (grayscale + contrast boost)
   * This drastically improves OCR accuracy on photos of printed or handwritten doctor prescriptions.
   */
  function preprocessImageOnCanvas(imgElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Grayscale and dynamic binarization / contrast boost
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast stretch
      const contrast = (gray - 128) * 1.5 + 128;
      const finalVal = Math.min(255, Math.max(0, contrast));
      d[i] = finalVal;
      d[i + 1] = finalVal;
      d[i + 2] = finalVal;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  /**
   * Extracts text from an Image File (PNG, JPG, etc.) using Tesseract OCR or Gemini API
   */
  async function extractTextFromImage(file, options = {}) {
    validateFile(file);

    const previewUrl = await getImagePreviewUrl(file);

    // Option A: If Gemini API Key is provided, use Google Gemini Multimodal Vision for high-accuracy handwriting reading!
    if (options.geminiApiKey) {
      return await extractViaGeminiVision(file, options.geminiApiKey);
    }

    // Option B: Client-side OCR via Tesseract.js if available in window
    if (typeof Tesseract !== 'undefined') {
      const worker = await Tesseract.createWorker('eng');
      const ret = await worker.recognize(previewUrl);
      await worker.terminate();
      return {
        text: ret.data.text,
        previewUrl: previewUrl,
        isOcr: true
      };
    }

    // Option C: Dynamic CDN loader for Tesseract.js if not already present
    if (typeof window !== 'undefined') {
      try {
        await loadTesseractScript();
        if (typeof Tesseract !== 'undefined') {
          const ret = await Tesseract.recognize(previewUrl, 'eng');
          return {
            text: ret.data.text,
            previewUrl: previewUrl,
            isOcr: true
          };
        }
      } catch (err) {
        console.warn('Tesseract dynamic load failed, falling back to manual paste option:', err);
      }
    }

    // Fallback if OCR library cannot load offline
    return {
      text: '',
      previewUrl: previewUrl,
      needsManualReview: true,
      message: 'Photo loaded! Please type or paste the doctor prescription notes below.'
    };
  }

  function loadTesseractScript() {
    return new Promise((resolve, reject) => {
      if (typeof Tesseract !== 'undefined') return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load OCR engine.'));
      document.head.appendChild(script);
    });
  }

  async function extractViaGeminiVision(file, apiKey) {
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        resolve(b64);
      };
      reader.readAsDataURL(file);
    });
    const base64Data = await base64Promise;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: "Extract all medications, dosages, frequency (1-0-1, daily, alternate days, 3 days a week, evening only), and instructions from this prescription photo. Output each medicine clearly on a new line." },
          { inline_data: { mime_type: file.type || 'image/jpeg', data: base64Data } }
        ]
      }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      text: text,
      previewUrl: await getImagePreviewUrl(file),
      isGemini: true
    };
  }

  return {
    validateFile,
    getImagePreviewUrl,
    extractTextFromImage,
    MAX_FILE_SIZE_BYTES
  };
}));
