import { api } from '../api.js';

const money = (value) => `Tk ${Number(value).toLocaleString('en-BD')}`;
const today = () => new Date().toISOString().slice(0, 10);

function nights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86400000));
}

export default function bookingPage(roomId) {
  const page = document.createElement('div');
  page.innerHTML = '<p class="muted">Loading room…</p>';

  api(`/rooms/${roomId}`)
    .then(({ room }) => draw(room))
    .catch((error) => {
      page.innerHTML = `<p class="notice bad">${error.message}</p>`;
    });

  function draw(room, message) {
    page.innerHTML = `
      <div class="page-head">
        <h1>Book room ${room.number}</h1>
        <p>${room.type} · sleeps ${room.capacity} · ${money(room.price_per_night)} per night.</p>
      </div>
      ${message ? `<p class="notice ${message.kind}">${message.text}</p>` : ''}
      <div class="card stack" style="max-width:520px">
        <form class="stack">
          <div class="row">
            <div class="field">
              <label for="check_in">Check in</label>
              <input id="check_in" name="check_in" type="date" min="${today()}" required />
            </div>
            <div class="field">
              <label for="check_out">Check out</label>
              <input id="check_out" name="check_out" type="date" min="${today()}" required />
            </div>
            <div class="field">
              <label for="guests">Guests</label>
              <input id="guests" name="guests" type="number" min="1" max="${room.capacity}" value="1" required />
            </div>
          </div>
          <p class="mono" id="total">Pick your dates to see the total.</p>
          <div class="row">
            <button class="primary" type="submit">Confirm booking</button>
            <a href="#/"><button class="ghost" type="button">Back to rooms</button></a>
          </div>
        </form>
      </div>
    `;

    const form = page.querySelector('form');
    const total = page.querySelector('#total');

    const updateTotal = () => {
      const count = nights(form.check_in.value, form.check_out.value);
      total.textContent = count
        ? `${count} night${count > 1 ? 's' : ''} · ${money(count * room.price_per_night)} total`
        : 'Pick your dates to see the total.';
    };

    form.check_in.addEventListener('change', () => {
      form.check_out.min = form.check_in.value || today();
      updateTotal();
    });
    form.check_out.addEventListener('change', updateTotal);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = { ...Object.fromEntries(new FormData(form)), room_id: room.id };

      try {
        const { booking } = await api('/bookings', { method: 'POST', body: payload });
        draw(room, {
          kind: 'good',
          text: `Booked room ${booking.room_number} for ${booking.check_in} → ${booking.check_out}. <a href="#/bookings">See your bookings</a>.`
        });
      } catch (error) {
        draw(room, { kind: 'bad', text: error.message });
      }
    });
  }

  return page;
}
