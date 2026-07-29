const state = { page: 1, pageSize: 20, total: 0, items: [], reloadTimer: null };
const labels = {
  user: ['Usuario', 'U'], reservation: ['Reserva', 'R'], payment: ['Pago', '$'],
  wine: ['Vino', 'V'], store: ['Tienda', 'T'],
};
const actionLabels = {
  create: 'Creación', update: 'Actualización', delete: 'Eliminación',
  pay: 'Pago', cancel: 'Cancelación', expire: 'Expiración',
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function params() {
  const values = new FormData($('#filters'));
  const query = new URLSearchParams({ page: String(state.page), pageSize: String(state.pageSize) });
  for (const [key, value] of values) if (String(value).trim()) query.set(key, String(value).trim());
  return query;
}

async function loadEvents(showError = true) {
  try {
    const response = await fetch(`/api/audit?${params()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    state.items = result.items;
    state.total = result.total;
    render();
  } catch (error) {
    if (showError) toast(`No se pudieron cargar las auditorías: ${error.message}`);
  }
}

function render() {
  $('#total').textContent = state.total.toLocaleString('es-ES');
  $('#visible').textContent = state.items.length;
  $('#updated').textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  $('#page').textContent = `Página ${state.page}`;
  $('#previous').disabled = state.page <= 1;
  $('#next').disabled = state.page * state.pageSize >= state.total;

  const rows = state.items.map((event) => {
    const [entity, icon] = labels[event.entity] || [event.entity, '•'];
    const when = new Date(event.timestamp);
    return `<tr>
      <td><div class="event-name"><span class="entity-icon">${icon}</span><span>${escapeHtml(entity)}<small class="event-id">${escapeHtml(event.eventId.slice(0, 12))}…</small></span></div></td>
      <td><span class="badge ${escapeHtml(event.action)}">${escapeHtml(actionLabels[event.action] || event.action)}</span></td>
      <td><span class="user-email">${escapeHtml(event.userEmail || 'Sistema')}</span><small class="user-id">${escapeHtml(event.userId || 'Sin usuario')}</small></td>
      <td>${escapeHtml(when.toLocaleDateString('es-ES'))}<small class="time-relative">${escapeHtml(when.toLocaleTimeString('es-ES'))}</small></td>
      <td><button class="detail-button" data-id="${escapeHtml(event.id)}">Ver JSON</button></td>
    </tr>`;
  }).join('');
  $('#events').innerHTML = rows || '<tr><td colspan="5" class="empty">No hay eventos para estos filtros.</td></tr>';

  $('#cards').innerHTML = state.items.map((event) => {
    const [entity, icon] = labels[event.entity] || [event.entity, '•'];
    return `<article class="event-card">
      <div class="event-card-head"><div class="event-name"><span class="entity-icon">${icon}</span>${escapeHtml(entity)}</div><span class="badge ${escapeHtml(event.action)}">${escapeHtml(actionLabels[event.action] || event.action)}</span></div>
      <span class="user-email">${escapeHtml(event.userEmail || 'Sistema')}</span>
      <div class="event-card-foot"><span class="time-relative">${escapeHtml(new Date(event.timestamp).toLocaleString('es-ES'))}</span><button class="detail-button" data-id="${escapeHtml(event.id)}">Ver JSON</button></div>
    </article>`;
  }).join('') || '<p class="empty">No hay eventos para estos filtros.</p>';
}

function openDetail(id) {
  const event = state.items.find((item) => item.id === id);
  if (!event) return;
  $('#detail-title').textContent = `${labels[event.entity]?.[0] || event.entity} · ${actionLabels[event.action] || event.action}`;
  $('#detail-meta').innerHTML = `
    <span>${escapeHtml(event.eventId)}</span>
    <span>${escapeHtml(event.userEmail || 'Sistema')}</span>
    <span>${escapeHtml(new Date(event.timestamp).toLocaleString('es-ES'))}</span>`;
  $('#detail-json').textContent = JSON.stringify(event.data, null, 2);
  $('#detail').showModal();
}

function connectStream() {
  const status = $('#connection');
  const source = new EventSource('/api/audit/stream');
  source.addEventListener('connected', () => {
    status.className = 'connection online';
    status.lastElementChild.textContent = 'En vivo';
    loadEvents(false);
  });
  source.addEventListener('audit', () => {
    clearTimeout(state.reloadTimer);
    state.reloadTimer = setTimeout(() => loadEvents(false), 150);
  });
  source.onerror = () => {
    status.className = 'connection offline';
    status.lastElementChild.textContent = 'Reconectando…';
  };
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 3500);
}

$('#filters').addEventListener('submit', (event) => {
  event.preventDefault();
  state.page = 1;
  loadEvents();
});
$('#clear').addEventListener('click', () => {
  $('#filters').reset();
  state.page = 1;
  loadEvents();
});
$('#previous').addEventListener('click', () => { state.page--; loadEvents(); });
$('#next').addEventListener('click', () => { state.page++; loadEvents(); });
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (button) openDetail(button.dataset.id);
});
$('#close-detail').addEventListener('click', () => $('#detail').close());
$('#detail').addEventListener('click', (event) => {
  if (event.target === $('#detail')) $('#detail').close();
});

loadEvents();
connectStream();
