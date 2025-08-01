import { runAnimUp, runAnimDown, runAnimPage, checkAnimationDelay } from './animations.js';
import { contextMenuSite, contextMenuPage, contextMenuGlobal } from './contextMenus.js';
import { generatePageHTML, generateSiteHTML, fixAndValidateUrl } from './utils.js';
import { showDelSiteForm, showDelPageForm, showChangeSiteForm, showChangePageForm, closeAllModals, createModal } from './modals.js';


export async function fetchPageList() {
  const res = await fetch(`/api/get/page/list`);

  if (!res.ok) {
    throw new Error('Error while receiving data');
  }

  const pageList = await res.json();
  const textView = localStorage.getItem('textView');
  const container = document.getElementById('container-pages');

  await runAnimDown(container, "page3");
  container.innerHTML = '';

  pageList.forEach(page => {
    const pageElement = generatePageHTML(page);

    pageElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuGlobal.style.display = 'none';
      contextMenuSite.style.display = 'none';
    
      contextMenuPage.dataset.targetPage = page.id;
      contextMenuPage.dataset.targetName = page.name;
      contextMenuPage.dataset.targetIcon = page.icon;
    
      const x = Math.min(e.clientX, window.innerWidth - contextMenuPage.offsetWidth - 5);
      const y = Math.min(e.clientY, window.innerHeight - contextMenuPage.offsetHeight - 5);
    
      contextMenuPage.style.display = 'block';
      contextMenuPage.style.left = `${x}px`;
      contextMenuPage.style.top = `${y}px`;
    });

    container.appendChild(pageElement);
  });

  await runAnimUp(container, "page3");
  await runAnimPage();
}


export async function fetchSiteList(parent_id, type_call = "", pageElement) {
  const res = await fetch(`/api/get/site/list/${parent_id}`);
  const parent_id_global = localStorage.getItem("parent_id_global");
  const old_parent_id_global = localStorage.getItem("old_parent_id_global");
  localStorage.setItem('parent_id_global', parent_id);
  if (parent_id != parent_id_global) {
    localStorage.setItem('old_parent_id_global', parent_id_global);
  } else if (parent_id == parent_id_global && type_call == "page") {
    return
  }

  if (!res.ok) {
      throw new Error('Error while receiving data');
  }

  const siteList = await res.json();
  const textView = localStorage.getItem('textView');
  const container = document.getElementById('container-sites');
  if (type_call == "page") {
    await runAnimPage(type_call);
  }

  await runAnimUp(container, type_call);
  container.innerHTML = '';

  siteList.forEach(site => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = generateSiteHTML(site);
    const siteElement = wrapper.firstElementChild;

    const nameLabel = document.createElement('div');
    const nameLabelBlur = document.createElement('div');
    const nameLabelBack = document.createElement('div');
    nameLabel.className = 'site-button-text';
    nameLabel.textContent = site.name;
    nameLabelBlur.className = 'site-button-text-blur';
    nameLabelBack.className = 'page-button-text-back';
    nameLabel.appendChild(nameLabelBlur);
    nameLabel.appendChild(nameLabelBack);
    siteElement.appendChild(nameLabel);

    let timer;

    siteElement.dataset.siteId = site.id;

    siteElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuGlobal.style.display = 'none';
      contextMenuPage.style.display = 'none';
    
      contextMenuSite.dataset.targetSite = site.id;
      contextMenuSite.dataset.targetName = site.name;
      contextMenuSite.dataset.targetUrl = site.url;
    
      const x = Math.min(e.clientX, window.innerWidth - contextMenuSite.offsetWidth - 5);
      const y = Math.min(e.clientY, window.innerHeight - contextMenuSite.offsetHeight - 5);
    
      contextMenuSite.style.display = 'block';
      contextMenuSite.style.left = `${x}px`;
      contextMenuSite.style.top = `${y}px`;
    });

    container.appendChild(wrapper.firstElementChild);
  });

  await runAnimDown(container, type_call);
}


let isMovingSite = false;
let isMovingPage = false;


export async function addSite() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const parent_id_global = localStorage.getItem("parent_id_global");
  const name = document.getElementById('title-site').value;
  let url = document.getElementById('url-site').value;
  url = fixAndValidateUrl(url);
  if (!url && name) {
    return createModal('You entered incorrect URL!', null, null, "1");
  } else if (!name && url) {
    return createModal('You dont entered name!', null, null, "1");
  } else if (!name && !url) {
    return createModal('You entered incorrect URL and dont entered name!', null, null, "1");
  }
  await fetch(`/api/add/site/${parent_id_global}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      url: url
    })
  });
  closeAllModals();
  fetchSiteList(parent_id_global, "page2");
}


export async function addPage() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const name = document.getElementById('title-page').value;
  if (!name) return createModal("You don't entered name!", null, null, "1");
  await fetch(`/api/add/page/${name}/`, {
    method: 'POST'
  });
  closeAllModals();
  fetchPageList();
}


export async function delSite() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const parent_id_global = localStorage.getItem("parent_id_global");
  const site_id_global = localStorage.getItem("site_id_global");
  await fetch(`/api/del/site/${site_id_global}/`, {
    method: 'DELETE'
  });
  closeAllModals();
  fetchSiteList(parent_id_global, "page2");
  localStorage.removeItem('site_id_global');
}


export async function delPage() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const page_id_global = localStorage.getItem("page_id_global");
  const parent_id_global = localStorage.getItem("parent_id_global");
  await fetch(`/api/del/page/${page_id_global}/`, {
    method: 'DELETE'
  });
  closeAllModals();
  fetchPageList();
  if (page_id_global == parent_id_global) {
    const res = await fetch(`/api/get/page/list`);
    const data = await res.json();
    const temp_parent_id = data[0].id;
    localStorage.setItem("parent_id_global", temp_parent_id);
    const parent_id_global = localStorage.getItem("parent_id_global");

    fetchSiteList(parent_id_global, "page2");
  }
  localStorage.removeItem('page_id_global');
}


export async function changeSite() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const parent_id_global = localStorage.getItem("parent_id_global");
  const site_id_global = localStorage.getItem("site_id_global");
  const name = document.getElementById('change-title-site').value;
  let url = document.getElementById('change-url-site').value;

  url = fixAndValidateUrl(url);
  if (!url && name) {
    return createModal('You entered incorrect URL!', null, null, "1");
  } else if (!name && url) {
    return createModal('You dont entered name!', null, null, "1");
  } else if (!name && !url) {
    return createModal('You entered incorrect URL and dont entered name!', null, null, "1");
  }

  const response = await fetch(`/api/change/site/${parent_id_global}/${site_id_global}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      url: url
    })
  });

  closeAllModals();
  fetchSiteList(parent_id_global, "page2");
  localStorage.removeItem('site_id_global');
}


export async function changePage() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    const animationDate = localStorage.setItem("animationDate", (Date.now()));
  } else {
    return;
  }
  const page_id_global = localStorage.getItem("page_id_global");
  const name = document.getElementById('change-title-page').value;
  const icon = document.getElementById('url-icon-page').value;

  if (!name) return createModal("You don't entered name!", null, null, "1");

  const response = await fetch(`/api/change/page/${page_id_global}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      icon: icon
    })
  });

  closeAllModals();
  fetchPageList();
  localStorage.removeItem('page_id_global');
}