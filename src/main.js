// === Main Entry Point ===
// Orchestrates all modules: upload, API, results, history

import { initUpload } from "./upload.js";
import { analyzePhoto, getApiKey, setApiKey, hasApiKey } from "./api.js";
import { renderResults, resetResults } from "./results.js";
import {
  saveToHistory,
  clearHistory,
  renderHistory,
  getHistoryItem,
  generateThumbnail,
  generatePreviewImage,
} from "./history.js";
import { supabase } from "./supabase.js";
import {
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  getCurrentUser,
} from "./auth.js";

// --- State ---
let currentImage = {
  base64: null,
  mimeType: null,
  previewUrl: null,
};

// --- DOM Elements ---
const $ = (id) => document.getElementById(id);

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  initRouting();
  initAuthUI();
  initSettingsModal();
  initUploadHandlers();
  initButtons();

  // Listen for Supabase auth changes
  onAuthChange(async (user) => {
    updateAuthUI(user);

    if (user) {
      await initHistoryView(); // Reload history for the active user state

      // Load saved API key
      const key = await getApiKey(); // Await async
      if (key) $("api-key-input").value = key;
    } else {
      // Clear history data for guest
      $("history-list").innerHTML =
        '<p class="empty-state">Vui lòng đăng nhập bằng Google để xem lịch sử.</p>';
    }

    // Enforce route permissions AFTER auth state resolves
    enforceRoutePermissions(user);
  });
});

// ============================
// Routing & Permissions
// ============================
function initRouting() {
  setTimeout(() => {
    if (window.location.hash.includes("access_token")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, 100);

  $("logo-btn").addEventListener("click", () => {
    goToHome();
  });

  window.addEventListener("popstate", handleRouteChange);
  handleRouteChange();
}

async function handleRouteChange() {
  const path = window.location.pathname;
  const user = getCurrentUser();

  if (path === "/history") {
    if (!user) {
      goToHome();
      return;
    }
    showHistoryViewOnly();
    renderHistory(handleHistoryItemClick);
  } else if (path.startsWith("/history/")) {
    const id = path.split("/")[2];
    if (id) {
      toggleLoading(true, "Đang tải bản review...", "Đang truy xuất dữ liệu từ hệ thống lưu trữ");
      const item = await getHistoryItem(id);
      toggleLoading(false);

      if (item) {
        showResultsViewOnly();
        resetResults();
        renderResults(item.result, item.imageDataUrl);
      } else {
        showToast("Không tìm thấy bản review này", "error");
        goToHome();
      }
    } else {
      goToHome();
    }
  } else {
    showMainViewOnly();
  }

  // Ensure we start from the top after all view changes
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToHome() {
  if (window.location.pathname !== "/") {
    history.pushState(null, "", "/");
  }
  handleRouteChange();
}

function goToHistory() {
  const user = getCurrentUser();
  if (!user) {
    showToast("Vui lòng đăng nhập để truy cập lịch sử", "error");
    return;
  }

  if (window.location.pathname !== "/history") {
    history.pushState(null, "", "/history");
  }
  handleRouteChange();
}

function showHistoryViewOnly() {
  $("upload-section").classList.add("hidden");
  $("results-section").classList.add("hidden");
  $("history-section").classList.remove("hidden");
}

function showMainViewOnly() {
  $("history-section").classList.add("hidden");
  $("upload-section").classList.remove("hidden");
  $("results-section").classList.add("hidden");
}

function showResultsViewOnly() {
  $("upload-section").classList.add("hidden");
  $("history-section").classList.add("hidden");
  $("results-section").classList.remove("hidden");
}

// ============================
// Auth UI
// ============================
function initAuthUI() {
  $("login-btn").addEventListener("click", handleLogin);
  $("logout-btn").addEventListener("click", handleLogout);

  // Dropdown toggle
  const userMenuBtn = $("user-menu-btn");
  const userDropdown = $("user-dropdown");
  const userMenuContainer = $("user-menu-container");

  userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !userDropdown.classList.contains("hidden");
    if (isOpen) {
      userDropdown.classList.add("hidden");
      userMenuContainer.classList.remove("open");
    } else {
      userDropdown.classList.remove("hidden");
      userMenuContainer.classList.add("open");
    }
  });

  // Close dropdown on outside click
  document.addEventListener("click", () => {
    userDropdown.classList.add("hidden");
    userMenuContainer.classList.remove("open");
  });

  // Handle dropdown history button
  $("dropdown-history-btn").addEventListener("click", () => {
    goToHistory();
    // Close dropdown
    userDropdown.classList.add("hidden");
    userMenuContainer.classList.remove("open");
  });

  // Handle dropdown settings button similarly to the main settings button
  $("dropdown-settings-btn").addEventListener("click", async () => {
    $("settings-modal").classList.remove("hidden");
    $("api-key-input").value = await getApiKey();
    // Close dropdown
    userDropdown.classList.add("hidden");
    userMenuContainer.classList.remove("open");
  });
}

async function handleLogin() {
  try {
    $("login-btn").disabled = true;
    await signInWithGoogle();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    $("login-btn").disabled = false;
  }
}

async function handleLogout() {
  try {
    await signOutUser();
    goToHome(); // Return to home on logout
  } catch (err) {
    showToast("Lỗi đăng xuất.", "error");
  }
}

function updateAuthUI(user) {
  const loginBtn = $("login-btn");
  const userMenuContainer = $("user-menu-container");
  const userAvatar = $("user-avatar");
  const userName = $("user-name");
  if (user) {
    const meta = user.user_metadata || {};
    loginBtn.classList.add("hidden");
    userMenuContainer.classList.remove("hidden");

    // Fallback URL for avatar if metadata missing
    userAvatar.src =
      meta.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.full_name || user.email || "U")}&background=random`;
    userAvatar.alt = meta.full_name || "User";
    userName.textContent = meta.full_name || user.email;
  } else {
    loginBtn.classList.remove("hidden");
    userMenuContainer.classList.add("hidden");
  }
}

// ============================
// Settings Modal
// ============================
function initSettingsModal() {
  const modal = $("settings-modal");
  const input = $("api-key-input");
  const toggleBtn = $("toggle-key-visibility");

  $("close-settings").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Toggle key visibility
  toggleBtn.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      toggleBtn.textContent = "🙈";
    } else {
      input.type = "password";
      toggleBtn.textContent = "👁️";
    }
  });

  // Save API key
  $("save-api-key").addEventListener("click", async () => {
    const key = input.value.trim();
    if (!key) {
      showToast("Vui lòng nhập API Key", "error");
      return;
    }
    await setApiKey(key);
    modal.classList.add("hidden");
    showToast("Đã lưu API Key thành công!", "success");
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
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
      $("preview-image").src = previewUrl;
      $("preview-area").classList.remove("hidden");
      $("dropzone").classList.add("hidden");
    },
    onError: (message) => {
      showToast(message, "error");
    },
  });
}

// ============================
// Button Handlers
// ============================
function initButtons() {
  // Clear selected photo
  $("clear-photo").addEventListener("click", () => {
    resetUploadState();
  });

  // Analyze button
  $("analyze-btn").addEventListener("click", () => {
    handleAnalyze();
  });

  // New review button
  $("new-review-btn").addEventListener("click", () => {
    resetUploadState();
    resetResults();
    goToHome();
  });

  // Clear history
  $("clear-history").addEventListener("click", async () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử review?")) {
      await clearHistory();
      await renderHistory(handleHistoryItemClick);
      showToast("Đã xóa lịch sử", "success");
    }
  });
}

// ============================
// Analyze Photo
// ============================
async function handleAnalyze() {
  if (!currentImage.base64) {
    showToast("Vui lòng chọn ảnh trước", "error");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    showToast("Vui lòng đăng nhập để phân tích ảnh", "error");
    return;
  }

  const hasKey = await hasApiKey();
  if (!hasKey) {
    showToast("Vui lòng cài đặt API Key trong menu tài khoản", "error");
    $("settings-modal").classList.remove("hidden");
    return;
  }

  // Show loading
  $("upload-section").classList.add("hidden");
  $("results-section").classList.add("hidden");
  $("loading-section").classList.remove("hidden");

  try {
    const result = await analyzePhoto(
      currentImage.base64,
      currentImage.mimeType,
    );

    // Validate result structure
    if (!result.overall_score || !result.criteria) {
      throw new Error("AI trả về dữ liệu không đầy đủ. Vui lòng thử lại.");
    }

    // Render results
    resetResults();
    renderResults(result, currentImage.previewUrl);

    // Show results section
    $("loading-section").classList.add("hidden");
    $("results-section").classList.remove("hidden");

    // Save to history
    try {
      const thumbnail = await generateThumbnail(currentImage.previewUrl);
      const previewImage = await generatePreviewImage(currentImage.previewUrl);
      const historyItem = await saveToHistory({
        thumbnail,
        overallScore: result.overall_score,
        result,
        imageDataUrl: previewImage,
      });

      // Update URL to the specific history share link
      history.pushState(null, "", `/history/${historyItem.id}`);
      handleRouteChange();

      showToast("Phân tích hoàn tất!", "success");
    } catch (e) {
      console.warn("Failed to save to history:", e);
      showResultsViewOnly();
      renderResults(result, currentImage.previewUrl);
    }
  } catch (err) {
    console.error("Analysis error:", err);
    $("loading-section").classList.add("hidden");
    $("upload-section").classList.remove("hidden");
    $("preview-area").classList.remove("hidden");
    $("dropzone").classList.add("hidden");
    showToast(err.message || "Có lỗi xảy ra. Vui lòng thử lại.", "error");
  }
}

// ============================
// History
// ============================
async function initHistoryView() {
  await renderHistory(handleHistoryItemClick);
}

function handleHistoryItemClick(item) {
  history.pushState(null, "", `/history/${item.id}`);
  handleRouteChange();
}

function toggleLoading(show, title = 'AI đang phân tích ảnh...', desc = 'Photographer AI đang xem xét bố cục, ánh sáng, màu sắc và nhiều tiêu chí khác') {
  const loading = $('loading-section');
  if (show) {
    $('loading-title').textContent = title;
    $('loading-desc').textContent = desc;
    $('upload-section').classList.add('hidden');
    $('results-section').classList.add('hidden');
    $('history-section').classList.add('hidden');
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function resetUploadState() {
  currentImage = { base64: null, mimeType: null, previewUrl: null };
  $("preview-area").classList.add("hidden");
  $("dropzone").classList.remove("hidden");
  $("file-input").value = "";
}

function showToast(message, type = "info") {
  const container = $("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
