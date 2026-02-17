// Scam Alert Ticker
const Ticker = {
  async init() {
    try {
      const res = await fetch('data/alerts.json');
      const alerts = await res.json();
      this.render(alerts);
    } catch (e) {
      console.error('Ticker load failed:', e);
    }
  },

  render(alerts) {
    const container = document.getElementById('ticker-content');
    if (!container) return;

    const icons = { critical: '\u{1F6A8}', high: '\u26A0\uFE0F', medium: '\u{1F514}' };
    const html = alerts.map(a => `
      <span class="ticker-item">
        <span class="severity-${a.severity}">${icons[a.severity] || '\u26A0\uFE0F'}</span>
        <span class="severity-${a.severity}">${a.text}</span>
      </span>
    `).join('');

    // Duplicate for seamless scroll
    container.innerHTML = html + html;
  }
};
