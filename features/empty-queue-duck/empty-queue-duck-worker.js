const DUCK_CLASS = 'mytoolbox-dancing-duck';

function injectDuckStyle() {
  if (document.getElementById('mytoolbox-duck-style')) return;
  const style = document.createElement('style');
  style.id = 'mytoolbox-duck-style';
  style.textContent = `
    @keyframes mytoolbox-duck-dance {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      25% { transform: rotate(-20deg) translateY(-10px); }
      75% { transform: rotate(20deg) translateY(-10px); }
    }
    .${DUCK_CLASS} {
      font-size: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: mytoolbox-duck-dance 1s infinite;
      width: 100%;
      height: 100%;
    }
  `;
  document.head.appendChild(style);
}

function createDuck() {
  injectDuckStyle();
  const duck = document.createElement('div');
  duck.className = DUCK_CLASS;
  duck.textContent = '🦆';
  return duck;
}

function replaceEmptyQueueImage() {
  const img = document.querySelector("div[data-testid^='servicedesk-queues-empty-queue'] img");
  if (img && !img.dataset.duckified) {
    img.dataset.duckified = 'true';
    img.replaceWith(createDuck());
  }
}

function observeEmptyQueue() {
  replaceEmptyQueueImage();
  const observer = new MutationObserver(replaceEmptyQueueImage);
  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener('load', observeEmptyQueue);
