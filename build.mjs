import { readFile, readdir, mkdir, writeFile, cp, access, realpath, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects, categories } from './content/projects.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const out = resolve(root, 'dist');
const read = async (file) => readFile(resolve(root, file), 'utf8');
const json = async (file) => JSON.parse(await read(file));
const { slides, cv } = await json('content/source.json');
const images = await json('content/images.json');
const settings = await json('site.json');
const siteUrl = (process.env.SITE_URL || settings.siteUrl || process.env.URL || '').replace(/\/+$/, '');
if (siteUrl && !/^https:\/\/[^/?#]+(?:\/[\w.-]+)*$/.test(siteUrl)) {
  throw new Error('SITE_URL must be an HTTPS site URL, e.g. https://example.com or https://owner.github.io/portfolio');
}
const basePath = siteUrl ? new URL(siteUrl).pathname.replace(/\/$/, '') : '';
const hasPdf = await access(resolve(root, 'assets/cv.pdf')).then(() => true, () => false);
const routes = [];
const nav = [['home','/','Αρχική'],['work','/work/','Δουλειά'],['cv','/cv/','CV'],['articles','/articles/','Άρθρα']];
const social = [['LinkedIn', slides[0].links[3]], ['Instagram', slides[0].links[2]], ['Facebook', slides[0].links[0]], ['X', slides[0].links[1]]];
const deck = 'https://docs.google.com/presentation/d/1iOwq0PZsxBOG9S4XnEm1lZvUzE6gzQ-fXCU07L2A9eY/edit';
const intro = 'Είμαι ο Νίκος Μπόβολος, Senior Copywriter με 10 χρόνια εμπειρίας στη διαφήμιση. Γράφω ιδέες που δουλεύουν σε μια οθόνη, σε ένα σποτ ή σε μια κουβέντα την επόμενη μέρα.';
const about = 'Ξεκίνησα από τη δημοσιογραφία και πέρασα στη διαφήμιση. Σήμερα γράφω σενάρια, καμπάνιες και κείμενα για brands. Έχω γράψει χιουμοριστικά σχόλια για το Gazzetta, ένα βιβλίο με τίτλο «Επαγγελματίας Ζαμπονοκόπτης» και, μαζί με τον Θοδωρή, παρουσιάζω το podcast «ΡΕ ΤΙ ΛΕΤΕ ΡΕ;». Σε ό,τι γράφω, με απασχολεί το ίδιο πράγμα: ποια φράση αξίζει να μείνει;';
const year = new Date().getUTCFullYear();

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}
function link(url, label, className = '') {
  return `<a${className ? ` class="${className}"` : ''} href="${esc(url)}">${label}</a>`;
}
const arrow = '<span aria-hidden="true">↗</span>';
const right = '<span aria-hidden="true">→</span>';
const mail = (label) => link(`mailto:${settings.email}`, label);
const number = (i) => String(i + 1).padStart(2, '0');
const pdf = () => hasPdf
  ? '<a class="button" href="/assets/cv.pdf" download="nikos-bovolos-cv.pdf">Κατέβασε το CV <span aria-hidden="true">↓</span></a>'
  : '<span class="small">[Προσθήκη PDF]</span>';

async function page(path, section, title, description, body, options = {}) {
  const { image = 'share.png', article = false, notFound = false, demo = false } = options;
  if (!notFound && !demo) routes.push(path);
  const fullTitle = section === 'home' ? 'Νίκος Μπόβολος — Senior Copywriter' : `${title} — Νίκος Μπόβολος`;
  const canonical = siteUrl && !notFound ? `${siteUrl}${path}` : '';
  const imageUrl = siteUrl ? `${siteUrl}/assets/${image}` : `/assets/${image}`;
  const navLinks = nav.map(([key, href, label]) => `<a href="${href}"${key === section ? ` aria-current="${path === href ? 'page' : 'location'}"` : ''}>${label}</a>`).join('');
  const socialLinks = social.map(([label, url]) => link(url, `${label} ${arrow}`)).join('');
  const html = `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fff8ed">
${notFound || demo ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">` : ''}
<meta property="og:type" content="${article ? 'article' : 'website'}">
<meta property="og:locale" content="el_GR">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:image:alt" content="${esc(image === 'share.png' ? 'Νίκος Μπόβολος, Senior Copywriter' : title)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css">
${section === 'work' && path === '/work/' ? '<script src="/assets/filter.js" defer></script>' : ''}
</head>
<body>
<a class="skip" href="#main">Μετάβαση στο περιεχόμενο</a>
<header class="site-header"><div class="wrap header-inner">
<a class="wordmark" href="/" aria-label="Νίκος Μπόβολος, αρχική">νίκος<span>.</span></a>
<nav class="main-nav" aria-label="Κύρια πλοήγηση">${navLinks}</nav>
</div></header>
<main id="main" tabindex="-1">${body}</main>
<footer class="site-footer" id="contact"><div class="wrap">
<p class="eyebrow"><span class="dot"></span> ΕΠΙΚΟΙΝΩΝΙΑ</p>
<div class="footer-top"><div><h2>Έχεις κάτι στα σκαριά;</h2>${mail(`${esc(settings.email)} ${arrow}`)}</div>
<nav class="social" aria-label="Κοινωνικά δίκτυα">${socialLinks}</nav></div>
<div class="footer-base"><small>© ${year} Νίκος Μπόβολος</small><a href="#main">Πίσω στην αρχή ↑</a></div>
</div></footer>
</body>
</html>`;
  const target = resolve(out, notFound ? '404.html' : `.${path}index.html`);
  await mkdir(dirname(target), { recursive: true });
  const output = basePath
    ? html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${basePath}/`)
    : html;
  await writeFile(target, output);
}

function withSource(project) {
  const entries = project.slides.map((i) => slides[i]);
  const from = (ref) => ref ? slides[ref[0]].text[ref[1]] : '';
  return {
    ...project,
    description: project.description || from(project.descriptionFrom),
    result: project.result || from(project.resultFrom),
    visuals: entries.flatMap((item) => item.assets),
    links: [...new Set(entries.flatMap((item) => item.links))],
    source: `${deck}#slide=id.${entries[0].id}`,
  };
}
const work = projects.map(withSource);
const featured = work.filter((project) => project.featured);
const workPath = (project) => `/work/${project.slug}/`;

function imageTag(file, alt, eager = false) {
  const size = images[file];
  if (!size) return '';
  return `<img src="/assets/${file}.jpg" width="${size.w}" height="${size.h}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
}
function cover(project) {
  const file = project.cover || project.visuals.find((item) => images[item.file])?.file;
  return file
    ? imageTag(file, '')
    : `<span class="type-cover" aria-hidden="true"><span>✳</span>${esc(project.title)}</span>`;
}
function workCards(items) {
  return items.map((project, i) => `<article class="work-card" data-category="${project.category}" data-project>
    <a class="work-link" href="${workPath(project)}">
      <div class="work-image theme-${project.category}">${cover(project)}</div>
      <div class="card-meta"><span>${esc(project.format || categories[project.category])}</span><span>${number(i)} / ${number(items.length - 1)}</span></div>
      <div class="card-title"><h3>${esc(project.title)}</h3><span class="circle">${arrow}</span></div>
      <p>${esc(project.brand || project.description || 'Από το portfolio')}</p>
    </a>
  </article>`).join('');
}
function heading(kicker, title, copy) {
  return `<div class="wrap page-head"><p class="eyebrow"><span class="dot"></span> ${kicker}</p><h1>${title}</h1><p class="lede">${copy}</p></div>`;
}
function detail(label, value) {
  return value ? `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>` : '';
}
function slideVisual(item, project, i) {
  if (item.type === 'video') {
    const image = imageTag(item.file, '', i === 0);
    return `<figure class="visual"><a class="video-link" href="${esc(item.url)}">${image}<span class="play"><span aria-hidden="true">▶</span> Δες το βίντεο${project.visuals.length > 1 ? ' ' + number(i) : ''} ${arrow}</span></a></figure>`;
  }
  const alt = settings.imageAlt[item.file] || `Δείγμα ${i + 1} από το έργο «${project.title}»`;
  return `<figure class="visual">${imageTag(item.file, alt, i === 0)}</figure>`;
}

function safeUrl(url) {
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|\/(?!\/)[^\s\\]*)$/.test(url) ? url : '';
}
function inline(value) {
  return [...value.matchAll(/\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`|([^\[*`]+|.)/g)].map((m) => {
    if (m[1]) return safeUrl(m[2]) ? link(m[2], esc(m[1])) : esc(m[0]);
    if (m[3]) return `<strong>${esc(m[3])}</strong>`;
    if (m[4]) return `<em>${esc(m[4])}</em>`;
    if (m[5]) return `<code>${esc(m[5])}</code>`;
    return esc(m[0]);
  }).join('');
}
function markdown(content) {
  const blocks = [];
  let paragraph = [];
  let bullets = [];
  function flush() {
    if (paragraph.length) blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);
    if (bullets.length) blocks.push(`<ul>${bullets.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    paragraph = [];
    bullets = [];
  }
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const head = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!line) { flush(); continue; }
    if (head) { flush(); const level = head[1].length; blocks.push(`<h${level}>${inline(head[2])}</h${level}>`); continue; }
    if (line.startsWith('- ')) {
      if (paragraph.length) flush();
      bullets.push(line.slice(2));
      continue;
    }
    if (bullets.length) flush();
    paragraph.push(line);
  }
  flush();
  return blocks.join('\n');
}
async function readArticles() {
  const dir = 'content/articles';
  const files = (await readdir(resolve(root, dir))).filter((file) => file.endsWith('.md'));
  const articles = await Promise.all(files.map(async (file) => {
    const slug = file.slice(0, -3);
    const raw = (await read(`${dir}/${file}`)).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const match = /^---\n([\s\S]+?)\n---\n([\s\S]+)$/.exec(raw);
    if (!match || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid article format: ${file}`);
    const fields = Object.fromEntries(match[1].split('\n').map((line) => {
      const split = line.indexOf(':');
      return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
    }));
    const { title, date, excerpt, tags, demo } = fields;
    const timestamp = Date.parse(date);
    if (!title || !excerpt || !tags || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date ||
      !['true','false'].includes(demo)) throw new Error(`Invalid article metadata: ${file}`);
    return { slug, title, date, excerpt, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), demo: demo === 'true', body: markdown(match[2]) };
  }));
  return articles.sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
const articles = await readArticles();
const articlePath = (article) => `/articles/${article.slug}/`;
const dateFormat = new Intl.DateTimeFormat('el-GR', { dateStyle:'long', timeZone:'UTC' });
function articleRows(items) {
  return items.map((article) => `<article class="article-row">
    <div class="article-meta"><time datetime="${article.date}">${dateFormat.format(new Date(article.date))}</time>${article.demo ? '<span class="badge">Demo</span>' : ''}</div>
    <div><h3>${link(articlePath(article), esc(article.title))}</h3><p>${esc(article.excerpt)}</p><p class="tags">${article.tags.map(esc).join(' · ')}</p></div>
    <span class="circle" aria-hidden="true">${right}</span>
  </article>`).join('');
}

// A fresh build removes old routes when an article or project is removed.
try {
  if (await realpath(out) !== resolve(await realpath(root), 'dist')) {
    throw new Error('dist/ must resolve to the output directory inside the project');
  }
  await rm(out, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await page('/', 'home', '', 'Portfolio, βιογραφικό και άρθρα του Νίκου Μπόβολου, Senior Copywriter με 10 χρόνια εμπειρίας στη διαφήμιση.', `
  <section class="wrap hero" aria-labelledby="hero-title">
    <div class="hero-copy"><p class="eyebrow"><span class="dot"></span> ΝΙΚΟΣ ΜΠΟΒΟΛΟΣ <span class="divider">/</span> SENIOR COPYWRITER</p>
    <h1 id="hero-title">Γράφω για να<br class="desktop-break"> <em>μείνει κάτι<span class="hero-period">.</span></em></h1>
    <p class="lede">${esc(intro)}</p>
    <div class="actions">${link('/work/', `Δες δουλειά ${right}`, 'button primary')}${link('/cv/', `Δες το CV ${arrow}`, 'button')}</div></div>
    <div class="hero-art" aria-hidden="true">
      <div class="art-top"><span>ΤΥΠΟΓΡΑΦΙΚΕΣ ΠΑΡΕΚΤΡΟΠΕΣ</span><span>FIG. 01</span></div>
      <img class="art-mark" src="/assets/cherry-quotes.svg" width="440" height="300" alt="" fetchpriority="high">
      <div class="art-bottom"><span>Το κερασάκι στο copy.</span><span>ΝΜ&nbsp;✦</span></div>
    </div>
  </section>
  <section class="wrap section" aria-labelledby="selected-title">
    <div class="section-head"><div><p class="eyebrow">01 / PORTFOLIO</p><h2 id="selected-title">Δουλειά που <em>βγήκε έξω.</em></h2></div>${link('/work/', `Όλο το portfolio ${arrow}`, 'text-link')}</div>
    <div class="work-grid">${workCards(featured)}</div>
  </section>
  <section class="about-band"><div class="wrap about-inner"><p class="eyebrow">02 / ΣΧΕΤΙΚΑ</p><div><h2>Λίγα για <em>μένα.</em></h2><p>${esc(about)}</p>${link('/cv/', `Η διαδρομή μου ${arrow}`, 'text-link')}</div></div></section>
  <section class="wrap section" aria-labelledby="journal-title">
    <div class="section-head"><div><p class="eyebrow">03 / ΑΡΘΡΑ</p><h2 id="journal-title">Στο <em>περιθώριο.</em></h2></div>${link('/articles/', `Όλα τα άρθρα ${arrow}`, 'text-link')}</div>
    <div class="article-list">${articleRows(articles.slice(0, 2))}</div>
  </section>`);

const filters = [['all','Όλα'], ...Object.entries(categories).filter(([key]) => work.some((item) => item.category === key))];
await page('/work/', 'work', 'Δουλειά', 'Τηλεοπτικά σποτ, καμπάνιες, digital έργα, αρθρογραφία και προσωπικά projects του Νίκου Μπόβολου.', `
  ${heading('01 / PORTFOLIO', 'Η <em>δουλειά.</em>', 'Από τηλεοπτικά σποτ και καμπάνιες μέχρι στήλες, σελίδες και ένα βιβλίο. Διάλεξε τι θες να δεις.')}
  <section class="wrap listing" aria-label="Έργα portfolio">
    <div class="filter-bar" hidden><div role="group" aria-label="Φίλτρα έργων">${filters.map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="${key === 'all'}">${label}</button>`).join('')}</div><p class="eyebrow" role="status" data-count>${work.length} έργα</p></div>
    <div class="work-grid">${workCards(work)}</div>
    <details class="clients"><summary>Πελάτες που αναφέρονται στο portfolio</summary><p>${esc(slides[1].text[0].split('\n').filter(Boolean).slice(1).join(' '))}</p></details>
  </section>`);

for (const project of work) {
  const gallery = project.visuals.map((item, i) => slideVisual(item, project, i)).join('');
  const refs = project.links.map((url, i) => link(url, `${esc(project.linkLabels?.[i] || 'Δες το σχετικό υλικό')} ${arrow}`, 'text-link'));
  const visual = project.cover || project.visuals.find((item) => images[item.file])?.file;
  await page(workPath(project), 'work', project.title, project.description || `Δείγμα δουλειάς από το portfolio του Νίκου Μπόβολου. ${project.title}.`, `
    <article class="wrap case">
      ${link('/work/', '<span aria-hidden="true">←</span> Όλα τα έργα', 'back')}
      <header class="case-head"><p class="eyebrow"><span class="dot"></span> ${esc(categories[project.category])}</p><h1>${esc(project.title)}</h1>
      ${project.description ? `<p class="lede">${esc(project.description)}</p>` : ''}</header>
      <dl class="case-facts">${detail('Brand / φορέας', project.brand)}${detail('Είδος', project.format || categories[project.category])}${detail('Ρόλος', project.role)}${detail('Διάκριση', project.result)}</dl>
      <div class="gallery">${gallery}</div>
      <div class="case-links">${refs.join('')}${link(project.source, `Διαφάνεια από το αρχικό portfolio ${arrow}`, 'text-link')}</div>
    </article>`, { image: visual ? `${visual}.jpg` : 'share.png' });
}

const expEnd = cv.indexOf('FACEBOOK PAGES');
const experience = [];
for (let i = 2; i < expEnd; i += 2) {
  const [period, role] = cv[i + 1].split('\u000b');
  experience.push({ name: cv[i], period, role });
}
function cvGroup(title) {
  const start = cv.indexOf(title) + 1;
  const ends = ['FACEBOOK PAGES','ΣΥΓΓΡΑΦΙΚΟ ΕΡΓΟ','ΔΕΞΙΟΤΗΤΕΣ','ΕΚΠΑΙΔΕΥΣΗ','ΓΛΩΣΣΕΣ','ΒΡΑΒΕΙΑ & ΔΙΑΚΡΙΣΕΙΣ'];
  const next = cv.findIndex((value, i) => i >= start && ends.includes(value));
  return cv.slice(start, next < 0 ? undefined : next);
}
const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
const cvBlock = (title, items) => `<section class="cv-block"><h2>${title}</h2>${list(items)}</section>`;
const projectList = featured.map((project) => link(workPath(project), esc(project.title)));
const cvFooter = `<p class="print-contact">${esc(settings.email)} · linkedin.com/in/nikos-bovolos</p>`;
await page('/cv/', 'cv', 'Βιογραφικό', 'Το βιογραφικό του Νίκου Μπόβολου, Senior Copywriter. Εμπειρία, εκπαίδευση, διακρίσεις, δεξιότητες και επιλεγμένα έργα.', `
  ${heading('02 / ΒΙΟΓΡΑΦΙΚΟ', 'Νίκος <em>Μπόβολος.</em>', esc(intro))}
  <div class="wrap cv-shell"><div class="cv-tools">${pdf()}<a href="/work/" class="text-link">Portfolio ${arrow}</a></div>${cvFooter}
    <div class="cv-grid"><section class="cv-block"><h2>Εμπειρία</h2><ol class="timeline">${experience.map(({name,period,role}) => `<li><p class="cv-date">${esc(period)}</p><h3>${esc(name)}</h3><p>${esc(role)}</p></li>`).join('')}</ol></section>
    <div class="cv-side">
      ${cvBlock('Βραβεία & διακρίσεις', cvGroup('ΒΡΑΒΕΙΑ & ΔΙΑΚΡΙΣΕΙΣ').map(esc))}
      ${cvBlock('Δεξιότητες', cvGroup('ΔΕΞΙΟΤΗΤΕΣ').map(esc))}
      ${cvBlock('Εκπαίδευση', cvGroup('ΕΚΠΑΙΔΕΥΣΗ').flatMap((value) => value.split('\u000b')).map(esc))}
      ${cvBlock('Γλώσσες', cvGroup('ΓΛΩΣΣΕΣ').map(esc))}
      ${cvBlock('Επιλεγμένα έργα', projectList)}
      ${cvBlock('Συγγραφικό έργο', cvGroup('ΣΥΓΓΡΑΦΙΚΟ ΕΡΓΟ').map(esc))}
      ${cvBlock('Χιουμοριστικές σελίδες Facebook', cvGroup('FACEBOOK PAGES').slice(1).filter((item) => !item.startsWith('*')).map(esc))}
    </div></div>
  </div>`);

await page('/articles/', 'articles', 'Άρθρα', 'Σημειώσεις για copywriting, brand voice, brief και επιμέλεια κειμένου.', `
  ${heading('03 / ΑΡΘΡΑ', 'Στο <em>περιθώριο.</em>', 'Σημειώσεις για τις λέξεις, τη δουλειά και τα δεύτερα drafts.')}
  <section class="wrap listing article-list" aria-labelledby="article-list-title"><h2 class="sr-only" id="article-list-title">Λίστα άρθρων</h2>${articleRows(articles) || '<p>Τα πρώτα άρθρα ετοιμάζονται.</p>'}</section>`);
for (const article of articles) {
  await page(articlePath(article), 'articles', article.title, article.excerpt, `
    <article class="wrap case article-page">
    ${link('/articles/', '<span aria-hidden="true">←</span> Όλα τα άρθρα', 'back')}
    <header class="case-head"><div class="article-meta"><time datetime="${article.date}">${dateFormat.format(new Date(article.date))}</time>${article.demo ? '<span class="badge">Demo άρθρο</span>' : ''}</div>
    <h1>${esc(article.title)}</h1><p class="lede">${esc(article.excerpt)}</p><p class="tags">${article.tags.map(esc).join(' · ')}</p></header>
    <div class="prose">${article.body}</div></article>`, { article: true, demo: article.demo });
}

await page('/404.html', '', 'Η σελίδα χάθηκε', 'Η σελίδα δεν βρέθηκε.', `
  ${heading('404 / ΜΙΑ ΧΑΜΕΝΗ ΓΡΑΜΜΗ', 'Κάτι <em>χάθηκε.</em>', 'Η σελίδα που ψάχνεις έχει αλλάξει διεύθυνση ή δεν υπάρχει.')}
  <div class="wrap listing">${link('/', `Πίσω στην αρχική ${right}`, 'button primary')}</div>`, { notFound: true });

await cp(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });
const xml = routes.map((path) => `  <url><loc>${esc(siteUrl + path)}</loc></url>`).join('\n');
await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteUrl ? xml : ''}\n</urlset>\n`);
await writeFile(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
console.log(`Built ${work.length} projects, ${articles.length} articles and ${routes.length} indexable routes in dist/.`);
