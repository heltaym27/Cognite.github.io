const REPORTS_DIR = '/media/reports/';
const LIST_FILE = 'reports.txt';
const CONTAINER_ID = 'reports';

async function loadReports() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.error(`No element with id="${CONTAINER_ID}" found`);
    return;
  }

  // 1. Load the list of report names
  let names;
  try {
    const res = await fetch(REPORTS_DIR + LIST_FILE);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();

    names = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // drop blank lines
  } catch (err) {
    console.error(`Could not load ${LIST_FILE}:`, err);
    return;
  }

  if (names.length === 0) {
    console.log('reports.txt is empty.');
    return;
  }

  // 2. Process each name, skipping incomplete pairs
  for (const name of names) {
    await processReport(container, name);
  }
}

async function processReport(container, name) {
  const jsonUrl = `${REPORTS_DIR}${name}.json`;
  const pdfUrl = `${REPORTS_DIR}${name}.pdf`;

  // Check both files exist
  const [jsonRes, pdfRes] = await Promise.all([
    fetch(jsonUrl).catch(() => null),
    fetch(pdfUrl, { method: 'HEAD' }).catch(() => null), // HEAD = don't download the whole pdf just to check
  ]);

  if (!jsonRes || !jsonRes.ok || !pdfRes || !pdfRes.ok) {
    console.warn(`Skipping "${name}" — missing pdf or json counterpart`);
    return;
  }

  let data;
  try {
    data = await jsonRes.json();
  } catch (err) {
    console.error(`Failed to parse JSON for "${name}":`, err);
    return;
  }

  // ---- THIS IS WHERE YOU READ VALUES FROM THE JSON ----
  const title = data.title ?? name;
  const date = data.date ?? '';
  const summary = data.summary ?? '';
  // e.g. const author = data.author;
  // e.g. const score = data.metrics?.score;
  // ------------------------------------------------------

  renderReportCard(container, { name, title, date, summary, pdfUrl });
}

function renderReportCard(container, { name, title, date, summary, pdfUrl }) {
  const card = document.createElement('div');
  card.className = 'report-card';
  card.id = `report-${name}`;

  card.innerHTML = `
    <h3>${title}</h3>
    ${date ? `<p class="report-date">${date}</p>` : ''}
    ${summary ? `<p class="report-summary">${summary}</p>` : ''}
    <embed style="width:100%; height: 10cm;" type="text/pdf" src="${pdfUrl}"/>
  `;

  container.appendChild(card);
}

// Run as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadReports);
} else {
  loadReports();
}