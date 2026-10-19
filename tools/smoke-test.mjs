/**
 * Smoke test end-to-end: Chrome headless via DevTools Protocol, senza dipendenze
 * (stesso approccio di Flip7). Verifica che i moduli si carichino, che l'anteprima
 * compaia, che "Via" porti alla sessione col primo esercizio di riscaldamento, che
 * "Termina" porti al voto e il voto torni all'avvio. Salva screenshot a 390 e 1024 px.
 *
 * Uso:
 *   1. npm run serve            (http://localhost:8090)
 *   2. node tools/smoke-test.mjs   [APP_URL=... per un altro indirizzo]
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:8090/'
const PORT = 9333
const SHOTS = 'screenshots'
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p))

const results = []
let failures = 0
function check(name, ok, detail = '') {
  if (!ok) failures++
  results.push(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `  -> ${detail}`}`)
}

function connect(url) {
  const ws = new WebSocket(url)
  const pending = new Map()
  const listeners = []
  let id = 1
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result)
    } else if (msg.method) {
      for (const l of listeners) l(msg)
    }
  })
  return {
    ready: new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }) }),
    send(method, params = {}) {
      const i = id++
      ws.send(JSON.stringify({ id: i, method, params }))
      return new Promise((resolve, reject) => pending.set(i, { resolve, reject }))
    },
    on(fn) { listeners.push(fn) },
    close() { ws.close() },
  }
}

async function main() {
  if (!CHROME) throw new Error('Nessun browser Chromium trovato.')
  const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.env.TEMP ?? '/tmp'}/allenamento-smoke-${Date.now()}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' })
  let c
  try {
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break } catch { /* attesa */ }
      await sleep(200)
    }
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
    c = connect(target.webSocketDebuggerUrl)
    await c.ready
    const errors = []
    c.on((m) => {
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url ?? ''}`)
    })
    await c.send('Runtime.enable')
    await c.send('Page.enable')
    await c.send('Log.enable')
    const ev = async (expression) => (await c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value
    const viewport = (width, height, mobile) => c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    const shot = async (name) => {
      const { data } = await c.send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data, 'base64'))
    }
    mkdirSync(SHOTS, { recursive: true })

    await viewport(390, 844, true)
    await c.send('Page.navigate', { url: `${APP_URL}?durata=15&attrezzi=manubri,trave` })
    await sleep(1500)

    check('avvio visibile', await ev("!document.getElementById('avvio').hidden"))
    check('15 min selezionato', await ev("[...document.querySelectorAll('#durate button')].find(b=>b.getAttribute('aria-pressed')==='true')?.textContent.startsWith('15')"))
    check('anteprima con esercizi', await ev("document.querySelectorAll('#anteprima li').length >= 2"))
    check('nessun overflow orizzontale a 390', await ev('document.documentElement.scrollWidth <= 390'), String(await ev('document.documentElement.scrollWidth')))
    await shot('avvio-390')

    await ev("document.getElementById('via').click()")
    await sleep(700)
    check('sessione visibile', await ev("!document.getElementById('sessione').hidden"))
    check('fase riscaldamento', await ev("document.getElementById('fase-nome').textContent === 'Riscaldamento'"))
    check('primo esercizio "Marcia sul posto"', await ev("document.getElementById('es-nome').textContent === 'Marcia sul posto'"))
    check('numero del timer presente', await ev("/^\\d+$/.test(document.getElementById('numero').textContent)"))
    await shot('sessione-390')

    await ev("document.getElementById('termina').click()")
    await ev("document.getElementById('termina').click()")
    await sleep(300)
    check('schermata voto', await ev("!document.getElementById('fine').hidden && document.querySelectorAll('#voti button').length === 4"))
    await shot('fine-390')
    await ev("document.querySelector('#voti button').click()")
    await sleep(300)
    check('ritorno all\'avvio', await ev("!document.getElementById('avvio').hidden"))
    check('storico salvato con voto', await ev("JSON.parse(localStorage.getItem('allenamento-casa:v1')).history[0].voto === 'facile'"))

    await viewport(1024, 900, false)
    await sleep(300)
    check('nessun overflow orizzontale a 1024', await ev('document.documentElement.scrollWidth <= 1024'))
    await shot('avvio-1024')

    check('nessun errore in console', errors.length === 0, errors.join(' | '))
  } finally {
    c?.close()
    child.kill()
  }
  console.log(results.join('\n'))
  console.log(failures ? `\n${failures} controlli falliti` : '\nTutto ok')
  process.exitCode = failures ? 1 : 0
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
