// === History Module ===
// Manages review history in Supabase (logged in) or localStorage (guest)

import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

const STORAGE_KEY = 'photo_reviewer_history';
const MAX_HISTORY = 20;

/**
 * Get all history items
 * @returns {Promise<Array>} History items sorted by date (newest first)
 */
export async function getHistory() {
  const user = getCurrentUser();
  if (user) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);
      
      if (!error && data) {
        return data.map(doc => ({
          id: doc.id,
          timestamp: doc.created_at,
          thumbnail: doc.thumbnail,
          overallScore: doc.overall_score,
          result: doc.result,
          imageDataUrl: doc.image_data_url
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase:', e);
    }
  }

  // Local fallback
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get a single history item by ID
 * @param {string} id - Item ID
 * @returns {Promise<object|null>}
 */
export async function getHistoryItem(id) {
  const user = getCurrentUser();
  if (user) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          timestamp: data.created_at,
          thumbnail: data.thumbnail,
          overallScore: data.overall_score,
          result: data.result,
          imageDataUrl: data.image_data_url
        };
      }
    } catch (e) {
      console.warn('Failed to fetch item from Supabase:', e);
    }
  }

  const history = await getHistory();
  return history.find(item => item.id == id) || null;
}

/**
 * Save a review to history
 * @param {object} params
 * @param {string} params.thumbnail - Small base64 thumbnail
 * @param {number} params.overallScore - Overall score
 * @param {object} params.result - Full analysis result
 * @param {string} params.imageDataUrl - Full image data URL for re-viewing
 */
export async function saveToHistory({ thumbnail, overallScore, result, imageDataUrl }) {
  const user = getCurrentUser();
  const timestamp = new Date().toISOString();
  
  if (user) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          thumbnail,
          overall_score: overallScore,
          result,
          image_data_url: imageDataUrl,
          created_at: timestamp
        })
        .select()
        .single();
        
      if (!error && data) {
        return {
          id: data.id,
          timestamp: data.created_at,
          thumbnail,
          overallScore,
          result,
          imageDataUrl
        };
      }
    } catch (e) {
      console.warn('Failed to save to Supabase:', e);
    }
  }

  // Local fallback
  const history = await getHistory();

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp,
    thumbnail,
    overallScore,
    result,
    imageDataUrl
  };

  history.unshift(item);

  // Keep max items
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    // If localStorage is full, remove oldest items and try again
    console.warn('localStorage full, removing old items');
    history.length = Math.floor(MAX_HISTORY / 2);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      console.error('Cannot save to localStorage');
    }
  }

  return item;
}

/**
 * Clear all history
 */
export async function clearHistory() {
  const user = getCurrentUser();
  if (user) {
    try {
      await supabase.from('reviews').delete().eq('user_id', user.id);
    } catch (e) {
      console.warn('Failed to clear Supabase history:', e);
    }
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Generate a small thumbnail from an image URL
 * @param {string} imageUrl - Source image URL
 * @returns {Promise<string>} Base64 thumbnail
 */
export function generateThumbnail(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 200;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Center crop
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = imageUrl;
  });
}

/**
 * Generate a high-quality preview image for review display
 * Keeps aspect ratio, max 1200px on longest side
 */
export function generatePreviewImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxSize = 1200;
      let { width, height } = img;

      // Only scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to generate preview'));
    img.src = imageUrl;
  });
}

/**
 * Render history list in the UI
 * @param {Function} onItemClick - Callback when a history item is clicked
 */
export async function renderHistory(onItemClick) {
  const container = document.getElementById('history-list');
  const history = await getHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-state">Chưa có ảnh nào được review</p>';
    return;
  }

  container.innerHTML = '';
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <img class="history-thumb" src="${item.thumbnail}" alt="Ảnh đã review" loading="lazy" />
      <div class="history-info">
        <div class="history-score">${item.overallScore}/100</div>
        <div class="history-date">${formatDate(item.timestamp)}</div>
      </div>
    `;
    el.addEventListener('click', () => onItemClick(item));
    container.appendChild(el);
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
