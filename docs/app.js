'use strict';

if (!window.React || !window.ReactDOM) {
  document.getElementById('root').textContent = 'ResumeCraft could not load React. Check your internet connection and reload.';
} else {
  start();
}

function start() {
  const { createElement: h, useState, useEffect } = React;
  const storageKey = 'resume-craft:draft:v1';
  const sectionOrder = ['experience', 'projects', 'skills', 'education', 'certifications'];
  const sections = {
    experience: { title: 'Work Experience', item: 'role', fields: [
      ['title', 'Job title'], ['organization', 'Employer'], ['location', 'Location'], ['dates', 'Dates', 'text', 'Jun 2022 – Present'],
      ['details', 'Achievements (one per line)', 'textarea', 'Describe what you did and the outcome.'],
    ] },
    projects: { title: 'Projects', item: 'project', fields: [
      ['title', 'Project name'], ['organization', 'Tools or technologies'], ['dates', 'Dates'], ['url', 'Project URL', 'url'],
      ['details', 'Project highlights (one per line)', 'textarea', 'Explain what you built and who it helped.'],
    ] },
    education: { title: 'Education', item: 'qualification', fields: [
      ['title', 'Degree or qualification'], ['organization', 'School or university'], ['location', 'Location'], ['dates', 'Dates'],
      ['details', 'Honors, GPA, or coursework (one per line)', 'textarea'],
    ] },
    certifications: { title: 'Certifications', item: 'certification', fields: [
      ['title', 'Certification name'], ['organization', 'Issuing organization'], ['dates', 'Date'],
    ] },
  };
  const contactFields = [
    ['name', 'Full name'], ['headline', 'Professional title'], ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'], ['location', 'Location'], ['linkedin', 'LinkedIn URL', 'url'],
    ['website', 'Portfolio or GitHub URL', 'url'],
  ];

  function blankDraft() {
    return {
      contact: Object.fromEntries(contactFields.map(([key]) => [key, ''])),
      summary: '', skills: '', experience: [], projects: [], education: [], certifications: [],
    };
  }

  function readDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && typeof saved === 'object') {
        const initial = blankDraft();
        const content = Object.fromEntries(Object.keys(initial).map(key => [key, saved[key] ?? initial[key]]));
        return { ...content, contact: { ...initial.contact, ...content.contact } };
      }
    } catch {
      // A blocked storage area or invalid JSON permits a fresh session.
    }
    return blankDraft();
  }

  function Field({ definition, value, onChange }) {
    const [, label, type = 'text', placeholder] = definition;
    const props = { value, placeholder, onChange: event => onChange(event.target.value) };
    return h('label', { className: type === 'textarea' ? 'field wide' : 'field' }, label,
      type === 'textarea' ? h('textarea', { ...props, rows: 3 }) : h('input', { ...props, type }));
  }

  function EntryEditor({ section, entries, onChange }) {
    const { item, fields } = sections[section];
    return h('section', { className: 'card', id: section },
      h('div', { className: 'card-heading' },
        h('button', { className: 'button small', onClick: () => onChange([...entries, {
          id: crypto.randomUUID(),
          ...Object.fromEntries(fields.map(([key]) => [key, ''])),
        }]) }, '+ Add ' + item)),
      entries.map((entry, index) => h('fieldset', { key: entry.id },
        h('legend', null, item[0].toUpperCase() + item.slice(1) + ' ' + (index + 1)),
        h('div', { className: 'fields' }, fields.map(definition => h(Field, {
          key: definition[0], definition, value: entry[definition[0]] ?? '',
          onChange: value => onChange(entries.map(row => row.id === entry.id
            ? { ...row, [definition[0]]: value } : row)),
        }))),
        h('button', { className: 'remove', onClick: () => onChange(entries.filter(row => row.id !== entry.id)) },
          'Remove ' + item + ' ' + (index + 1)))));
  }

  function lines(value) {
    return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  function ResumeSection({ title, children }) {
    return h('section', { className: 'resume-section' }, h('h2', null, title), children);
  }

  function Resume({ draft }) {
    const { contact, summary, skills } = draft;
    const contacts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website]
      .map(value => value.trim()).filter(Boolean);
    return h('article', { className: 'resume', 'aria-label': 'Resume document' },
      h('header', { className: 'resume-header' },
        h('h1', null, contact.name.trim() || 'Your Name'),
        contact.headline.trim() && h('p', { className: 'resume-headline' }, contact.headline),
        contacts.length > 0 && h('p', null, contacts.join(' | '))),
      summary.trim() && h(ResumeSection, { title: 'Professional Summary' }, h('p', null, summary)),
      sectionOrder.map(key => {
        if (key === 'skills') {
          const items = lines(skills);
          return items.length ? h(ResumeSection, { key, title: 'Skills' },
            items.map((line, index) => h('p', { key: index }, line))) : null;
        }
        const entries = draft[key].filter(({ id, ...values }) => Object.values(values).some(value => value.trim()));
        if (!entries.length) return null;
        return h(ResumeSection, { key, title: sections[key].title }, entries.map(entry => {
          const metadata = [entry.organization, entry.location, entry.dates].filter(value => value?.trim());
          const bullets = lines(entry.details || '');
          const projectLink = key === 'projects' && /^https?:\/\//i.test(entry.url?.trim()) ? entry.url.trim() : '';
          return h('div', { key: entry.id, className: 'resume-entry' },
            entry.title.trim() && h('h3', null, entry.title),
            projectLink && h('p', null, h('a', { href: projectLink, target: '_blank', rel: 'noopener noreferrer' }, projectLink)),
            metadata.length > 0 && h('p', { className: 'metadata' }, metadata.join(' | ')),
            bullets.length > 0 && h('ul', null, bullets.map((bullet, index) => h('li', { key: index }, bullet))));
        }));
      }));
  }

  function Module({ title, status, children, initiallyOpen = false }) {
    const [open, setOpen] = useState(initiallyOpen);
    return h('details', { className: 'module', open, onToggle: event => setOpen(event.currentTarget.open) },
      h('summary', null, h('span', null, title), status && h('span', { className: 'module-status' }, status)),
      h('div', { className: 'module-body' }, children));
  }

  function App() {
    const [draft, setDraft] = useState(readDraft);
    const [saved, setSaved] = useState(true);
    const [preview, setPreview] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, [draft]);

    function update(key, value) {
      setDraft(current => ({ ...current, [key]: value }));
    }

    function printResume() {
      const previous = document.title;
      document.title = (draft.contact.name.trim() || 'ResumeCraft') + ' - Resume';
      try {
        window.print();
      } finally {
        document.title = previous;
      }
    }

    return h(React.Fragment, null,
      h('header', { className: 'topbar' },
        h('div', { className: 'brand' }, h('span', { className: 'mark', 'aria-hidden': true }, 'RC'), 'ResumeCraft'),
        h('div', { className: 'top-actions' },
          h('span', { className: 'save-status', role: 'status' }, saved ? 'Saved on this device' : 'Draft storage unavailable'),
          h('button', { className: 'button primary', onClick: printResume }, 'Save as PDF'))),
      h('main', { className: 'workspace' + (preview ? ' show-preview' : '') },
        h('div', { className: 'mobile-bar', role: 'group', 'aria-label': 'Workspace view' },
          h('button', { className: 'button', 'aria-pressed': !preview, onClick: () => setPreview(false) }, 'Edit'),
          h('button', { className: 'button', 'aria-pressed': preview, onClick: () => setPreview(true) }, 'Preview')),
        h('section', { className: 'editor', 'aria-label': 'Resume editor' },
          h('h1', null, 'Build your resume'),
          h('p', { className: 'intro' }, 'Open a section to edit it. Your resume updates as you type.'),
          h(Module, { title: 'Contact information', initiallyOpen: true, status: draft.contact.name.trim() },
            h('div', { className: 'fields' }, contactFields.map(definition => h(Field, {
              key: definition[0], definition, value: draft.contact[definition[0]],
              onChange: value => setDraft(current => ({ ...current, contact: { ...current.contact, [definition[0]]: value } })),
            })))),
          h(Module, { title: 'Professional summary', status: draft.summary.trim() ? 'Added' : '' },
            h(Field, { definition: ['summary', 'Summary', 'textarea', 'Summarize your relevant skills, experience, and target role.'],
              value: draft.summary, onChange: value => update('summary', value) })),
          sectionOrder.map(key => {
            if (key === 'skills') {
              return h(Module, { key, title: 'Skills', status: draft.skills.trim() ? 'Added' : '' },
                h(Field, { definition: ['skills', 'Skills or skill groups', 'textarea', 'Languages: Python, SQL'],
                  value: draft.skills, onChange: value => update('skills', value) }));
            }
            return h(Module, { key, title: sections[key].title, status: draft[key].length ? String(draft[key].length) : '' },
              h(EntryEditor, { section: key, entries: draft[key], onChange: value => update(key, value) }));
          }),
          h('button', { className: 'remove reset', onClick: () => setResetOpen(true) }, 'Clear draft')),
        h('aside', { className: 'preview', 'aria-label': 'Live preview' },
          h('div', { className: 'preview-header' }, h('h2', null, 'Live preview'), h('span', null, 'US Letter · Single column')),
          h(Resume, { draft }))),
      resetOpen && h(ResetDialog, {
        onClose: () => setResetOpen(false),
        onReset: () => { setDraft(blankDraft()); setResetOpen(false); },
      }));
  }

  function ResetDialog({ onClose, onReset }) {
    const dialog = React.useRef(null);
    useEffect(() => { dialog.current.showModal(); }, []);
    return h('dialog', { ref: dialog, 'aria-labelledby': 'clear-title', onCancel: onClose },
      h('h2', { id: 'clear-title' }, 'Clear your draft?'),
      h('p', null, 'This removes the resume details saved in this browser.'),
      h('div', { className: 'dialog-actions' },
        h('button', { className: 'button', autoFocus: true, onClick: onClose }, 'Keep editing'),
        h('button', { className: 'button danger', onClick: onReset }, 'Clear draft')));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
}
