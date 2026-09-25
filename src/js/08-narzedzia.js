// ==================== NARZĘDZIA =========================================================
// Matematyka, losowość, szum, wyszukiwanie ścieżki, kolory.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function thash(x, y, s = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0;
}
function makeNoise(rng) {
  const P = 256, grid = new Float32Array(P * P); for (let i = 0; i < grid.length; i++) grid[i] = rng();
  const v = (x, y) => grid[((y & 255) * P) + (x & 255)], sm = t => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), w = sm(y - yi);
    const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  return (x, y) => { let s = 0, amp = 1, f = 1, tot = 0; for (let o = 0; o < 4; o++) { s += n2(x * f + o * 17.3, y * f + o * 9.1) * amp; tot += amp; amp *= 0.5; f *= 2; } return s / tot; };
}
function vnoise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = thash(xi, yi, seed) / 4294967296, b = thash(xi + 1, yi, seed) / 4294967296, c = thash(xi, yi + 1, seed) / 4294967296, d = thash(xi + 1, yi + 1, seed) / 4294967296;
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function quantile(arr, p) { const a = Float32Array.from(arr).sort(); return a[Math.floor(clamp(p, 0, 1) * (a.length - 1))]; }
// A* na siatce 8-kierunkowej. costFn(j, i, diag) zwraca koszt wejścia na pole j lub Infinity.
function findPath(n, sx, sy, tx, ty, costFn, minCost = 1) {
  const N = n * n, g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N), heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } }
    return top;
  };
  const hfn = i => { const dx = Math.abs(i % n - tx), dy = Math.abs(((i / n) | 0) - ty); return (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)) * minCost; };
  const s = sy * n + sx, t = ty * n + tx; g[s] = 0; push(0, s);
  while (heap.length) {
    const i = pop()[1]; if (i === t) break; if (closed[i]) continue; closed[i] = 1;
    const x = i % n, y = (i / n) | 0;
    for (let d = 0; d < 8; d++) {
      const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx; if (closed[j]) continue;
      const c = costFn(j, i, d >= 4); if (c === Infinity) continue;
      const ng = g[i] + c * (d >= 4 ? 1.414 : 1); if (ng < g[j]) { g[j] = ng; came[j] = i; push(ng + hfn(j), j); }
    }
  }
  if (s !== t && came[t] === -1) return null;
  const path = []; for (let i = t; i !== -1; i = came[i]) { path.push(i); if (i === s) break; }
  return path.reverse();
}
function hexRgb(h) { const v = parseInt(h.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
function shadeHex(hex, f) {
  const [r, g, b] = hexRgb(hex), k = f < 0 ? 1 + f : 1 - f, a = f > 0 ? f * 255 : 0;
  return `rgb(${Math.round(r * k + a)},${Math.round(g * k + a)},${Math.round(b * k + a)})`;
}
const inRect = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

