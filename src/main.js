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
import {
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  getCurrentUser,
} from "./auth.js";
import { setLanguage, t, getLanguage } from "./i18n.js";

// --- State ---
let currentImage = {
  base64: null,
  mimeType: null,
  previewUrl: null,
  metadata: null,
};

// Cache for the latest result to avoid re-fetching after analysis
let latestAnalysisResult = null;

// --- DOM Elements ---
const $ = (id) => document.getElementById(id);

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(getLanguage());
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
        `<p class="empty-state">${t("messages.login_required")}</p>`;
    }

    // Enforce route permissions AFTER auth state resolves
    handleRouteChange();
  });
});

// ============================
// Routing & Permissions
// ============================
function initRouting() {
  // Delay cleanup to allow Supabase to parse the hash
  setTimeout(() => {
    if (window.location.hash.includes("access_token")) {
      const cleanUrl = window.location.pathname + window.location.search;
      history.replaceState(null, "", cleanUrl);
    }
  }, 500);

  $("logo-btn").addEventListener("click", () => {
    goToHome();
  });

  window.addEventListener("popstate", handleRouteChange);
  handleRouteChange();
}

async function handleRouteChange() {
  const path = window.location.pathname;
  const user = getCurrentUser();

  if (path.endsWith("/history")) {
    if (!user) {
      goToHome();
      return;
    }
    showHistoryViewOnly();
    renderHistory(handleHistoryItemClick);
  } else if (path.includes("/history/")) {
    const segments = path.split("/");
    const id = segments[segments.length - 1];
    if (id) {
      // Check if this is the item we just analyzed
      if (latestAnalysisResult && latestAnalysisResult.id === id) {
        showResultsViewOnly();
        resetResults();
        renderResults(
          latestAnalysisResult.result,
          latestAnalysisResult.imageDataUrl,
        );
      } else {
        toggleLoading(
          true,
          t("loading_history.title"),
          t("loading_history.desc"),
        );
        try {
          const item = await getHistoryItem(id);
          if (item) {
            showResultsViewOnly();
            resetResults();
            renderResults(item.result, item.imageDataUrl);
          } else {
            showToast(t("messages.history_not_found"), "error");
            goToHome();
          }
        } catch (err) {
          console.error("Route change error:", err);
          showToast(t("messages.generic_error"), "error");
          goToHome();
        } finally {
          toggleLoading(false);
        }
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
  const base = window.location.pathname.split("/history")[0];
  const newPath = base === "" ? "/" : base;
  if (window.location.pathname !== newPath) {
    history.pushState(null, "", newPath);
  }
  handleRouteChange();
}

function goToHistory() {
  const user = getCurrentUser();
  if (!user) {
    showToast(t("messages.login_required"), "error");
    return;
  }

  const base = window.location.pathname.split("/history")[0].replace(/\/$/, "");
  const newPath = `${base}/history`;
  
  if (window.location.pathname !== newPath) {
    history.pushState(null, "", newPath);
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
    showToast(t("messages.generic_error"), "error");
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
      showToast(t("messages.key_required"), "error");
      return;
    }
    await setApiKey(key);
    modal.classList.add("hidden");
    showToast(t("messages.settings_saved"), "success");
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
    onImageReady: (base64, mimeType, previewUrl, metadata) => {
      currentImage = { base64, mimeType, previewUrl, metadata };

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
    if (confirm(t("history.clear_btn") + "?")) {
      await clearHistory();
      await renderHistory(handleHistoryItemClick);
      showToast(t("messages.history_cleared"), "success");
    }
  });

  // Language switchers
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = e.target.getAttribute("data-lang");
      if (lang) {
        setLanguage(lang);
      }
    });
  });
}

// ============================
// Analyze Photo
// ============================
async function handleAnalyze() {
  if (!currentImage.base64) {
    showToast(t("messages.select_photo_required"), "error");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    showToast(t("messages.login_required"), "error");
    return;
  }

  const hasKey = await hasApiKey();
  if (!hasKey) {
    showToast(t("messages.key_required"), "error");
    $("settings-modal").classList.remove("hidden");
    return;
  }

  // Show loading
  $("upload-section").classList.add("hidden");
  $("results-section").classList.add("hidden");
  toggleLoading(true, t("loading.title"), t("loading.desc"));

  try {
    const result = await analyzePhoto(
      currentImage.base64,
      currentImage.mimeType,
      currentImage.metadata,
    );

    // Attach metadata for saving and rendering
    result.metadata = currentImage.metadata;

    // Validate result structure
    if (!result.overall_score || !result.criteria) {
      throw new Error(t("messages.ai_return_error"));
    }

    // Save to history
    let historyItem = null;
    try {
      const thumbnail = await generateThumbnail(currentImage.previewUrl);
      const previewImage = await generatePreviewImage(currentImage.previewUrl);
      historyItem = await saveToHistory({
        thumbnail,
        overallScore: result.overall_score,
        result,
        imageDataUrl: previewImage,
      });

      // Cache locally to prevent redundant fetch in handleRouteChange
      latestAnalysisResult = historyItem;

      // Update URL to the specific history share link
      const base = window.location.pathname.split("/history")[0].replace(/\/$/, "");
      const newPath = `${base}/history/${historyItem.id}`;
      history.pushState(null, "", newPath);

      // We don't call handleRouteChange() directly here anymore,
      // instead we rely on the state update or just show the results.
      // But pushState doesn't trigger popstate, so we do need to call it
      // OR just finish the UI work here.
    } catch (e) {
      console.warn("Failed to save to history:", e);
    }

    // Common results display logic
    resetResults();
    renderResults(result, currentImage.previewUrl);
    showResultsViewOnly();

    // Important: hide loading AFTER results are ready or route is updated
    $("loading-section").classList.add("hidden");

    if (historyItem) {
      showToast(t("messages.analysis_complete"), "success");
    }
  } catch (err) {
    console.error("Analysis error:", err);
    $("loading-section").classList.add("hidden");
    $("upload-section").classList.remove("hidden");
    $("preview-area").classList.remove("hidden");
    $("dropzone").classList.add("hidden");
    showToast(err.message || t("messages.generic_error"), "error");
  }
}

// ============================
// History
// ============================
async function initHistoryView() {
  await renderHistory(handleHistoryItemClick);
}

function handleHistoryItemClick(item) {
  const base = window.location.pathname.split("/history")[0].replace(/\/$/, "");
  const newPath = `${base}/history/${item.id}`;
  history.pushState(null, "", newPath);
  handleRouteChange();
}

function toggleLoading(show, title = null, desc = null) {
  const loading = $("loading-section");
  if (show) {
    $("loading-title").textContent = title || t("loading.title");
    $("loading-desc").textContent = desc || t("loading.desc");
    $("upload-section").classList.add("hidden");
    $("results-section").classList.add("hidden");
    $("history-section").classList.add("hidden");
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

function resetUploadState() {
  currentImage = { base64: null, mimeType: null, previewUrl: null, metadata: null };
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
