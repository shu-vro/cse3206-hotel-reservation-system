import { api, session } from '../api.js';

const money = (value) => `Tk ${Number(value).toLocaleString('en-BD')}`;

export default function roomsPage() {
  const page = document.createElement('div');
  const { user } = session();
  const filters = { type: '', guests: '', max_price: '' };
  let editing = null;

  page.innerHTML = `
    <div class="page-head">
      <h1>Rooms</h1>
      <p>Six rooms, four types. Pick a size, then check the dates on the booking screen.</p>
    </div>
    <form class="card row" id="filters">
      <div class="field">
        <label for="type">Type</label>
        <select id="type" name="type">
          <option value="">Any</option>
        </select>
      </div>
      <div class="field">
        <label for="guests">Guests</label>
        <input id="guests" name="guests" type="number" min="1" max="6" placeholder="Any" />
      </div>
      <div class="field">
        <label for="max_price">Max per night</label>
        <input id="max_price" name="max_price" type="number" min="0" step="100" placeholder="Any" />
      </div>
      <button type="submit">Filter</button>
      <button type="button" class="ghost" id="clear">Clear</button>
      ${user?.role === 'admin' ? '<button type="button" id="add" class="primary">Add room</button>' : ''}
    </form>
    <div id="editor"></div>
    <div class="grid" id="list"><p class="muted">Loading rooms…</p></div>
  `;

  const list = page.querySelector('#list');
  const editor = page.querySelector('#editor');
  const typeSelect = page.querySelector('#type');

  page.querySelector('#filters').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    filters.type = data.get('type');
    filters.guests = data.get('guests');
    filters.max_price = data.get('max_price');
    load();
  });

  page.querySelector('#clear').addEventListener('click', () => {
    page.querySelector('#filters').reset();
    Object.keys(filters).forEach((key) => (filters[key] = ''));
    load();
  });

  page.querySelector('#add')?.addEventListener('click', () => {
    editing = { number: '', type: 'Single', capacity: 1, price_per_night: '', description: '' };
    drawEditor();
  });

  function drawEditor(message) {
    if (!editing) {
      editor.innerHTML = '';
      return;
    }

    editor.innerHTML = `
      <div class="card stack" style="margin-bottom:16px">
        <h2>${editing.id ? `Edit room ${editing.number}` : 'New room'}</h2>
        ${message ? `<p class="notice bad">${message}</p>` : ''}
        <form class="row" id="room-form">
          <div class="field">
            <label for="f-number">Number</label>
            <input id="f-number" name="number" value="${editing.number}" required />
          </div>
          <div class="field">
            <label for="f-type">Type</label>
            <select id="f-type" name="type">
              ${['Single', 'Double', 'Deluxe', 'Suite']
                .map((t) => `<option ${t === editing.type ? 'selected' : ''}>${t}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="f-capacity">Capacity</label>
            <input id="f-capacity" name="capacity" type="number" min="1" value="${editing.capacity}" required />
          </div>
          <div class="field">
            <label for="f-price">Price / night</label>
            <input id="f-price" name="price_per_night" type="number" min="1" value="${editing.price_per_night}" required />
          </div>
          <div class="field" style="flex:1 1 220px">
            <label for="f-desc">Description</label>
            <input id="f-desc" name="description" value="${editing.description}" />
          </div>
          <button class="primary" type="submit">Save</button>
          <button class="ghost" type="button" id="cancel">Cancel</button>
        </form>
      </div>
    `;

    editor.querySelector('#cancel').addEventListener('click', () => {
      editing = null;
      drawEditor();
    });

    editor.querySelector('#room-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.target));
      try {
        await api(editing.id ? `/rooms/${editing.id}` : '/rooms', {
          method: editing.id ? 'PATCH' : 'POST',
          body: payload
        });
        editing = null;
        drawEditor();
        load();
      } catch (error) {
        drawEditor(error.message);
      }
    });
  }

  function card(room) {
    return `
      <article class="card room-card">
        <div class="row" style="justify-content:space-between">
          <h2>Room ${room.number}</h2>
          <span class="badge teal">${room.type}</span>
        </div>
        <p class="muted">${room.description || 'No description yet.'}</p>
        <p class="mono">Sleeps ${room.capacity} · <strong>${money(room.price_per_night)}</strong> / night</p>
        <div class="row">
          <a href="#/book/${room.id}"><button type="button" class="primary">Book</button></a>
          ${
            user?.role === 'admin'
              ? `<button type="button" class="ghost" data-edit="${room.id}">Edit</button>
                 <button type="button" class="ghost" data-archive="${room.id}">Archive</button>`
              : ''
          }
        </div>
      </article>
    `;
  }

  async function load() {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    try {
      const { rooms, types } = await api(`/rooms?${query}`);

      if (typeSelect.options.length === 1) {
        types.forEach((type) => typeSelect.add(new Option(type, type)));
      }
      typeSelect.value = filters.type;

      list.innerHTML = rooms.length
        ? rooms.map(card).join('')
        : '<p class="notice">No rooms match those filters.</p>';

      list.querySelectorAll('[data-edit]').forEach((button) =>
        button.addEventListener('click', async () => {
          const { room } = await api(`/rooms/${button.dataset.edit}`);
          editing = room;
          drawEditor();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        })
      );

      list.querySelectorAll('[data-archive]').forEach((button) =>
        button.addEventListener('click', async () => {
          if (!confirm('Archive this room? It stops showing up for guests.')) return;
          await api(`/rooms/${button.dataset.archive}`, { method: 'DELETE' });
          load();
        })
      );
    } catch (error) {
      list.innerHTML = `<p class="notice bad">${error.message}</p>`;
    }
  }

  load();
  return page;
}
