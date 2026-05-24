/* Shared JS for Asphlatrica AI
   - Handles sidebar active link highlighting
   - Settings persistence and theme support
   - Utility helpers used across pages
*/

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

(function(){
  const settings = Settings.load();
  const theme = settings.theme || 'light';
  applyTheme(theme);
})();

// Mark the sidebar link active based on filename
(function(){
  const links = document.querySelectorAll('.nav-link');
  const path = location.pathname.split('/').pop() || 'index.html';
  links.forEach(link=>{
    const href = link.getAttribute('href').split('/').pop();
    if(href === path) link.classList.add('active');
    link.addEventListener('click', ()=>{
      links.forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    });
  });
})();

// Settings persistence helper
const Settings = {
  key: 'asphlatrica_ai_settings_v1',
  load(){
    try{ const s = localStorage.getItem(this.key); return s? JSON.parse(s): {} }catch(e){return{}}},
  save(obj){
    try{
      localStorage.setItem(this.key, JSON.stringify(obj));
      if(obj.theme){ applyTheme(obj.theme); }
    }catch(e){console.warn(e)}
  }
};

// Detections & Alerts global manager
const Detections = {
  key: 'asphlatrica_ai_detections_v1',
  load() {
    try {
      const d = localStorage.getItem(this.key);
      return d ? JSON.parse(d) : [];
    } catch (e) {
      return [];
    }
  },
  save(arr) {
    try {
      localStorage.setItem(this.key, JSON.stringify(arr));
    } catch (e) {
      console.warn(e);
    }
  },
  add(item) {
    const arr = this.load();
    arr.unshift(item); // prepend so newest shows up first
    this.save(arr);
  },
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch (e) {
      console.warn(e);
    }
  }
};

// Simple time formatter for alert timestamps
function timeAgo(minutes){
  if(minutes<1) return 'just now';
  if(minutes<60) return `${minutes}m ago`;
  const h = Math.floor(minutes/60); return `${h}h ago`;
}

// Load and apply User Profile dynamically across all pages
function applyUserProfile() {
  const settings = Settings.load();
  const userName = settings.name || '';
  const userEmail = settings.email || '';
  
  // Calculate initials (e.g. "John Doe" -> "JD")
  const words = userName.trim().split(' ').filter(Boolean);
  let initials = 'AA';
  if (words.length > 0) {
    initials = words[0].charAt(0).toUpperCase();
    if (words.length > 1) {
      initials += words[1].charAt(0).toUpperCase();
    } else {
      initials = (words[0].slice(0, 2)).toUpperCase();
    }
  }

  const logoEls = document.querySelectorAll('.logo');
  logoEls.forEach(el => {
    const pageLabel = el.textContent.replace(/^Asphlatrica AI\s*—\s*/i, '').trim();
    el.textContent = `Asphlatrica AI${userName ? ` — ${userName}` : pageLabel ? ` — ${pageLabel}` : ''}`;
  });

  const userButtons = document.querySelectorAll('.username-button, .avatar, #settingsAvatar');
  userButtons.forEach(a => {
    if (a.classList.contains('username-button')) {
      a.innerHTML = `${initials} <span class="arrow">▾</span>`;
    } else {
      a.textContent = initials;
    }
    a.title = userName || 'Asphlatrica AI User';
  });

  const userNameInput = document.getElementById('userNameInput');
  const userEmailInput = document.getElementById('userEmailInput');
  if (userNameInput && !userNameInput.value) userNameInput.value = userName;
  if (userEmailInput && !userEmailInput.value) userEmailInput.value = userEmail;
}

// Hook up profile and theme loading automatically on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  applyUserProfile();
});

window.RV = {Settings, timeAgo, applyTheme, Detections, applyUserProfile};



