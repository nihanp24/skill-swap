
const API = (window.__API_BASE__ = window.__API_BASE__ || '/api');
function el(tag, props={}, ...children){ const e=document.createElement(tag); Object.assign(e, props); children.forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else e.appendChild(c); }); return e }
function setRoot(node){ const root=document.getElementById('root'); root.innerHTML=''; root.appendChild(node); }
function showMessage(msg, type='error'){ const d=el('div',{className:'message '+(type==='error'?'error':'success')}, msg); return d; }

function registerPage(){
  const form = el('form');
  const username = el('input',{placeholder:'username'});
  const email = el('input',{type:'email', placeholder:'email'});
  const password = el('input',{type:'password', placeholder:'password'});
  const btn = el('button',{}, 'Create account');
  form.append(username,email,password,btn);
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = { username: username.value.trim(), email: email.value.trim(), password: password.value };
    try {
      const res = await fetch(API+'/auth/register', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if(!res.ok){ setRoot(showMessage(data.error || 'Register failed', 'error')); return; }
      localStorage.setItem('token', data.token || '');
      setRoot(showMessage('Registered — redirecting to dashboard...', 'success'));
      window.location.hash = '#/dashboard';
      setTimeout(()=>renderRoute(),800);
    } catch(err){ setRoot(showMessage('Network error','error')); }
  });
  return form;
}

function loginPage(){
  const form = el('form');
  const usernameOrEmail = el('input',{placeholder:'username or email'});
  const password = el('input',{type:'password', placeholder:'password'});
  const btn = el('button',{}, 'Sign in');
  form.append(usernameOrEmail,password,btn);
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = { usernameOrEmail: usernameOrEmail.value.trim(), password: password.value };
    try {
      const res = await fetch(API+'/auth/login', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if(!res.ok){ setRoot(showMessage(data.error || 'Login failed', 'error')); return; }
      localStorage.setItem('token', data.token || '');
      setRoot(showMessage('Logged in — redirecting to dashboard...', 'success'));
      window.location.hash = '#/dashboard';
      setTimeout(()=>renderRoute(),600);
    } catch(err){ setRoot(showMessage('Network error','error')); }
  });
  return form;
}

function dashboardPage(){
  const wrap = el('div');
  const token = localStorage.getItem('token');
  const title = el('h2',{}, 'Dashboard');
  const info = el('div',{}, 'Loading profile...');
  const out = el('button',{}, 'Logout');
  out.addEventListener('click', ()=>{ localStorage.removeItem('token'); window.location.hash='#/login'; renderRoute(); });
  wrap.append(title, info, out);
 (async ()=> {
    try {
      // send Authorization header with token from localStorage if present
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const r = await fetch(API + '/auth/me', { credentials: 'include', headers });
      if (r.ok) {
        const d = await r.json();
        info.innerText = 'Hello, ' + (d.user?.username || d.user?.email || 'user');
        return;
      }
      // fallback: call /api/users to see users (public)
      const r2 = await fetch(API + '/users');
      const list = await r2.json();
      info.innerText = 'Users on system: ' + (Array.isArray(list) ? list.length : 0);
    } catch(e) {
      info.innerText = 'Could not fetch profile.';
    }
  })();
  return wrap;
}

function notFound(){ return el('div',{}, 'Not found') }

function renderRoute(){
  const hash = location.hash.replace('#','') || '/';
  if(hash.startsWith('/register')) setRoot(registerPage());
  else if(hash.startsWith('/login')) setRoot(loginPage());
  else if(hash.startsWith('/dashboard')) setRoot(dashboardPage());
  else setRoot(notFound());
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
