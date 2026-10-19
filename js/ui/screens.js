// Funzioni di disegno delle schermate. Nessuno stato qui: ricevono dati e callback.

import { byId } from '../core/catalog.js'
import { FORMATS } from '../core/formats.js'
import { RULES } from '../core/rules.js'

export const VOTI = [
  { v: 'facile', t: 'Troppo facile', d: 'Avrei potuto fare molto di più.' },
  { v: 'giusta', t: 'Giusta', d: 'Impegnativa ma sotto controllo.' },
  { v: 'faticosa', t: 'Faticosa', d: 'Al limite, ma tecnica tenuta fino alla fine.' },
  { v: 'difficile', t: 'Troppo difficile', d: 'Mi sono fermato o ho perso la tecnica.' },
]

export const FASI = { riscaldamento: 'Riscaldamento', blocco: 'Circuito', pausa: 'Recupero', defaticamento: 'Defaticamento' }

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function formatTime(sec) {
  if (sec == null) return ''
  const s = Math.max(0, sec)
  if (s < 60) return String(s)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function renderSeg(container, options, value, onPick) {
  container.replaceChildren(...options.map((o) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.innerHTML = o.html ?? esc(o.label)
    b.setAttribute('aria-pressed', String(o.value === value))
    b.addEventListener('click', () => onPick(o.value))
    return b
  }))
}

export function renderPreview(el, session) {
  const f = FORMATS.find((x) => x.id === session.formatoId)
  const [w, m, c] = RULES.SPLIT[session.durataMin]
  const main = session.steps.filter((s) => s.fase === 'blocco' || s.fase === 'pausa')
  const firstWork = main.findIndex((s) => s.fase === 'blocco')
  let ritmo = ''
  if (main[firstWork]?.tipo === 'tempo') {
    const rest = main[firstWork + 1]?.fase === 'pausa' ? main[firstWork + 1].sec : 0
    ritmo = `${main[firstWork].sec}:${rest}`
  } else if (main[firstWork]) {
    ritmo = `tempo limite ${m} min`
  }
  const nomi = session.esercizi.map((id) => byId(id)?.nome ?? id)
  el.innerHTML = `
    <h3>${esc(f?.nome ?? session.formatoId)}${ritmo ? ` <span class="tag">${esc(ritmo)}</span>` : ''}${session.leggera ? ' <span class="tag">leggera</span>' : ''}</h3>
    <p class="phases">Riscaldamento ${w} min, circuito ${m} min, defaticamento ${c} min</p>
    <ol>${nomi.map((n) => `<li>${esc(n)}</li>`).join('')}</ol>`
}

export function renderExerciseChoices(ul, exercises, pers, onChange) {
  const includi = new Set(pers.includi)
  const escludi = new Set(pers.escludi)
  ul.replaceChildren(...exercises.map((e) => {
    const li = document.createElement('li')
    const label = document.createElement('span')
    label.textContent = e.nome
    const sel = document.createElement('select')
    sel.setAttribute('aria-label', `Scelta per ${e.nome}`)
    for (const [v, t] of [['auto', 'auto'], ['includi', 'sempre'], ['escludi', 'mai']]) {
      const o = document.createElement('option')
      o.value = v
      o.textContent = t
      sel.append(o)
    }
    sel.value = includi.has(e.id) ? 'includi' : escludi.has(e.id) ? 'escludi' : 'auto'
    sel.addEventListener('change', () => onChange(e.id, sel.value))
    li.append(label, sel)
    return li
  }))
}

export function renderVotes(el, onVote) {
  el.replaceChildren(...VOTI.map((x) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.innerHTML = `<strong>${esc(x.t)}</strong><span>${esc(x.d)}</span>`
    b.addEventListener('click', () => onVote(x.v))
    return b
  }))
}

export function renderHistory(ul, history, onRevote) {
  if (!history.length) {
    ul.innerHTML = '<li class="hint">Nessuna sessione ancora.</li>'
    return
  }
  ul.replaceChildren(...history.slice(0, 60).map((h, i) => {
    const li = document.createElement('li')
    const d = new Date(h.data)
    const quando = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
    const f = FORMATS.find((x) => x.id === h.formatoId)?.nome ?? h.formatoId
    const voto = VOTI.find((x) => x.v === h.voto)?.t ?? 'senza voto'
    // I dati possono arrivare da un backup importato: tutto passa da esc().
    li.innerHTML = `<strong>${esc(quando)}, ${esc(h.durataMin)} min</strong>
      <span class="meta">${esc(f)}${h.leggera ? ', leggera' : ''}${h.interrotta ? ', interrotta' : ''}, ${esc(h.saltati?.length ?? 0)} saltati</span>`
    if (i === 0 && h.levelsPrima) {
      const sel = document.createElement('select')
      sel.setAttribute('aria-label', 'Voto dell\'ultima sessione')
      for (const x of [{ v: '', t: 'senza voto' }, ...VOTI]) {
        const o = document.createElement('option')
        o.value = x.v
        o.textContent = x.t
        sel.append(o)
      }
      sel.value = h.voto ?? ''
      sel.addEventListener('change', () => sel.value && onRevote(sel.value))
      li.append(sel)
    } else {
      const s = document.createElement('span')
      s.className = 'meta'
      s.textContent = `Voto: ${voto}`
      li.append(s)
    }
    return li
  }))
}
