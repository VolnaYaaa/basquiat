const paragraphs = document.querySelectorAll('.article p');
const paddingPercent = 5;
const placed = [];

function rectsOverlap(a, b, gap = 20) {
  return !(
    a.right + gap < b.left ||
    a.left - gap > b.right ||
    a.bottom + gap < b.top ||
    a.top - gap > b.bottom
  );
}

function placeElements() {
  placed.length = 0;

  paragraphs.forEach(p => {
    let x, y, rect;
    let attempts = 0;

    do {
      x = paddingPercent + Math.random() * (100 - paddingPercent * 2);
      y = paddingPercent + Math.random() * (100 - paddingPercent * 2);
      p.style.left = x + '%';
      p.style.top = y + '%';
      rect = p.getBoundingClientRect();
      attempts++;
    } while (placed.some(r => rectsOverlap(r, rect)) && attempts < 100);

    placed.push(rect);
  });
}

placeElements();