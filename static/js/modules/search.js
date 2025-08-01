import { isValidUrl } from './utils.js';


export let searchContainer;
export let searchInput;


export function createGoogleLikeSearch(containerSelector = 'body') {
  searchContainer = document.createElement('div');
  const searchForm = document.createElement('form');
  searchInput = document.createElement('input');
  
  searchContainer.style.display = 'flex';
  searchContainer.style.flexDirection = 'column';
  searchContainer.style.alignItems = 'center';
  searchContainer.style.justifyContent = 'center';
  searchContainer.style.height = '90vh';
  searchContainer.style.margin = '0 auto';
  searchContainer.style.maxWidth = '984px';
  
  searchForm.style.width = '100%';
  searchForm.style.position = 'relative';
  
  searchInput.type = 'text';
  searchInput.style.mixBlendMode = 'normal';
  searchInput.placeholder = 'Search';
  searchInput.classList.add("custom-placeholder");
  searchInput.style.width = '100%';
  searchInput.style.padding = '12px 16px';
  searchInput.style.border = '2px solid rgba(255, 255, 255, 0.3)';
  searchInput.style.backgroundColor = 'transparent';
  searchInput.style.color = '#ffb6c1';
  searchInput.style.backdropFilter = 'blur(10px)';
  searchInput.style.borderRadius = '24px';
  searchInput.style.outline = 'none';
  searchInput.style.fontSize = '16px';
  searchInput.style.fontFamily = "'Comfortaa', sans-serif";

  searchInput.addEventListener('focus', () => {
    searchInput.style.borderColor = 'rgba(255, 182, 193, 1)';
    searchInput.classList.add('scale-up');
    searchInput.classList.remove('scale-down');
  });

  searchInput.addEventListener('blur', () => {
    if (!searchInput.value) {
      searchInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      searchInput.classList.add('scale-down');
      searchInput.classList.remove('scale-up');
    }
  });
  
  searchForm.onsubmit = function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (!query) return;

    if (isValidUrl(query)) {
      let url = query;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.location.href = url;
      return;
    }

    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };
  
  searchForm.appendChild(searchInput);
  searchContainer.appendChild(searchForm);
  
  const container = document.querySelector(containerSelector);
  if (container) {
    container.appendChild(searchContainer);
  } else {
    document.body.appendChild(searchContainer);
  }
  
  searchInput.focus();
  
  return {
    container: searchContainer,
    form: searchForm,
    input: searchInput
  };
}