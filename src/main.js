import { api, clearSession, session } from './api.js';
import loginPage from './pages/login.js';
import roomsPage from './pages/rooms.js';

const app = document.querySelector('#app');

const routes = {
  '/': { render: roomsPage },
  '/bookings': {
    auth: true,
    render: () => placeholder('My bookings', 'Booking list lands here once the booking module is ready.')
  },
  '/login': { render: loginPage, guestOnly: true }
};

function placeholder(title, note) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `<h2>${title}</h2><p class="muted">${note}</p>`;
  return el;
}

function navLink(href, label, path) {
  return `<a href="#${href}" class="${path === href ? 'active' : ''}">${label}</a>`;
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
    location.hash = '#/login';
    render();
  }
}

function render() {
  const path = location.hash.slice(1) || '/';
  const { user } = session();
  const route = routes[path] || routes['/'];

  if (route.auth && !user) {
    location.hash = '#/login';
    return;
  }
  if (route.guestOnly && user) {
    location.hash = '#/';
    return;
  }

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#/">Rajshahi Grand</a>
      <nav>
        ${navLink('/', 'Rooms', path)}
        ${user ? navLink('/bookings', 'My bookings', path) : ''}
        ${
          user
            ? `<span class="badge">${user.name}</span><button class="ghost" id="logout">Log out</button>`
            : navLink('/login', 'Log in', path)
        }
      </nav>
    </header>
    <main id="view"></main>
  `;

  app.querySelector('#logout')?.addEventListener('click', logout);
  app.querySelector('#view').append(route.render());
}

window.addEventListener('hashchange', render);
render();
