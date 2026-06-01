// import Swiper from 'swiper/swiper-bundle.mjs';
// import 'swiper/swiper-bundle.css';

// import anatomy1 from 'url:../../public/imgs/articles/anatomy/anatomy-1.png';
// import anatomy2 from 'url:../../public/imgs/articles/anatomy/anatomy-2.png';
// import anatomy3 from 'url:../../public/imgs/articles/anatomy/anatomy-3.png';
// import anatomy4 from 'url:../../public/imgs/articles/anatomy/anatomy-4.png';
// import anatomy5 from 'url:../../public/imgs/articles/anatomy/anatomy-5.png';
// import anatomy6 from 'url:../../public/imgs/articles/anatomy/anatomy-6.png';
// import anatomy7 from 'url:../../public/imgs/articles/anatomy/anatomy-7.png';
// import anatomy8 from 'url:../../public/imgs/articles/anatomy/anatomy-8.png';
// import anatomy9 from 'url:../../public/imgs/articles/anatomy/anatomy-9.png';
// import anatomy10 from 'url:../../public/imgs/articles/anatomy/anatomy-10.png';

// import jawbone1 from 'url:../../public/imgs/articles/jawbone_of_an_ass/Jawbone Of An Ass-1.png';
// import jawbone2 from 'url:../../public/imgs/articles/jawbone_of_an_ass/Jawbone Of An Ass.png';
// import jawbone3 from 'url:../../public/imgs/articles/jawbone_of_an_ass/image 15.png';

// import hollywood1 from 'url:../../public/imgs/articles/hollywood_africans/image 15.png';
// import hollywood2 from 'url:../../public/imgs/articles/hollywood_africans/image 16.png';

// import figure1 from 'url:../../public/imgs/articles/the_figure_portfolio/The Figure I.png';
// import figure2 from 'url:../../public/imgs/articles/the_figure_portfolio/The Figure II.png';
// import figure3 from 'url:../../public/imgs/articles/the_figure_portfolio/The Figure III.png';
// import figure4 from 'url:../../public/imgs/articles/the_figure_portfolio/The Figure IV.png';
// import figure5 from 'url:../../public/imgs/articles/the_figure_portfolio/The Figure V.png';

// import superhero1 from 'url:../../public/imgs/articles/superhero_portfolio/A Panel of Experts (Superhero Portfolio).png';
// import superhero2 from 'url:../../public/imgs/articles/superhero_portfolio/Flash In Naples.png';
// import superhero3 from 'url:../../public/imgs/articles/superhero_portfolio/Piano Lesson.png';
// import superhero4 from 'url:../../public/imgs/articles/superhero_portfolio/Riddle Me This.png';

// import daros1 from 'url:../../public/imgs/articles/daros suit/50 Cent Piece, 1982.png';
// import daros2 from 'url:../../public/imgs/articles/daros suit/Ascent.png';
// import daros3 from 'url:../../public/imgs/articles/daros suit/Jawbone Of An Ass.png';
// import daros4 from 'url:../../public/imgs/articles/daros suit/King Brand, 1983.png';
// import daros5 from 'url:../../public/imgs/articles/daros suit/Liberty, 1983.png';
// import daros6 from 'url:../../public/imgs/articles/daros suit/Olympic.png';

// import music1 from 'url:../../public/imgs/articles/music/Jawbone Of An Ass-1.png';
// import music2 from 'url:../../public/imgs/articles/music/Jawbone Of An Ass-2.png';
// import music3 from 'url:../../public/imgs/articles/music/Jawbone Of An Ass-3.png';
// import music4 from 'url:../../public/imgs/articles/music/Jawbone Of An Ass-4.png';
// import music5 from 'url:../../public/imgs/articles/music/Jawbone Of An Ass-5.png';

// const articles = {
//   'Anatomy': [anatomy1, anatomy2, anatomy3, anatomy4, anatomy5, anatomy6, anatomy7, anatomy8, anatomy9, anatomy10],
//   'Jawbone Of An Ass': [jawbone1, jawbone2, jawbone3],
//   'Hollywood Africans': [hollywood1, hollywood2],
//   'The Figure Portfolio': [figure1, figure2, figure3, figure4, figure5],
//   'Superhero Portfolio': [superhero1, superhero2, superhero3, superhero4],
//   'Daros Suite': [daros1, daros2, daros3, daros4, daros5, daros6],
//   'Music': [music1, music2, music3, music4, music5],
// };

const popup = document.getElementById('article-popup');
const closeBtn = document.getElementById('popup-close');

// const swiper = new Swiper('.swiper', {
//   direction: 'horizontal',
//   navigation: {
//     nextEl: '.swiper-button-next',
//     prevEl: '.swiper-button-prev',
//   },
//   pagination: {
//     el: '.swiper-pagination',
//     clickable: true,
//   },
// });

window.addEventListener('word-click', (e) => {
  const word = e.detail.word;

  // document.querySelector('.swiper-wrapper').innerHTML = images
  //   .map(src => `<div class="swiper-slide"><img src="${src}" /></div>`)
  //   .join('');

  // swiper.update();

  document.querySelector('.popup-title').textContent = word;
  popup.classList.add('active');
});

closeBtn.addEventListener('click', () => popup.classList.remove('active'));

popup.addEventListener('click', (e) => {
  if (e.target === popup) popup.classList.remove('active');
});
