import { api } from '../api.js';

const money = (value) => `Tk ${Number(value).toLocaleString('en-BD')}`;

export default function bookingsPage() {
  const page = document.createElement('div');
  page.innerHTML = `
    <div class="page-head">
      <h1>My bookings</h1>
      <p>Everything you have reserved, newest stay first.</p>
    </div>
    <div id="list"><p class="muted">Loading…</p></div>
  `;

  const list = page.querySelector('#list');

  function row(booking) {
    return `
      <tr>
        <td class="mono">#${booking.id}</td>
        <td>Room ${booking.room_number}<br /><span class="muted">${booking.room_type}</span></td>
        <td class="mono">${booking.check_in}<br />${booking.check_out}</td>
        <td>${booking.guests}</td>
        <td class="mono">${money(booking.total_price)}</td>
        <td><span class="badge ${booking.status === 'cancelled' ? 'clay' : 'teal'}">${booking.status}</span></td>
        <td>${
          booking.status === 'cancelled'
            ? ''
            : `<button class="ghost" data-cancel="${booking.id}">Cancel</button>`
        }</td>
      </tr>
    `;
  }

  async function load() {
    try {
      const { bookings } = await api('/bookings?scope=mine');

      if (!bookings.length) {
        list.innerHTML = '<p class="notice">Nothing booked yet. Pick a room from the catalogue.</p>';
        return;
      }

      list.innerHTML = `
        <div class="card table-wrap">
          <table>
            <thead>
              <tr><th>Ref</th><th>Room</th><th>Dates</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>${bookings.map(row).join('')}</tbody>
          </table>
        </div>
      `;

      list.querySelectorAll('[data-cancel]').forEach((button) =>
        button.addEventListener('click', async () => {
          if (!confirm('Cancel this booking?')) return;
          await api(`/bookings/${button.dataset.cancel}/cancel`, { method: 'POST' });
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
