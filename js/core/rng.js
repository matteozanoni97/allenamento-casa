// Generatore pseudo-casuale con seme (mulberry32): stessa sessione a parità di seme,
// cosi' il generatore resta una funzione pura e testabile.

export function createRng(seed) {
  let a = seed >>> 0

  function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(min, max) {
    return min + Math.floor(next() * (max - min + 1))
  }

  function pick(arr) {
    return arr[Math.floor(next() * arr.length)]
  }

  function shuffle(arr) {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  return { next, int, pick, shuffle }
}
