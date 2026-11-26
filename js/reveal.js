// ظاهر شدن تدریجی عناصر هنگام اسکرول.
// هر قاعده: [انتخابگر CSS، جهت]. جهت 'alt' یعنی یکی از راست و یکی از چپ.
const REVEAL_RULES = [
  ['.section h2, .page-title, .month-title', 'right'],
  ['.quick .card, .news-card, .honor-card, .stat, .download-card, .channel', 'up'],
  ['.gallery figure', 'alt'],
  ['.location-card, .event', 'right'],
  ['.since > *', 'up']
];

const REVEAL_SELECTOR = REVEAL_RULES.map(([selector]) => selector).join(',');

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('in');   // CSS انیمیشن را اجرا می‌کند
    observer.unobserve(entry.target);   // فقط یک بار
  }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

function prepare(element) {
  if (element.dataset.reveal) return;
  const [, rule] = REVEAL_RULES.find(([selector]) => element.matches(selector));
  const siblings = [...element.parentElement.children].filter(child => child.matches(REVEAL_SELECTOR));
  const index = siblings.indexOf(element);
  element.dataset.reveal = rule === 'alt' ? (index % 2 === 0 ? 'right' : 'left') : rule;
  element.style.setProperty('--delay', `${(index % 4) * 90}ms`);   // ورود پله‌ای
  observer.observe(element);
}

function scan(root) {
  if (root.matches?.(REVEAL_SELECTOR)) prepare(root);
  root.querySelectorAll?.(REVEAL_SELECTOR).forEach(prepare);
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scan(document);
  // عناصری که بعداً با JS ساخته می‌شوند (کارت‌های خبر و افتخار) هم شامل شوند
  new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      addedNodes.forEach(node => node.nodeType === Node.ELEMENT_NODE && scan(node));
    }
  }).observe(document.body, { childList: true, subtree: true });
}
