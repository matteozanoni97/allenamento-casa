// Player della sessione: macchina a stati basata sull'orologio, non sul conteggio dei
// tick. Se il telefono sospende la pagina, al ritorno lo stato si ricalcola dal tempo
// reale trascorso. Nessun timer qui dentro: la UI chiama state(now) quando vuole.

import { byId } from './catalog.js'

const MAIN = new Set(['blocco', 'pausa'])

export function createPlayer(steps, nowMs) {
  let index = 0
  let stepStart = nowMs
  let pausedAt = null
  let capEnd = null
  let finished = steps.length === 0
  const skippedIds = []

  function enter(i, t) {
    index = i
    stepStart = t
    if (i >= steps.length) {
      finished = true
      capEnd = null
      return
    }
    const st = steps[i]
    if (st.capSec) capEnd = t + st.capSec * 1000
    else if (!MAIN.has(st.fase)) capEnd = null
  }

  function firstAfterMain(i) {
    const j = steps.findIndex((s, k) => k > i && !MAIN.has(s.fase))
    return j < 0 ? steps.length : j
  }

  function sync(now) {
    const t = pausedAt ?? now
    for (;;) {
      if (finished) return
      const st = steps[index]
      if (capEnd != null && MAIN.has(st.fase) && t >= capEnd) {
        enter(firstAfterMain(index), capEnd)
        continue
      }
      if (st.tipo === 'tempo' && t - stepStart >= st.sec * 1000) {
        enter(index + 1, stepStart + st.sec * 1000)
        continue
      }
      return
    }
  }

  function state(now) {
    sync(now)
    const t = pausedAt ?? now
    const step = finished ? null : steps[index]
    return {
      index,
      step,
      remainingSec: step && step.tipo === 'tempo' ? Math.ceil((stepStart + step.sec * 1000 - t) / 1000) : null,
      phaseEndsInSec: capEnd != null && !finished ? Math.ceil((capEnd - t) / 1000) : null,
      finished,
      paused: pausedAt != null,
    }
  }

  function pause(now) {
    sync(now)
    if (pausedAt == null) pausedAt = now
  }

  function resume(now) {
    if (pausedAt == null) return
    const d = now - pausedAt
    stepStart += d
    if (capEnd != null) capEnd += d
    pausedAt = null
  }

  function next(now) {
    sync(now)
    if (!finished) enter(index + 1, pausedAt ?? now)
  }

  function skip(now) {
    sync(now)
    const st = steps[index]
    if (!finished && st.fase === 'blocco' && st.esercizioId) skippedIds.push(st.esercizioId)
    next(now)
  }

  function describe(step) {
    if (step.fase === 'pausa') return `Recupero, ${step.sec} secondi`
    const nome = byId(step.esercizioId)?.nome ?? step.esercizioId
    return step.tipo === 'tempo' ? `${nome}, ${step.sec} secondi` : `${nome}, ${step.reps} ripetizioni`
  }

  function nextName(i) {
    const s = steps.find((x, k) => k > i && x.esercizioId)
    return s ? byId(s.esercizioId)?.nome ?? s.esercizioId : null
  }

  function cues(prev, cur) {
    if (cur.finished) return prev.finished ? [] : [{ kind: 'fine' }]
    const out = []
    if (cur.index !== prev.index) {
      const a = prev.step
      const b = cur.step
      if (a && MAIN.has(a.fase) && (!MAIN.has(b.fase) || b.blocco !== a.blocco)) out.push({ kind: 'fineBlocco' })
      const poi = nextName(cur.index)
      out.push({ kind: 'annuncia', text: poi ? `${describe(b)}. poi: ${poi}` : describe(b) })
      return out
    }
    if (cur.remainingSec != null && prev.remainingSec != null) {
      if ([3, 2, 1].some((k) => prev.remainingSec > k && cur.remainingSec <= k)) out.push({ kind: 'bip' })
    }
    return out
  }

  return { state, pause, resume, next, skip, skipped: () => [...skippedIds], cues }
}
