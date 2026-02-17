// Scam Database — Searchable, sortable table with voting
const Database = {
  scams: [],
  sortCol: 'date',
  sortDir: 'desc',
  filter: 'all',
  votes: {},

  async init() {
    this.votes = JSON.parse(localStorage.getItem('db_votes') || '{}');
    try {
      const res = await fetch('data/scams.json');
      this.scams = await res.json();
      this.render();
      this.bindEvents();
    } catch (e) {
      console.error('Database load failed:', e);
    }
  },

  bindEvents() {
    const searchEl = document.getElementById('db-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => this.render());
    }

    document.querySelectorAll('#database .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#database .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.render();
      });
    });
  },

  sort(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'desc';
    }
    this.render();
  },

  getVoteScore(id) {
    const key = 'db_' + id;
    const v = this.votes[key] || { up: 0, down: 0 };
    return (v.up || 0) - (v.down || 0);
  },

  getUserVote(id) {
    return localStorage.getItem('uv_db_' + id) || null;
  },

  vote(id, dir) {
    const key = 'db_' + id;
    const current = this.getUserVote(id);
    if (!this.votes[key]) this.votes[key] = { up: 0, down: 0 };

    if (current === dir) {
      this.votes[key][dir === 'up' ? 'up' : 'down']--;
      localStorage.removeItem('uv_db_' + id);
    } else {
      if (current) {
        this.votes[key][current === 'up' ? 'up' : 'down']--;
      }
      this.votes[key][dir === 'up' ? 'up' : 'down']++;
      localStorage.setItem('uv_db_' + id, dir);
    }

    localStorage.setItem('db_votes', JSON.stringify(this.votes));
    this.render();
  },

  getFiltered() {
    const search = (document.getElementById('db-search')?.value || '').toLowerCase();
    let items = [...this.scams];

    if (this.filter !== 'all') {
      items = items.filter(s => s.type === this.filter);
    }

    if (search) {
      items = items.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => {
      let va, vb;
      switch (this.sortCol) {
        case 'votes':
          va = this.getVoteScore(a.id);
          vb = this.getVoteScore(b.id);
          break;
        case 'name':
          va = a.name.toLowerCase();
          vb = b.name.toLowerCase();
          break;
        case 'type':
          va = a.type;
          vb = b.type;
          break;
        case 'date':
          va = new Date(a.date);
          vb = new Date(b.date);
          break;
        case 'losses':
          va = this.parseLosses(a.losses);
          vb = this.parseLosses(b.losses);
          break;
        case 'status':
          va = a.status;
          vb = b.status;
          break;
        default:
          va = a.date;
          vb = b.date;
      }
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  },

  parseLosses(str) {
    if (!str || str === 'Unknown' || str === '$Unknown' || str === '$Ongoing') return 0;
    const clean = str.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean) || 0;
    if (str.toLowerCase().includes('billion')) return num * 1e9;
    if (str.toLowerCase().includes('million')) return num * 1e6;
    return num;
  },

  render() {
    const container = document.getElementById('db-table-body');
    if (!container) return;

    const items = this.getFiltered();

    if (items.length === 0) {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No scams match your search</td></tr>';
      return;
    }

    container.innerHTML = items.map(s => {
      const score = this.getVoteScore(s.id);
      const userVote = this.getUserVote(s.id);
      const statusClass = s.status === 'Active' ? 'active' : s.status === 'Dead' ? 'dead' : 'investigation';
      const typeClass = s.type;

      return `
        <tr>
          <td>
            <div class="vote-cell">
              <button class="db-vote-btn ${userVote === 'up' ? 'upvoted' : ''}" onclick="Database.vote(${s.id}, 'up')">\u25B2</button>
              <span style="font-weight:700;font-size:13px;min-width:20px;text-align:center">${score}</span>
              <button class="db-vote-btn ${userVote === 'down' ? 'downvoted' : ''}" onclick="Database.vote(${s.id}, 'down')">\u25BC</button>
            </div>
          </td>
          <td><strong>${this.escapeHtml(s.name)}</strong></td>
          <td><span class="card-type type-${typeClass}">${s.type}</span></td>
          <td>${s.date}</td>
          <td style="color:var(--red);font-weight:600">${s.losses}</td>
          <td><span class="card-status status-${statusClass}">${s.status}</span></td>
          <td>${s.source ? `<a href="${s.source}" target="_blank" rel="noopener">\u{1F517}</a>` : '-'}</td>
        </tr>
      `;
    }).join('');

    // Update count
    const countEl = document.getElementById('db-count');
    if (countEl) countEl.textContent = items.length;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
