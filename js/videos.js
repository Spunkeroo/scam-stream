// Video Vault + Stream of the Day
const Videos = {
  videos: [],
  filter: 'all',

  async init() {
    try {
      const res = await fetch('data/videos.json');
      this.videos = await res.json();
      this.renderFeatured();
      this.renderVault();
      this.bindFilters();
    } catch (e) {
      console.error('Videos load failed:', e);
    }
  },

  bindFilters() {
    document.querySelectorAll('#vault .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#vault .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.renderVault();
      });
    });

    const searchEl = document.getElementById('video-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => this.renderVault());
    }
  },

  renderFeatured() {
    const container = document.getElementById('featured-video');
    if (!container) return;

    // Find today's featured or most recent featured
    const today = new Date().toISOString().split('T')[0];
    const featured = this.videos
      .filter(v => v.featured)
      .sort((a, b) => new Date(b.featuredDate || b.date) - new Date(a.featuredDate || a.date));

    const current = featured[0];
    if (!current) return;

    const previous = featured.slice(1, 6);

    container.innerHTML = `
      <div class="featured-embed">
        <iframe src="https://www.youtube.com/embed/${current.videoId}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>
      </div>
      <div class="featured-info">
        <div>
          <h3>${this.escapeHtml(current.title)}</h3>
          <div class="creator">by ${this.escapeHtml(current.creator)}</div>
          <p style="color:var(--text-dim);font-size:14px;margin-top:8px">${this.escapeHtml(current.description)}</p>
        </div>
        <button class="btn btn-primary" onclick="Videos.shareVideo('${current.videoId}', '${this.escapeHtml(current.title)}')">
          \u{1F4E4} Share
        </button>
      </div>
      ${previous.length > 0 ? `
        <div class="previous-picks">
          <h4>Previous Picks</h4>
          <div class="picks-row">
            ${previous.map(v => `
              <div class="pick-card" onclick="Videos.playInModal('${v.videoId}')">
                <div class="pick-thumb">
                  <img src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" alt="${this.escapeHtml(v.title)}" loading="lazy">
                </div>
                <div class="pick-info">
                  <div class="title">${this.escapeHtml(v.title)}</div>
                  <div class="creator">${this.escapeHtml(v.creator)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  renderVault() {
    const container = document.getElementById('video-vault-grid');
    if (!container) return;

    const search = (document.getElementById('video-search')?.value || '').toLowerCase();

    let items = this.videos.filter(v => {
      if (this.filter !== 'all' && v.category !== this.filter) return false;
      if (search && !v.title.toLowerCase().includes(search) && !v.description.toLowerCase().includes(search) && !v.creator.toLowerCase().includes(search)) return false;
      return true;
    });

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">\u{1F3AC}</div><p>No videos found</p></div>';
      return;
    }

    container.innerHTML = items.map(v => `
      <div class="video-card" onclick="Videos.playInModal('${v.videoId}')">
        <div class="video-thumb">
          <img src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" alt="${this.escapeHtml(v.title)}" loading="lazy">
          <div class="play-overlay">
            <div class="play-icon">\u25B6</div>
          </div>
        </div>
        <div class="video-card-info">
          <h4>${this.escapeHtml(v.title)}</h4>
          <div class="creator">${this.escapeHtml(v.creator)}</div>
          <div class="desc">${this.escapeHtml(v.description)}</div>
        </div>
      </div>
    `).join('');
  },

  playInModal(videoId) {
    const modal = document.getElementById('video-modal');
    const embed = document.getElementById('modal-embed');
    if (!modal || !embed) return;

    embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
    modal.classList.add('active');

    modal.onclick = (e) => {
      if (e.target === modal || e.target.classList.contains('video-modal-close')) {
        this.closeModal();
      }
    };
  },

  closeModal() {
    const modal = document.getElementById('video-modal');
    const embed = document.getElementById('modal-embed');
    if (modal) modal.classList.remove('active');
    if (embed) embed.innerHTML = '';
  },

  shareVideo(videoId, title) {
    const text = `\u{1F6A8} Watch: ${title}\n\nhttps://youtube.com/watch?v=${videoId}\n\nFound on scam.stream \u2014 exposing scams daily`;
    if (navigator.share) {
      navigator.share({ title, text, url: `https://youtube.com/watch?v=${videoId}` });
    } else {
      navigator.clipboard.writeText(text).then(() => App.toast('Copied to clipboard!'));
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
