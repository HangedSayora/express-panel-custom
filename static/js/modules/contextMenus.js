let textView = localStorage.getItem("textView");
let sortableView = localStorage.getItem("sortableView");
let _contextMenuGlobal = null;


export const contextMenuSite = createContextMenu(`
  <div class="context-menu-item" data-action="changeSite">Редактировать</div>
  <div class="context-menu-item" data-action="delSite">Удалить</div>
`);


export const contextMenuPage = createContextMenu(`
  <div class="context-menu-item" data-action="changePage">Редактировать</div>
  <div class="context-menu-item" data-action="delPage">Удалить</div>
`);


export let contextMenuGlobal = null;


function createContextMenu(html) {
  if (_contextMenuGlobal && _contextMenuGlobal.parentNode) {
    _contextMenuGlobal.parentNode.removeChild(_contextMenuGlobal);
  }
  textView = localStorage.getItem("textView");
  const menu = document.createElement('div');
  menu.id = 'custom-context-menu';
  menu.innerHTML = html;
  document.body.appendChild(menu);
  return menu;
}

export function updateContexMenuGlobal() {
  textView = localStorage.getItem("textView");
  sortableView = localStorage.getItem("sortableView");
  let textViewTitle;
  let sortableViewTitle;
  _contextMenuGlobal = contextMenuGlobal;
  if (textView) {
    textViewTitle = `<div class="context-menu-item" data-action="textView">Показать названия</div>`;
  } else {
    textViewTitle = `<div class="context-menu-item" data-action="textView">Скрыть названия</div>`;
  }
  if (sortableView) {
    sortableViewTitle = `<div class="context-menu-item" data-action="sortableView">Выкл. Сортировку</div>`;
  } else {
    sortableViewTitle = `<div class="context-menu-item" data-action="sortableView">Вкл. Сортировку</div>`;
  }
  contextMenuGlobal = createContextMenu(`
    <div class="context-menu-item" data-action="addPage">Добавить страницу</div>
    <div class="context-menu-item" data-action="addSite">Добавить сайт</div>
    ${textViewTitle}
    ${sortableViewTitle}
    <div class="context-menu-item" data-action="refresh">Обновить</div>
  `);
}
