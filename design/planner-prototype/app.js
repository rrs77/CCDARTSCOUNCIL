/* CCDesigner Planner — static design prototype (sample data only, no network, no app imports). */

const I = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ic = {
  book: I('<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'),
  folder: I('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  edit: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  tag: I('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  cal: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  hand: I('<path d="M11 17l2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.3L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>'),
  mail: I('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  chevL: I('<path d="m15 18-6-6 6-6"/>'),
  chevR: I('<path d="m9 18 6-6-6-6"/>'),
  chevD: I('<path d="m6 9 6 6 6-6"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  filter: I('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'),
  share: I('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4M12 2v13"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  more: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  clip: I('<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>'),
  layers: I('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  msg: I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  help: I('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  refresh: I('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),
  out: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  eye: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: I('<path d="M9.9 4.2A9 9 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.6 8 10 8a9 9 0 0 0 5.4-1.6M2 2l20 20"/>'),
  grip: I('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'),
  link: I('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  copy: I('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  move: I('<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>'),
  file: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  music: I('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  video: I('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>'),
  lock: I('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  alert: I('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  repeat: I('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  sparkle: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
  print: I('<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>'),
  archive: I('<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>'),
  x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  home: I('<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>'),
  pdf: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 18h4"/>'),
};

/* ---------- Sample data (illustrative; mirrors the teacher's real timetable shape) ---------- */
const C = {
  nursery: { n: 'Nursery', c: 'rose', yg: 'Lower Kindergarten' },
  recA: { n: 'Reception A', c: 'amber', yg: 'Reception' },
  recB: { n: 'Reception B', c: 'gold', yg: 'Reception' },
  y1d: { n: 'Year 1 Drama', c: 'violet', yg: 'Year 1' },
  y2d: { n: 'Year 2 Drama', c: 'violet', yg: 'Year 2' },
  y2m: { n: 'Year 2 Music', c: 'blue', yg: 'Year 2' },
  y3m: { n: 'Year 3 Music', c: 'green', yg: 'Year 3' },
  y4m: { n: 'Year 4 Music', c: 'teal', yg: 'Year 4' },
  y6m: { n: 'Year 6 Music', c: 'indigo', yg: 'Year 6' },
  choir: { n: 'Choir', c: 'rose', yg: 'Mixed KS2' },
  orch: { n: 'Orchestra', c: 'slate', yg: 'Mixed KS2' },
};
const acc = (k) => `--acc: var(--c-${C[k].c}); --acc-t: var(--c-${C[k].c}-t);`;

const WEEK = [
  { dn: 'Mon', dd: 12, today: true, items: [
    { t: '07:45', ev: 'Staff briefing', sub: 'School event' },
    { t: '09:00', k: 'y6m', title: 'Young Voices', unit: 'Young Voices · Lesson 5', res: 2, st: 'ready' },
    { t: '09:55', k: 'y6m', title: 'Young Voices', unit: 'Young Voices · Lesson 5', res: 2, linked: true },
    { t: '13:30', k: 'y3m', title: 'Ukulele chords: C and Am', unit: 'First Steps on Ukulele · L3', res: 1, st: 'done', fb: true },
  ]},
  { dn: 'Tue', dd: 13, items: [
    { t: '08:00', k: 'orch', title: 'Autumn concert rehearsal', unit: 'Rehearsal', res: 1 },
    { t: '09:30', k: 'recA', title: 'Loud and quiet sounds', unit: 'Sound Explorers · L2', res: 3, st: 'ready' },
    { t: '11:10', k: 'y2m', title: 'Rhythm patterns', unit: 'Pulse and Rhythm · L4' },
    { t: '14:15', k: 'y3m', title: 'Ukulele: strumming patterns', unit: 'First Steps on Ukulele · L4', res: 1 },
  ]},
  { dn: 'Wed', dd: 14, items: [
    { t: '08:45', k: 'choir', title: 'Singing practice', unit: 'Christmas repertoire' },
    { t: '09:00', k: 'recB', title: 'Loud and quiet sounds', unit: 'Sound Explorers · L2', res: 3, linked: true },
    { t: '11:10', k: 'y1d', title: 'The Gruffalo: hot-seating', unit: 'Story Drama · L2', res: 1 },
    { t: '13:30', k: 'y4m', title: 'Chair drumming', unit: 'Body Percussion · L1', st: 'draft' },
  ]},
  { dn: 'Thu', dd: 15, items: [
    { t: '09:10', k: 'y1d', title: 'Funnybones: freeze frames', unit: 'Funnybones · L3', res: 2 },
    { t: '11:00', k: 'y4m', title: 'Chair drumming', unit: 'Body Percussion · L1', linked: true },
    { t: '14:15', k: 'y2d', title: 'Funnybones: soundscapes', unit: 'Funnybones · L3' },
    { t: '15:00', k: 'y2m', empty: true },
  ]},
  { dn: 'Fri', dd: 16, items: [
    { t: '08:00', k: 'choir', title: 'Choir: harmony parts', unit: 'Christmas repertoire' },
    { t: '09:00', k: 'nursery', title: 'Loud and quiet sounds', unit: 'Sound Explorers · L2', res: 3, linked: true },
    { t: '10:05', k: 'y2m', title: 'Rhythm patterns', unit: 'Pulse and Rhythm · L5' },
    { t: '11:00', k: 'y6m', title: 'Young Voices', unit: 'Young Voices · Lesson 6', st: 'draft' },
  ]},
];

/* ---------- Shared chrome ---------- */
function topbar() {
  return `<header class="topbar">
    <div class="brand"><button class="icon-btn menu-btn" data-drawer aria-label="Show my classes">${ic.folder.replace('<svg', '<svg width="20" height="20"')}</button><div class="logo">CCD</div><div class="brand-name">Creative Curriculum Designer</div></div>
    <div class="top-right">
      <div class="yg-pill"><span><b>All my classes</b> <span style="color:#9CA3AF">·</span> Planner</span>${ic.chevD.replace('<svg', '<svg width="16" height="16"')}</div>
      <button class="icon-btn" aria-label="Messages">${ic.msg.replace('<svg', '<svg width="19" height="19"')}</button>
      <button class="icon-btn" aria-label="Help">${ic.help.replace('<svg', '<svg width="19" height="19"')}</button>
      <button class="icon-btn" aria-label="Settings">${ic.gear.replace('<svg', '<svg width="19" height="19"')}</button>
      <div class="user"><div class="avatar">RR</div>Rob Reichstorer</div>
      <button class="icon-btn" aria-label="Sign out">${ic.out.replace('<svg', '<svg width="19" height="19"')}</button>
    </div>
  </header>`;
}
function tabs(active = 'Planner') {
  const t = [['Planner', ic.cal], ['Lesson Library', ic.folder], ['Lesson Builder', ic.edit], ['Activity Library', ic.tag], ['Partner Hubs', ic.hand], ['Contact Us', ic.mail]];
  return `<nav class="tabs">${t.map(([n, i]) => `<div class="tab ${n === active ? 'on' : ''}">${i}${n}</div>`).join('')}</nav>`;
}
function seg(on) {
  return `<div class="seg" role="tablist">${['Day', 'Week', 'Month', 'Term', 'Units'].map((v) => `<button class="${v === on ? 'on' : ''}">${v}</button>`).join('')}</div>`;
}
function classPanel({ on = 'y6m', hidden = [] } = {}) {
  const folder = (name, keys, open = true) => `
    <div class="folder">
      <div class="folder-h">${open ? ic.chevD : ic.chevR}${name}<span class="count">${keys.length}</span></div>
      ${open ? keys.map((k) => `<div class="cls ${k === on ? 'on' : ''} ${hidden.includes(k) ? 'off' : ''}"><span class="dot" style="background:var(--c-${C[k].c})"></span>${C[k].n}${hidden.includes(k) ? ic.eyeOff.replace('<svg', '<svg class="eye"') : ''}</div>`).join('') : ''}
    </div>`;
  return `<aside class="panel classes">
    <h3>My classes <span>${ic.plus.replace('<svg', '<svg width="16" height="16"')}</span></h3>
    <div class="cls-search">${ic.search.replace('<svg', '<svg width="15" height="15"')}Find a class</div>
    ${folder('EYFS', ['nursery', 'recA', 'recB'])}
    ${folder('KS1', ['y1d', 'y2d', 'y2m'])}
    ${folder('KS2 Music', ['y3m', 'y4m', 'y6m'])}
    ${folder('Ensembles', ['choir', 'orch'])}
    <div class="cls-foot">
      <div class="ghost-row">${ic.archive}2025–26 classes (archived)</div>
      <div class="ghost-row">${ic.gear}Organise classes &amp; colours</div>
    </div>
  </aside>`;
}
function header({ crumb, title, view, date, sub, extra = '', showFilters = true, searchPh = 'Search this week…' }) {
  return `<div class="head">
    <div class="head-top">
      <div><div class="crumb">${crumb}</div><h1>${title}</h1><div class="sub">${sub}</div></div>
      <div style="display:flex;gap:10px;align-items:center">${seg(view)}<button class="btn lime">${ic.plus}New</button></div>
    </div>
    <div class="toolrow">
      <button class="nav-btn" aria-label="Previous">${ic.chevL.replace('<svg', '<svg width="16" height="16"')}</button>
      <button class="btn">Today</button>
      <button class="nav-btn" aria-label="Next">${ic.chevR.replace('<svg', '<svg width="16" height="16"')}</button>
      <span class="date-label">${date}</span>
      <div class="search">${ic.search}${searchPh}</div>
      <button class="btn" aria-label="Filters">${ic.filter}<span class="lbl">Filters</span></button>
      <button class="btn" aria-label="Share and print">${ic.share}<span class="lbl">Share &amp; print</span></button>
    </div>
    ${showFilters ? `<div class="filters">
      <span class="fchip on">All classes <span class="x">· 11</span></span>
      <span class="fchip">Units</span><span class="fchip">Status</span><span class="fchip">Objectives</span>
      <span class="fchip">Show school events</span>
    </div>` : ''}
    ${extra}
  </div>`;
}
function bottomNav() {
  const t = [['Planner', ic.cal, 1], ['Lessons', ic.folder], ['Builder', ic.edit], ['Activities', ic.tag], ['More', ic.more]];
  return `<nav class="bottom-nav">${t.map(([n, i, on]) => `<span class="${on ? 'on' : ''}">${i}${n}</span>`).join('')}</nav>`;
}
function page(body, { side = true, sideOpts = {} } = {}) {
  return `${topbar()}<div class="wrap">${tabs()}<div class="planner ${side ? '' : 'no-side'}">${side ? classPanel(sideOpts) : ''}<main class="panel">${body}</main></div></div>
    ${side ? '<div class="scrim" data-drawer></div>' : ''}${bottomNav()}`;
}

/* ---------- Lesson card ---------- */
function card(it, { sel = false } = {}) {
  if (it.ev) {
    return `<div class="lc event" style="--acc:#9CA3AF"><div class="row1"><span class="time">${it.t}</span></div><div class="title">${it.ev}</div><div class="unit">${it.sub}</div></div>`;
  }
  if (it.empty) {
    return `<div class="lc empty" style="${acc(it.k)}"><div class="row1"><span class="time">${it.t}</span><span class="klass">${C[it.k].n}</span></div><div class="title">No lesson planned yet</div><div class="unit">${ic.plus}Choose from unit or library</div></div>`;
  }
  const st = it.st === 'done' ? '<span class="status st-done">Taught</span>' : it.st === 'draft' ? '<span class="status st-draft">Draft</span>' : it.st === 'ready' ? '<span class="status st-ready">Ready</span>' : '';
  const icons = [
    it.res ? `<span title="Resources">${ic.clip}${it.res}</span>` : '',
    it.linked ? `<span title="Same lesson as another session">${ic.link}Shared lesson</span>` : '',
    it.fb ? `<span title="Reflection recorded">${ic.msg}Reflection</span>` : '',
  ].join('');
  return `<div class="lc ${sel ? 'sel' : ''}" style="${acc(it.k)}">
    <div class="row1"><span class="time">${it.t}</span><span class="klass">${C[it.k].n}</span>${ic.more.replace('<svg', '<svg class="more"')}</div>
    <div class="title">${it.title}</div>
    <div class="unit">${ic.layers}${it.unit}</div>
    ${icons || st ? `<div class="icons">${icons}${st}</div>` : ''}
  </div>`;
}

/* ---------- Screens ---------- */
const S = {};

S.week = () => page(
  header({
    crumb: 'Planner · Autumn 1 · 2026–27', title: 'This week', view: 'Week', date: '12 – 16 October 2026',
    sub: `<span class="chip">Current week</span><span>Week 6 of Autumn 1</span>`,
    extra: `<div class="summary"><span><b>18</b> sessions</span><span><b>15</b> lessons planned</span><span><b>2</b> drafts</span><span><b>1</b> empty slot</span><span style="margin-left:auto;display:flex;gap:10px;align-items:center">Planning complete <span class="meter"><i style="width:83%"></i></span><b>83%</b></span></div>`,
  }) +
  `<div class="week">${WEEK.map((d) => `<section class="day-col ${d.today ? 'today' : ''}">
      <div class="day-h"><span class="dn">${d.dn}</span><span class="dd">${d.dd}</span>${d.today ? '<span class="tag">Today</span>' : ''}<span class="cnt">${d.items.filter((x) => !x.ev).length} lessons</span></div>
      ${d.items.map((it) => card(it, { sel: it.k === 'y6m' && d.today && it.t === '09:00' })).join('')}
      <div class="add-slot">${ic.plus}Add lesson or event</div>
    </section>`).join('')}</div>`,
);

S['week-b'] = () => {
  const toY = (t) => { const [h, m] = t.split(':').map(Number); return ((h - 8) * 60 + m) * (80 / 60); };
  const dur = { '07:45': 15, '08:00': 30, '08:45': 15 };
  const hours = [8, 9, 10, 11, 12, 13, 14, 15];
  return page(
    header({ crumb: 'Planner · Variant B · Time grid', title: 'This week', view: 'Week', date: '12 – 16 October 2026', sub: '<span class="chip">Current week</span><span>Time-aligned layout</span>', showFilters: false }) +
    `<div class="tgrid">
      <div></div>${WEEK.map((d) => `<div class="colh ${d.today ? 'today' : ''}">${d.dn}<b>${d.dd}</b></div>`).join('')}
      <div class="hours">${hours.map((h) => `<span style="top:${(h - 8) * 80}px">${String(h).padStart(2, '0')}:00</span>`).join('')}</div>
      ${WEEK.map((d) => `<div class="tcol ${d.today ? 'today' : ''}">
        ${d.items.filter((x) => x.t >= '08:00').map((it) => {
          const h = (dur[it.t] || 50) * (80 / 60);
          if (it.ev) return `<div class="tblock ev" style="top:${toY(it.t)}px;height:${h}px"><div class="t1">${it.t}</div><div class="t2">${it.ev}</div></div>`;
          if (h < 30) return `<div class="tblock short" style="${acc(it.k)}top:${toY(it.t)}px;height:${h - 2}px"><div class="t2">${it.t} ${it.title}</div></div>`;
          return `<div class="tblock" style="${acc(it.k)}top:${toY(it.t)}px;height:${h - 4}px"><div class="t1">${it.t} · ${C[it.k].n}</div><div class="t2">${it.empty ? 'No lesson yet' : it.title}</div></div>`;
        }).join('')}
        ${d.today ? `<div class="nowline" style="top:${toY('10:20')}px"></div>` : ''}
      </div>`).join('')}
    </div>`,
  );
};

S.day = () => page(
  header({ crumb: 'Planner · Day', title: 'Monday 12 October', view: 'Day', date: 'Monday, 12 October 2026', sub: '<span class="chip">Today</span><span>4 sessions · 3 lessons · 1 school event</span>', showFilters: false, searchPh: 'Search today…' }) +
  `<div class="with-panel">
    <div class="dayline">
      ${WEEK[0].items.map((it) => `<div class="slot"><div class="tm">${it.t}</div>${card(it, { sel: it.t === '09:00' })}</div>`).join('')}
      <div class="slot"><div class="tm"></div><div class="add-slot">${ic.plus}Add a lesson or event</div></div>
      <div class="slot"><div class="tm">Notes</div><div class="note-box">Collect Young Voices permission slips from 6M. Ukulele tuners need batteries.</div></div>
    </div>
    ${lessonPanel()}
  </div>`,
);

function lessonPanel() {
  return `<aside class="sheet">
    <div style="display:flex;justify-content:space-between"><span class="k">Lesson details</span><button class="icon-btn" style="width:30px;height:30px" aria-label="Close">${ic.x.replace('<svg', '<svg width="16" height="16"')}</button></div>
    <h2>Young Voices — Lesson 5</h2>
    <div class="meta">Year 6 Music · Monday 09:00 – 09:55 · Hall</div>
    <div class="pill-row"><span class="tagp">Unit: Young Voices · 5 of 8</span><span class="tagp">Ready to teach</span><span class="tagp">Also taught to 6M</span></div>
    <section><h4>Learning focus <a>Edit objectives</a></h4>
      <div class="obj"><span class="code">MU6.1</span>Perform songs from memory with accurate pitch, rhythm and clear diction.</div>
      <div class="obj"><span class="code">MU6.3</span>Maintain a part while listening and responding to the conductor.</div>
    </section>
    <section><h4>Resources <a>+ Attach</a></h4>
      <div class="res">${ic.pdf}Young Voices 2027 vocal score<span class="ft">PDF</span></div>
      <div class="res">${ic.music}Backing track — medley<span class="lock">Partner licence</span><span class="ft">AUDIO</span></div>
    </section>
    <section><h4>Note for this class</h4>
      <div class="note-box ph">Add a quick reminder for 6D only…</div>
    </section>
    <section><h4>After the lesson</h4>
      <div class="note-box ph">How did it go? Record a reflection…</div>
    </section>
    <div class="actions"><button class="btn forest">${ic.edit}Open in Lesson Builder</button><button class="btn">${ic.copy}Reuse / move</button><button class="btn">${ic.more}</button></div>
  </aside>`;
}

S.month = () => {
  const cells = [];
  const mk = (d, items = [], extra = {}) => ({ d, items, ...extra });
  const W = WEEK.map((x) => x.items.filter((i) => !i.ev && !i.empty));
  cells.push(mk(28, [], { out: true }), mk(29, [], { out: true }), mk(30, [], { out: true }), mk(1, W[3].slice(0, 2)), mk(2, W[4].slice(0, 3)));
  cells.push(mk(5, W[0].slice(0, 3)), mk(6, W[1]), mk(7, W[2].slice(0, 3)), mk(8, W[3].slice(0, 2)), mk(9, W[4]));
  cells.push(mk(12, W[0], { today: true }), mk(13, W[1]), mk(14, W[2]), mk(15, W[3]), mk(16, W[4]));
  cells.push(mk(19, W[0].slice(0, 2)), mk(20, W[1].slice(0, 3)), mk(21, W[2].slice(0, 2)), mk(22, W[3]), mk(23, [], { hol: 'INSET day' }));
  cells.push(mk(26, [], { hol: 'Half term' }), mk(27, [], { hol: 'Half term' }), mk(28, [], { hol: 'Half term' }), mk(29, [], { hol: 'Half term' }), mk(30, [], { hol: 'Half term' }));
  return page(
    header({ crumb: 'Planner · Month', title: 'October 2026', view: 'Month', date: 'October 2026', sub: '<span>Autumn 1 ends Fri 23 Oct · Half term 26–30 Oct</span>', searchPh: 'Search October…' }) +
    `<div class="month"><div class="mgrid">
      ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `<div class="mh">${d}</div>`).join('')}
      ${cells.map((c) => `<div class="mcell ${c.out ? 'out' : ''} ${c.today ? 'today' : ''} ${c.hol ? 'hol' : ''}">
        <div class="mn">${c.today ? `<span class="now">${c.d}</span>` : c.d}${c.hol ? `<span class="htag">${c.hol}</span>` : ''}</div>
        ${c.items.slice(0, 3).map((it) => `<div class="mi" style="${acc(it.k)}"><i></i><b>${C[it.k].n.replace('Reception', 'Rec').replace('Year ', 'Y').replace(' Music', 'M').replace(' Drama', 'D')}</b>${it.title}</div>`).join('')}
        ${c.items.length > 3 ? `<div class="mmore">+${c.items.length - 3} more</div>` : ''}
      </div>`).join('')}
    </div>
    <div class="legend"><span><i style="background:var(--forest)"></i>Planned lesson</span><span>${ic.check.replace('<svg', '<svg width="13" height="13"')} Taught</span><span><i style="background:#FFE4E6"></i>Holiday / INSET</span><span><i style="background:#E5E7EB"></i>School event</span><span>Class colours from <b style="color:var(--forest)">Organise classes</b></span></div>
    </div>`,
  );
};

S.term = () => {
  const P = [['Autumn 1', 'Sep – Oct', '3 Sep – 23 Oct', 22], ['Autumn 2', 'Nov – Dec', '2 Nov – 18 Dec', 9], ['Spring 1', 'Jan – Feb', '5 Jan – 12 Feb', 0], ['Spring 2', 'Feb – Mar', '22 Feb – 26 Mar', 0], ['Summer 1', 'Apr – May', '12 Apr – 21 May', 0], ['Summer 2', 'Jun – Jul', '1 Jun – 21 Jul', 0]];
  const U = [
    ['y3m', 'First Steps on Ukulele', 'Year 3 Music · 6 lessons', [4, 0, 2], 'Autumn 2'],
    ['y6m', 'Young Voices', 'Year 6 Music · 8 lessons', [2, 4, 2], 'Autumn 1 → Spring 1', true],
    ['y2d', 'Funnybones', 'Year 2 Drama · 4 lessons', [0, 4, 0], 'Autumn 2'],
    ['recA', 'Sound Explorers', 'Reception A + B · 6 lessons', [1, 3, 2], 'Autumn 2'],
  ];
  return page(
    `<div class="head"><div class="head-top"><div><div class="crumb">Planner · Term</div><h1>Half-Term Designer</h1>
      <div class="sub">Academic Year 2026–2027 <span class="chip">Current year</span><span>Six half-terms · dates from school calendar</span></div></div>
      <div style="display:flex;gap:10px;align-items:center">${seg('Term')}<button class="btn lime">${ic.copy}Reuse planning</button></div></div>
      <div class="toolrow"><button class="nav-btn">${ic.chevL.replace('<svg', '<svg width="16" height="16"')}</button><button class="nav-btn">${ic.chevR.replace('<svg', '<svg width="16" height="16"')}</button><span class="date-label">2026–2027</span><div class="search">${ic.search}Search units and lessons…</div><button class="btn">${ic.gear}Academic calendar</button></div>
    </div>
    <div class="term-wrap">
      <div class="periods">${P.map(([n, m, d, l], i) => `<div class="ht ${i === 1 ? 'on' : ''}"><div class="top"><div class="nm">${n}</div><div class="mo">${m}</div><div class="dates">${d}</div></div><div class="band ${l ? 'full' : 'empty'}">${l ? `<span>${l} lessons</span><span>${i === 0 ? 'Complete' : '3 units'}</span>` : `<span>${ic.plus.replace('<svg', '<svg width="13" height="13"')} Add lessons</span>`}</div></div>`).join('')}</div>
      <div class="units-list">
        <div class="lh"><div><h3>Autumn 2 · Teaching units</h3><p>2 Nov – 18 Dec · 7 teaching weeks · lessons stay in their unit until you choose dates</p></div><div style="display:flex;gap:8px"><button class="btn">${ic.plus}Add from Lesson Library</button><button class="btn forest">${ic.plus}New unit</button></div></div>
        ${U.map(([k, n, s, [taught, sched, uns], span, spans]) => {
          const tot = taught + sched + uns;
          return `<div class="urow" style="${acc(k)}"><div class="uicon">${ic.layers}</div>
          <div><div class="un">${n}${spans ? '<span class="span-tag">Spans half-terms</span>' : ''}</div><div class="us">${s}</div></div>
          <div class="us">${span}</div>
          <div class="prog"><div class="bar"><i class="t" style="width:${(taught / tot) * 100}%"></i><i class="s" style="width:${(sched / tot) * 100}%"></i></div><span>${taught} taught · ${sched} scheduled · <b style="color:#8A5300">${uns} unscheduled</b></span></div>
          <button class="btn">Open unit ${ic.chevR.replace('<svg', '<svg width="14" height="14"')}</button></div>`;
        }).join('')}
      </div>
    </div>`,
  );
};

S.units = () => {
  const L = [
    ['C and Am: first chords', 'Taught · Tue 3 Nov', 'done', ['MU3.2', 'MU3.4']],
    ['Strumming in time', 'Taught · Tue 10 Nov', 'done', ['MU3.1']],
    ['Changing between C and Am', 'Tue 17 Nov · 14:15', 'sched', ['MU3.2']],
    ['Adding F', 'Tue 24 Nov · 14:15', 'sched', ['MU3.2', 'MU3.5']],
    ['Play-along: Three Little Birds', 'Not scheduled', 'un', ['MU3.3']],
    ['Class performance', 'Not scheduled', 'un', ['MU3.3', 'MU3.6']],
  ];
  return page(
    header({ crumb: 'Planner · Units · Year 3 Music', title: 'First Steps on Ukulele', view: 'Units', date: 'Autumn 2 · 2026–27', sub: '<span class="tagp">6 lessons</span><span>Reusable unit · built in Lesson Library · scheduled to Year 3 Music (Tuesdays)</span>', showFilters: false, searchPh: 'Search lessons in this unit…' }) +
    `<div class="unit-layout">
      <div class="seq">
        <div class="seq-h"><div><b style="color:var(--forest);font-size:15px">Lesson sequence</b><div class="sub">Drag to reorder the sequence — dates do not move unless you choose “Re-flow dates”.</div></div><div style="display:flex;gap:8px"><button class="btn">${ic.plus}Add lesson</button><button class="btn lime">${ic.cal}Schedule remaining</button></div></div>
        ${L.map(([t, w, s, codes], i) => `<div class="seq-row">${ic.grip.replace('<svg', '<svg class="grip" width="18" height="18"')}<div class="num">${i + 1}</div>
          <div><div class="lt">${t}</div><div class="ls">Lesson ${i + 1} of 6 · 45 min · ${i < 2 ? 'Reflection recorded' : '3 activities'}</div></div>
          <div class="covers">${codes.map((c) => `<span>${c}</span>`).join('')}</div>
          <div class="when ${s === 'un' ? 'un' : ''}">${s === 'done' ? ic.check : s === 'sched' ? ic.cal : ic.alert}${w}</div>
        </div>`).join('')}
      </div>
      <aside class="sheet">
        <span class="k">Schedule remaining lessons</span>
        <h2 style="font-size:20px">2 lessons to place</h2>
        <div class="meta">Uses Year 3 Music’s regular slot. Skips holidays and INSET days.</div>
        <section><div class="field">Class<div class="input">Year 3 Music ${ic.chevD.replace('<svg', '<svg width="15" height="15"')}</div></div>
          <div class="grid2" style="margin-top:10px"><div class="field">Starting<div class="input">Tue 1 Dec</div></div><div class="field">Slot<div class="input">Tue 14:15</div></div></div></section>
        <section><h4>Preview</h4>
          <div class="preview"><ul>
            <li class="ok">${ic.check}<span><b>L5 Play-along</b> → Tue 1 Dec, 14:15</span></li>
            <li class="ok">${ic.check}<span><b>L6 Class performance</b> → Tue 8 Dec, 14:15</span></li>
            <li class="warn">${ic.alert}<span>Tue 15 Dec is the Christmas concert — skipped</span></li>
          </ul></div></section>
        <div class="actions"><button class="btn quiet">Cancel</button><button class="btn forest" style="margin-left:auto">Schedule 2 lessons</button></div>
        <section><h4>Unit coverage</h4><div class="covers"><span>MU3.1</span><span>MU3.2 ×3</span><span>MU3.3 ×2</span><span>MU3.4</span><span>MU3.5</span><span>MU3.6</span></div><div class="meta" style="margin-top:8px">No gaps for Year 3 performing strand. MU3.2 repeated 3× — intended progression.</div></section>
      </aside>
    </div>`,
    { sideOpts: { on: 'y3m' } },
  );
};

S.classes = () => {
  const row = (k, meta, extra = '') => `<div class="crow ${extra}">${ic.grip.replace('<svg', '<svg class="grip" width="18" height="18"')}<span class="dot" style="width:12px;height:12px;border-radius:50%;background:var(--c-${C[k].c})"></span><div><b style="font-size:14px">${C[k].n}</b></div><div class="meta">Curriculum: ${C[k].yg}</div><div class="meta">${meta}</div><span>${ic.eye.replace('<svg', '<svg width="17" height="17" style="color:#6B7280"')}</span></div>`;
  return page(
    `<div class="head"><div class="head-top"><div><div class="crumb">Planner · Settings</div><h1>Organise classes</h1><div class="sub">Folders are only for your view. A class’s curriculum year group, objectives and lessons never change when you move it.</div></div>
      <div style="display:flex;gap:8px"><button class="btn">${ic.folder}New folder</button><button class="btn lime">${ic.plus}New class</button></div></div>
      <div class="toolrow"><div class="search" style="margin-left:0">${ic.search}Find a class…</div><span class="fchip on">2026–27 classes</span><span class="fchip">${ic.archive.replace('<svg', '<svg width="13" height="13"')} Archived (2025–26)</span></div></div>
    <div class="mgmt">
      <div>
        <div class="fold-card"><div class="fh">${ic.chevD.replace('<svg', '<svg width="16" height="16"')}EYFS <span class="count">3 classes</span><div class="tools"><button class="icon-btn">${ic.edit.replace('<svg', '<svg width="16" height="16"')}</button><button class="icon-btn">${ic.more.replace('<svg', '<svg width="16" height="16"')}</button></div></div>
          ${row('nursery', '2 sessions / week')}${row('recA', '1 session / week')}${row('recB', '1 session / week')}</div>
        <div class="fold-card"><div class="fh">${ic.chevD.replace('<svg', '<svg width="16" height="16"')}KS2 Music <span class="count">3 classes</span><div class="tools"><button class="icon-btn">${ic.edit.replace('<svg', '<svg width="16" height="16"')}</button><button class="icon-btn">${ic.more.replace('<svg', '<svg width="16" height="16"')}</button></div></div>
          ${row('y3m', '2 sessions / week')}${row('y6m', '2 sessions / week', 'dragging')}${row('y4m', '2 sessions / week')}
          <div class="drop-hint">Drop to place Year 6 Music after Year 4 Music</div></div>
        <div class="fold-card"><div class="fh">${ic.chevR.replace('<svg', '<svg width="16" height="16"')}KS1 <span class="count">3 classes · collapsed</span></div></div>
        <div class="fold-card"><div class="fh">${ic.chevD.replace('<svg', '<svg width="16" height="16"')}Ensembles <span class="count">2 groups</span></div>${row('choir', 'Wed + Fri')}${row('orch', 'Tue')}</div>
      </div>
      <aside class="sheet">
        <span class="k">Class</span><h2 style="font-size:22px">Year 6 Music</h2>
        <div class="meta">Folder: KS2 Music · Curriculum year group: <b>Year 6</b> (from Settings → Year groups)</div>
        <section><h4>Colour</h4>
          <div class="swatches">${['rose', 'amber', 'gold', 'violet', 'blue', 'green', 'teal', 'indigo', 'slate'].map((c) => `<span class="sw ${c === 'indigo' ? 'on' : ''}" style="background:var(--c-${c})"></span>`).join('')}<span class="sw" style="background:conic-gradient(#f43f5e,#f59e0b,#22c55e,#3b82f6,#a855f7,#f43f5e)" title="Custom colour"></span></div>
          <div class="contrast">${ic.check.replace('<svg', '<svg width="14" height="14"')} Text contrast 7.1 : 1 — passes AA</div>
          <div class="preview-card">${card({ t: '09:00', k: 'y6m', title: 'Young Voices', unit: 'Young Voices · Lesson 5', res: 2 })}</div>
        </section>
        <section><h4>Move to folder</h4><div class="input">KS2 Music ${ic.chevD.replace('<svg', '<svg width="15" height="15"')}</div></section>
        <section><h4>Visibility</h4><div class="cb on"><i></i>Show in Planner</div><div class="cb" style="margin-top:6px"><i></i>Archive at end of 2026–27</div></section>
        <div class="actions"><button class="btn quiet">Reset colour</button><button class="btn forest" style="margin-left:auto">Done</button></div>
      </aside>
    </div>`,
    { side: false },
  );
};

S.copy = () => page(
  header({ crumb: 'Planner · Week', title: 'This week', view: 'Week', date: '12 – 16 October 2026', sub: '<span class="chip">Current week</span>', showFilters: false }) +
  `<div class="with-panel">
    <div class="week dim" style="padding:0;grid-template-columns:repeat(3,1fr)">${WEEK.slice(0, 3).map((d) => `<section class="day-col"><div class="day-h"><span class="dn">${d.dn}</span><span class="dd">${d.dd}</span></div>${d.items.map((it) => card(it)).join('')}</section>`).join('')}</div>
    <aside class="sheet">
      <div style="display:flex;justify-content:space-between"><span class="k">Reuse or move</span>${ic.x.replace('<svg', '<svg width="18" height="18" style="color:#6B7280"')}</div>
      <h2>Loud and quiet sounds</h2>
      <div class="meta">Reception A · Tue 13 Oct, 09:30 · Sound Explorers, lesson 2</div>
      <section><h4>What would you like to do?</h4>
        <div class="choice on"><div class="ci">${ic.link}</div><div><b>Teach to another class</b><small>Same lesson, new session. Edits stay in sync.</small></div><span class="radio"></span></div>
        <div class="choice"><div class="ci">${ic.move}</div><div><b>Move this session</b><small>Change date or time. Unit and notes go with it.</small></div><span class="radio"></span></div>
        <div class="choice"><div class="ci">${ic.copy}</div><div><b>Make an independent copy</b><small>A separate lesson you can change freely.</small></div><span class="radio"></span></div>
      </section>
      <section><div class="grid2"><div class="field">Class<div class="input">Reception B ${ic.chevD.replace('<svg', '<svg width="15" height="15"')}</div></div><div class="field">When<div class="input">Wed 14 Oct · 09:00</div></div></div></section>
      <section><h4>What will happen</h4><div class="preview"><ul>
        <li class="ok">${ic.check}<span>New session for <b>Reception B</b>, Wed 14 Oct 09:00 (their timetabled slot)</span></li>
        <li class="ok">${ic.check}<span>Lesson content, unit link, objectives and 3 resources are shared — nothing duplicated</span></li>
        <li class="ok">${ic.check}<span>Reception A’s reflection and class notes stay private to Reception A</span></li>
        <li class="warn">${ic.alert}<span>1 partner-licensed track: available because Reception B is in your licensed school</span></li>
      </ul></div></section>
      <div class="actions"><button class="btn quiet">Cancel</button><button class="btn forest" style="margin-left:auto">Add session</button></div>
      <div class="meta" style="margin-top:10px">You can undo for 30 seconds after confirming.</div>
    </aside>
  </div>`,
);

S.timetable = () => {
  const toY = (t) => { const [h, m] = t.split(':').map(Number); return ((h - 8) * 60 + m) * (64 / 60); };
  const D = [
    [['08:00', 30, 'orch', 'Orchestra'], ['09:00', 55, 'y6m', 'Year 6D Music'], ['09:55', 55, 'y6m', 'Year 6M Music'], ['13:30', 45, 'y3m', 'Year 3 Music']],
    [['09:30', 45, 'recA', 'Reception A'], ['11:10', 45, 'y2m', 'Year 2 Music'], ['14:15', 45, 'y3m', 'Year 3 Music']],
    [['08:45', 15, 'choir', 'Singing practice'], ['09:00', 45, 'recB', 'Reception B'], ['11:10', 45, 'y1d', 'Year 1 Drama'], ['13:30', 45, 'y4m', 'Year 4 Music', true]],
    [['09:10', 35, 'y1d', 'Year 1C Drama'], ['11:00', 45, 'y4m', 'Year 4C Music'], ['14:15', 45, 'y2d', 'Year 2 Drama']],
    [['08:00', 35, 'choir', 'Choir'], ['09:00', 60, 'nursery', 'Nursery'], ['10:05', 45, 'y2m', 'Year 2 Music']],
  ];
  const brk = [['10:30', 15, 'Break'], ['12:15', 60, 'Lunch']];
  return page(
    `<div class="head"><div class="head-top"><div><div class="crumb">Planner · Timetable</div><h1>Your teaching timetable</h1><div class="sub">Regular sessions repeat automatically. Lessons are added to sessions — the timetable never stores lesson content.</div></div>
      <div style="display:flex;gap:8px"><button class="btn">${ic.copy}Copy from Summer 2026</button><button class="btn lime">${ic.plus}Add session</button></div></div>
      <div class="toolrow"><span class="fchip on">Autumn 1 2026 · from 3 Sep</span><span class="fchip">Autumn 2 · from 2 Nov</span><span class="fchip">+ New timetable period</span>
      <span style="margin-left:auto" class="rot"><span class="on">Weekly</span><span>Day 1–5 rotation</span><span>2-week</span></span></div></div>
    <div class="tt-layout">
      <div class="tgrid" style="padding:0">
        <div></div>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `<div class="colh">${d}</div>`).join('')}
        <div class="hours" style="height:512px">${[8, 9, 10, 11, 12, 13, 14, 15].map((h) => `<span style="top:${(h - 8) * 64}px">${String(h).padStart(2, '0')}:00</span>`).join('')}</div>
        ${D.map((col) => `<div class="tcol" style="height:512px;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 63px,var(--line) 63px,var(--line) 64px)">
          ${brk.map(([t, m, n]) => `<div class="tblock ev" style="top:${toY(t)}px;height:${m * 64 / 60 - 2}px"><div class="t1">${n}</div></div>`).join('')}
          ${col.map(([t, m, k, n, sel]) => `<div class="tblock ${sel ? 'sel' : ''}" style="${acc(k)}top:${toY(t)}px;height:${m * 64 / 60 - 3}px"><div class="t1">${t}</div><div class="t2">${n}</div>${sel ? '<span class="handle"></span>' : ''}</div>`).join('')}
        </div>`).join('')}
      </div>
      <aside class="sheet">
        <span class="k">Edit session</span><h2 style="font-size:21px">Year 4 Music</h2><div class="meta">Every Wednesday · 13:30 – 14:15 · Music room</div>
        <section><div class="grid2"><div class="field">Day<div class="input">Wednesday</div></div><div class="field">Time<div class="input">13:30 – 14:15</div></div></div>
          <div class="field" style="margin-top:10px">Type<div class="input">Class lesson ${ic.chevD.replace('<svg', '<svg width="15" height="15"')}</div></div></section>
        <section><h4>Apply this change to</h4><div class="scope">
          <div class="choice on" style="margin:0"><div class="ci">${ic.repeat}</div><div><b>All future Wednesdays</b><small>From 21 Oct. Past sessions unchanged.</small></div><span class="radio"></span></div>
          <div class="choice" style="margin:0"><div class="ci">${ic.cal}</div><div><b>Only Wed 14 Oct</b><small>A one-off change for this week.</small></div><span class="radio"></span></div>
        </div></section>
        <section><div class="preview"><ul><li class="ok">${ic.check}<span>Moves 9 future sessions</span></li><li class="warn">${ic.alert}<span>3 already have lessons — they move with their session</span></li><li class="ok">${ic.check}<span>Taught sessions and reflections are not touched</span></li></ul></div></section>
        <div class="actions"><button class="btn quiet">Cancel</button><button class="btn forest" style="margin-left:auto">Save change</button></div>
      </aside>
    </div>`,
    { side: false },
  );
};

S.feedback = () => page(
  header({ crumb: 'Planner · Reflection', title: 'How did it go?', view: 'Day', date: 'Monday, 12 October 2026', sub: '<span class="tagp">Year 3 Music</span><span>Ukulele chords: C and Am · 13:30 · First Steps on Ukulele, L3</span>', showFilters: false, searchPh: 'Search reflections…' }) +
  `<div class="fb-layout">
    <section class="sheet" style="box-shadow:none">
      <span class="k">My teaching reflection</span>
      <div class="quick" style="margin:10px 0 14px"><span>Lesson outcome:</span><span>Below plan</span><span class="on">As planned</span><span>Exceeded</span></div>
      <div class="prompt"><label>What worked well?</label><div class="note-box">Most children moved between C and Am without stopping by the end of the lesson.</div></div>
      <div class="prompt"><label>What needs revisiting?</label><div class="note-box">Six children still flatten the 3rd finger on Am — left-hand position.</div></div>
      <div class="prompt"><label>Note for next lesson</label><div class="note-box">Start with a 3-minute finger-placement warm-up before introducing F.</div>
        <div class="quick"><span class="on">${ic.check.replace('<svg', '<svg width="12" height="12"')} Show at top of Lesson 4 for Year 3</span><span>Also suggest edit to the shared lesson</span></div></div>
      <div class="vis">${ic.lock}Private to you. Linked to Year 3 Music on 12 Oct — not to the shared lesson.</div>
      <div class="actions"><button class="btn quiet">Later</button><button class="btn forest" style="margin-left:auto">Save reflection</button></div>
    </section>
    <div>
      <section class="sheet" style="box-shadow:none;margin-bottom:16px">
        <span class="k">Professional feedback</span>
        <div class="meta" style="margin:6px 0 12px">Only people you invite (mentor, subject lead) can see and comment.</div>
        <div class="comment"><div class="who"><div class="avatar">JS</div>Jo Singh <small>· Music lead · 12 Oct</small></div><p>Lovely pacing on the chord changes. Try counting in out loud before each change — it really helped the strugglers in 3F.</p></div>
        <div class="note-box ph">Reply…</div>
      </section>
      <section class="sheet" style="box-shadow:none">
        <span class="k">Earlier reflections in this unit</span>
        <div class="history" style="margin-top:8px">
          <div class="h"><span>Tue 6 Oct · L2</span>Strumming in time — good. Down-strums only next time.</div>
          <div class="h"><span>Tue 29 Sep · L1</span>Tuning took 10 min. Pre-tune ukuleles before class.</div>
        </div>
      </section>
    </div>
  </div>`,
  { sideOpts: { on: 'y3m' } },
);

S.export = () => {
  const P = WEEK.map((d) => ({ dn: `${d.dn} ${d.dd}`, it: d.items.filter((x) => !x.ev && !x.empty && ['y3m', 'y4m', 'y6m', 'choir', 'orch'].includes(x.k)) }));
  return page(
    header({ crumb: 'Planner · Share & print', title: 'Share & print this week', view: 'Week', date: '12 – 16 October 2026', sub: '<span>Uses the existing CCDesigner PDF engine</span>', showFilters: false }) +
    `<div class="exp-layout">
      <aside class="sheet" style="box-shadow:none">
        <span class="k">What to export</span>
        <div style="margin-top:10px">
          <div class="opt on"><div><b>Weekly overview</b><small>One landscape page: timetable, lessons, key objectives</small></div><span class="radio"></span></div>
          <div class="opt"><div><b>Complete lesson plans</b><small>Every selected lesson in the standard lesson-plan format, page-numbered</small></div><span class="radio"></span></div>
        </div>
        <section><h4>Classes <a>Select all</a></h4><div class="checks">
          <span class="cb"><i></i>EYFS (3)</span><span class="cb"><i></i>KS1 (3)</span><span class="cb on"><i></i>KS2 Music (3)</span><span class="cb on"><i></i>Ensembles (2)</span></div></section>
        <section><h4>Days</h4><div class="checks"><span class="cb on"><i></i>Mon – Fri</span><span class="cb"><i></i>Include school events</span></div></section>
        <section><h4>Privacy</h4><div class="cb on"><i></i>Exclude private reflections</div><div class="cb on" style="margin-top:6px"><i></i>List partner-licensed resources by name only</div></section>
        <div class="actions"><button class="btn">${ic.share}Share link</button><button class="btn forest" style="margin-left:auto">${ic.print}Create PDF</button></div>
        <div class="share-row">${ic.user.replace('<svg', '<svg width="16" height="16"')}<span>Share read-only with <b>Jo Singh</b> (Music lead)</span><span style="margin-left:auto;font-weight:600;color:var(--teal-deep)">View only</span></div>
      </aside>
      <div>
        <div class="paper">
          <div class="ph"><div><h3>Week of 12 October 2026</h3><small>Rob Reichstorer · KS2 Music + Ensembles · Autumn 1, week 6</small></div><div class="logo" style="width:34px;height:34px;font-size:11px">CCD</div></div>
          <div class="pgrid">${P.map((d) => `<div><div class="pd">${d.dn}</div>${d.it.map((it) => `<div class="pl" style="${acc(it.k)}"><div class="a">${it.t} · ${C[it.k].n}</div><div class="b">${it.title}</div><div class="c">${it.unit}</div></div>`).join('')}</div>`).join('')}</div>
          <div class="pf"><span>Key objectives: MU6.1 perform from memory · MU3.2 chord changes · MU4.1 steady pulse</span><span>Page 1 of 1</span></div>
        </div>
        <p class="meta" style="text-align:center;margin-top:10px">Preview of the Weekly overview PDF (A4 landscape).</p>
      </div>
    </div>`,
  );
};

S.mobile = () => {
  const today = WEEK[0].items;
  return `<div class="deck" style="padding-bottom:0"><div class="crumb">Responsive · 390 px</div><h1 style="font-size:30px">Planner on a phone</h1><p class="lead">Day is the default on narrow screens. The week strip replaces the grid; lesson details and reflections open as a bottom sheet. Class folders move into a filter sheet.</p></div>
  <div class="phones">
    <div class="phone"><div class="screen">
      <div class="m-top"><div class="logo">CCD</div><b>Planner</b><span style="margin-left:auto">${ic.search.replace('<svg', '<svg width="20" height="20" style="color:#4B5563"')}</span></div>
      <div class="m-days">${WEEK.map((d) => `<span class="${d.today ? 'on' : ''}">${d.dn}<b>${d.dd}</b></span>`).join('')}</div>
      <div class="m-list">${today.map((it) => card(it)).join('')}<div class="add-slot">${ic.plus}Add lesson</div></div>
      <div class="m-tabbar">${[['Day', ic.cal, 1], ['Week', ic.layers], ['Units', ic.book], ['Classes', ic.folder], ['More', ic.more]].map(([n, i, on]) => `<span class="${on ? 'on' : ''}">${i}${n}</span>`).join('')}</div>
    </div></div>
    <div class="phone"><div class="screen" style="background:#DDE5DF">
      <div class="m-top"><div class="logo">CCD</div><b>Planner</b></div>
      <div class="m-list" style="opacity:.45">${today.slice(1, 3).map((it) => card(it)).join('')}</div>
      <div class="m-sheet"><div class="grab"></div>
        <span class="k" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#4B5563">Year 3 Music · 13:30</span>
        <h2 style="font-family:var(--serif);color:var(--forest);font-size:22px;margin:4px 0">Ukulele chords: C and Am</h2>
        <div class="meta" style="font-size:13px;color:#4B5563">First Steps on Ukulele · Lesson 3</div>
        <div class="prompt" style="margin-top:14px"><label style="font-size:13px;font-weight:600">What worked well?</label><div class="note-box">Most children changed C → Am cleanly.</div></div>
        <div class="prompt"><label style="font-size:13px;font-weight:600">Next time</label><div class="note-box ph">Add a note for Lesson 4…</div></div>
        <button class="btn forest" style="width:100%;justify-content:center;height:46px">Save reflection</button>
      </div>
    </div></div>
  </div>`;
};

S.index = () => `<div class="deck">
  <div class="crumb">CCDesigner · Planner redesign · design-only prototype</div>
  <h1>Planner — visual proposal</h1>
  <p class="lead">Static mock-ups with illustrative data, built from CCDesigner’s own tokens (Inter, Playfair Display, forest #002D24, lime #B6FF7E, sage #F3F6F3, 24 px cards). Not connected to the application.</p>
  <div class="deck-grid">${[
    ['week', '1 · Week (recommended, A)', 'Agenda columns, compact cards'],
    ['week-b', '1b · Week (variant B)', 'Time-aligned grid'],
    ['day', '2 · Day + lesson details', 'Timeline with side panel'],
    ['month', '3 · Month', 'Scannable overview'],
    ['term', '4 · Term', 'Half-Term Designer evolved'],
    ['units', '5 · Unit planning', 'Sequence vs dates'],
    ['classes', '6 · Organise classes', 'Folders, order, colours'],
    ['copy', '7 · Reuse / move', 'One deliberate action'],
    ['timetable', '8 · Timetable', 'Sessions, not lessons'],
    ['feedback', '9 · Reflection', 'Private + professional'],
    ['export', '10 · Share & print', 'Weekly PDF overview'],
    ['mobile', '11 · Phone', 'Responsive layout'],
  ].map(([h, t, s]) => `<a href="#${h}"><b>${t}</b><span>${s}</span></a>`).join('')}
    <a href="devices.html"><b>12 · Tablet &amp; phone preview</b><span>Every screen at iPad landscape, iPad portrait and iPhone sizes</span></a></div></div>`;

function render() {
  const key = (location.hash || '#index').slice(1);
  document.body.classList.remove('drawer-open');
  document.getElementById('app').innerHTML = (S[key] || S.index)();
  document.title = `CCDesigner Planner · ${key}`;
}
window.addEventListener('hashchange', render);
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-drawer]')) document.body.classList.toggle('drawer-open');
});
render();
