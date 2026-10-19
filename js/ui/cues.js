// Voce, segnali sonori e schermo acceso. Ogni funzione e' innocua se l'API manca:
// l'app resta usabile solo a vista.

let audio = null
let voice = null
let wakeLock = null
let wantWake = false

function pickVoice() {
  try {
    const voices = speechSynthesis.getVoices()
    voice = voices.find((v) => v.lang?.toLowerCase().startsWith('it')) ?? null
  } catch { voice = null }
}

// Da chiamare dentro un tocco dell'utente (il tasto "Via"): sblocca audio e voce su iOS.
export function unlock() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
  } catch { audio = null }
  try {
    pickVoice()
    speechSynthesis.onvoiceschanged = pickVoice
    const u = new SpeechSynthesisUtterance('')
    speechSynthesis.speak(u)
  } catch { /* nessuna sintesi vocale */ }
}

export function speak(text) {
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'it-IT'
    if (voice) u.voice = voice
    u.rate = 1.05
    speechSynthesis.speak(u)
  } catch { /* nessuna sintesi vocale */ }
}

export function beep(kind = 'bip') {
  if (!audio) return
  try {
    const plan = kind === 'fine' ? [[880, 0], [660, 0.18], [990, 0.36]]
      : kind === 'fineBlocco' ? [[660, 0], [880, 0.2]]
        : kind === 'via' ? [[990, 0]]
          : [[740, 0]]
    for (const [freq, at] of plan) {
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.frequency.value = freq
      o.type = 'sine'
      const t = audio.currentTime + at
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'bip' ? 0.15 : 0.25))
      o.connect(g).connect(audio.destination)
      o.start(t)
      o.stop(t + 0.3)
    }
  } catch { /* audio non disponibile */ }
}

async function requestWake() {
  try {
    if (!('wakeLock' in navigator)) return
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener?.('release', () => { wakeLock = null })
  } catch { wakeLock = null }
}

export function keepAwake(on) {
  wantWake = on
  if (on) requestWake()
  else {
    try { wakeLock?.release() } catch { /* gia' rilasciato */ }
    wakeLock = null
  }
}

// Il wake lock cade quando la pagina va in background: lo si riprende al ritorno.
try {
  document.addEventListener('visibilitychange', () => {
    if (wantWake && document.visibilityState === 'visible' && !wakeLock) requestWake()
  })
} catch { /* fuori dal browser */ }
