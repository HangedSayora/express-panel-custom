const timeAnim = 2800;


export async function runAnimUp(container, type_call) {
  container.style.animation = 'none';
  void container.offsetWidth;
  
  if (type_call === "page" || type_call === "page2") {
    container.style.animation = 'floatUp 0.5s ease-out forwards';
    
    await new Promise(resolve => {
      const handler = () => {
        container.removeEventListener('animationend', handler);
        resolve();
      };
      container.addEventListener('animationend', handler);
    });
    
  } else if (type_call === "page3") {
    container.style.animation = 'floatUp2 0.5s ease-out forwards';
    
    await new Promise(resolve => {
      const handler = () => {
        container.removeEventListener('animationend', handler);
        resolve();
      };
      container.addEventListener('animationend', handler);
    });
  }
}


export async function runAnimDown(container, type_call) {
  container.style.animation = 'none';
  void container.offsetWidth;
  
  if (type_call === "page" || type_call === "page2") {
    await new Promise(resolve => requestAnimationFrame(resolve));
    container.style.animation = 'floatDown 0.5s ease-out forwards';
    
    await new Promise(resolve => {
      const handler = () => {
        container.removeEventListener('animationend', handler);
        resolve();
      };
      container.addEventListener('animationend', handler);
    });
    
  } else if (type_call === "page3") {
    await new Promise(resolve => requestAnimationFrame(resolve));
    container.style.animation = 'floatDown2 0.5s ease-out forwards';
    
    await new Promise(resolve => {
      const handler = () => {
        container.removeEventListener('animationend', handler);
        resolve();
      };
      container.addEventListener('animationend', handler);
    });
  }
}


export async function runAnimPage(type_call) {
  const parent_id_global = localStorage.getItem("parent_id_global");
  const old_parent_id_global = localStorage.getItem("old_parent_id_global");
  const newParentGlobal = document.querySelector(`[data-page-id="${parent_id_global}"]`);
  const oldParentGlobal = document.querySelector(`[data-page-id="${old_parent_id_global}"]`);
  if (oldParentGlobal && type_call == "page") {
    oldParentGlobal.style.pointerEvents = 'none';
    oldParentGlobal.style.animation = 'pageReg 1s forwards';

    oldParentGlobal.addEventListener('animationend', function handler() {
      oldParentGlobal.style.animation = '';
      oldParentGlobal.style.pointerEvents = '';
    }, { once: true });
  }
  if (newParentGlobal) {
    newParentGlobal.style.animation = 'pageReg 1s forwards';

    newParentGlobal.addEventListener('animationend', function handler() {
      newParentGlobal.style.animation = 'none';
      void newParentGlobal.offsetWidth;

      newParentGlobal.style.animation = 'pulseCircle 3s ease-in-out infinite';
    }, { once: true });
  }
}


export async function checkAnimationDelay(msec) {
  const animationDate = localStorage.getItem("animationDate");
  if (!msec) {
    if (!animationDate || (new Date() - animationDate) >= timeAnim) {
      return true;
    }
    return false;
  } else {
    if (!animationDate || (new Date() - animationDate) >= msec) {
      return true;
    }
    return false;
  }
}