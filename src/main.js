const app = document.querySelector('#app');

const routes = {
  '/': () => placeholder('Rooms', 'Room catalogue lands here once the rooms module is ready.'),
  '/bookings': () => placeholder('My bookings', 'Booking list lands here once the booking module is ready.')
};

function placeholder(title, note) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `<h2>${title}</h2><p class="muted">${note}</p>`;
  return el;
}

function shell() {
  const path = location.hash.slice(1) || '/';
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#/">Rajshahi Grand</a>
      <nav>
        <a href="#/" class="${path === '/' ? 'active' : ''}">Rooms</a>
        <a href="#/bookings" class="${path === '/bookings' ? 'active' : ''}">My bookings</a>
      </nav>
    </header>
    <main id="view"></main>
  `;
  const view = app.querySelector('#view');
  const render = routes[path] || routes['/'];
  view.append(render());
}

window.addEventListener('hashchange', shell);
shell();
