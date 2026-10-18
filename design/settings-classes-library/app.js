/** Simpler Settings preview — classes only; folders live on the class. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const PRESETS = {
  'eyfs-music': ['welcome', 'kodaly', 'vocal', 'core'],
  drama: ['welcome', 'drama'],
  ks2: ['vocal'],
  y6: ['vocal', 'lso'],
  y8: ['vocal', 'chords'],
  'y7-drama': ['y7-drama', 'wtd'],
};

function openDrawer(id) {
  const el = $(`#${id}`);
  if (!el) return;
  el.classList.remove('hidden');
  const focusable = el.querySelector('input:not([type=checkbox]):not([type=radio]), button.primary');
  focusable?.focus?.();
}

function closeDrawers() {
  $$('.drawer').forEach((d) => d.classList.add('hidden'));
}

function closeFolderDrawerOnly() {
  $('#drawer-add-folder')?.classList.add('hidden');
}

function allFolderInputs() {
  return $$('#drawer-class .toggle-list input[type=checkbox]');
}

function updateFolderCount() {
  const inputs = allFolderInputs();
  const on = inputs.filter((c) => c.checked).length;
  const el = $('#folder-count');
  if (el) el.textContent = `${on} on`;
}

function applyPreset(preset) {
  const ids = new Set(PRESETS[preset] || []);
  allFolderInputs().forEach((c) => {
    const id = c.closest('li')?.dataset.id;
    c.checked = id ? ids.has(id) : false;
  });
  updateFolderCount();
}

function wireClassRow(row) {
  row.addEventListener('click', () => {
    const name = row.dataset.name || 'Class';
    const stage = row.dataset.stage || '';
    const color = row.dataset.color || '#10B981';
    const preset = row.dataset.preset || '';

    $('#class-detail-title').textContent = name;
    $('#class-detail-name').value = name;
    $('#class-detail-stage').textContent = stage;
    $('#class-detail-dot').style.background = color;
    const forClass = $('#folder-for-class');
    if (forClass) forClass.textContent = name;

    applyPreset(preset);
    openDrawer('drawer-class');
  });
}

$$('.class-row').forEach(wireClassRow);

$('#open-add-class')?.addEventListener('click', () => openDrawer('drawer-add-class'));

$('#open-add-folder')?.addEventListener('click', () => {
  openDrawer('drawer-add-folder');
});

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-folder]')) {
    closeFolderDrawerOnly();
    return;
  }
  if (e.target.closest('[data-close]')) closeDrawers();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#drawer-add-folder')?.classList.contains('hidden')) closeFolderDrawerOnly();
    else closeDrawers();
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('#drawer-class .toggle-list input')) updateFolderCount();
});

$('#form-add-class')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const stage = String(fd.get('stage') || 'Other');
  const color = String(fd.get('color') || '#10B981');

  let block = $(`.stage-block[data-stage="${stage}"]`);
  if (!block) {
    block = document.createElement('div');
    block.className = 'stage-block';
    block.dataset.stage = stage;
    block.innerHTML = `<h4>${stage} <span>0</span></h4><ul class="class-list"></ul>`;
    $('#view-classes').appendChild(block);
  }
  const list = block.querySelector('.class-list');
  const li = document.createElement('li');
  const stageKey = stage.toLowerCase().replace(/\s+/g, '');
  const preset =
    stageKey === 'eyfs' || stageKey === 'ks1'
      ? 'eyfs-music'
      : stageKey === 'ks3'
        ? 'y8'
        : 'ks2';
  li.innerHTML = `
    <button type="button" class="class-row" data-name="${name.replace(/"/g, '&quot;')}" data-stage="${stage}" data-color="${color}" data-preset="${preset}">
      <span class="dot" style="background:${color}"></span>
      <span class="meta"><strong>${name}</strong><em>New class</em></span>
      <span class="chev">Open</span>
    </button>`;
  list.appendChild(li);
  const count = block.querySelector('h4 span');
  if (count) count.textContent = String(list.children.length);

  const row = li.querySelector('.class-row');
  wireClassRow(row);
  e.target.reset();
  closeDrawers();
  row.click();
});

$('#form-add-folder')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const id = `yours-${Date.now()}`;
  const list = $('#list-yours');
  if (!list) return;
  const li = document.createElement('li');
  li.dataset.id = id;
  li.innerHTML = `<label><input type="checkbox" checked /> ${name}</label>`;
  list.appendChild(li);
  updateFolderCount();
  e.target.reset();
  closeFolderDrawerOnly();
});
