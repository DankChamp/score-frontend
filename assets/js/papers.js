// ============================================================
// SCORE AI — SAMPLE PAPER LIBRARY
// Public paper cards + admin paper manager.
// Defaults ship with the site; admin changes persist in this
// browser so the static build can publish papers without a server.
// ============================================================
(function () {
  'use strict';

  const STORAGE_KEY = 'score-ai-papers-v1';
  const MAX_PDF_BYTES = 2 * 1024 * 1024;
  const DEFAULT_PAPERS = [
    {
      id: 'math-standard-launch',
      title: 'Mathematics Standard — Launch Paper',
      subject: 'Mathematics',
      year: 2027,
      marks: 80,
      duration: 180,
      access: 'free',
      status: 'published',
      pdf: 'assets/papers/mathematics-standard-launch-paper.pdf',
      createdAt: '2026-11-20T00:00:00.000Z',
      updatedAt: '2026-11-20T00:00:00.000Z'
    },
    {
      id: 'math-standard-set-1',
      title: 'Mathematics Standard — Set 1',
      subject: 'Mathematics',
      year: 2027,
      marks: 80,
      duration: 180,
      access: 'free',
      status: 'published',
      pdf: '',
      createdAt: '2026-11-19T00:00:00.000Z',
      updatedAt: '2026-11-19T00:00:00.000Z'
    },
    {
      id: 'science-set-1',
      title: 'Science — Set 1',
      subject: 'Science',
      year: 2027,
      marks: 80,
      duration: 180,
      access: 'free',
      status: 'published',
      pdf: '',
      createdAt: '2026-11-19T00:00:00.000Z',
      updatedAt: '2026-11-19T00:00:00.000Z'
    },
    {
      id: 'math-standard-set-2',
      title: 'Mathematics Standard — Set 2',
      subject: 'Mathematics',
      year: 2027,
      marks: 80,
      duration: 180,
      access: 'paid',
      status: 'published',
      pdf: '',
      createdAt: '2026-11-19T00:00:00.000Z',
      updatedAt: '2026-11-19T00:00:00.000Z'
    }
  ];

  let isSaving = false;
  let returnFocus = null;

  // ----------------------------------------------------------
  // Data helpers
  // ----------------------------------------------------------
  function cloneDefaults() {
    return DEFAULT_PAPERS.map(function (paper) {
      return Object.assign({}, paper);
    });
  }

  function cleanText(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength || 160);
  }

  function boundedInt(value, min, max, fallback) {
    const number = parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function makePaperId(title) {
    const slug = cleanText(title, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 42);
    return (slug || 'paper') + '-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 6);
  }

  function isSafePdfSource(value) {
    if (typeof value !== 'string') return false;
    const source = value.trim();
    if (!source) return false;

    if (/^data:/i.test(source)) {
      return /^data:application\/pdf(?:;[^,]*)?,/i.test(source);
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(source)) {
      return /^https?:/i.test(source);
    }

    // Relative paths are fine; protocol-relative URLs are not needed here.
    return source.indexOf('//') !== 0;
  }

  function isEmbeddedPdf(value) {
    return /^data:application\/pdf/i.test(value || '');
  }

  function resolvePdfUrl(value) {
    if (!value) return '';
    if (/^(data:|https?:|\/|\.{1,2}\/)/i.test(value)) return value;
    const base = document.body ? document.body.getAttribute('data-paper-base') || '' : '';
    return base + value;
  }

  function normalizePaper(paper) {
    if (!paper || typeof paper !== 'object') return null;

    const title = cleanText(paper.title, 140);
    if (!title) return null;

    return {
      id: typeof paper.id === 'string' && paper.id.trim()
        ? paper.id.trim().slice(0, 120)
        : makePaperId(title),
      title: title,
      subject: cleanText(paper.subject, 60) || 'General',
      year: boundedInt(paper.year, 2000, 2100, 2027),
      marks: boundedInt(paper.marks, 1, 200, 80),
      duration: boundedInt(paper.duration, 1, 600, 180),
      access: paper.access === 'free' ? 'free' : 'paid',
      status: paper.status === 'draft' ? 'draft' : 'published',
      pdf: isSafePdfSource(paper.pdf) ? String(paper.pdf).trim() : '',
      createdAt: typeof paper.createdAt === 'string' ? paper.createdAt : '',
      updatedAt: typeof paper.updatedAt === 'string' ? paper.updatedAt : ''
    };
  }

  function readPapers() {
    let raw = null;

    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return cloneDefaults();
    }

    if (raw === null) {
      const seeded = cloneDefaults();
      savePapers(seeded);
      return seeded;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Invalid paper library');

      const seen = Object.create(null);
      const papers = [];

      parsed.forEach(function (item) {
        const paper = normalizePaper(item);
        if (!paper || seen[paper.id]) return;
        seen[paper.id] = true;
        papers.push(paper);
      });

      if (parsed.length > 0 && papers.length === 0) {
        return cloneDefaults();
      }

      return papers;
    } catch (error) {
      return cloneDefaults();
    }
  }

  function savePapers(papers) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getPublishedPapers() {
    return readPapers().filter(function (paper) {
      return paper.status === 'published';
    });
  }

  function formatMeta(paper) {
    const marks = paper.marks === 1 ? '1 mark' : paper.marks + ' marks';
    return [paper.subject, paper.year, marks, paper.duration + ' min'].join(' · ');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function pdfFileName(paper) {
    const name = cleanText(paper.title, 100)
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    return (name || 'score-ai-paper') + '.pdf';
  }

  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    let live = document.querySelector('[data-paper-live]');
    if (!live) {
      live = document.createElement('p');
      live.className = 'sr-only';
      live.setAttribute('data-paper-live', '');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = message;
  }

  function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) throw new Error('Invalid PDF data');

    const header = dataUrl.slice(0, comma);
    const body = dataUrl.slice(comma + 1);
    if (!/;base64/i.test(header)) throw new Error('Unsupported PDF encoding');

    const binary = window.atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  }

  function openEmbeddedPdf(paper) {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(dataUrlToBlob(paper.pdf));
    } catch (error) {
      notify('The attached PDF could not be opened.', 'error');
      return;
    }

    const opened = window.open(objectUrl, '_blank');
    if (!opened) {
      URL.revokeObjectURL(objectUrl);
      notify('Allow pop-ups to open this paper.', 'error');
      return;
    }

    try {
      opened.opener = null;
    } catch (error) {
      /* Cross-window access can be restricted. */
    }

    window.setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 60000);
  }

  function downloadEmbeddedPdf(paper) {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(dataUrlToBlob(paper.pdf));
    } catch (error) {
      notify('The attached PDF could not be downloaded.', 'error');
      return;
    }

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = pdfFileName(paper);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 10000);
  }

  // ----------------------------------------------------------
  // Shared paper UI
  // ----------------------------------------------------------
  function createAccessBadge(paper, extraClass) {
    const badge = document.createElement('span');
    const free = paper.access === 'free';
    badge.className =
      (free ? 'badge badge-fill badge-blueprint' : 'badge badge-outline') +
      (extraClass ? ' ' + extraClass : '');
    badge.textContent = free ? 'Free' : 'Paid';
    return badge;
  }

  function createStatus(paper) {
    const status = document.createElement('span');
    const draft = paper.status === 'draft';
    status.className = 'paper-status ' + (draft ? 'paper-status-draft' : 'paper-status-live');
    status.textContent = draft ? 'Draft' : 'Published';
    return status;
  }

  function createPdfAction(paper, kind, small) {
    const embedded = isEmbeddedPdf(paper.pdf);
    const element = document.createElement(embedded ? 'button' : 'a');
    const className = small
      ? 'btn btn-ghost btn-sm table-action-btn table-action-btn-ghost'
      : (kind === 'open' ? 'btn btn-primary' : 'btn btn-secondary');

    element.className = className;

    if (embedded) {
      element.type = 'button';
      element.textContent = small ? 'View' : (kind === 'open' ? 'Open Paper' : 'Download');
      element.setAttribute('aria-label', (small ? 'View PDF: ' : kind === 'open' ? 'Open Paper: ' : 'Download PDF: ') + paper.title);
      element.addEventListener('click', function () {
        if (kind === 'open') {
          openEmbeddedPdf(paper);
        } else {
          downloadEmbeddedPdf(paper);
        }
      });
    } else {
      element.href = resolvePdfUrl(paper.pdf);
      element.textContent = small ? 'View' : (kind === 'open' ? 'Open Paper' : 'Download');
      element.setAttribute('aria-label', (small ? 'View PDF: ' : kind === 'open' ? 'Open Paper: ' : 'Download PDF: ') + paper.title);
      if (kind === 'open' || small) {
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      } else {
        element.download = pdfFileName(paper);
      }
    }

    if (!small && kind === 'open') {
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = ' (opens in a new tab)';
      element.appendChild(sr);
    }

    return element;
  }

  function createPaperCard(paper, headingTag) {
    const article = document.createElement('article');
    article.className = 'card paper-card';
    article.setAttribute('data-paper-id', paper.id);
    article.setAttribute('data-paper-access', paper.access);

    if (paper.id === 'math-standard-launch') {
      article.classList.add('paper-card-launch');
    }

    const header = document.createElement('div');
    header.className = 'paper-header';

    const info = document.createElement('div');
    const title = document.createElement(headingTag.toLowerCase() === 'h3' ? 'h3' : 'h2');
    title.className = 'paper-title';
    title.textContent = paper.title;

    const meta = document.createElement('p');
    meta.className = 'paper-meta';
    meta.textContent = formatMeta(paper);

    info.appendChild(title);
    info.appendChild(meta);
    header.appendChild(info);
    header.appendChild(createAccessBadge(paper, 'paper-badge'));

    const actions = document.createElement('div');
    actions.className = 'paper-actions';

    if (paper.access === 'paid') {
      const login = document.createElement('a');
      login.href = 'login.html';
      login.className = 'btn btn-primary';
      login.textContent = 'Login to Access';
      actions.appendChild(login);
    } else if (paper.pdf) {
      actions.appendChild(createPdfAction(paper, 'open', false));
      actions.appendChild(createPdfAction(paper, 'download', false));
    } else {
      const preview = document.createElement('a');
      preview.href = 'papers.html';
      preview.className = 'btn btn-secondary';
      preview.textContent = 'Preview';
      actions.appendChild(preview);
    }

    article.appendChild(header);
    article.appendChild(actions);
    return article;
  }

  function renderPublicPapers() {
    const lists = document.querySelectorAll('[data-paper-list]');
    if (!lists.length) return;

    const published = getPublishedPapers();

    document.querySelectorAll('[data-paper-count]').forEach(function (label) {
      const count = published.length;
      label.textContent = count + (count === 1 ? ' Paper Available' : ' Papers Available');
    });

    lists.forEach(function (list) {
      const headingTag = (list.getAttribute('data-paper-heading') || 'h2').toLowerCase();
      const limit = parseInt(list.getAttribute('data-paper-limit'), 10);
      const visible = Number.isFinite(limit) && limit > 0
        ? published.slice(0, limit)
        : published;

      if (!visible.length) {
        const empty = document.createElement('p');
        empty.className = 'paper-empty';
        empty.textContent = 'No published papers are available yet.';
        list.replaceChildren(empty);
        return;
      }

      list.replaceChildren.apply(
        list,
        visible.map(function (paper) {
          return createPaperCard(paper, headingTag);
        })
      );
    });
  }

  // ----------------------------------------------------------
  // Admin table
  // ----------------------------------------------------------
  function renderAdminPapers() {
    const tbody = document.querySelector('[data-admin-paper-rows]');
    if (!tbody) return;

    const papers = readPapers();
    const fragment = document.createDocumentFragment();

    if (!papers.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 8;
      cell.className = 'paper-table-empty';
      cell.textContent = 'No papers in the library yet.';
      row.appendChild(cell);
      fragment.appendChild(row);
    }

    papers.forEach(function (paper) {
      const row = document.createElement('tr');
      row.setAttribute('data-paper-id', paper.id);

      const titleCell = document.createElement('td');
      const title = document.createElement('span');
      title.className = 'paper-table-title';
      title.textContent = paper.title;
      titleCell.appendChild(title);

      const subjectCell = document.createElement('td');
      subjectCell.textContent = paper.subject;

      const yearCell = document.createElement('td');
      yearCell.textContent = String(paper.year);

      const marksCell = document.createElement('td');
      marksCell.textContent = String(paper.marks);

      const durationCell = document.createElement('td');
      durationCell.textContent = paper.duration + ' min';

      const accessCell = document.createElement('td');
      accessCell.appendChild(createAccessBadge(paper, ''));

      const statusCell = document.createElement('td');
      statusCell.appendChild(createStatus(paper));

      const actionsCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'table-actions';

      if (paper.pdf) {
        actions.appendChild(createPdfAction(paper, 'open', true));
      }

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-ghost btn-sm table-action-btn table-action-btn-ghost';
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label', 'Edit ' + paper.title);
      edit.addEventListener('click', function () {
        openEditDialog(paper);
      });
      actions.appendChild(edit);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-ghost btn-sm table-action-btn table-action-btn-danger';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete ' + paper.title);
      remove.addEventListener('click', function () {
        deletePaper(paper);
      });
      actions.appendChild(remove);

      actionsCell.appendChild(actions);

      [titleCell, subjectCell, yearCell, marksCell, durationCell, accessCell, statusCell, actionsCell].forEach(function (cell) {
        row.appendChild(cell);
      });
      fragment.appendChild(row);
    });

    tbody.replaceChildren(fragment);
  }

  function renderAll() {
    renderPublicPapers();
    renderAdminPapers();
  }

  // ----------------------------------------------------------
  // Admin dialog + form
  // ----------------------------------------------------------
  function getAdminElements() {
    const dialog = document.querySelector('[data-paper-dialog]');
    const form = document.querySelector('[data-paper-form]');
    if (!dialog || !form) return null;

    return {
      dialog: dialog,
      form: form,
      fields: {
        id: form.querySelector('[data-paper-input-id]'),
        title: form.querySelector('[data-paper-title]'),
        subject: form.querySelector('[data-paper-subject]'),
        year: form.querySelector('[data-paper-year]'),
        marks: form.querySelector('[data-paper-marks]'),
        duration: form.querySelector('[data-paper-duration]'),
        access: form.querySelector('[data-paper-access]'),
        published: form.querySelector('[data-paper-published]'),
        file: form.querySelector('[data-paper-file]'),
        url: form.querySelector('[data-paper-url]'),
        fileHelp: form.querySelector('[data-paper-file-help]'),
        error: form.querySelector('[data-paper-error]'),
        heading: dialog.querySelector('[data-paper-dialog-title]'),
        lead: dialog.querySelector('[data-paper-dialog-lead]'),
        submit: form.querySelector('[data-paper-submit]')
      }
    };
  }

  function clearError(elements) {
    if (!elements.fields.error) return;
    elements.fields.error.hidden = true;
    elements.fields.error.textContent = '';
  }

  function showError(elements, message) {
    if (!elements.fields.error) {
      notify(message, 'error');
      return;
    }
    elements.fields.error.textContent = message;
    elements.fields.error.hidden = false;
    elements.fields.error.focus();
  }

  function setFileHelp(elements, message) {
    if (elements.fields.fileHelp) {
      elements.fields.fileHelp.textContent = message;
    }
  }

  function setBusy(elements, busy) {
    isSaving = busy;
    elements.form.setAttribute('aria-busy', busy ? 'true' : 'false');
    elements.form.querySelectorAll('[data-paper-close]').forEach(function (button) {
      button.disabled = busy;
    });

    if (elements.fields.submit) {
      if (!elements.fields.submit.dataset.label) {
        elements.fields.submit.dataset.label = elements.fields.submit.textContent;
      }
      elements.fields.submit.disabled = busy;
      elements.fields.submit.textContent = busy ? 'Saving…' : elements.fields.submit.dataset.label;
    }
  }

  function resetForm(elements) {
    elements.form.reset();
    elements.form.removeAttribute('data-paper-id');
    elements.dialog.removeAttribute('data-editing-id');

    if (elements.fields.id) elements.fields.id.value = '';
    if (elements.fields.access) elements.fields.access.value = 'paid';
    if (elements.fields.published) elements.fields.published.checked = true;
    if (elements.fields.url) elements.fields.url.value = '';
    if (elements.fields.file) elements.fields.file.value = '';

    if (elements.fields.heading) {
      elements.fields.heading.textContent = 'Upload Paper';
    }
    if (elements.fields.lead) {
      elements.fields.lead.textContent = 'Add a paper to the public library. Paid papers are the default.';
    }
    if (elements.fields.submit) {
      elements.fields.submit.dataset.label = 'Publish Paper';
      elements.fields.submit.textContent = 'Publish Paper';
    }

    setFileHelp(elements, 'Required for new papers unless a PDF link is added. Up to 2 MB. Embedded files are stored in this browser.');
    clearError(elements);
    setBusy(elements, false);
  }

  function openAddDialog(elements) {
    resetForm(elements);
    openDialog(elements);
  }

  function openEditDialog(paper) {
    const elements = getAdminElements();
    if (!elements) return;

    resetForm(elements);
    elements.dialog.setAttribute('data-editing-id', paper.id);

    if (elements.fields.id) elements.fields.id.value = paper.id;
    if (elements.fields.title) elements.fields.title.value = paper.title;
    if (elements.fields.subject) elements.fields.subject.value = paper.subject;
    if (elements.fields.year) elements.fields.year.value = String(paper.year);
    if (elements.fields.marks) elements.fields.marks.value = String(paper.marks);
    if (elements.fields.duration) elements.fields.duration.value = String(paper.duration);
    if (elements.fields.access) elements.fields.access.value = paper.access;
    if (elements.fields.published) elements.fields.published.checked = paper.status === 'published';
    if (elements.fields.url) {
      elements.fields.url.value = paper.pdf && !isEmbeddedPdf(paper.pdf) ? paper.pdf : '';
    }

    if (elements.fields.heading) {
      elements.fields.heading.textContent = 'Edit Paper';
    }
    if (elements.fields.lead) {
      elements.fields.lead.textContent = 'Update this paper’s details, access, or PDF file.';
    }
    if (elements.fields.submit) {
      elements.fields.submit.dataset.label = 'Save Changes';
      elements.fields.submit.textContent = 'Save Changes';
    }

    setFileHelp(
      elements,
      paper.pdf
        ? 'A PDF is attached. Choose a new file to replace it.'
        : 'Required for new papers unless a PDF link is added. Up to 2 MB. Embedded files are stored in this browser.'
    );

    openDialog(elements);
  }

  function lockDialogScroll() {
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.setAttribute('data-paper-pad', document.body.style.paddingRight || '');
    document.body.style.paddingRight = scrollbarGap ? scrollbarGap + 'px' : '';
    document.body.classList.add('paper-dialog-open');
  }

  function unlockDialogScroll() {
    document.body.classList.remove('paper-dialog-open');
    document.body.style.paddingRight = document.body.getAttribute('data-paper-pad') || '';
    document.body.removeAttribute('data-paper-pad');
  }

  function openDialog(elements) {
    returnFocus = document.activeElement;

    if (typeof elements.dialog.showModal === 'function') {
      if (!elements.dialog.open) elements.dialog.showModal();
    } else {
      elements.dialog.setAttribute('open', '');
    }

    lockDialogScroll();

    window.setTimeout(function () {
      if (elements.fields.title) elements.fields.title.focus();
    }, 30);
  }

  function closeDialog() {
    if (isSaving) return;
    const elements = getAdminElements();
    if (!elements) return;

    if (typeof elements.dialog.close === 'function' && elements.dialog.open) {
      elements.dialog.close();
    } else {
      elements.dialog.removeAttribute('open');
      unlockDialogScroll();
      if (returnFocus && typeof returnFocus.focus === 'function') {
        returnFocus.focus({ preventScroll: true });
      }
    }
  }

  function isPdfFile(file) {
    if (!file) return false;
    const typeOkay = !file.type || file.type === 'application/pdf';
    const nameOkay = /\.pdf$/i.test(file.name || '');
    return typeOkay && nameOkay;
  }

  function readPdfFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Could not read the PDF file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function readForm(elements) {
    return {
      title: cleanText(elements.fields.title ? elements.fields.title.value : '', 140),
      subject: cleanText(elements.fields.subject ? elements.fields.subject.value : '', 60),
      year: boundedInt(elements.fields.year ? elements.fields.year.value : '', 2000, 2100, 2027),
      marks: boundedInt(elements.fields.marks ? elements.fields.marks.value : '', 1, 200, 80),
      duration: boundedInt(elements.fields.duration ? elements.fields.duration.value : '', 1, 600, 180),
      access: elements.fields.access && elements.fields.access.value === 'free' ? 'free' : 'paid',
      status: elements.fields.published && elements.fields.published.checked ? 'published' : 'draft',
      pdfUrl: elements.fields.url ? elements.fields.url.value.trim() : ''
    };
  }

  async function handleSubmit(event, elements) {
    event.preventDefault();
    if (isSaving) return;
    clearError(elements);

    const values = readForm(elements);
    if (!values.title) {
      if (elements.fields.title) elements.fields.title.focus();
      return;
    }
    if (!values.subject) {
      showError(elements, 'Add a subject for this paper.');
      if (elements.fields.subject) elements.fields.subject.focus();
      return;
    }
    if (values.pdfUrl && !isSafePdfSource(values.pdfUrl)) {
      showError(elements, 'Use a relative PDF path or an http(s) PDF link.');
      if (elements.fields.url) elements.fields.url.focus();
      return;
    }

    const papers = readPapers();
    const editingId = elements.fields.id ? elements.fields.id.value : '';
    const existing = editingId
      ? papers.find(function (paper) { return paper.id === editingId; })
      : null;

    if (editingId && !existing) {
      showError(elements, 'This paper no longer exists. Refresh and try again.');
      return;
    }

    const file = elements.fields.file && elements.fields.file.files
      ? elements.fields.file.files[0]
      : null;

    if (file) {
      if (!isPdfFile(file)) {
        showError(elements, 'Choose a valid PDF file.');
        elements.fields.file.focus();
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        showError(elements, 'The PDF must be 2 MB or smaller. Host larger files and use a PDF link.');
        elements.fields.file.focus();
        return;
      }
    }

    let pdf = existing ? existing.pdf : '';
    if (file) {
      setBusy(elements, true);
      try {
        pdf = await readPdfFile(file);
      } catch (error) {
        setBusy(elements, false);
        showError(elements, 'The PDF could not be read. Try another file.');
        return;
      }
    } else if (values.pdfUrl) {
      pdf = values.pdfUrl;
    }

    if (!pdf && !existing) {
      setBusy(elements, false);
      showError(elements, 'Attach a PDF file or add a PDF link.');
      if (elements.fields.file) elements.fields.file.focus();
      return;
    }

    const now = new Date().toISOString();
    const nextPaper = {
      title: values.title,
      subject: values.subject,
      year: values.year,
      marks: values.marks,
      duration: values.duration,
      access: values.access,
      status: values.status,
      pdf: pdf,
      updatedAt: now
    };

    let nextPapers;
    let paper;

    if (existing) {
      paper = Object.assign({}, existing, nextPaper);
      nextPapers = papers.map(function (item) {
        return item.id === existing.id ? paper : item;
      });
    } else {
      paper = Object.assign({}, nextPaper, {
        id: makePaperId(values.title),
        createdAt: now
      });
      nextPapers = [paper].concat(papers);
    }

    if (!savePapers(nextPapers)) {
      setBusy(elements, false);
      showError(elements, 'This paper could not be saved. Browser storage may be full or unavailable.');
      return;
    }

    setBusy(elements, false);
    closeDialog();
    renderAll();

    if (existing) {
      notify('Paper updated.', 'success');
    } else if (paper.status === 'published') {
      notify('Paper published to the site.', 'success');
    } else {
      notify('Paper saved as draft.', 'success');
    }
  }

  function deletePaper(paper) {
    const confirmed = window.confirm(
      'Delete "' + paper.title + '"? It will be removed from the public Papers page.'
    );
    if (!confirmed) return;

    const next = readPapers().filter(function (item) {
      return item.id !== paper.id;
    });

    if (!savePapers(next)) {
      notify('This paper could not be deleted. Browser storage may be unavailable.', 'error');
      return;
    }

    renderAll();
    notify('Paper deleted.', 'success');
  }

  function initAdmin() {
    const elements = getAdminElements();
    if (!elements) return;

    document.querySelectorAll('[data-paper-add]').forEach(function (button) {
      button.addEventListener('click', function () {
        openAddDialog(elements);
      });
    });

    document.querySelectorAll('[data-paper-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        closeDialog();
      });
    });

    elements.dialog.addEventListener('click', function (event) {
      if (event.target === elements.dialog) closeDialog();
    });

    elements.dialog.addEventListener('cancel', function (event) {
      if (isSaving) {
        event.preventDefault();
        return;
      }
      unlockDialogScroll();
    });

    elements.dialog.addEventListener('close', function () {
      unlockDialogScroll();
      if (returnFocus && typeof returnFocus.focus === 'function') {
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
    });

    elements.form.addEventListener('submit', function (event) {
      handleSubmit(event, elements);
    });

    elements.form.addEventListener('input', function () {
      clearError(elements);
    });

    if (elements.fields.file) {
      elements.fields.file.addEventListener('change', function () {
        const file = elements.fields.file.files ? elements.fields.file.files[0] : null;
        if (!file) {
          setFileHelp(elements, 'Required for new papers unless a PDF link is added. Up to 2 MB. Embedded files are stored in this browser.');
          return;
        }
        setFileHelp(
          elements,
          file.name + ' · ' + formatBytes(file.size) + ' · saved in this browser.'
        );
      });
    }
  }

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  renderAll();
  initAdmin();

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY || event.key === null) {
      renderAll();
    }
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) renderAll();
  });
})();
