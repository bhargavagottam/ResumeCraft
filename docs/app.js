'use strict';

if (!window.React || !window.ReactDOM) {
  document.getElementById('root').textContent = 'ResumeCraft could not load React. Check your internet connection and reload.';
} else {
  start();
}

function start() {
  const { createElement: h, useState, useEffect } = React;
  const storageKey = 'resume-craft:draft:v1';
  const templates = {
    classic: { name: 'Classic Chronological', audience: 'Best all-purpose choice', description: 'Lead with your latest role and show your career progression.', order: 'experience skills education projects certifications', tip: 'Add your most recent role first. Use bullets to show results.' },
    graduate: { name: 'Graduate & Early Career', audience: 'Students, freshers, and juniors', description: 'Put education, projects, and internships near the top.', order: 'education projects experience skills certifications', tip: 'Use projects, coursework, internships, or volunteer work to demonstrate your skills.' },
    engineering: { name: 'Engineering Serif', audience: 'Software, data, and AI engineers', description: 'A compact serif layout with ruled sections and technical project links.', order: 'experience projects skills education certifications', tip: 'Show the engineering decisions you made and the results they produced.' },
    technical: { name: 'Technical Hybrid', audience: 'Technical roles and career changers', description: 'Show relevant skills and projects before your work history.', order: 'skills projects experience certifications education', tip: 'Group relevant skills by category. Use projects to show how you applied them.' },
    leadership: { name: 'Leadership & Impact', audience: 'Senior, staff, and principal roles', description: 'Open with a summary and accomplishments that show scope and impact.', order: 'experience projects skills certifications education', tip: 'Describe the decisions you led, the teams involved, and the measurable outcomes.' },
  };
  const demo = {
    contact: { name: 'Jordan Lee', headline: 'Software Engineer', email: 'jordan@example.com', phone: '555-0100', location: 'Boston, MA', linkedin: '', website: '' },
    summary: 'Engineer with experience building accessible tools and improving delivery across teams.',
    skills: 'Languages: JavaScript, Python, SQL\nTools: React, Git, PostgreSQL',
    experience: [{ id: 'demo-role', title: 'Software Engineer', organization: 'Example Studio', dates: '2022 – Present', details: 'Reduced release time by 30% through automated checks.\nLed a cross-team dashboard rollout.' }],
    projects: [{ id: 'demo-project', title: 'Service Health Dashboard', organization: 'React, Python', details: 'Built a dashboard to track response times and error rates.' }],
    education: [{ id: 'demo-school', title: 'B.S. in Computer Science', organization: 'Example University', dates: '2022' }],
    certifications: [],
  };
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
      template: null,
      contact: Object.fromEntries(contactFields.map(([key]) => [key, ''])),
      summary: '', skills: '', experience: [], projects: [], education: [], certifications: [],
    };
  }

  function readDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && typeof saved === 'object') {
        const { template, ...content } = saved;
        const validTemplate = Object.hasOwn(templates, template) ? template : null;
        return { ...blankDraft(), ...content, template: validTemplate };
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
    const { title, item, fields } = sections[section];
    return h('section', { className: 'card', id: section },
      h('div', { className: 'card-heading' }, h('h3', null, title),
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

  function Resume({ draft, template, compact = false, font = 'template', paper = 'letter' }) {
    const { contact, summary, skills } = draft;
    const order = templates[template].order.split(' ');
    const contacts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website]
      .map(value => value.trim()).filter(Boolean);
    return h('article', { className: 'resume format-' + template + ' density-' + (compact ? 'compact' : 'standard') + ' font-' + font + ' paper-' + paper, 'aria-label': 'Resume document' },
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
          const projectLink = key === 'projects' && /^https?:\/\//i.test(entry.url?.trim()) ? entry.url.trim() : '';
          return h('div', { key: entry.id, className: 'resume-entry' },
            entry.title.trim() && h('h3', null, entry.title),
            projectLink && h('p', null, h('a', { href: projectLink, target: '_blank', rel: 'noopener noreferrer' }, projectLink)),
            metadata.length > 0 && h('p', { className: 'metadata' }, metadata.join(' | ')),
            bullets.length > 0 && h('ul', null, bullets.map((bullet, index) => h('li', { key: index }, bullet))));
        }));
      }));
  }

  function App() {
    const [draft, setDraft] = useState(readDraft);
    const [saved, setSaved] = useState(true);
    const [showGallery, setShowGallery] = useState(() => !draft.template);
    const [section, setSection] = useState('contact');
    const [mode, setMode] = useState('content');
    const [mobilePreview, setMobilePreview] = useState(false);
    const [selected, setSelected] = useState(() => draft.template || 'classic');
    const format = templates[draft.template || selected];
    const order = format.order.split(' ');
    const navigation = [['contact', 'Contact'], ['summary', 'Summary'], ...order.map(key => [key, sections[key]?.title || 'Skills'])];
    const sectionIndex = navigation.findIndex(([key]) => key === section);
    const design = { paper: 'letter', font: 'template', compact: draft.template === 'engineering', ...draft.design };
    const checks = [
      ['Full name', Boolean(draft.contact.name.trim()), 'contact'],
      ['Email or phone', Boolean(draft.contact.email.trim() || draft.contact.phone.trim()), 'contact'],
      ['Experience, projects, or education', ['experience', 'projects', 'education'].some(key => draft[key].some(entry => entry.title.trim())), order.find(key => ['experience', 'projects', 'education'].includes(key))],
      ['Relevant skills', Boolean(draft.skills.trim()), 'skills'],
    ];

    function goToSection(key) {
      setSection(key);
      setMode('content');
      setMobilePreview(false);
    }

    function changeDesign(key, value) {
      update('design', { ...design, [key]: value });
    }

    function selectField(label, value, options, onChange) {
      return h('label', { className: 'field' }, label,
        h('select', { value, onChange: event => onChange(event.target.value) },
          options.map(([key, name]) => h('option', { key, value: key }, name))));
    }

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

    function openEditor() {
      update('template', selected);
      setMode('content');
      setMobilePreview(false);
      setShowGallery(false);
      window.scrollTo(0, 0);
    }

    function openGallery() {
      setSelected(draft.template || 'classic');
      setShowGallery(true);
      window.scrollTo(0, 0);
    }

    return h(React.Fragment, null,
      h('header', { className: 'topbar' },
        h('div', { className: 'brand' }, h('span', { className: 'mark', 'aria-hidden': true }, 'RC'), 'ResumeCraft'),
        h('div', { className: 'top-actions' },
          h('span', { className: 'save-status', role: 'status' }, saved ? 'Saved on this device' : 'Draft storage unavailable'),
          !showGallery && h('button', { className: 'button primary', onClick: printResume }, 'Save as PDF'))),
      showGallery && h('main', { className: 'gallery' },
        h('div', { className: 'gallery-intro' },
          h('h1', null, 'Choose your resume template'),
          h('p', null, 'Compare single-column formats, then write and review your resume in one workspace.')),
        h('fieldset', { className: 'template-grid' },
          h('legend', { className: 'sr-only' }, 'Resume format'),
          Object.entries(templates).map(([key, item]) => h('label', { key, className: 'template-card' },
            h('input', { type: 'radio', name: 'template', value: key, checked: selected === key, onChange: () => setSelected(key) }),
            h('div', { className: 'sample-paper', 'aria-hidden': true }, h(Resume, { draft: demo, template: key })),
            h('span', { className: 'template-info' },
              h('strong', null, item.name),
              h('span', { className: 'audience' }, item.audience),
              h('span', null, item.description))))),
        h('div', { className: 'gallery-actions' },
          draft.template && h('button', { className: 'button', onClick: () => setShowGallery(false) }, 'Back to editor'),
          h('button', { className: 'button primary', onClick: openEditor }, 'Use ' + templates[selected].name)),
        h('details', { className: 'template-sources' }, h('summary', null, 'Format references'),
          h('ul', null,
            h('li', null, h('a', { href: 'https://www.dol.gov/sites/dolgov/files/vets/files/resumeessentials_pg_interactive_feb2026.pdf' }, 'U.S. Department of Labor resume formats')),
            h('li', null, h('a', { href: 'https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/' }, 'Harvard College bullet-point resume template')),
            h('li', null, h('a', { href: 'https://career.utdallas.edu/career-resource-library/resume-and-cover-letter/' }, 'UT Dallas resume layout guidance'))))),
      !showGallery && h('main', { className: 'workspace' + (mobilePreview ? ' mobile-preview' : '') },
        h('div', { className: 'mobile-bar' },
          h('button', { className: 'button small', 'aria-pressed': !mobilePreview, onClick: () => setMobilePreview(false) }, 'Edit'),
          h('button', { className: 'button small', 'aria-pressed': mobilePreview, onClick: () => setMobilePreview(true) }, 'Preview')),
        h('div', { className: 'editor' },
          h('div', { className: 'intro' }, h('h1', null, 'Edit your resume'),
            h('div', { className: 'format-line' }, h('strong', null, format.name),
              h('button', { className: 'button small', onClick: openGallery }, 'Change template')),
            h('p', null, format.tip)),
          h('nav', { className: 'mode-nav', 'aria-label': 'Builder steps' },
            [['content', 'Write'], ['design', 'Design'], ['review', 'Review']].map(([key, label]) => h('button', {
              key, className: 'mode-button', 'aria-pressed': mode === key, onClick: () => setMode(key),
            }, label))),
          mode === 'content' && h(React.Fragment, null,
          h('nav', { className: 'section-links', 'aria-label': 'Resume sections' },
            navigation.map(([key, label]) => h('button', { key, className: 'section-link', 'aria-pressed': section === key, onClick: () => goToSection(key) }, label))),
          section === 'contact' && h('section', { className: 'card', id: 'contact' },
            h('h3', null, 'Contact Information'),
            h('div', { className: 'fields' }, contactFields.map(definition => h(Field, {
              key: definition[0], definition, value: draft.contact[definition[0]],
              onChange: value => setDraft(current => ({ ...current,
                contact: { ...current.contact, [definition[0]]: value },
              })),
            })))),
          section === 'summary' && h('section', { className: 'card', id: 'summary' }, h('h3', null, 'Professional Summary'),
            h(Field, { definition: ['summary', 'Summary', 'textarea', 'Write a short introduction tailored to your target role.'],
              value: draft.summary, onChange: value => update('summary', value) })),
          order.filter(key => key === section).map(key => key === 'skills'
            ? h('section', { key, className: 'card', id: 'skills' }, h('h3', null, 'Skills'),
              h(Field, { definition: ['skills', 'Skills or skill groups', 'textarea', 'Analytics: SQL, Excel, Power BI'],
                value: draft.skills, onChange: value => update('skills', value) }))
            : h(EntryEditor, { key, section: key, entries: draft[key], onChange: value => update(key, value) })),
          h('div', { className: 'step-actions' },
            sectionIndex > 0 && h('button', { className: 'button', onClick: () => goToSection(navigation[sectionIndex - 1][0]) }, 'Back'),
            h('button', { className: 'button primary', onClick: () => {
              if (sectionIndex + 1 < navigation.length) goToSection(navigation[sectionIndex + 1][0]);
              else setMode('design');
            } }, sectionIndex + 1 < navigation.length ? 'Next: ' + navigation[sectionIndex + 1][1] : 'Continue to design'))),
          mode === 'design' && h('section', { className: 'card settings-card' },
            h('h3', null, 'Document settings'),
            selectField('Paper size', design.paper, [['letter', 'US Letter'], ['a4', 'A4']], value => changeDesign('paper', value)),
            selectField('Typeface', design.font, [['template', 'Template default'], ['serif', 'Serif'], ['sans', 'Sans serif']], value => changeDesign('font', value)),
            h('label', { className: 'checkbox-field' }, h('input', { type: 'checkbox', checked: design.compact,
              onChange: event => changeDesign('compact', event.target.checked) }), 'Compact spacing'),
            h('button', { className: 'button primary', onClick: () => setMode('review') }, 'Review resume')),
          mode === 'review' && h('section', { className: 'card' },
            h('h3', null, 'Before you export'),
            h('ul', { className: 'review-list' }, checks.map(([label, done, key]) => h('li', { key: label },
              h('span', null, label), h('button', { className: 'button small', onClick: () => goToSection(key) }, done ? 'Added · Edit' : 'Add')))),
            h('p', null, 'In the print dialog, choose Save as PDF and turn off browser headers and footers.'),
            h('button', { className: 'button primary', onClick: printResume }, 'Save as PDF')),
          h('button', { className: 'remove reset', onClick: () => {
            if (window.confirm('Clear this resume draft from this browser?')) setDraft({ ...blankDraft(), template: draft.template });
          } }, 'Start over')),
        h('aside', { className: 'preview', 'aria-label': 'Live preview' },
          h('div', { className: 'preview-header' }, h('h2', null, 'Live preview'),
            h('span', null, (design.paper === 'a4' ? 'A4' : 'US Letter') + ' · ' + format.name)),
          h(Resume, { draft, template: draft.template, ...design }))));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
}
