// Community Scam Submission with voting
const Submit = {
  screenshots: [],
  selectedType: '',
  reports: [],
  votes: {},

  init() {
    this.reports = JSON.parse(localStorage.getItem('community_reports') || '[]');
    this.votes = JSON.parse(localStorage.getItem('report_votes') || '{}');
    this.bindEvents();
    this.renderReports();
  },

  bindEvents() {
    // Quick type buttons
    document.querySelectorAll('.quick-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quick-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedType = btn.dataset.type;
        const typeSelect = document.getElementById('scam-type');
        if (typeSelect) typeSelect.value = this.selectedType;
      });
    });

    // Drag & drop zone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
      });
      dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = () => this.handleFiles(input.files);
        input.click();
      });
    }

    // Paste handler
    document.addEventListener('paste', (e) => {
      const activeSection = document.querySelector('#submit.active');
      if (!activeSection) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) this.handleFiles([file]);
        }
      }
    });

    // Form submit
    const form = document.getElementById('submit-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReport();
      });
    }
  },

  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.screenshots.push(e.target.result);
        this.renderPreviews();
      };
      reader.readAsDataURL(file);
    });
  },

  renderPreviews() {
    const preview = document.getElementById('screenshot-preview');
    if (!preview) return;
    preview.innerHTML = this.screenshots.map((src, i) =>
      `<img src="${src}" alt="Screenshot ${i + 1}" onclick="Submit.removeScreenshot(${i})">`
    ).join('');
  },

  removeScreenshot(i) {
    this.screenshots.splice(i, 1);
    this.renderPreviews();
  },

  submitReport() {
    const name = document.getElementById('scam-name')?.value?.trim();
    const type = document.getElementById('scam-type')?.value || this.selectedType;
    const desc = document.getElementById('scam-desc')?.value?.trim();
    const evidence = document.getElementById('scam-evidence')?.value?.trim();
    const alias = document.getElementById('reporter-alias')?.value?.trim() || 'Anonymous';

    if (!name) {
      App.toast('Please enter a scam/project name');
      return;
    }
    if (!type) {
      App.toast('Please select a scam type');
      return;
    }

    const report = {
      id: Date.now(),
      name,
      type,
      description: desc || 'No description provided',
      evidence,
      alias,
      screenshots: this.screenshots.slice(0, 3), // Limit to 3
      date: new Date().toISOString().split('T')[0],
      upvotes: 0,
      downvotes: 0
    };

    this.reports.unshift(report);
    localStorage.setItem('community_reports', JSON.stringify(this.reports));

    // Reset form
    document.getElementById('submit-form')?.reset();
    document.querySelectorAll('.quick-type-btn').forEach(b => b.classList.remove('active'));
    this.screenshots = [];
    this.renderPreviews();
    this.renderReports();

    App.toast('Scam reported! Community votes will determine if it gets promoted to the main feed.');

    // Update hero stats
    const statEl = document.getElementById('stat-reports');
    if (statEl) statEl.textContent = this.reports.length;
  },

  getUserVote(id) {
    return localStorage.getItem('uv_report_' + id) || null;
  },

  vote(id, dir) {
    const report = this.reports.find(r => r.id === id);
    if (!report) return;

    const current = this.getUserVote(id);

    if (current === dir) {
      // Undo
      if (dir === 'up') report.upvotes = Math.max(0, (report.upvotes || 0) - 1);
      else report.downvotes = Math.max(0, (report.downvotes || 0) - 1);
      localStorage.removeItem('uv_report_' + id);
    } else {
      if (current) {
        if (current === 'up') report.upvotes = Math.max(0, (report.upvotes || 0) - 1);
        else report.downvotes = Math.max(0, (report.downvotes || 0) - 1);
      }
      if (dir === 'up') report.upvotes = (report.upvotes || 0) + 1;
      else report.downvotes = (report.downvotes || 0) + 1;
      localStorage.setItem('uv_report_' + id, dir);
    }

    localStorage.setItem('community_reports', JSON.stringify(this.reports));
    this.renderReports();
  },

  renderReports() {
    const container = document.getElementById('community-reports');
    if (!container) return;

    if (this.reports.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">No community reports yet. Be the first to submit!</p>';
      return;
    }

    // Sort by net votes
    const sorted = [...this.reports].sort((a, b) => {
      const sa = (a.upvotes || 0) - (a.downvotes || 0);
      const sb = (b.upvotes || 0) - (b.downvotes || 0);
      return sb - sa;
    });

    container.innerHTML = sorted.map(r => {
      const score = (r.upvotes || 0) - (r.downvotes || 0);
      const userVote = this.getUserVote(r.id);
      const promoted = score >= 5;
      const typeClass = r.type;

      return `
        <div class="community-report" style="${promoted ? 'border-color:var(--green)' : ''}">
          <div class="report-vote">
            <button class="vote-btn ${userVote === 'up' ? 'upvoted' : ''}" onclick="Submit.vote(${r.id}, 'up')">\u25B2</button>
            <span class="vote-count">${score}</span>
            <button class="vote-btn ${userVote === 'down' ? 'downvoted' : ''}" onclick="Submit.vote(${r.id}, 'down')">\u25BC</button>
          </div>
          <div class="report-body">
            <h4>
              ${this.escapeHtml(r.name)}
              <span class="card-type type-${typeClass}" style="margin-left:8px">${r.type}</span>
              ${promoted ? '<span class="card-type" style="background:rgba(0,204,102,0.2);color:#00cc66;margin-left:4px">PROMOTED</span>' : ''}
            </h4>
            <p>${this.escapeHtml(r.description)}</p>
            ${r.evidence ? `<p><a href="${this.escapeHtml(r.evidence)}" target="_blank" rel="noopener">\u{1F517} Evidence</a></p>` : ''}
            ${r.screenshots && r.screenshots.length > 0 ? `
              <div style="display:flex;gap:4px;margin-top:4px">
                ${r.screenshots.map(s => `<img src="${s}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">`).join('')}
              </div>
            ` : ''}
            <div class="meta">Reported by ${this.escapeHtml(r.alias)} \u2022 ${r.date} ${promoted ? '\u2022 \u2705 Promoted to main feed' : score >= 3 ? `\u2022 ${5 - score} more votes to promote` : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
