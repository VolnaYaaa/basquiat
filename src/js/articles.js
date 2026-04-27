const nodes = document.querySelectorAll('.article .node');
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

  nodes.forEach(node => {
    let x, y, rect;
    let attempts = 0;

    do {
      x = paddingPercent + Math.random() * (100 - paddingPercent * 2);
      y = paddingPercent + Math.random() * (100 - paddingPercent * 2);
      node.style.left = x + '%';
      node.style.top = y + '%';
      rect = node.getBoundingClientRect();
      attempts++;
    } while (placed.some(r => rectsOverlap(r, rect)) && attempts < 100);

    placed.push(rect);
  });
}

placeElements();

nodes.forEach(node => {
  node.addEventListener('click', () => {
    const id = node.dataset.id;
    const data = content[id];
    let currentSlide = 0; // текущий слайд

    function renderSlide() {
      const slide = data.slides[currentSlide];
      popupContent.innerHTML = `
        <h2>${data.title}</h2>
        <img src="${slide.image}" style="width:100%" />
        <h3>${slide.name}</h3>
        <p>${slide.desc}</p>
        <div class="slider-controls">
          <button id="prev">←</button>
          <span>${currentSlide + 1} / ${data.slides.length}</span>
          <button id="next">→</button>
        </div>
      `;

      // кнопки переключения
      document.getElementById('prev').onclick = () => {
        currentSlide = (currentSlide - 1 + data.slides.length) % data.slides.length;
        renderSlide();
      };
      document.getElementById('next').onclick = () => {
        currentSlide = (currentSlide + 1) % data.slides.length;
        renderSlide();
      };
    }

    renderSlide();
    popup.classList.add('visible');
  });
});

/* const content = {
  anatomy: {
    title: 'Anatomy',
    image: 'public/imgs/anatomy/anatomy-10.jpg',
    desc: 'Jean-Michel Basquiat, renowned for his raw, yet eloquent works, enters into a realm of quiet introspection with his Anatomy series. This collection holds a striking visual contrast compared to Basquiat’s other works, considering its limited colour palette and equally concise drawings. Rooted in personal experiences—a childhood accident, a gift of Gray's Anatomy from his mother—the Anatomy series goes beyond clinical representation, acting as Basquiat's reflection on existence, identity, and human fragility. While much of his work critiques societal structures, this series offers a momentary respite, urging viewers to marvel at the wonder of the human form. Through Anatomy, Basquiat challenges, enlightens, and invites contemplation on the universal experience of being human.',

    slides: [
      {
        image: '/imgs/anatomy/anatomy-9.jpg',
        name: 'Skull Study',
        desc: 'Описание этой картины...'
      },
     
    ]
  },
} */