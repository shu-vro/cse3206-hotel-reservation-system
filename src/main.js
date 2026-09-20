import { api, clearSession, session } from './api.js';
import loginPage from './pages/login.js';
import roomsPage from './pages/rooms.js';
import bookingPage from './pages/booking.js';
import bookingsPage from './pages/bookings.js';

const app = document.querySelector('#app');

const routes = {
  '/': { render: roomsPage },
  '/bookings': { auth: true, render: bookingsPage },
  '/login': { render: loginPage, guestOnly: true }
};

function resolve(path) {
  if (routes[path]) return routes[path];

  const booking = path.match(/^\/book\/(\d+)$/);
  if (booking) return { auth: true, render: () => bookingPage(Number(booking[1])) };

  return routes['/'];
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
  const route = resolve(path);

  if (route.auth && !user) {
    sessionStorage.setItem('hrs.next', path);
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
