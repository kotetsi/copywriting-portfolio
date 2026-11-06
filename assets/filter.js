const filterBar = document.querySelector('.filter-bar');
const buttons = [...filterBar.querySelectorAll('[data-filter]')];
const projects = [...document.querySelectorAll('[data-project]')];
const count = filterBar.querySelector('[data-count]');

function show(category) {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  }
  let shown = 0;
  for (const project of projects) {
    project.hidden = category !== 'all' && category !== project.dataset.category;
    shown += Number(!project.hidden);
  }
  count.textContent = shown === 1 ? '1 έργο' : `${shown} έργα`;
}

filterBar.hidden = false;
for (const button of buttons) {
  button.addEventListener('click', () => show(button.dataset.filter));
}
