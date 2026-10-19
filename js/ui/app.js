// Controllore dell'app: collega schermate, generatore, player e persistenza.

import { RULES } from '../core/rules.js'
import { CATALOG, byId } from '../core/catalog.js'
import { generateSession } from '../core/generator.js'
import { applyVote, onWeightChange } from '../core/adapt.js'
import { createStore, addHistory } from '../core/storage.js'
import { createPlayer } from '../core/player.js'
import { parseDeepLink } from './deeplink.js'
import { unlock, speak, beep, keepAwake } from './cues.js'
import {
  FASI, formatTime, renderSeg, renderPreview, renderExerciseChoices, renderVotes, renderHistory,
} from './screens.js'

const $ = (id) => document.getElementById(id)

const backend = (() => {
  try {
    const ls = window.localStorage
    ls.getItem('x')
    return ls
  } catch {
    return { getItem: () => null, setItem() {}, removeItem() {} }
  }
})()
const store = createStore(backend)
let state = store.load()

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 2 ** 30)) >>> 0
const link = parseDeepLink(location.search)
const draft = {
  durataMin: link.durataMin ?? state.settings.durataMin,
  attrezzi: link.attrezzi ?? { ...state.settings.attrezzi },
  pers: { umore: 'normale', focus: link.focus ?? 'tutto', senzaSalti: !!link.senzaSalti, includi: [], escludi: [] },
  seed: newSeed(),
}

let session = null
let player = null
let timer = null
let prev = null
let terminaArmed = null
let salvataggioFallito = false

// Unico punto in cui l'interfaccia salva: se il browser non lo permette, lo dice.
function persist() {
  salvataggioFallito = !store.save(state)
  renderAvviso()
}

function renderAvviso() {
  const msg = [
    salvataggioFallito ? 'Non riesco a salvare i dati su questo browser: esporta un backup dallo storico.' : '',
    session?.avviso ?? '',
  ].filter(Boolean).join(' ')
  $('avviso').textContent = msg
  $('avviso').hidden = !msg
}

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id
  window.scrollTo(0, 0)
}

function persForGen() {
  const p = { ...draft.pers }
  if (p.umore === 'normale') delete p.umore
  return p
}

function build() {
  session = generateSession({
    durataMin: draft.durataMin,
    attrezzi: draft.attrezzi,
    pers: persForGen(),
    levels: state.levels,
    history: state.history,
    seed: draft.seed,
    now: new Date().toISOString(),
  })
  renderPreview($('anteprima'), session)
  renderAvviso()
}

// --- Avvio ---

function renderAvvio() {
  renderSeg($('durate'), Object.keys(RULES.SPLIT).map(Number).map((d) => ({ value: d, html: `${d}<small>min</small>` })), draft.durataMin, (v) => {
    draft.durataMin = v
    renderAvvio()
  })
  $('att-manubri').checked = draft.attrezzi.manubri
  $('att-trave').checked = draft.attrezzi.trave
  $('peso-label').textContent = `${state.settings.pesoManubri} kg`
  renderSeg($('umore'), [
    { value: 'leggera', label: 'Più leggera' }, { value: 'normale', label: 'Normale' }, { value: 'spinta', label: 'Più spinta' },
  ], draft.pers.umore, (v) => { draft.pers.umore = v; renderAvvio() })
  renderSeg($('focus'), [
    { value: 'tutto', label: 'Tutto il corpo' }, { value: 'gambe', label: 'Gambe' }, { value: 'alto', label: 'Parte alta' }, { value: 'core', label: 'Core' },
  ], draft.pers.focus, (v) => { draft.pers.focus = v; renderAvvio() })
  $('senza-salti').checked = draft.pers.senzaSalti
  const disponibili = CATALOG.filter((e) => e.ruolo === 'blocco'
    && (e.attrezzo === 'corpo' || draft.attrezzi[e.attrezzo]))
  renderExerciseChoices($('scelta-esercizi'), disponibili, draft.pers, (id, v) => {
    draft.pers.includi = draft.pers.includi.filter((x) => x !== id)
    draft.pers.escludi = draft.pers.escludi.filter((x) => x !== id)
    if (v === 'includi') draft.pers.includi.push(id)
    if (v === 'escludi') draft.pers.escludi.push(id)
    build()
  })
  build()
}

$('att-manubri').addEventListener('change', (e) => { draft.attrezzi.manubri = e.target.checked; renderAvvio() })
$('att-trave').addEventListener('change', (e) => { draft.attrezzi.trave = e.target.checked; renderAvvio() })
$('senza-salti').addEventListener('change', (e) => { draft.pers.senzaSalti = e.target.checked; build() })
$('rigenera').addEventListener('click', () => { draft.seed = newSeed(); build() })
$('via').addEventListener('click', start)

// --- Sessione ---

function start() {
  unlock()
  state.settings.durataMin = draft.durataMin
  state.settings.attrezzi = { ...draft.attrezzi }
  persist()
  build()
  player = createPlayer(session.steps, Date.now())
  prev = null
  show('sessione')
  keepAwake(true)
  if (state.settings.suoni) beep('via')
  tick()
  clearInterval(timer)
  timer = setInterval(tick, 200)
}

function handleCues(cues) {
  for (const c of cues) {
    if (c.kind === 'annuncia' && state.settings.voce) speak(c.text)
    else if (c.kind !== 'annuncia' && state.settings.suoni) beep(c.kind)
  }
}

function tick() {
  const st = player.state(Date.now())
  if (prev) handleCues(player.cues(prev, st))
  else if (state.settings.voce && st.step) speak(player.cues({ index: -1 }, st).find((c) => c.kind === 'annuncia')?.text ?? '')
  prev = st
  if (st.finished) return finish(false)
  renderSessione(st)
}

function renderSessione(st) {
  const step = st.step
  const root = $('sessione')
  root.dataset.fase = step.fase
  root.classList.toggle('paused', st.paused)
  $('fase-nome').textContent = st.paused ? 'In pausa' : FASI[step.fase]
  $('fase-info').textContent = st.phaseEndsInSec != null
    ? `tempo limite ${formatTime(st.phaseEndsInSec)}`
    : step.fase === 'blocco' || step.fase === 'pausa' ? `giro ${step.giro}${step.blocco > 1 ? `, blocco ${step.blocco}` : ''}` : ''
  $('progresso').style.width = `${Math.round((st.index / session.steps.length) * 100)}%`
  $('numero').textContent = step.tipo === 'tempo' ? formatTime(st.remainingSec) : `×${step.reps}`

  const e = step.esercizioId ? byId(step.esercizioId) : null
  const poi = session.steps.slice(st.index + 1).find((s) => s.esercizioId)
  $('es-nome').textContent = e ? e.nome : 'Recupero'
  $('es-trave').hidden = !(e && e.attrezzo === 'trave')
  const imgEx = e ?? (poi ? byId(poi.esercizioId) : null)
  const img = $('es-img')
  if (imgEx?.img) {
    if (img.getAttribute('src') !== imgEx.img) img.src = imgEx.img
    img.alt = imgEx.nome
    img.hidden = false
  } else {
    img.hidden = true
  }
  $('es-istruzione').textContent = e ? e.istruzione : ''
  $('es-poi').innerHTML = ''
  if (poi) {
    $('es-poi').append('Poi: ')
    const b = document.createElement('strong')
    b.textContent = byId(poi.esercizioId).nome
    $('es-poi').append(b)
  }
  $('fatto').hidden = step.tipo !== 'ripetizioni'
  $('salta').hidden = step.fase !== 'blocco'
  $('pausa').textContent = st.paused ? 'Riprendi' : 'Pausa'
}

$('pausa').addEventListener('click', () => {
  const now = Date.now()
  if (player.state(now).paused) player.resume(now)
  else player.pause(now)
  tick()
})
$('salta').addEventListener('click', () => { player.skip(Date.now()); tick() })
$('fatto').addEventListener('click', () => { player.next(Date.now()); tick() })
$('termina').addEventListener('click', () => {
  const b = $('termina')
  if (terminaArmed) {
    clearTimeout(terminaArmed)
    terminaArmed = null
    b.textContent = 'Termina'
    b.classList.remove('confirm')
    return finish(true)
  }
  b.textContent = 'Conferma'
  b.classList.add('confirm')
  terminaArmed = setTimeout(() => {
    terminaArmed = null
    b.textContent = 'Termina'
    b.classList.remove('confirm')
  }, 3000)
})

// --- Fine ---

function finish(interrotta) {
  clearInterval(timer)
  timer = null
  keepAwake(false)
  state = addHistory(state, {
    sessionId: session.id,
    data: session.creata,
    durataMin: session.durataMin,
    formatoId: session.formatoId,
    esercizi: session.esercizi,
    saltati: player.skipped(),
    voto: null,
    leggera: session.leggera,
    interrotta,
    levelsPrima: state.levels,
  })
  persist()
  renderVotes($('voti'), vote)
  show('fine')
}

function vote(v) {
  const h = state.history[0]
  state.levels = applyVote(h.levelsPrima, { esercizi: h.esercizi, leggera: h.leggera }, v, h.saltati)
  state.history = [{ ...h, voto: v }, ...state.history.slice(1)]
  persist()
  draft.seed = newSeed()
  show('avvio')
  renderAvvio()
}

// --- Storico e impostazioni ---

function renderStorico() {
  renderHistory($('lista-storico'), state.history, (v) => {
    const h = state.history[0]
    state.levels = applyVote(h.levelsPrima, { esercizi: h.esercizi, leggera: h.leggera }, v, h.saltati)
    state.history = [{ ...h, voto: v }, ...state.history.slice(1)]
    persist()
    renderStorico()
  })
  $('peso').value = state.settings.pesoManubri
  $('voce').checked = state.settings.voce
  $('suoni').checked = state.settings.suoni
}

$('apri-storico').addEventListener('click', () => { renderStorico(); show('storico') })
$('chiudi-storico').addEventListener('click', () => { show('avvio'); renderAvvio() })
$('peso').addEventListener('change', (e) => {
  const kg = Number(e.target.value)
  if (!(kg > 0)) { e.target.value = state.settings.pesoManubri; return }
  state.levels = onWeightChange(state.levels, state.settings.pesoManubri, kg)
  state.settings.pesoManubri = kg
  persist()
})
$('voce').addEventListener('change', (e) => { state.settings.voce = e.target.checked; persist() })
$('suoni').addEventListener('change', (e) => { state.settings.suoni = e.target.checked; persist() })
$('esporta').addEventListener('click', () => {
  const blob = new Blob([store.exportJson(state)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `allenamento-casa-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  $('msg-backup').textContent = 'Backup esportato.'
})
$('importa').addEventListener('change', async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    state = store.importJson(await file.text())
    persist()
    $('msg-backup').textContent = `Backup importato: ${state.history.length} sessioni.`
    renderStorico()
  } catch (err) {
    $('msg-backup').textContent = err.message
  }
  e.target.value = ''
})

// --- Avvio dell'app ---

renderAvvio()
show('avvio')
if (link.avvia) start()

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
