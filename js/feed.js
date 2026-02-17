// Scam Feed — Reddit-style cards with upvote/downvote
const Feed = {
  scams: [],
  filter: 'all',
  sort: 'newest',
  votes: {},

  async init() {
    this.votes = JSON.parse(localStorage.getItem('scam_votes') || '{}');
    try {
      const res = await fetch('data/scams.json');
      this.scams = await res.json();
      // Merge community reports that got promoted
      const community = JSON.parse(localStorage.getItem('community_reports') || '[]');
      const promoted = community.filter(r => (r.upvotes || 0) - (r.downvotes || 0) >= 5);
      promoted.forEach(r => {
        if (!this.scams.find(s => s.name === r.name)) {
          this.scams.push({
            id: 'c_' + r.id,
            name: r.name,
            type: r.type,
            date: r.date,
            losses: 'Unknown',
            status: 'Under Investigation',
            description: r.description,
            source: r.evidence || '',
            community: true
          });
        }
      });
      this.render();
      this.bindFilters();
    } catch (e) {
      console.error('Feed load failed:', e);
    }
  },

  bindFilters() {
    document.querySelectorAll('#feed .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#feed .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.render();
      });
    });

    const sortEl = document.getElementById('feed-sort');
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        this.sort = sortEl.value;
        this.render();
      });
    }
  },

  getVoteScore(id) {
    const key = 'scam_' + id;
    const v = this.votes[key] || { up: 0, down: 0 };
    return (v.up || 0) - (v.down || 0);
  },

  getUserVote(id) {
    return localStorage.getItem('uv_scam_' + id) || null;
  },

  vote(id, dir) {
    const key = 'scam_' + id;
    const current = this.getUserVote(id);
    if (!this.votes[key]) this.votes[key] = { up: 0, down: 0 };

    if (current === dir) {
      // Undo vote
      this.votes[key][dir === 'up' ? 'up' : 'down']--;
      localStorage.removeItem('uv_scam_' + id);
    } else {
      if (current) {
        this.votes[key][current === 'up' ? 'up' : 'down']--;
      }
      this.votes[key][dir === 'up' ? 'up' : 'down']++;
      localStorage.setItem('uv_scam_' + id, dir);
    }

    localStorage.setItem('scam_votes', JSON.stringify(this.votes));
    this.render();
  },

  getSorted() {
    let items = [...this.scams];
    if (this.filter !== 'all') {
      items = items.filter(s => s.type === this.filter);
    }

    switch (this.sort) {
      case 'newest':
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'top':
        items.sort((a, b) => this.getVoteScore(b.id) - this.getVoteScore(a.id));
        break;
      case 'controversial':
        items.sort((a, b) => {
          const va = this.votes['scam_' + a.id] || { up: 0, down: 0 };
          const vb = this.votes['scam_' + b.id] || { up: 0, down: 0 };
          return (vb.up + vb.down) - (va.up + va.down);
        });
        break;
    }
    return items;
  },

  render() {
    const container = document.getElementById('scam-feed');
    if (!container) return;

    const items = this.getSorted();
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">\u{1F50D}</div><p>No scams found for this filter</p></div>';
      return;
    }

    container.innerHTML = items.map(s => {
      const score = this.getVoteScore(s.id);
      const userVote = this.getUserVote(s.id);
      const statusClass = s.status === 'Active' ? 'active' : s.status === 'Dead' ? 'dead' : 'investigation';
      const typeClass = s.type;

      return `
        <div class="scam-card" data-id="${s.id}">
          <div class="vote-col">
            <button class="vote-btn ${userVote === 'up' ? 'upvoted' : ''}" onclick="Feed.vote('${s.id}', 'up')" title="Upvote">\u25B2</button>
            <span class="vote-count">${score}</span>
            <button class="vote-btn ${userVote === 'down' ? 'downvoted' : ''}" onclick="Feed.vote('${s.id}', 'down')" title="Downvote">\u25BC</button>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="card-type type-${typeClass}">${s.type}</span>
              <span class="card-status status-${statusClass}">${s.status}</span>
              <span class="card-date">${s.date}</span>
              ${s.community ? '<span class="card-type" style="background:rgba(0,204,102,0.2);color:#00cc66">COMMUNITY</span>' : ''}
            </div>
            <div class="card-title">${this.escapeHtml(s.name)}</div>
            <div class="card-losses">Est. losses: ${s.losses}</div>
            <div class="card-desc">${this.escapeHtml(s.description)}</div>
            <div class="card-actions">
              ${s.source ? `<a class="card-action" href="${s.source}" target="_blank" rel="noopener">\u{1F517} Source</a>` : ''}
              <button class="card-action" onclick="Feed.share('${s.id}')">\u{1F4E4} Share</button>
              <button class="card-action" onclick="Feed.report('${s.id}')">\u{1F6A9} Report</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Update hero stats
    const statEl = document.getElementById('stat-scams');
    if (statEl) statEl.textContent = this.scams.length;
  },

  share(id) {
    const scam = this.scams.find(s => String(s.id) === String(id));
    if (!scam) return;
    const text = `\u{1F6A8} ${scam.name} just got EXPOSED \u2014 ${scam.losses} lost!\n\nType: ${scam.type}\nStatus: ${scam.status}\n\nCheck it out on scam.stream`;

    if (navigator.share) {
      navigator.share({ title: `${scam.name} — EXPOSED`, text, url: 'https://scam.stream' });
    } else {
      navigator.clipboard.writeText(text).then(() => App.toast('Copied to clipboard!'));
    }
  },

  report(id) {
    App.toast('Report submitted. Thanks for keeping the community safe!');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
