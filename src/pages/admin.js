import { api } from '../api.js';

const money = (value) => `Tk ${Number(value).toLocaleString('en-BD')}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function adminPage() {
  const page = document.createElement('div');
  let filter = 'all';

  page.innerHTML = `
    <div class="page-head">
      <h1>Front desk</h1>
      <p>Tonight at a glance, then every reservation on the books.</p>
    </div>
    <div class="stats" id="stats"></div>
    <div class="row" id="filters" style="margin:20px 0 12px">
      ${['all', 'confirmed', 'cancelled']
        .map((value) => `<button type="button" data-filter="${value}">${value}</button>`)
        .join('')}
    </div>
    <div id="list"><p class="muted">Loading…</p></div>
  `;

  const stats = page.querySelector('#stats');
  const list = page.querySelector('#list');

  page.querySelectorAll('[data-filter]').forEach((button) =>
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      load();
    })
  );

  function tile(label, value, note) {
    return `
      <div class="card stat">
        <span class="muted">${label}</span>
        <strong class="mono">${value}</strong>
        <span class="muted">${note}</span>
      </div>
    `;
  }

  function row(booking) {
    return `
      <tr>
        <td class="mono">#${booking.id}</td>
        <td>${booking.guest_name}<br /><span class="muted">${booking.guest_email}</span></td>
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
      const [{ bookings }, { rooms }] = await Promise.all([api('/bookings'), api('/rooms')]);
      const live = bookings.filter((booking) => booking.status !== 'cancelled');
      const staying = live.filter(
        (booking) => booking.check_in <= today() && booking.check_out > today()
      );
      const arriving = live.filter((booking) => booking.check_in === today());
      const earned = live
        .filter((booking) => booking.check_out >= today())
        .reduce((sum, booking) => sum + booking.total_price, 0);

      stats.innerHTML = [
        tile('Rooms open', rooms.length, 'not archived'),
        tile('Occupied tonight', staying.length, `${rooms.length - staying.length} free`),
        tile('Arriving today', arriving.length, today()),
        tile('Booked value', money(earned), 'upcoming stays')
      ].join('');

      page.querySelectorAll('[data-filter]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.filter === filter);
      });

      const shown = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

      list.innerHTML = shown.length
        ? `<div class="card table-wrap">
             <table>
               <thead>
                 <tr><th>Ref</th><th>Guest</th><th>Room</th><th>Dates</th><th>Pax</th><th>Total</th><th>Status</th><th></th></tr>
               </thead>
               <tbody>${shown.map(row).join('')}</tbody>
             </table>
           </div>`
        : '<p class="notice">No bookings in this view.</p>';

      list.querySelectorAll('[data-cancel]').forEach((button) =>
        button.addEventListener('click', async () => {
          if (!confirm('Cancel this reservation?')) return;
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
