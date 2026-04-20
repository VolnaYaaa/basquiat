const paragraphs = document.querySelectorAll('.article p');
const padding = 60;

const paddingPercent = 10; // 10% отступ от краёв

paragraphs.forEach(p => {
  const x = paddingPercent + Math.random() * (100 - paddingPercent * 2);
  const y = paddingPercent + Math.random() * (100 - paddingPercent * 2);

  p.style.position = 'absolute';
  p.style.left = x + '%';
  p.style.top = y + '%';
});
function placeElements() {
  paragraphs.forEach(p => {
    const x = paddingPercent + Math.random() * (100 - paddingPercent * 2);
    const y = paddingPercent + Math.random() * (100 - paddingPercent * 2);
    p.style.left = x + '%';
    p.style.top = y + '%';
  });
}

placeElements(); // при загрузке

window.addEventListener('resize', () => {
  placeElements(); // при изменении окна
  // обновляем и камеру Three.js
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});