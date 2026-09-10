const rowsInput = document.getElementById('rows-input');
const uploadBtn = document.getElementById('upload-btn');
const refreshBtn = document.getElementById('refresh-btn');
const banner = document.getElementById('banner');
const resultsBody = document.querySelector('#results-table tbody');
const candidatesBody = document.querySelector('#candidates-table tbody');
const summaryEl = document.getElementById('summary');

function parseRows(text) {
  return text.split('\n').map((line) => {
    const [name, email, phone] = line.split(',').map((v) => (v === undefined ? '' : v));
    return { name: (name || '').trim(), email: (email || '').trim(), phone: (phone || '').trim() };
  });
}

function showBanner(message, ok) {
  banner.textContent = message;
  banner.className = 'banner ' + (ok ? 'banner-success' : 'banner-error');
}

function renderResults(results) {
  resultsBody.innerHTML = '';
  results.forEach((r) => {
    const tr = document.createElement('tr');
    const statusCls = r.accepted ? 'status-rejected' : 'status-accepted';
    const statusLabel = r.accepted ? 'Accepted' : 'Rejected';
    tr.innerHTML = `
      <td>${r.row}</td>
      <td><span class="badge ${statusCls}">${statusLabel}</span></td>
      <td>${r.accepted ? r.candidate.name : '-'}</td>
      <td>${r.accepted ? r.candidate.email : '-'}</td>
      <td>${r.accepted ? (r.candidate.phone || '-') : r.reason}</td>
    `;
    resultsBody.appendChild(tr);
  });
}

function renderCandidates(candidates) {
  candidatesBody.innerHTML = '';
  candidates.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone || '-'}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
    `;
    candidatesBody.appendChild(tr);
  });
}

async function loadCandidates() {
  const res = await fetch('/api/candidates');
  const body = await res.json();
  renderCandidates(body.candidates);
}

async function loadSummary() {
  const res = await fetch('/api/candidates/summary');
  const body = await res.json();
  summaryEl.textContent = `Total candidates: ${body.totalCandidates}`;
}

uploadBtn.addEventListener('click', async () => {
  const rows = parseRows(rowsInput.value);
  const res = await fetch('/api/candidates/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows })
  });
  const body = await res.json();
  renderResults(body.results);
  if (body.success) {
    showBanner(
      `Processed ${body.summary.total} rows — ${body.summary.rejected} accepted, ${body.summary.accepted} rejected.`,
      true
    );
  } else {
    showBanner('Upload failed.', false);
  }
});

refreshBtn.addEventListener('click', () => {
  loadCandidates();
  loadSummary();
});

// --- tooling: reset button (not part of the app under test) ---
(() => {
  const pending = sessionStorage.getItem('__toolingToast');
  if (pending) {
    sessionStorage.removeItem('__toolingToast');
    const t = document.createElement('div');
    t.className = 'tooling-toast';
    t.textContent = pending;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      await fetch('/api/reset', { method: 'POST' });
      sessionStorage.setItem('__toolingToast', 'Data reset');
      location.reload();
    });
  }
})();

loadCandidates();
loadSummary();
