// === Upload Module ===
// Handles image upload, drag & drop, preview, and compression

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 2048; // Max width/height for API (compress larger images)

/**
 * Initialize upload functionality
 * @param {object} callbacks - { onImageReady(base64, mimeType, previewUrl) }
 */
export function initUpload(callbacks) {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  // Click dropzone to open file picker
  dropzone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0], callbacks);
    }
  });

  // Drag & Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0], callbacks);
    }
  });
}

/**
 * Process uploaded file
 */
async function handleFile(file, callbacks) {
  // Validate type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    callbacks.onError?.('Định dạng ảnh không hỗ trợ. Vui lòng chọn JPG, PNG hoặc WebP.');
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    callbacks.onError?.('Ảnh quá lớn. Vui lòng chọn ảnh dưới 20MB.');
    return;
  }

  try {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Compress and convert to base64
    const { base64, mimeType } = await compressImage(file);

    callbacks.onImageReady(base64, mimeType, previewUrl);
  } catch (err) {
    console.error('Error processing image:', err);
    callbacks.onError?.('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
  }
}

/**
 * Compress image if needed and return base64
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        // Only compress if too large
        if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= 4 * 1024 * 1024) {
          // No compression needed — use original
          const base64 = e.target.result.split(',')[1];
          resolve({ base64, mimeType: file.type });
          return;
        }

        // Scale down
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw to canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const outputMime = 'image/jpeg';
        const quality = 0.85;
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: outputMime });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
