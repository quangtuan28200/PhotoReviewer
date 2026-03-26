// === Results Module ===
// Renders analysis results with premium UI

import { t } from './i18n.js';

const CRITERIA_CONFIG = {
  composition: { labelKey: 'composition', emoji: '📐', color: '#a855f7' },
  lighting:    { labelKey: 'lighting',    emoji: '💡', color: '#f97316' },
  color:       { labelKey: 'color',       emoji: '🎨', color: '#3b82f6' },
  sharpness:   { labelKey: 'sharpness',   emoji: '🔍', color: '#06b6d4' },
  emotion:     { labelKey: 'emotion',     emoji: '🎭', color: '#22c55e' },
  technical:   { labelKey: 'technical',   emoji: '⚡', color: '#eab308' }
};

/**
 * Render all results from the AI analysis
 */
export function renderResults(result, imageUrl) {
  ensureGaugeGradient();
  renderOverallScore(result.overall_score, result.verdict);
  renderReviewedImage(imageUrl);
  renderExif(result.metadata, result.exif_analysis);
  renderCriteria(result.criteria);
  renderAnalysis(result.analysis);
  renderSuggestions(result.suggestions);
}

function ensureGaugeGradient() {
  const gauge = document.querySelector('.gauge');
  if (!gauge || gauge.querySelector('#gauge-gradient')) return;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  `;
  gauge.insertBefore(defs, gauge.firstChild);
}

function renderOverallScore(score, verdict) {
  const scoreEl = document.getElementById('overall-score-value');
  const gaugeFill = document.getElementById('gauge-fill');
  const verdictEl = document.getElementById('overall-verdict');

  animateValue(scoreEl, 0, score, 1800);

  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => {
    gaugeFill.style.strokeDashoffset = offset;
  }, 100);

  verdictEl.textContent = verdict;

  if (score >= 80) verdictEl.style.color = '#22c55e';
  else if (score >= 60) verdictEl.style.color = '#eab308';
  else if (score >= 40) verdictEl.style.color = '#f97316';
  else verdictEl.style.color = '#ef4444';
}

function renderReviewedImage(imageUrl) {
  document.getElementById('reviewed-image').src = imageUrl;
}

function renderExif(metadata, analysisText) {
  const container = document.getElementById('exif-section');
  const badgesContainer = document.getElementById('exif-badges');
  const textEl = document.getElementById('exif-analysis-text');

  if (!container || !badgesContainer || !textEl) return;

  if (!metadata || Object.keys(metadata).length === 0 || !analysisText) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  badgesContainer.innerHTML = '';
  
  const createBadge = (icon, value) => {
    if (!value) return '';
    return `
      <div style="padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
        <span style="color: var(--text-primary);">${icon}</span>
        <span>${value}</span>
      </div>
    `;
  };

  let html = '';
  if (metadata.camera) html += createBadge('📷', metadata.camera);
  if (metadata.lens) html += createBadge('🔍', metadata.lens);
  if (metadata.focalLength) html += createBadge('📏', metadata.focalLength);
  if (metadata.aperture) html += createBadge('👁️', metadata.aperture);
  if (metadata.shutterSpeed) html += createBadge('⏱️', metadata.shutterSpeed);
  if (metadata.iso) html += createBadge('☀️', metadata.iso);
  if (metadata.software) html += createBadge('💻', metadata.software);

  badgesContainer.innerHTML = html;
  textEl.innerHTML = formatText(analysisText);
}

function renderCriteria(criteria) {
  const container = document.getElementById('criteria-bars');
  container.innerHTML = '';

  Object.entries(CRITERIA_CONFIG).forEach(([key, config], index) => {
    const data = criteria[key];
    if (!data) return;

    const scoreColor = getScoreColor(data.score);

    const item = document.createElement('div');
    item.className = 'criteria-item';
    item.innerHTML = `
      <div class="criteria-header">
        <span class="criteria-label">
          <span class="criteria-emoji">${config.emoji}</span>
          <span data-i18n="criteria.${config.labelKey}">${t('criteria.' + config.labelKey)}</span>
        </span>
        <span class="criteria-score" style="color: ${scoreColor}">${data.score}</span>
      </div>
      <div class="criteria-bar">
        <div class="criteria-fill" style="background: linear-gradient(90deg, ${config.color}, ${config.color}aa);" data-width="${data.score}%"></div>
      </div>
      <p class="criteria-detail">${formatText(data.comment)}</p>
    `;
    container.appendChild(item);

    // Animate bar fill with stagger
    setTimeout(() => {
      item.querySelector('.criteria-fill').style.width = data.score + '%';
    }, 400 + index * 180);
  });
}

function renderAnalysis(analysisText) {
  const container = document.getElementById('analysis-content');
  const paragraphs = analysisText.split('\n').filter(p => p.trim());
  container.innerHTML = paragraphs.map(p => `<p>${formatText(p)}</p>`).join('');
}

function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestions-list');
  container.innerHTML = '';

  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = `<p class="empty-state">${t("messages.no_suggestions")}</p>`;
    return;
  }

  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.style.animationDelay = `${0.4 + index * 0.1}s`;
    item.innerHTML = `
      <div class="suggestion-priority ${suggestion.priority}"></div>
      <div class="suggestion-text">
        <span class="suggestion-title">${suggestion.title}</span>
        <span class="suggestion-detail">${suggestion.detail}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function formatText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function animateValue(element, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + range * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/**
 * Reset results section
 */
export function resetResults() {
  const gaugeFill = document.getElementById('gauge-fill');
  if (gaugeFill) gaugeFill.style.strokeDashoffset = 534;

  const scoreEl = document.getElementById('overall-score-value');
  if (scoreEl) scoreEl.textContent = '0';

  document.getElementById('criteria-bars').innerHTML = '';
  document.getElementById('analysis-content').innerHTML = '';
  document.getElementById('suggestions-list').innerHTML = '';
  document.getElementById('overall-verdict').textContent = '';
}
