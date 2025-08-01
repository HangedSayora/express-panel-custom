import { contextMenuSite, contextMenuPage, contextMenuGlobal, updateContexMenuGlobal } from './modules/contextMenus.js';
import { createModal, closeAllModals, showAddSiteForm, showAddPageForm, showDelSiteForm, showDelPageForm, showChangeSiteForm, showChangePageForm, isModalOpen, isModalOpen2 } from './modules/modals.js';
import { fetchSiteList, fetchPageList, addSite, addPage, delSite, delPage, changeSite, changePage } from './modules/api.js';
import { runAnimUp, runAnimDown, runAnimPage, checkAnimationDelay } from './modules/animations.js';
import { isValidUrl, fixAndValidateUrl, generatePageHTML, generateSiteHTML, handleTextViewChange } from './modules/utils.js';
import { createGoogleLikeSearch, searchContainer, searchInput } from './modules/search.js';
import { setBackgroundFromAPI } from './modules/background.js';


document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem("animationDate");
  loadData();
  createGoogleLikeSearch();
  
  initEventListeners();

  const dragArea1 = document.querySelector(".container-pages");
  const dragArea2 = document.querySelector(".container-sites");


  let sortable1, sortable2;

  function initializeSortable() {
      const sortableView = localStorage.getItem("sortableView") === 'true';

      if (sortable1) sortable1.destroy();
      if (sortable2) sortable2.destroy();

      sortable1 = new Sortable(dragArea1, {
          onStart: () => localStorage.setItem("isDragging", "true"),
          onEnd: () => {
              localStorage.removeItem("isDragging");
              updatePagesOrder(dragArea1);

              const pageButtons = document.querySelectorAll('.page-button');
              const pageButtonsBlur = document.querySelectorAll('.page-button-blur');
              pageButtons.forEach(button => {
                  button.classList.add('no-animation');
                  void button.offsetWidth;
                  button.classList.remove('no-animation');
              });
              pageButtonsBlur.forEach(button => {
                  button.classList.add('no-animation');
                  void button.offsetWidth;
                  button.classList.remove('no-animation');
              });
          },
          disabled: !sortableView
      });

      sortable2 = new Sortable(dragArea2, {
          onStart: () => localStorage.setItem("isDragging", "true"),
          onEnd: () => {
              localStorage.removeItem("isDragging");
              updateSitesOrder(dragArea2);
          },
          disabled: !sortableView
      });
  }


  initializeSortable();

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === 'sortableView') {
          initializeSortable();
      }
  };

  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function(key, value) {
      originalRemoveItem(key, value);
      if (key === 'sortableView') {
          initializeSortable();
      }
  };
});


export async function loadData() {
  const canAnimate = await checkAnimationDelay();
  if (canAnimate) {
    localStorage.setItem("animationDate", Date.now());
  } else {
    return;
  }

  let parent_id_global = localStorage.getItem('parent_id_global');
  
  if (!parent_id_global) {
    try {
      const response = await fetch('/api/get/page/list');
      const data = await response.json();
      if (data.length > 0) {
        parent_id_global = data[0].id;
        localStorage.setItem('parent_id_global', parent_id_global);
        parent_id_global = localStorage.getItem('parent_id_global');
      } else {
        return;
      }
    } catch (error) {
      console.error('Error at getting info:', error);
      return;
    }
  }

  const sitesPromise = fetchSiteList(parent_id_global, "page2");
  const pagesPromise = fetchPageList();
  const backgroundPromise = setBackgroundFromAPI();

  await Promise.all([sitesPromise, pagesPromise, backgroundPromise]);
}


function initEventListeners() {
  updateContexMenuGlobal();

  document.addEventListener('dragstart', function(event) {
    const sortableView = localStorage.getItem("sortableView") === 'true';
    if (!sortableView) {
      event.preventDefault();
    }
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
  });

  document.addEventListener('mouseenter', (e) => {

    if (!(e.target instanceof Element)) return;
    
    const pageElement = e.target.closest('.page-button');
    const siteElement = e.target.closest('.site-button');
    const element = pageElement || siteElement;
    if (!element) return;

    const isPage = !!pageElement;
    const nameLabel = isPage 
      ? element.querySelector('.page-button-text') 
      : element.querySelector('.site-button-text');
    if (!nameLabel) return;

    const textView = localStorage.getItem('textView');
    const isDragging = localStorage.getItem('isDragging');
    const parent_id_global = localStorage.getItem("parent_id_global");
    
    const pageId = isPage ? element.dataset.pageId : null;
    const isActivePage = isPage && (parent_id_global == pageId);
    
    if (isDragging || isActivePage) return;

    clearTimeout(element._hoverTimer);
    clearTimeout(element._hoverTimer2);
    
    const scale = isPage ? '1.2' : '1.4';
    element._hoverTimer2 = setTimeout(() => {
      element.style.transform = `scale(${scale})`;
    }, 1);

    if (textView) return;
    
    element._hoverTimer = setTimeout(() => {
      nameLabel.style.opacity = '1';
    }, 300);
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (!(e.target instanceof Element)) return;
    
    const pageElement = e.target.closest('.page-button');
    const siteElement = e.target.closest('.site-button');
    const element = pageElement || siteElement;
    if (!element) return;

    const isPage = !!pageElement;
    const nameLabel = isPage 
      ? element.querySelector('.page-button-text') 
      : element.querySelector('.site-button-text');
    if (!nameLabel) return;

    clearTimeout(element._hoverTimer);
    clearTimeout(element._hoverTimer2);
    
    nameLabel.style.opacity = '0';
    element.style.transform = 'scale(1)';
  }, true);


  document.addEventListener('contextmenu', event => event.preventDefault());


  document.body.addEventListener('click', (e) => {
    if (e.target.closest('#custom-context-menu [data-action]')) {
      const action = e.target.closest('[data-action]').dataset.action;
      const sortableView = localStorage.getItem("sortableView");
      contextMenuGlobal.style.display = 'none';
      
      if (action === 'addPage') {
        showAddPageForm();
      } else if (action === 'addSite') {
        showAddSiteForm();
      } else if (action === 'refresh') {
        loadData();
      } else if (action === 'textView') {
        handleTextViewChange();
        updateContexMenuGlobal();
      } else if (action === 'sortableView') {
        if (sortableView) {
          localStorage.removeItem("sortableView");
          updateContexMenuGlobal();
        } else {
          localStorage.setItem("sortableView", true);
          updateContexMenuGlobal();
        }
      } 
    }
  });


  document.addEventListener('click', (e) => {
    if (e.button !== 2 && !contextMenuSite.contains(e.target)) {
      contextMenuSite.style.display = 'none';
    }
    if (e.button !== 2 && !contextMenuPage.contains(e.target)) {
      contextMenuPage.style.display = 'none';
    }
    if (e.button !== 2 && !contextMenuGlobal.contains(e.target)) {
      contextMenuGlobal.style.display = 'none';
    }
  });

  contextMenuSite.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const siteId = contextMenuSite.dataset.targetSite;
      const siteName = contextMenuSite.dataset.targetName;
      const siteUrl = contextMenuSite.dataset.targetUrl;
      
      contextMenuSite.style.display = 'none';
      
      if (action === 'changeSite') {
        showChangeSiteForm(siteName, siteId, siteUrl);
      } else if (action === 'delSite') {
        showDelSiteForm(siteName, siteId);
      }
    });
  });


  contextMenuPage.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const pageId = contextMenuPage.dataset.targetPage;
      const pageName = contextMenuPage.dataset.targetName;
      const pageIcon = contextMenuPage.dataset.targetIcon;
      
      contextMenuPage.style.display = 'none';
      
      if (action === 'changePage') {
        showChangePageForm(pageName, pageId, pageIcon);
      } else if (action === 'delPage') {
        showDelPageForm(pageName, pageId);
      }
    });
  });


  document.addEventListener('contextmenu', (e) => {
    const pageContainer = document.getElementById('container-pages');
    const siteContainer = document.getElementById('container-sites');
    if (e.target === document.body || e.target === document.documentElement || e.target === searchContainer || e.target === pageContainer || e.target === siteContainer) {
      e.preventDefault();
      contextMenuPage.style.display = 'none';
      contextMenuSite.style.display = 'none';
      
      const x = Math.min(e.clientX, window.innerWidth - contextMenuGlobal.offsetWidth - 5);
      const y = Math.min(e.clientY, window.innerHeight - contextMenuGlobal.offsetHeight - 5);
      
      contextMenuGlobal.style.display = 'block';
      contextMenuGlobal.style.left = `${x}px`;
      contextMenuGlobal.style.top = `${y}px`;
    } else {
      contextMenuGlobal.style.display = 'none';
    }
  });


  let mouseDownTarget = null;


  document.addEventListener('mousedown', function(event) {
    if (!isModalOpen && !isModalOpen2) return;

    const modalContent = document.querySelector('.modal-content');
    const errorModalContent = document.querySelector('.error-modal-content');
    
    const isOutsideModal = 
      (!modalContent || !modalContent.contains(event.target)) && 
      (!errorModalContent || !errorModalContent.contains(event.target));

    mouseDownTarget = isOutsideModal ? event.target : null;
  });

  document.addEventListener('mouseup', function(event) {
    if (!mouseDownTarget || (!isModalOpen && !isModalOpen2)) return;

    const modalContent = document.querySelector('.modal-content');
    const errorModalContent = document.querySelector('.error-modal-content');
    
    const isOutsideModal = 
      (!modalContent || !modalContent.contains(event.target)) && 
      (!errorModalContent || !errorModalContent.contains(event.target));

    if (mouseDownTarget === event.target && isOutsideModal) {
      closeAllModals();
    }
    
    mouseDownTarget = null;
  });


  document.addEventListener('keydown', function(event) {
    const isModifierKey = [17, 18, 91, 93].includes(event.keyCode);
    const isModifiedCombo = isModifierKey || event.ctrlKey || event.altKey || event.metaKey;
    
    if (document.activeElement !== searchInput && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && 
        isModalOpen === false &&
        !isModifiedCombo) {
      searchInput.focus();
    }
  });
}


async function updatePagesOrder(container) {
    const items = Array.from(container.children);
    const newOrder = items.map(item => parseInt(item.page_id)).filter(page_id => !isNaN(page_id));


    if (newOrder.length === 0) {
        console.error('No valid items found');
        return;
    }

    try {
        const response = await fetch('/api/reorder/pages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newOrder)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.message || 'Failed to update order');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при сохранении порядка: ' + error.message);
        throw error;
    }
}


async function updateSitesOrder(container) {
    const items = Array.from(container.children);

    const parentId = items[0]?.getAttribute('parent-id');
    if (!parentId) {
        console.error('Parent ID not found');
        return;
    }

    const newOrder = items.map(item => {
        return parseInt(item.getAttribute('site_id'));
    }).filter(id => !isNaN(id));

    try {
        const response = await fetch(`/api/reorder/sites/${parentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newOrder)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update order');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при сохранении порядка: ' + error.message);
        throw error;
    }
}