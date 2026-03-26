// === Upload Module ===
// Handles image upload, drag & drop, preview, and compression

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

    const { base64, mimeType } = await readImageAsBase64(file);

    callbacks.onImageReady(base64, mimeType, previewUrl);
  } catch (err) {
    console.error('Error processing image:', err);
    callbacks.onError?.('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
  }
}

/**
 * Read image file and return base64 without any compression
 */
function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
