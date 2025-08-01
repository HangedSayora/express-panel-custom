import { addSite, addPage, delSite, delPage, changeSite, changePage } from './api.js';


export let isModalOpen = false;
export let isModalOpen2 = false;


export function createModal(title, contentHTML, buttonsHTML, type_call = "") {

  if (!type_call) {
    closeAllModals();

    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalBg = document.createElement('div');
    modalBg.className = 'modal-bg';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const titleElement = document.createElement('h2');
    titleElement.innerHTML = title;
    
    modalContent.appendChild(titleElement);
    modalContent.insertAdjacentHTML('beforeend', contentHTML);
    modalContent.insertAdjacentHTML('beforeend', buttonsHTML);
    
    modal.appendChild(modalBg);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modalBg.style.backgroundImage = 'url("../background/background.png")';
      modalBg.style.filter = 'blur(5px)'; 
      modal.style.opacity = '1';
      modal.style.transition = 'opacity 0.3s ease-in-out';
      isModalOpen = true;
    }, 10);
    return modal;
  } else {
    showErrorModal(title);
  }
}


function showErrorModal(message) {
  if (isModalOpen2) return;

  const errorModal = document.querySelector('.modal');

  const errorModalContent = document.createElement('div');
  errorModalContent.className = 'error-modal-content';
  errorModalContent.innerHTML = `<p>${message}</p>`;

  errorModal.appendChild(errorModalContent);
  document.body.appendChild(errorModal);

  setTimeout(() => {
    errorModalContent.style.opacity = '1';
    errorModalContent.style.transition = 'opacity 0.3s ease-in-out';
    isModalOpen2 = true;
  }, 10);

  setTimeout(() => {
    errorModalContent.style.opacity = '0';
    errorModalContent.style.transition = 'opacity 0.3s ease-in-out';
    
    setTimeout(() => {
      if (errorModalContent) {
        errorModalContent.remove();
      }
      isModalOpen2 = false;
    }, 301);
  }, 2000);

  return errorModal;
}


export function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease-in-out';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 301);
  });
  const modals2 = document.querySelectorAll('.error-modal');
  modals2.forEach(modal => {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease-in-out';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 301);
  });
}


export function showAddSiteForm() {
  const modal = createModal(
    'Добавить сайт',
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="title-site" placeholder="Название"><br>' +
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="url-site" placeholder="URL">',
    '<button class="button-true" id="add-site-btn">Добавить</button>' +
    '<button class="button-false" id="cancel-site-btn">Отмена</button>'
  );
  
  modal.querySelector('#add-site-btn').addEventListener('click', addSite);
  modal.querySelector('#cancel-site-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}

export function showAddPageForm() {
  const modal = createModal(
    'Добавить страницу',
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="title-page" placeholder="Название">',
    '<button class="button-true" id="add-page-btn">Добавить</button>' +
    '<button class="button-false" id="cancel-page-btn">Отмена</button>'
  );
  
  modal.querySelector('#add-page-btn').addEventListener('click', addPage);
  modal.querySelector('#cancel-page-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}

export function showDelSiteForm(site_name, site_id) {
  localStorage.setItem('site_id_global', site_id);
  const coloredName = `<span style="color: #fcb069">${site_name}</span>`;
  const modal = createModal(
    `Удаление сайта<br>${coloredName}`,
    '',
    '<button class="button-true" id="confirm-del-site-btn">Удалить</button>' +
    '<button class="button-false" id="cancel-del-site-btn">Отмена</button>'
  );
  
  modal.querySelector('#confirm-del-site-btn').addEventListener('click', delSite);
  modal.querySelector('#cancel-del-site-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}

export function showDelPageForm(page_name, page_id) {
  localStorage.setItem('page_id_global', page_id);
  const coloredName = `<span style="color: #fcb069">${page_name}</span>`;
  const modal = createModal(
    `Удаление страницы<br>${coloredName}`,
    '',
    '<button class="button-true" id="confirm-del-page-btn">Удалить</button>' +
    '<button class="button-false" id="cancel-del-page-btn">Отмена</button>'
  );
  
  modal.querySelector('#confirm-del-page-btn').addEventListener('click', delPage);
  modal.querySelector('#cancel-del-page-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}

export function showChangeSiteForm(site_name, site_id, site_url) {
  localStorage.setItem('site_id_global', site_id);
  const coloredName = `<span style="color: #fcb069">${site_name}</span>`;
  const modal = createModal(
    `Редактирование Сайта<br>${coloredName}`,
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="change-title-site" placeholder="Название" value="' + site_name + '"><br>' +
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="change-url-site" placeholder="URL" value="' + site_url + '">',
    '<button class="button-true" id="save-site-btn">Сохранить</button>' +
    '<button class="button-false" id="cancel-change-site-btn">Отмена</button>'
  );
  
  modal.querySelector('#save-site-btn').addEventListener('click', changeSite);
  modal.querySelector('#cancel-change-site-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}

export function showChangePageForm(page_name, page_id, icon) {
  localStorage.setItem('page_id_global', page_id);
  const coloredName = `<span style="color: #fcb069">${page_name}</span>`;
  const modal = createModal(
    `Редактирование страницы<br>${coloredName}`,
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="change-title-page" placeholder="Название" value="' + page_name + '"><br>' +
    '<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" id="url-icon-page" placeholder="URL иконки" value="' + icon + '">',
    '<button class="button-true" id="save-page-btn">Сохранить</button>' +
    '<button class="button-false" id="cancel-change-page-btn">Отмена</button>'
  );
  
  modal.querySelector('#save-page-btn').addEventListener('click', changePage);
  modal.querySelector('#cancel-change-page-btn').addEventListener('click', closeAllModals);
  modal.style.display = 'flex';
}