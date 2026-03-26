// === Main Entry Point ===
// Orchestrates all modules: upload, API, results, history

import { initUpload } from './upload.js';
import { analyzePhoto, getApiKey, setApiKey, hasApiKey } from './api.js';
import { renderResults, resetResults } from './results.js';
import {
  saveToHistory,
  clearHistory,
  renderHistory,
  generateThumbnail,
  generatePreviewImage
} from './history.js';

// --- State ---
let currentImage = {
  base64: null,
  mimeType: null,
  previewUrl: null
};

// --- DOM Elements ---
const $ = (id) => document.getElementById(id);

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initSettingsModal();
  initUploadHandlers();
  initButtons();
  initHistoryView();

  // Show API key reminder if not set
  if (!hasApiKey()) {
    showToast('Vui lòng nhập Gemini API Key trong ⚙️ Cài đặt để bắt đầu', 'info');
  }
});

// ============================
// Settings Modal
// ============================
function initSettingsModal() {
  const modal = $('settings-modal');
  const input = $('api-key-input');
  const toggleBtn = $('toggle-key-visibility');

  $('settings-btn').addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = getApiKey();
  });

  $('close-settings').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Toggle key visibility
  toggleBtn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      input.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  });

  // Save API key
  $('save-api-key').addEventListener('click', () => {
    const key = input.value.trim();
    if (!key) {
      showToast('Vui lòng nhập API Key', 'error');
      return;
    }
    setApiKey(key);
    modal.classList.add('hidden');
    showToast('Đã lưu API Key thành công!', 'success');
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  });
}

// ============================
// Upload Handlers
// ============================
function initUploadHandlers() {
  initUpload({
    onImageReady: (base64, mimeType, previewUrl) => {
      currentImage = { base64, mimeType, previewUrl };

      // Show preview
      $('preview-image').src = previewUrl;
      $('preview-area').classList.remove('hidden');
      $('dropzone').classList.add('hidden');
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });
}

// ============================
// Button Handlers
// ============================
function initButtons() {
  // Clear selected photo
  $('clear-photo').addEventListener('click', () => {
    resetUploadState();
  });

  // Analyze button
  $('analyze-btn').addEventListener('click', () => {
    handleAnalyze();
  });

  // New review button
  $('new-review-btn').addEventListener('click', () => {
    resetUploadState();
    $('results-section').classList.add('hidden');
    $('upload-section').classList.remove('hidden');
    resetResults();
  });

  // Clear history
  $('clear-history').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử review?')) {
      clearHistory();
      renderHistory(handleHistoryItemClick);
      showToast('Đã xóa lịch sử', 'success');
    }
  });
}

// ============================
// Analyze Photo
// ============================
async function handleAnalyze() {
  if (!currentImage.base64) {
    showToast('Vui lòng chọn ảnh trước', 'error');
    return;
  }

  if (!hasApiKey()) {
    showToast('Vui lòng nhập API Key trong ⚙️ Cài đặt', 'error');
    $('settings-modal').classList.remove('hidden');
    return;
  }

  // Show loading
  $('upload-section').classList.add('hidden');
  $('results-section').classList.add('hidden');
  $('loading-section').classList.remove('hidden');

  try {
    const result = await analyzePhoto(currentImage.base64, currentImage.mimeType);

    // Validate result structure
    if (!result.overall_score || !result.criteria) {
      throw new Error('AI trả về dữ liệu không đầy đủ. Vui lòng thử lại.');
    }

    // Render results
    resetResults();
    renderResults(result, currentImage.previewUrl);

    // Show results section
    $('loading-section').classList.add('hidden');
    $('results-section').classList.remove('hidden');

    // Save to history
    try {
      const thumbnail = await generateThumbnail(currentImage.previewUrl);
      const previewImage = await generatePreviewImage(currentImage.previewUrl);
      saveToHistory({
        thumbnail,
        overallScore: result.overall_score,
        result,
        imageDataUrl: previewImage
      });
      renderHistory(handleHistoryItemClick);
    } catch (e) {
      console.warn('Failed to save to history:', e);
    }

  } catch (err) {
    console.error('Analysis error:', err);
    $('loading-section').classList.add('hidden');
    $('upload-section').classList.remove('hidden');
    $('preview-area').classList.remove('hidden');
    $('dropzone').classList.add('hidden');
    showToast(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
  }
}

// ============================
// History
// ============================
function initHistoryView() {
  renderHistory(handleHistoryItemClick);
}

function handleHistoryItemClick(item) {
  // Show results from history
  resetResults();
  renderResults(item.result, item.imageDataUrl || item.thumbnail);

  $('upload-section').classList.add('hidden');
  $('loading-section').classList.add('hidden');
  $('results-section').classList.remove('hidden');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================
// Helpers
// ============================
function resetUploadState() {
  currentImage = { base64: null, mimeType: null, previewUrl: null };
  $('preview-area').classList.add('hidden');
  $('dropzone').classList.remove('hidden');
  $('file-input').value = '';
}

function showToast(message, type = 'info') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
