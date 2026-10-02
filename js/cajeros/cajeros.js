import { temaSiHaySesion, cerrarSesion } from '../auth/auth.js';
temaSiHaySesion();
document.getElementById('btn-logout')?.addEventListener('click', () => sessionStorage.getItem('usuario') ? cerrarSesion() : (window.location.href = 'login.html'));

const CAJEROS = [ // coordenadas referenciales: ajústalas a tu gusto
  { n: 'Agencia Plaza Constitución', d: 'Jr. Real, Cercado', lat: -12.0679, lon: -75.2104, h: '24 horas' },
  { n: 'Cajero Terminal Terrestre', d: 'Av. Ferrocarril', lat: -12.0722, lon: -75.2043, h: '24 horas' },
  { n: 'Cajero Parque de la Identidad', d: 'Av. Giráldez', lat: -12.0645, lon: -75.2078, h: '6:00 - 22:00' },
  { n: 'Agencia El Tambo', d: 'Av. Mariscal Castilla', lat: -12.0468, lon: -75.2049, h: '9:00 - 18:00' }
];
const ul = document.getElementById('lista-cajeros');
const mapa = document.getElementById('mapa');
const link = document.getElementById('link-mapa');
function ver(c, li) {
  const b = 0.006;
  mapa.src = `https://www.openstreetmap.org/export/embed.html?bbox=${c.lon-b},${c.lat-b},${c.lon+b},${c.lat+b}&layer=mapnik&marker=${c.lat},${c.lon}`;
  link.href = `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`;
  ul.querySelectorAll('li').forEach(x => x.classList.remove('activo'));
  li.classList.add('activo');
}
CAJEROS.forEach((c, k) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button"><strong></strong><span></span><em></em></button>`;
  li.querySelector('strong').textContent = c.n;
  li.querySelector('span').textContent = c.d;
  li.querySelector('em').textContent = 'Horario: ' + c.h;
  li.querySelector('button').addEventListener('click', () => ver(c, li));
  ul.appendChild(li);
  if (k === 0) ver(c, li);
});
