import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

// 1. Control de Seguridad por Rol
const usuario = exigirSesion();

if (!usuario || (usuario.rol !== 'administrador' && usuario.rol !== 'empleado')) {
  alert("Acceso Restringido: solo administrador o empleado.");
  window.location.href = usuario ? 'registro.html' : 'login.html';
  throw new Error('Acceso restringido');
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

// Mostrar Badge con Estilo según Rol
const badgeInfo = document.getElementById('user-info');
badgeInfo.textContent = `${usuario.nombre} [${usuario.rol.toUpperCase()}]`;
badgeInfo.className = `badge-rol ${usuario.rol === 'administrador' ? 'badge-admin' : 'badge-empleado'}`;

document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);

// 2. Pestañas (Trámites / Quejas / Usuarios[solo admin])
const TABS = { 'tab-tramites': 'sec-tramites', 'tab-quejas': 'sec-quejas', 'tab-usuarios': 'sec-usuarios' };
if (usuario.rol === 'administrador') document.getElementById('tab-usuarios').style.display = '';
Object.entries(TABS).forEach(([t, sec]) => document.getElementById(t).addEventListener('click', () => {
  Object.entries(TABS).forEach(([t2, s2]) => {
    document.getElementById(t2).classList.toggle('active', t2 === t);
    document.getElementById(s2).style.display = s2 === sec ? 'block' : 'none';
  });
}));

// 3. Cargar Datos y Aplicar Permisos
const tabla = document.getElementById('tabla-panel');
const form = document.getElementById('form-panel');
const btnCancel = document.getElementById('pnl-btn-cancel');

let cacheRegistros = [];
async function listarTodos() {
  try {
    const registros = await sql`
      SELECT id, beneficiario, dni, programa, estado, id_usuario
      FROM inscripciones_programas_sociales
      ORDER BY id DESC;
    `;

    cacheRegistros = registros;
    if (registros.length === 0) {
      tabla.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay registros cargados.</td></tr>`;
      return;
    }

    tabla.innerHTML = registros.map(r => `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${esc(r.beneficiario)}</td>
        <td>${esc(r.dni)}</td>
        <td>${esc(r.programa)}</td>
        <td><span style="color: ${r.estado === 'atendido' ? 'green' : '#d97706'}; font-weight:bold;">${esc(r.estado)}</span></td>
        <td>${r.id_usuario ? 'Web (Cliente)' : '<em>Presencial</em>'}</td>
        <td>
          <button data-accion="editar" data-id="${r.id}" class="boton" style="padding:4px 8px;">Editar</button>
          <button data-accion="eliminar" data-id="${r.id}" class="boton" style="padding:4px 8px; background:#dc3545; color:white;">Eliminar</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    tabla.innerHTML = `<tr><td colspan="7" style="color:red;">Error al cargar panel: ${esc(err.message)}</td></tr>`;
  }
}

export async function crearRegistro(datos) {
  await sql`
    INSERT INTO inscripciones_programas_sociales (beneficiario, dni, programa, estado, id_usuario)
    VALUES (${datos.beneficiario}, ${datos.dni}, ${datos.programa}, ${datos.estado}, NULL);
  `;
}

export async function actualizarCualquiera(id, datos) {
  await sql`
    UPDATE inscripciones_programas_sociales
    SET beneficiario = ${datos.beneficiario}, dni = ${datos.dni}, programa = ${datos.programa}, estado = ${datos.estado}
    WHERE id = ${id};
  `;
}

export async function eliminarRegistro(id) {
  await sql`
    DELETE FROM inscripciones_programas_sociales WHERE id = ${id};
  `;
}

const prepararEdicion = (id, beneficiario, dni, programa, estado) => {
  document.getElementById('form-titulo').textContent = `Editando Registro ID #${id}`;
  document.getElementById('pnl-id').value = id;
  document.getElementById('pnl-nombre').value = beneficiario;
  document.getElementById('pnl-dni').value = dni;
  document.getElementById('pnl-programa').value = programa;
  document.getElementById('pnl-estado').value = estado;
  btnCancel.style.display = 'inline-block';
};

const eliminar = async (id) => {
  if (confirm(`¿Está seguro de eliminar permanentemente el registro ID #${id}?`)) {
    try {
      await eliminarRegistro(id);
      alert("Registro eliminado del sistema.");
      listarTodos();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }
};

tabla.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-accion]');
  if (!b) return;
  const id = Number(b.dataset.id);
  if (b.dataset.accion === 'eliminar') return eliminar(id);
  const r = cacheRegistros.find(x => x.id === id);
  if (r) prepararEdicion(r.id, r.beneficiario, r.dni, r.programa, r.estado);
});

btnCancel.addEventListener('click', () => {
  form.reset();
  document.getElementById('pnl-id').value = '';
  document.getElementById('form-titulo').textContent = 'Registrar Trámite Presencial / Telefónico';
  btnCancel.style.display = 'none';
});

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pnl-id').value;
    const datos = {
      beneficiario: document.getElementById('pnl-nombre').value,
      dni: document.getElementById('pnl-dni').value,
      programa: document.getElementById('pnl-programa').value,
      estado: document.getElementById('pnl-estado').value
    };

    try {
      if (id) {
        await actualizarCualquiera(id, datos);
        alert("¡Registro actualizado exitosamente!");
      } else {
        await crearRegistro(datos);
        alert("¡Nuevo trámite presencial registrado!");
      }
      form.reset();
      btnCancel.click();
      listarTodos(); cargarStats();
    } catch (err) {
      alert("Error en la operación: " + err.message);
    }
  });
}

listarTodos();

// 4. Estadísticas, quejas reales y usuarios
async function cargarStats() {
  const [t] = await sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado='registrado') AS pend, COUNT(*) FILTER (WHERE estado='atendido') AS aten FROM inscripciones_programas_sociales;`;
  let q = { pend: 0 };
  try { [q] = await sql`SELECT COUNT(*) FILTER (WHERE estado='pendiente') AS pend FROM quejas;`; } catch { /* tabla quejas aún no creada */ }
  document.getElementById('stats').innerHTML = [['Solicitudes', t.total], ['Por atender', t.pend], ['Atendidas', t.aten], ['Quejas pendientes', q.pend]]
    .map(([k, v]) => `<div class="stat"><strong>${esc(v)}</strong><span>${k}</span></div>`).join('');
}
async function cargarQuejas() {
  const tb = document.getElementById('tabla-quejas');
  try {
    const r = await sql`SELECT q.id, q.tipo, q.descripcion, q.estado, u.nombre FROM quejas q LEFT JOIN usuarios u ON u.id = q.id_usuario ORDER BY q.id DESC;`;
    tb.innerHTML = r.length ? r.map(q => `<tr><td>#${q.id}</td><td>${esc(q.nombre)}</td><td>${esc(q.tipo)}</td><td>${esc(q.descripcion)}</td>
      <td>${esc(q.estado)}</td><td>${q.estado === 'pendiente' ? `<button class="boton" data-resp="${q.id}">Responder</button>` : '✔'}</td></tr>`).join('')
      : '<tr><td colspan="6">Sin quejas registradas.</td></tr>';
  } catch (err) { tb.innerHTML = `<tr><td colspan="6">Crea la tabla con quejas_neon.sql (${esc(err.message)})</td></tr>`; }
}
document.getElementById('tabla-quejas').addEventListener('click', async (ev) => {
  const b = ev.target.closest('button[data-resp]');
  if (!b) return;
  const txt = prompt('Escribe la respuesta para el ciudadano:');
  if (!txt) return;
  await sql`UPDATE quejas SET respuesta = ${txt}, estado = 'resuelta' WHERE id = ${Number(b.dataset.resp)};`;
  cargarQuejas(); cargarStats();
});
// 5. Gestión de usuarios (solo administrador)
const usrMsg = document.getElementById('usr-msg');
function avisoUsuario(texto, ok = true) {
  usrMsg.textContent = texto;
  usrMsg.className = 'usr-msg ' + (ok ? 'usr-ok' : 'usr-error');
}
async function cargarUsuarios() {
  if (usuario.rol !== 'administrador') return;
  const r = await sql`SELECT id, nombre, correo, rol FROM usuarios ORDER BY CASE rol WHEN 'administrador' THEN 1 WHEN 'empleado' THEN 2 ELSE 3 END, id;`;
  document.getElementById('tabla-usuarios').innerHTML = r.map(u => {
    const yo = u.id === usuario.id;
    return `<tr>
      <td>${u.id}</td><td>${esc(u.nombre)}${yo ? ' <em>(tú)</em>' : ''}</td><td>${esc(u.correo)}</td>
      <td><select data-rol-id="${u.id}" aria-label="Rol de ${esc(u.nombre)}" ${yo ? 'disabled' : ''}>
        ${['cliente', 'empleado', 'administrador'].map(x => `<option value="${x}" ${x === u.rol ? 'selected' : ''}>${x}</option>`).join('')}
      </select></td>
      <td>${yo ? '—' : `<button class="boton" style="padding:4px 8px; background:#dc3545; color:white;" data-del-usr="${u.id}">Eliminar</button>`}</td>
    </tr>`;
  }).join('');
}
document.getElementById('form-usuario')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nombre = document.getElementById('usr-nombre').value.trim();
  const correo = document.getElementById('usr-correo').value.trim().toLowerCase();
  const pass = document.getElementById('usr-pass').value;
  const rol = document.getElementById('usr-rol').value;
  try {
    await sql`INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (${nombre}, ${correo}, ${pass}, ${rol});`;
    ev.target.reset();
    avisoUsuario(`Cuenta de ${rol} creada para ${nombre}.`);
    cargarUsuarios();
  } catch (err) {
    avisoUsuario(/duplicate|unique/i.test(err.message) ? 'Ese correo ya está registrado.' : 'No se pudo crear la cuenta: ' + err.message, false);
  }
});
const tablaUsr = document.getElementById('tabla-usuarios');
tablaUsr.addEventListener('change', async (ev) => {
  const sel = ev.target.closest('select[data-rol-id]');
  if (!sel) return;
  try {
    await sql`UPDATE usuarios SET rol = ${sel.value} WHERE id = ${Number(sel.dataset.rolId)};`;
    avisoUsuario('Rol actualizado a ' + sel.value + '.');
  } catch (err) { avisoUsuario('No se pudo cambiar el rol: ' + err.message, false); cargarUsuarios(); }
});
tablaUsr.addEventListener('click', async (ev) => {
  const b = ev.target.closest('button[data-del-usr]');
  if (!b || !confirm('¿Eliminar esta cuenta de forma permanente?')) return;
  try {
    await sql`DELETE FROM usuarios WHERE id = ${Number(b.dataset.delUsr)};`;
    avisoUsuario('Cuenta eliminada.');
    cargarUsuarios();
  } catch (err) {
    avisoUsuario(/foreign key|violates/i.test(err.message) ? 'No se puede eliminar: la cuenta tiene registros o quejas asociados.' : 'Error: ' + err.message, false);
  }
});
cargarStats(); cargarQuejas(); cargarUsuarios();
