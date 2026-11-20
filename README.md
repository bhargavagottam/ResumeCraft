# ResumeCraft

ResumeCraft is a browser-based React resume builder. It uses a single-column layout, standard section headings, and selectable text for an ATS-friendly document.

- Import a text-based PDF, DOCX, TXT, or Markdown resume. Choose whether to convert the resume, then compare the extracted text with the preview before applying. Import runs in the browser.
- Open the sections you need on one page. The live preview uses a single-column resume format and omits empty sections.
- Edit contact details, a summary, skills, work experience, projects, education, and certifications. Empty sections disappear from the preview.
- Save a PDF using the browser print dialog. Choose **Save as PDF** as the destination and turn off browser headers and footers. Follow the employer's requested file format.
- Drafts are stored in this browser when storage is available. Clear the draft using **Start over** on a shared device.

## Run locally

Serve the repository with `python -m http.server 8000` and open http://localhost:8000/docs/. The static frontend loads pinned React and ReactDOM scripts from jsDelivr. No build step, API, or database is required.

## GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save. The published site will be at https://bhargavagottam.github.io/ResumeCraft/.
