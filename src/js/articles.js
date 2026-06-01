// import Swiper from 'swiper/swiper-bundle.mjs';
// import 'swiper/swiper-bundle.css';
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


  // document.querySelector('.swiper-wrapper').innerHTML = images
  //   .map(src => `<div class="swiper-slide"><img src="${src}" /></div>`)
  //   .join('');

  // swiper.update();

import anatomy1 from 'url:../../public/imgs/articles/anatomy/anatomy-1.png';
import anatomy2 from 'url:../../public/imgs/articles/anatomy/anatomy-2.png';
import anatomy3 from 'url:../../public/imgs/articles/anatomy/anatomy-3.png';
import anatomy4 from 'url:../../public/imgs/articles/anatomy/anatomy-4.png';
import anatomy5 from 'url:../../public/imgs/articles/anatomy/anatomy-5.png';
import anatomy6 from 'url:../../public/imgs/articles/anatomy/anatomy-6.png';
import anatomy7 from 'url:../../public/imgs/articles/anatomy/anatomy-7.png';
import anatomy8 from 'url:../../public/imgs/articles/anatomy/anatomy-8.png';
import anatomy9 from 'url:../../public/imgs/articles/anatomy/anatomy-9.png';
import anatomy10 from 'url:../../public/imgs/articles/anatomy/anatomy-10.png';

import jawbone1 from 'url:../../public/imgs/articles/jawbone_of_an_ass/jawbone_of_an_ass-1.png';
import jawbone2 from 'url:../../public/imgs/articles/jawbone_of_an_ass/jawbone_of_an_ass.png';
import jawbone3 from 'url:../../public/imgs/articles/jawbone_of_an_ass/image_15.png';

import hollywood1 from 'url:../../public/imgs/articles/hollywood_africans/image_15.png';
import hollywood2 from 'url:../../public/imgs/articles/hollywood_africans/image_16.png';

import figure1 from 'url:../../public/imgs/articles/the_figure_portfolio/the_figure_i.png';
import figure2 from 'url:../../public/imgs/articles/the_figure_portfolio/the_figure_ii.png';
import figure3 from 'url:../../public/imgs/articles/the_figure_portfolio/the_figure_iii.png';
import figure4 from 'url:../../public/imgs/articles/the_figure_portfolio/the_figure_iv.png';
import figure5 from 'url:../../public/imgs/articles/the_figure_portfolio/the_figure_v.png';

import superhero1 from 'url:../../public/imgs/articles/superhero_portfolio/a_panel_of_experts_(superhero_portfolio).png';
import superhero2 from 'url:../../public/imgs/articles/superhero_portfolio/flash_in_naples.png';
import superhero3 from 'url:../../public/imgs/articles/superhero_portfolio/piano_lesson.png';
import superhero4 from 'url:../../public/imgs/articles/superhero_portfolio/riddle_me_this.png';

import daros1 from 'url:../../public/imgs/articles/daros suit/50_cent_piece,_1982.png';
import daros2 from 'url:../../public/imgs/articles/daros suit/Ascent.png';
import daros3 from 'url:../../public/imgs/articles/daros suit/jawbone_of_an_ass.png';
import daros4 from 'url:../../public/imgs/articles/daros suit/king_brand,_1983.png';
import daros5 from 'url:../../public/imgs/articles/daros suit/liberty,_1983.png';
import daros6 from 'url:../../public/imgs/articles/daros suit/Olympic.png';

import music1 from 'url:../../public/imgs/articles/music/jawbone_of_an_ass-1.png';
import music2 from 'url:../../public/imgs/articles/music/jawbone_of_an_ass-2.png';
import music3 from 'url:../../public/imgs/articles/music/jawbone_of_an_ass-3.png';
import music4 from 'url:../../public/imgs/articles/music/jawbone_of_an_ass-4.png';
import music5 from 'url:../../public/imgs/articles/music/jawbone_of_an_ass-5.png';





const articles = {
  'Anatomy': `Anatomy, Jean-Michel Basquiat, 1982. The artist's first print portfolio — eighteen silkscreens, each in an edition of 18 (plus 7 APs), 76.2 × 56.5 cm. Conceived in the basement studio of the Annina Nosei Gallery after his debut solo show. White anatomical sketches — skulls, femurs, scapulae, pelvises — glow against solid black like x-rays, each part labeled as in a medical textbook. The clinical restraint contrasts sharply with his chaotic, graffiti-rooted work. Inspired by Gray's Anatomy, a childhood gift.`,
  'Jawbone Of An Ass': `Jawbone of an Ass, Jean-Michel Basquiat, 1982. A mixed-media work (acrylic, oil sticks, collage) in the Neo-Expressionist spirit. The title refers to the biblical Samson, who slays a thousand enemies with a donkey's jawbone. Against a black-and-white ground flecked with red and yellow, Basquiat chaotically weaves together names and events — from Hannibal and the Punic Wars to the Louisiana Purchase — conjuring a cyclical vision of violence and power. Crossed-out text, crowns, and wordplay ('asbestos') form a sharp social commentary.`,
  'Hollywood Africans': `Hollywood Africans, Jean-Michel Basquiat, 1983. Acrylic and oil stick on canvas, approx. 210 × 210 cm, Whitney Museum. Against a golden-yellow ground, a group self-portrait of Basquiat with his fellow artists Toxic and Rammellzee, painted during a trip to Los Angeles. Obscured words — "Tobacco," "Sugar Cane," "Gangsterism," "What is Bwana?" — gather the stereotypes imposed on African American actors in Hollywood. A pointed critique of racial clichés in film and the commodification of Black culture.`,
  'The Figure Portfolio': `The Figure Portfolio (1982/2023), Jean-Michel Basquiat. A series of five hand-pulled screenprints, published by Flatiron Editions and authenticated by the artist's estate; edition of 85, 122 × 81 cm each. A posthumous release of 1980s prints in a Neo-Expressionist and Primitivist vein. Figures intertwine with abstract symbols and text, speaking to identity, segregation, and isolation. A deep blue echoes the Daros Suite, set off by red, orange, and yellow; among the figures is a female character rare in Basquiat's work.`,
  'Superhero Portfolio': `Superhero Portfolio (1982–87/2022), Jean-Michel Basquiat. A set of four hand-pulled screenprints (Riddle Me This, A Panel of Experts, Piano Lesson, Flash In Naples), released by the artist's estate in an edition of 85, 101.6 × 101.6 cm each. Basquiat reimagines the language of comics: mask-like heads, skeletal bodies, repeated laughter — "HA," "HEE," "HO." Acidic yellows, reds, and blues on scraped grounds. His superheroes appear vulnerable and uneasy — a sharp meditation on power, identity, and myth-making.`,
  'Basquiat as musician': `Jean-Michel Basquiat, musician. In 1979 the artist co-founded the experimental band Gray with Michael Holman, naming it after Gray's Anatomy — the textbook that also fed his painting. Part of the No Wave movement, Gray played deliberately dissonant, industrial, improvised music; by the band's rules, members weren't supposed to know how to play. Basquiat took up clarinet, guitar, and the Wasp synthesizer, performing at CBGB, the Mudd Club, and Hurrah's. After leaving the band in 1981 to focus on art, he also worked as a DJ at the club AREA.`,
  'Daros Suite': `Daros Suite, Jean-Michel Basquiat. A series of prints after The Daros Suite of Thirty-Two Drawings (1983) — thirty-two drawings housed in the Daros Collection, Zurich. Posthumous estate screenprints in an edition of 50 (including the set Leeches, Ascent, Olympic, Liberty), on Somerset paper. A chaotic, almost childlike hand conceals a controlled intent. Themes range across sport, "Black excellence," capitalism, and anarchy; anatomical motifs recur throughout — bones, skulls, feet. A sharp social commentary in the artist's signature Neo-Expressionist language.`,
  'Enfants': `Jean-Michel Basquiat was born on December 22, 1960, in Brooklyn, to a Haitian father and a mother of Puerto Rican descent; by age 11 he was fluent in French, Spanish, and English. His mother, Matilde, nurtured his talent, taking him to New York's museums. At eight he was hit by a car; while recovering, she gave him Gray's Anatomy — a wellspring of his future imagery. His childhood was shadowed by financial hardship, his parents' divorce, and his mother's mental illness. At 17, Basquiat dropped out and left home.`,
  'Andy Warhol': `In the late 1970s Basquiat first crossed paths with Warhol at a SoHo restaurant, selling him a handmade postcard. Their real meeting was arranged by dealer Bruno Bischofberger at a 1982 lunch: Basquiat took the Polaroid and returned two hours later with the still-wet Dos Cabezas. Friendship grew into collaboration (1983–85, ~160 works); on Basquiat's advice Warhol returned to hand-painting, while Basquiat deepened his use of silkscreen. Their 1985 joint show was panned by critics — reappraisal came only decades later.`,
  'SAMO': `SAMO© was a graffiti tag that appeared across Lower Manhattan from 1978 to 1980, a joint project by high-school friends Jean-Michel Basquiat and Al Diaz. Short for "same old shit," it began as a mock "religion" and a "JESUS SAVES"-style campaign: the tag, with its wry copyright symbol, accompanied cryptic, satirical phrases needling consumerism, religion, and the art world. Basquiat ended it by scrawling "SAMO© IS DEAD," then went solo. The text-and-image blend of SAMO© carried into his painting.`,
};

const popup = document.getElementById('article-popup');
const closeBtn = document.getElementById('popup-close');

window.addEventListener('word-click', (e) => {
  const word = e.detail.word;

  document.querySelector('.popup-title').textContent = word;
  popup.classList.add('active');

  document.querySelector('.popup-body').textContent = articles[word] || '';
  
  document.querySelector('.tablo-img').src = `../../public/imgs/articles/${word.toLowerCase().replace(/\s/g, '_')}/${word.toLowerCase().replace(/\s/g, '_')}.png`;
  
});

closeBtn.addEventListener('click', () => popup.classList.remove('active'));

popup.addEventListener('click', (e) => {
  if (e.target === popup) popup.classList.remove('active');
});
