export function setBackgroundFromAPI() {
  const oldBg = document.getElementById('dynamic-background');
  if (oldBg) oldBg.remove();

  const bgDiv = document.createElement('div');
  bgDiv.id = 'dynamic-background';
  document.body.appendChild(bgDiv);

  Object.assign(bgDiv.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '-1',
    backgroundImage: `url('http://127.0.0.1:5001/background/background.png?t=${Date.now()}')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: '0',
    willChange: 'opacity, transform'
  });

  requestAnimationFrame(() => {
    bgDiv.style.animation = 'backgroundFloat 1s ease-out forwards';
  });

  const img = new Image();
  img.onload = () => {
    if (document.getElementById('dynamic-background')) {
      bgDiv.style.backgroundImage = `url('${img.src}')`;
    }
  };
  img.onerror = () => {
    console.error("Не удалось загрузить фоновое изображение");
    bgDiv.remove();
    document.body.style.background = "#f0f0f0";
  };
  img.src = `http://127.0.0.1:5001/background/background.png?t=${Date.now()}`;
}