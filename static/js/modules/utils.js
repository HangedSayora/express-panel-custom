import { checkAnimationDelay } from './animations.js';
import { fetchSiteList } from './api.js';
import { loadData } from '../main.js';
import { updateContexMenuGlobal } from './contextMenus.js';


const textView = localStorage.getItem('textView');


export function isValidUrl(str) {
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}


export function fixAndValidateUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  } else {
    return null;
  }
}


export function generatePageHTML(pages) {
  const pageElement = document.createElement('a');
  pageElement.className = 'page-button';
  pageElement.href = '#';
  pageElement.draggable = false;
  pageElement.page_id = pages.id;
  pageElement.dataset.pageId = pages.id;
  pageElement.style.backgroundImage = `url('${pages.icon}?t=${Date.now()}')`;

  const pageBorderBlur = document.createElement('div');
  const pageBorderBack = document.createElement('div');
  pageBorderBlur.className = 'page-button-blur';
  pageBorderBack.className = 'page-button-back';
  pageElement.appendChild(pageBorderBlur);
  pageElement.appendChild(pageBorderBack);

  const nameLabel = document.createElement('div');
  const nameLabelBlur = document.createElement('div');
  const nameLabelBack = document.createElement('div');
  nameLabel.className = 'page-button-text';
  nameLabel.textContent = pages.name;
  nameLabelBlur.className = 'page-button-text-blur';
  nameLabelBack.className = 'page-button-text-back';
  nameLabel.appendChild(nameLabelBlur);
  nameLabel.appendChild(nameLabelBack);
  pageElement.appendChild(nameLabel);
  
  pageElement.addEventListener('click', async (e) => {
    e.preventDefault();
    const parent_id_global = localStorage.getItem('parent_id_global');
    
    if (parent_id_global != pages.id) {
      const canAnimate = await checkAnimationDelay(1050);
      if (!canAnimate) return;
      
      localStorage.setItem("animationDate", Date.now().toString());
      await fetchSiteList(pages.id, 'page');
    }
  });

  return pageElement;
}


export function generateSiteHTML(sites) {
  return `
    <a class="site-button" href="${sites.url}" site_id="${sites.id}" parent-id="${sites.parent_id}" draggable="false">
      <img src="${sites.icon}?t=${Date.now()}" alt="Icon" class="icon">
    </a>
  `;
}


export async function handleTextViewChange() {
  const textView = localStorage.getItem('textView');
  if (!textView) {
    localStorage.setItem('textView', true);
  } else {
    localStorage.removeItem('textView');
  }
  updateContexMenuGlobal();
}