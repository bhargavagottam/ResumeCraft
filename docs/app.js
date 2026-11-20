'use strict';

if (!window.React || !window.ReactDOM) {
  document.getElementById('root').textContent = 'ResumeCraft could not load React. Check your internet connection and reload.';
} else {
  start();
}

function start() {
  const { createElement: h, useState, useEffect } = React;
  const storageKey = 'resume-craft:draft:v1';
  const presets = {
    Fresher: ['education skills projects experience certifications', 'Lead with your degree, relevant coursework, internships, or projects.'],
    Junior: ['skills experience projects education certifications', 'Describe what you built, the tools you used, and the result.'],
    'Mid-level': ['experience skills projects certifications education', 'Show the features or processes you owned and the outcomes you delivered.'],
    Senior: ['experience skills projects certifications education', 'Highlight the decisions you led, who you worked with, and the outcomes.'],
    'Staff / Principal': ['experience projects skills certifications education', 'Show cross-team impact, technical direction, and the scope of your decisions.'],
  };
  const sections = {
    experience: { title: 'Work Experience', item: 'role', fields: [
      ['title', 'Job title'], ['organization', 'Employer'], ['location', 'Location'], ['dates', 'Dates', 'text', 'Jun 2022 – Present'],
      ['details', 'Achievements (one per line)', 'textarea', 'Describe what you did and the outcome.'],
    ] },
    projects: { title: 'Projects', item: 'project', fields: [
      ['title', 'Project name'], ['organization', 'Tools or technologies'], ['dates', 'Dates'],
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
      level: 'Fresher',
      contact: Object.fromEntries(contactFields.map(([key]) => [key, ''])),
      summary: '', skills: '', experience: [], projects: [], education: [], certifications: [],
    };
  }

  function readDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && Object.hasOwn(presets, saved.level)) return saved;
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
    const { title, item, fields } = sections[section];
    return h('section', { className: 'card' },
      h('div', { className: 'card-heading' }, h('h3', null, title),
        h('button', { className: 'button small', onClick: () => onChange([...entries, {
          id: crypto.randomUUID(),
          ...Object.fromEntries(fields.map(([key]) => [key, ''])),
        }]) }, '+ Add ' + item)),
      entries.map((entry, index) => h('fieldset', { key: entry.id },
        h('legend', null, item[0].toUpperCase() + item.slice(1) + ' ' + (index + 1)),
        h('div', { className: 'fields' }, fields.map(definition => h(Field, {
          key: definition[0], definition, value: entry[definition[0]],
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

  function Resume({ draft, order }) {
    const { contact, summary, skills } = draft;
    const contacts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website]
      .map(value => value.trim()).filter(Boolean);
    return h('article', { className: 'resume', 'aria-label': 'Resume document' },
      h('header', { className: 'resume-header' },
        h('h1', null, contact.name.trim() || 'Your Name'),
        contact.headline.trim() && h('p', { className: 'resume-headline' }, contact.headline),
        contacts.length > 0 && h('p', null, contacts.join(' | '))),
      summary.trim() && h(ResumeSection, { title: 'Professional Summary' }, h('p', null, summary)),
      order.map(key => {
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
          return h('div', { key: entry.id, className: 'resume-entry' },
            entry.title.trim() && h('h3', null, entry.title),
            metadata.length > 0 && h('p', { className: 'metadata' }, metadata.join(' | ')),
            bullets.length > 0 && h('ul', null, bullets.map((bullet, index) => h('li', { key: index }, bullet))));
        }));
      }));
  }

  function App() {
    const [draft, setDraft] = useState(readDraft);
    const [saved, setSaved] = useState(true);
    const [orderString, tip] = presets[draft.level];
    const order = orderString.split(' ');

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
        h('div', { className: 'brand' }, h('span', { className: 'mark', 'aria-hidden': true }, 'R'), 'ResumeCraft'),
        h('div', { className: 'top-actions' },
          h('span', { className: 'save-status', role: 'status' }, saved ? 'Saved on this device' : 'Draft storage unavailable'),
          h('button', { className: 'button primary', onClick: printResume }, 'Save as PDF'))),
      h('main', { className: 'workspace' },
        h('div', { className: 'editor' },
          h('div', { className: 'intro' }, h('h1', null, 'Build your resume'),
            h('p', null, 'Edit your details and preview your ATS-friendly resume as you type.')),
          h('section', { className: 'card preset' },
            h('label', { className: 'field' }, 'Career level',
              h('select', { value: draft.level, onChange: event => update('level', event.target.value) },
                Object.keys(presets).map(level => h('option', { key: level }, level)))),
            h('p', null, tip)),
          h('section', { className: 'card' },
            h('h3', null, 'Contact Information'),
            h('div', { className: 'fields' }, contactFields.map(definition => h(Field, {
              key: definition[0], definition, value: draft.contact[definition[0]],
              onChange: value => setDraft(current => ({ ...current,
                contact: { ...current.contact, [definition[0]]: value },
              })),
            })))),
          h('section', { className: 'card' }, h('h3', null, 'Professional Summary'),
            h(Field, { definition: ['summary', 'Summary', 'textarea', 'Write a short introduction tailored to your target role.'],
              value: draft.summary, onChange: value => update('summary', value) })),
          order.map(key => key === 'skills'
            ? h('section', { key, className: 'card' }, h('h3', null, 'Skills'),
              h(Field, { definition: ['skills', 'Skills or skill groups', 'textarea', 'Analytics: SQL, Excel, Power BI'],
                value: draft.skills, onChange: value => update('skills', value) }))
            : h(EntryEditor, { key, section: key, entries: draft[key], onChange: value => update(key, value) })),
          h('button', { className: 'remove reset', onClick: () => {
            if (window.confirm('Clear this resume draft from this browser?')) setDraft(blankDraft());
          } }, 'Start over')),
        h('aside', { className: 'preview', 'aria-label': 'Live preview' },
          h('div', { className: 'preview-header' }, h('h2', null, 'Live preview'),
            h('span', null, 'US Letter · Single column')),
          h(Resume, { draft, order }))));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
}
