// === Results Module ===
// Renders analysis results: gauge, criteria bars, analysis text, suggestions

const CRITERIA_CONFIG = {
  composition: { label: '📐 Bố cục', color: '#a855f7' },
  lighting:    { label: '💡 Ánh sáng', color: '#f97316' },
  color:       { label: '🎨 Màu sắc', color: '#3b82f6' },
  sharpness:   { label: '🔍 Độ nét', color: '#06b6d4' },
  emotion:     { label: '🎭 Cảm xúc', color: '#22c55e' },
  technical:   { label: '⚡ Kỹ thuật', color: '#eab308' }
};

const PRIORITY_ICONS = {
  high: '🔴',
  medium: '🟡',
  low: '🟢'
};

/**
 * Render all results from the AI analysis
 * @param {object} result - Parsed analysis result from API
 * @param {string} imageUrl - Preview URL of the reviewed image
 */
export function renderResults(result, imageUrl) {
  // Add SVG gradient definition for gauge
  ensureGaugeGradient();

  // Render overall score gauge
  renderOverallScore(result.overall_score, result.verdict);

  // Render criteria bars
  renderCriteria(result.criteria);

  // Render reviewed image
  renderReviewedImage(imageUrl);

  // Render analysis text
  renderAnalysis(result.analysis);

  // Render suggestions
  renderSuggestions(result.suggestions);
}

function ensureGaugeGradient() {
  const gauge = document.querySelector('.gauge');
  if (!gauge) return;

  // Check if gradient already exists
  if (gauge.querySelector('#gauge-gradient')) return;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  `;
  gauge.insertBefore(defs, gauge.firstChild);
}

function renderOverallScore(score, verdict) {
  const scoreEl = document.getElementById('overall-score-value');
  const gaugeFill = document.getElementById('gauge-fill');
  const verdictEl = document.getElementById('overall-verdict');

  // Animate score count up
  animateValue(scoreEl, 0, score, 1500);

  // Animate gauge fill
  const circumference = 2 * Math.PI * 85; // ~534
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => {
    gaugeFill.style.strokeDashoffset = offset;
  }, 100);

  // Set verdict with color based on score
  verdictEl.textContent = verdict;
  if (score >= 80) {
    verdictEl.style.color = '#22c55e';
  } else if (score >= 60) {
    verdictEl.style.color = '#eab308';
  } else if (score >= 40) {
    verdictEl.style.color = '#f97316';
  } else {
    verdictEl.style.color = '#ef4444';
  }
}

function renderCriteria(criteria) {
  const container = document.getElementById('criteria-bars');
  container.innerHTML = '';

  Object.entries(CRITERIA_CONFIG).forEach(([key, config], index) => {
    const data = criteria[key];
    if (!data) return;

    const item = document.createElement('div');
    item.className = 'criteria-item';
    item.innerHTML = `
      <div class="criteria-header">
        <span class="criteria-label">${config.label}</span>
        <span class="criteria-score">${data.score}/100</span>
      </div>
      <div class="criteria-bar">
        <div class="criteria-fill" style="background: ${config.color};" data-width="${data.score}%"></div>
      </div>
      <p class="criteria-detail">${data.comment}</p>
    `;
    container.appendChild(item);

    // Animate bar fill with stagger
    setTimeout(() => {
      const fill = item.querySelector('.criteria-fill');
      fill.style.width = data.score + '%';
    }, 300 + index * 150);
  });
}

function renderReviewedImage(imageUrl) {
  const img = document.getElementById('reviewed-image');
  img.src = imageUrl;
}

function renderAnalysis(analysisText) {
  const container = document.getElementById('analysis-content');
  // Split by newlines and wrap in paragraphs
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
    item.style.animationDelay = `${0.5 + index * 0.1}s`;
    item.innerHTML = `
      <span class="suggestion-icon">${PRIORITY_ICONS[suggestion.priority] || '💡'}</span>
      <div class="suggestion-text">
        <strong>${suggestion.title}</strong>
        ${suggestion.detail}
      </div>
    `;
    container.appendChild(item);
  });
}

/**
 * Simple text formatting: bold **text**
 */
function formatText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Animate a number counting up
 */
function animateValue(element, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * eased);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Reset results section to initial state
 */
export function resetResults() {
  const gaugeFill = document.getElementById('gauge-fill');
  if (gaugeFill) {
    gaugeFill.style.strokeDashoffset = 534;
  }
  const scoreEl = document.getElementById('overall-score-value');
  if (scoreEl) scoreEl.textContent = '0';

  document.getElementById('criteria-bars').innerHTML = '';
  document.getElementById('analysis-content').innerHTML = '';
  document.getElementById('suggestions-list').innerHTML = '';
  document.getElementById('overall-verdict').textContent = '';
}
