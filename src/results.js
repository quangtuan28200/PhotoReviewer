// === Results Module ===
// Renders analysis results with premium UI

const CRITERIA_CONFIG = {
  composition: { label: 'Bố cục',      emoji: '📐', color: '#a855f7' },
  lighting:    { label: 'Ánh sáng',     emoji: '💡', color: '#f97316' },
  color:       { label: 'Màu sắc',      emoji: '🎨', color: '#3b82f6' },
  sharpness:   { label: 'Độ nét',       emoji: '🔍', color: '#06b6d4' },
  emotion:     { label: 'Cảm xúc',      emoji: '🎭', color: '#22c55e' },
  technical:   { label: 'Kỹ thuật',     emoji: '⚡', color: '#eab308' }
};

/**
 * Render all results from the AI analysis
 */
export function renderResults(result, imageUrl) {
  ensureGaugeGradient();
  renderOverallScore(result.overall_score, result.verdict);
  renderReviewedImage(imageUrl);
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
          ${config.label}
        </span>
        <span class="criteria-score" style="color: ${scoreColor}">${data.score}</span>
      </div>
      <div class="criteria-bar">
        <div class="criteria-fill" style="background: linear-gradient(90deg, ${config.color}, ${config.color}aa);" data-width="${data.score}%"></div>
      </div>
      <p class="criteria-detail">${data.comment}</p>
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
    container.innerHTML = '<p class="empty-state">Không có góp ý nào</p>';
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
