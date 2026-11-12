const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Theme ------------------------------------------------------------------ */

const themeToggle = $('#theme-toggle');
const themeIcon = $('#theme-icon use');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const next = theme === 'dark' ? 'light' : 'dark';
  themeToggle.setAttribute('aria-label', `Switch to ${next} theme`);
  themeIcon.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#060a12' : '#f7f9fd');
}

const savedTheme = (() => {
  try {
    return localStorage.getItem('skillforge-theme');
  } catch {
    return null;
  }
})();
applyTheme(savedTheme === 'light' ? 'light' : 'dark');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem('skillforge-theme', next);
  } catch {
    /* Storage is optional. */
  }
});

/* Navigation ------------------------------------------------------------- */

const mobileToggle = $('#mobile-toggle');
const navLinks = $('#nav-links');

mobileToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  mobileToggle.setAttribute('aria-expanded', String(open));
  mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navLinks.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  }
});

/* Reveal ----------------------------------------------------------------- */

if (reduceMotion || !('IntersectionObserver' in window)) {
  $$('.reveal').forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  $$('.reveal').forEach((element) => observer.observe(element));
}

/* Skill builder ---------------------------------------------------------- */

const builderForm = $('#builder-form');
const builderOutput = $('#builder-output');
const builderCopy = $('#builder-copy');
const builderDownload = $('#builder-download');

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function titleize(value) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function yamlString(value) {
  return JSON.stringify(String(value).replace(/\s+/g, ' ').trim());
}

function listLines(value, numbered) {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const clean = line.replace(/^\d+[.)]\s*/, '').replace(/^[-*]\s*/, '');
      return numbered ? `${index + 1}. ${clean}` : `- ${clean}`;
    })
    .join('\n');
}

function buildSkill(data) {
  const id = slugify(data.name) || 'my-skill';
  const lines = ['---', `name: ${id}`];

  if (data.mode === 'manual') {
    lines.push('# Manual-only: description omitted so opencode 1.x does not advertise this skill.');
  } else if (data.mode === 'manual-v2') {
    lines.push(`description: ${yamlString(data.description)}`);
    lines.push('metadata:', '  opencode/autoinvoke: false');
  } else {
    lines.push(`description: ${yamlString(data.description)}`);
  }

  lines.push('---', '');
  lines.push(`# ${titleize(id)}`, '');
  lines.push('## When to use', '', data.when.trim() || 'Describe the trigger in one or two sentences.', '');
  lines.push('## Workflow', '');
  lines.push(listLines(data.steps, true) || '1. Describe the first concrete step.');
  lines.push('', '## Guardrails', '');
  lines.push(listLines(data.guardrails, false) || '- Do not invent facts.');
  lines.push('', '## Verification', '');
  lines.push('Confirm the requested output exists, the guardrails were respected, and no file outside the requested scope changed.', '');
  return { id, markdown: lines.join('\n') };
}

function currentBrief() {
  const form = new FormData(builderForm);
  return {
    name: form.get('name') || '',
    description: form.get('description') || '',
    when: form.get('when') || '',
    steps: form.get('steps') || '',
    guardrails: form.get('guardrails') || '',
    mode: form.get('mode') || 'manual',
  };
}

function renderBuilder() {
  const brief = currentBrief();
  const { markdown } = buildSkill(brief);
  builderOutput.textContent = markdown;
}

builderForm.addEventListener('input', renderBuilder);
builderForm.addEventListener('change', renderBuilder);
renderBuilder();

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

builderCopy.addEventListener('click', async () => {
  try {
    await copyText(builderOutput.textContent);
    builderCopy.textContent = 'Copied';
    setTimeout(() => {
      builderCopy.innerHTML = '<svg width="14" height="14" aria-hidden="true"><use href="#i-copy"></use></svg> Copy';
    }, 1600);
  } catch {
    builderCopy.textContent = 'Select and copy';
  }
});

builderDownload.addEventListener('click', () => {
  const { id, markdown } = buildSkill(currentBrief());
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${id}-SKILL.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

/* Learning path ---------------------------------------------------------- */

const modules = $$('[data-module]');
const progressBar = $('#learn-progress');
const progressFill = progressBar.querySelector('span');
const progressLabel = $('#learn-progress-label');
const learnReset = $('#learn-reset');
const LEARN_KEY = 'skillforge-learn-v1';

function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEARN_KEY) || '{}');
    for (const input of modules) input.checked = Boolean(stored[input.dataset.module]);
  } catch {
    /* Ignore malformed storage. */
  }
}

function updateProgress() {
  const done = modules.filter((input) => input.checked).length;
  const percent = Math.round((done / modules.length) * 100);
  progressFill.style.width = `${percent}%`;
  progressBar.setAttribute('aria-valuenow', String(percent));
  progressLabel.textContent = `${done} / ${modules.length} complete`;
  try {
    localStorage.setItem(
      LEARN_KEY,
      JSON.stringify(Object.fromEntries(modules.map((input) => [input.dataset.module, input.checked]))),
    );
  } catch {
    /* Storage is optional. */
  }
}

loadProgress();
updateProgress();
modules.forEach((input) => input.addEventListener('change', updateProgress));
learnReset.addEventListener('click', () => {
  for (const input of modules) input.checked = false;
  updateProgress();
});

/* Pattern search --------------------------------------------------------- */

const patternSearch = $('#pattern-search');
const patternCards = $$('#pattern-grid .pattern');
const patternStatus = $('#pattern-status');
const patternEmpty = $('#pattern-empty');

function filterPatterns(query) {
  const needle = query.trim().toLowerCase();
  let visible = 0;
  for (const card of patternCards) {
    const haystack = `${card.textContent} ${card.dataset.tags || ''}`.toLowerCase();
    const match = !needle || haystack.includes(needle);
    card.hidden = !match;
    if (match) visible += 1;
  }
  patternStatus.textContent = `${visible} pattern${visible === 1 ? '' : 's'}`;
  patternEmpty.hidden = visible !== 0;
}

patternSearch.addEventListener('input', () => filterPatterns(patternSearch.value));

/* ROI -------------------------------------------------------------------- */

const roiPeople = $('#roi-people');
const roiHours = $('#roi-hours');
const roiCost = $('#roi-cost');
const roiPeopleOut = $('#roi-people-out');
const roiHoursOut = $('#roi-hours-out');
const roiCostOut = $('#roi-cost-out');
const roiMoney = $('#roi-money');
const roiTotalHours = $('#roi-total-hours');
const number = new Intl.NumberFormat('en-US');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function updateRoi() {
  const people = Number(roiPeople.value);
  const hours = Number(roiHours.value);
  const cost = Number(roiCost.value);
  const annualHours = people * hours * 52;
  roiPeopleOut.textContent = number.format(people);
  roiHoursOut.textContent = number.format(hours);
  roiCostOut.textContent = `$${number.format(cost)}`;
  roiTotalHours.textContent = number.format(Math.round(annualHours));
  roiMoney.textContent = money.format(Math.round(annualHours * cost));
}

[roiPeople, roiHours, roiCost].forEach((input) => input.addEventListener('input', updateRoi));
updateRoi();

/* Quiz ------------------------------------------------------------------- */

const quizBody = $('#quiz-body');
const quizCounter = $('#quiz-counter');

const questions = [
  {
    q: 'What is the smallest unit of a skill?',
    options: [
      'A single prompt saved in a chat',
      'A folder containing SKILL.md and any companion files',
      'A JSON file registered with a service',
      'An MCP server with at least one tool',
    ],
    answer: 1,
    why: 'A skill is a folder. Copy the whole folder so relative links keep working.',
  },
  {
    q: 'What does progressive disclosure mean here?',
    options: [
      'The model reads every skill at startup',
      'Only the name and description sit in context until the skill is used',
      'The skill hides its instructions from the user',
      'The installer downloads files one at a time',
    ],
    answer: 1,
    why: 'The body loads on demand. That is why a short, honest description matters.',
  },
  {
    q: 'Where does a global skill live?',
    options: [
      '~/.opencode/skill.md',
      '~/.config/opencode/skills/<id>/SKILL.md',
      '/usr/local/share/opencode.md',
      './skills.md',
    ],
    answer: 1,
    why: 'Global skills live under the opencode config folder. Project skills use .opencode/skills.',
  },
  {
    q: 'On opencode 1.x, what makes a skill manual-only?',
    options: [
      'Deleting the body',
      'Removing the description and adding a command file',
      'Renaming the folder to start with an underscore',
      'Putting it in a hidden folder',
    ],
    answer: 1,
    why: 'On 1.x, only skills with a description are advertised. The command keeps it callable.',
  },
  {
    q: 'What should you do before installing a third-party skill?',
    options: [
      'Run its install script first',
      'Read the instructions and scripts, then validate the folder',
      'Ask the model to trust it',
      'Copy only SKILL.md',
    ],
    answer: 1,
    why: 'A skill can direct an agent with your tools and permissions. Review before you run.',
  },
  {
    q: 'What is a companion file?',
    options: [
      'A file linked from SKILL.md and stored inside the skill folder',
      'A second SKILL.md',
      'A file downloaded at runtime',
      'A database row',
    ],
    answer: 0,
    why: 'Companion files carry references and templates. Relative links must stay inside the folder.',
  },
  {
    q: 'Why restart opencode after installing a skill?',
    options: [
      'To clear the shell history',
      'Because skill state is loaded at startup',
      'To reinstall Node.js',
      'To rotate API keys',
    ],
    answer: 1,
    why: 'If the skill does not appear, the restart is the first thing to check.',
  },
  {
    q: 'When should you use an MCP server instead of a skill?',
    options: [
      'When you need live actions and tools',
      'When you want lower context cost',
      'When the workflow is plain text',
      'Never; skills replace MCP',
    ],
    answer: 0,
    why: 'MCP exposes tools for live systems. Skills carry judgment and workflow. They compose.',
  },
];

let quizSubmitted = false;

function renderQuiz() {
  quizSubmitted = false;
  quizBody.innerHTML = '';
  quizCounter.textContent = `${questions.length} questions`;

  const form = document.createElement('form');
  form.id = 'quiz-form';

  questions.forEach((item, index) => {
    const card = document.createElement('fieldset');
    card.className = 'quiz-card';
    card.style.border = '0';
    card.style.margin = '0';
    card.style.padding = '0';

    const meta = document.createElement('div');
    meta.className = 'quiz-meta';
    meta.innerHTML = `<span>Q${index + 1}</span><span>${index + 1} / ${questions.length}</span>`;

    const legend = document.createElement('legend');
    legend.className = 'quiz-question';
    legend.textContent = item.q;

    const options = document.createElement('div');
    options.className = 'quiz-options';

    item.options.forEach((option, optionIndex) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      label.dataset.index = String(optionIndex);
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${index}`;
      input.value = String(optionIndex);
      input.required = true;
      const span = document.createElement('span');
      span.textContent = option;
      label.append(input, span);
      options.append(label);
    });

    const result = document.createElement('p');
    result.className = 'quiz-result';
    result.dataset.result = String(index);
    result.setAttribute('aria-live', 'polite');

    card.append(meta, legend, options, result);
    form.append(card);
  });

  const actions = document.createElement('div');
  actions.className = 'quiz-actions';

  const submit = document.createElement('button');
  submit.className = 'button primary';
  submit.type = 'submit';
  submit.textContent = 'Check answers';

  const retry = document.createElement('button');
  retry.className = 'button ghost';
  retry.type = 'button';
  retry.textContent = 'Try again';
  retry.hidden = true;
  retry.addEventListener('click', renderQuiz);

  const summary = document.createElement('p');
  summary.className = 'quiz-result';
  summary.id = 'quiz-summary';
  summary.setAttribute('aria-live', 'polite');

  actions.append(submit, retry);
  form.append(actions, summary);
  quizBody.append(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (quizSubmitted) return;

    let score = 0;
    questions.forEach((item, index) => {
      const chosen = form.querySelector(`input[name="q${index}"]:checked`);
      const card = form.querySelectorAll('.quiz-card')[index];
      const labels = card.querySelectorAll('.quiz-option');
      const result = card.querySelector(`[data-result="${index}"]`);

      labels.forEach((label) => {
        const optionIndex = Number(label.dataset.index);
        if (optionIndex === item.answer) label.classList.add('correct');
        if (chosen && Number(chosen.value) === optionIndex && optionIndex !== item.answer) {
          label.classList.add('wrong');
        }
        const input = label.querySelector('input');
        input.disabled = true;
      });

      const correct = chosen && Number(chosen.value) === item.answer;
      if (correct) score += 1;
      result.innerHTML = `<strong>${correct ? 'Correct.' : 'Not quite.'}</strong> ${item.why}`;
    });

    quizSubmitted = true;
    quizCounter.textContent = `Score: ${score} / ${questions.length}`;
    summary.innerHTML = `<strong>${score} / ${questions.length}</strong> ${
      score === questions.length
        ? 'You are ready to review a real skill.'
        : score >= 5
          ? 'Solid. Re-read the explanations for the misses, then try a live install.'
          : 'Good start. Walk the six lessons above, then come back.'
    }`;
    submit.hidden = true;
    retry.hidden = false;
  });
}

renderQuiz();

/* Search palette --------------------------------------------------------- */

const palette = $('#palette');
const paletteInput = $('#palette-input');
const paletteList = $('#palette-list');
const paletteOpen = $('#palette-open');

const paletteItems = [
  { label: 'Why skills', meta: 'Section', target: '#why' },
  { label: 'How it works', meta: 'Section', target: '#how' },
  { label: 'Visual skill builder', meta: 'Tool', target: '#builder' },
  { label: 'Zero to pro learning path', meta: 'Lesson', target: '#learn' },
  { label: 'Pattern library', meta: 'Reference', target: '#patterns' },
  { label: 'Readiness quiz', meta: 'Quiz', target: '#quiz' },
  { label: 'Business value and ROI', meta: 'Section', target: '#business' },
  { label: 'Security checklist', meta: 'Section', target: '#security' },
  { label: 'Prompt dump vs MCP vs skill', meta: 'Comparison', target: '#compare' },
  { label: 'FAQ', meta: 'Section', target: '#faq' },
  { label: 'Review a pull request', meta: 'Pattern', target: '#patterns', query: 'review' },
  { label: 'Write release notes', meta: 'Pattern', target: '#patterns', query: 'release' },
  { label: 'Plan a migration', meta: 'Pattern', target: '#patterns', query: 'migrate' },
  { label: 'Add missing tests', meta: 'Pattern', target: '#patterns', query: 'test' },
  { label: 'Security pass', meta: 'Pattern', target: '#patterns', query: 'security' },
  { label: 'Refresh documentation', meta: 'Pattern', target: '#patterns', query: 'docs' },
  { label: 'Debug an incident', meta: 'Pattern', target: '#patterns', query: 'debug' },
  { label: 'Answer with data', meta: 'Pattern', target: '#patterns', query: 'data' },
  { label: 'Prepare a sales brief', meta: 'Pattern', target: '#patterns', query: 'sales' },
];

function renderPalette(query = '') {
  const needle = query.trim().toLowerCase();
  const matches = paletteItems.filter(
    (item) => !needle || `${item.label} ${item.meta}`.toLowerCase().includes(needle),
  );
  paletteList.innerHTML = '';
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'palette-empty';
    empty.textContent = 'No match. Try “builder”, “security”, or “release”.';
    paletteList.append(empty);
    return;
  }
  for (const item of matches) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'palette-item';
    button.innerHTML = `<span>${item.label}</span><small>${item.meta}</small>`;
    button.addEventListener('click', () => {
      closePalette();
      if (item.query) {
        patternSearch.value = item.query;
        filterPatterns(item.query);
      }
      document.querySelector(item.target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    paletteList.append(button);
  }
}

function openPalette() {
  palette.setAttribute('open', '');
  paletteInput.value = '';
  renderPalette();
  paletteInput.focus();
}

function closePalette() {
  palette.removeAttribute('open');
  paletteOpen.focus();
}

paletteOpen.addEventListener('click', openPalette);
palette.addEventListener('click', (event) => {
  if (event.target === palette) closePalette();
});
paletteInput.addEventListener('input', () => renderPalette(paletteInput.value));
paletteInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    paletteList.querySelector('button')?.focus();
  }
});
paletteList.addEventListener('keydown', (event) => {
  const items = $$('.palette-item', paletteList);
  const index = items.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    items[Math.min(index + 1, items.length - 1)]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (index <= 0) paletteInput.focus();
    else items[index - 1]?.focus();
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (palette.hasAttribute('open')) closePalette();
    else openPalette();
  }
  if (event.key === 'Escape' && palette.hasAttribute('open')) {
    event.preventDefault();
    closePalette();
  }
});

/* 3D hero ---------------------------------------------------------------- */

async function initHero() {
  const canvas = $('#hero-canvas');
  const fallback = $('#orb-fallback');
  const stage = canvas.closest('.hero-stage');
  const counter = $('#stage-counter');

  function showFallback() {
    fallback.hidden = false;
    canvas.hidden = true;
  }

  if (!canvas || !stage) return;

  if (reduceMotion) {
    showFallback();
    return;
  }

  let THREE;
  try {
    THREE = await import('three');
  } catch {
    showFallback();
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    showFallback();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 0, 6.6);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.3, 1),
    new THREE.MeshBasicMaterial({ color: 0x5ef2c2, wireframe: true, transparent: true, opacity: 0.55 }),
  );
  group.add(core);

  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: 0.18 }),
  );
  group.add(inner);

  const outer = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.02, 1),
    new THREE.MeshBasicMaterial({ color: 0x6aa8ff, wireframe: true, transparent: true, opacity: 0.12 }),
  );
  group.add(outer);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.42, 0.008, 8, 140),
    new THREE.MeshBasicMaterial({ color: 0xffce6a, transparent: true, opacity: 0.28 }),
  );
  ring.rotation.x = 1.08;
  ring.rotation.y = 0.32;
  group.add(ring);

  const nodeCount = window.innerWidth < 700 ? 7 : 10;
  const nodes = [];
  const nodeGeometry = new THREE.OctahedronGeometry(0.08, 0);
  const palette = [0x5ef2c2, 0x6aa8ff, 0xffce6a, 0xff7e9d];

  for (let index = 0; index < nodeCount; index += 1) {
    const angle = (index / nodeCount) * Math.PI * 2;
    const radius = 2.25 + (index % 3) * 0.36;
    const y = Math.sin(angle * 1.7) * 0.7;
    const node = new THREE.Mesh(
      nodeGeometry,
      new THREE.MeshBasicMaterial({ color: palette[index % palette.length], transparent: true, opacity: 0.9 }),
    );
    node.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    node.userData = {
      angle,
      radius,
      y,
      speed: 0.08 + (index % 4) * 0.025,
      phase: index * 0.7,
    };
    nodes.push(node);
    group.add(node);

    const points = [new THREE.Vector3(0, 0, 0), node.position.clone()];
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x5ef2c2, transparent: true, opacity: 0.14 }),
    );
    group.add(line);
    node.userData.line = line;
  }

  const starCount = window.innerWidth < 700 ? 90 : 180;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const radius = 3.4 + Math.random() * 4.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[index * 3 + 2] = radius * Math.cos(phi);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0x9fb0c8, size: 0.024, transparent: true, opacity: 0.55 }),
  );
  scene.add(stars);

  counter.textContent = `${nodes.length + 1} nodes linked`;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.4;
  });
  stage.addEventListener('pointerleave', () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  let visible = true;
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.05 },
  );
  visibilityObserver.observe(stage);

  const clock = new THREE.Clock();
  let frame = 0;

  function animate() {
    frame = requestAnimationFrame(animate);
    if (!visible || document.hidden) return;

    const time = clock.getElapsedTime();
    pointer.x += (pointer.targetX - pointer.x) * 0.05;
    pointer.y += (pointer.targetY - pointer.y) * 0.05;

    group.rotation.y = time * 0.12 + pointer.x;
    group.rotation.x = Math.sin(time * 0.25) * 0.08 + pointer.y;
    stars.rotation.y = -time * 0.015;

    core.rotation.x = time * 0.1;
    core.rotation.z = time * 0.07;
    inner.scale.setScalar(1 + Math.sin(time * 1.4) * 0.05);
    outer.rotation.y = -time * 0.06;
    outer.rotation.x = Math.sin(time * 0.2) * 0.12;
    ring.rotation.z = time * 0.1;

    for (const node of nodes) {
      const data = node.userData;
      const angle = data.angle + time * data.speed;
      node.position.x = Math.cos(angle) * data.radius;
      node.position.z = Math.sin(angle) * data.radius;
      node.position.y = data.y + Math.sin(time * 0.8 + data.phase) * 0.16;
      node.rotation.x = time * 0.6;
      node.rotation.y = time * 0.4;
      const linePosition = node.userData.line.geometry.attributes.position;
      linePosition.setXYZ(1, node.position.x, node.position.y, node.position.z);
      linePosition.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) clock.getDelta();
  });
}

initHero();
