# Allenamento Casa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA statica che genera sessioni di allenamento a casa (riscaldamento, circuito, defaticamento) per durata e attrezzi, le scandisce a tempo e adatta la successiva col voto di fine sessione.

**Architecture:** Nucleo puro e testabile in moduli ES (`js/core/`): regole, catalogo, generatore deterministico con seme, adattamento, timeline. Uno strato browser (`js/ui/`) per schermate, voce, bip e wake lock, e un unico modulo di persistenza su `localStorage`. Una CLI Node riusa il nucleo per la skill del brain.

**Tech Stack:** HTML, CSS, moduli ES senza build e senza dipendenze; `node --test` (Node 24); Service Worker; Web Speech API, Web Audio, Screen Wake Lock; GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-19-allenamento-casa-design.md` (+ `docs/principi-sessione.md` per i valori con fonte).

## Global Constraints

- Zero dipendenze runtime, zero build: i file si servono così come sono (come Flip7).
- Testi dell'interfaccia in italiano; **mai il trattino lungo** nei testi.
- Durate offerte: 15, 20, 30, 45 min. Ripartizione (riscaldamento + blocco + defaticamento, minuti): 15 → 3+9+3; 20 → 4+12+4; 30 → 5+20+5; 45 → 7+31+7.
- Attrezzi: corpo libero sempre; `manubri` (peso default 10 kg, impostabile); `trave` (solo prese ampie, mano aperta).
- Spazio 2 × 1,5 m: nel catalogo solo esercizi da fermo.
- Stesso input + stesso seme ⇒ stessa sessione (generatore puro).
- Tutte le soglie numeriche in `js/core/rules.js`, nessun numero magico altrove.
- Dati solo su dispositivo, chiave `localStorage` `allenamento-casa:v1`, formato con `schemaVersion: 1`; esporta/importa JSON.
- Ogni chiamata a speech/audio/wake lock degrada senza errori se l'API manca.
- Avvio: dalla schermata iniziale si parte con un solo tocco su "Via" (durata e attrezzi hanno default).
- Service worker network-first per documento e JS, cache-first per il resto; costante `VERSION` alzata a ogni rilascio.

## Review Focus

1. **Catalogo povero per una combinazione** (solo corpo libero + "senza salti" + focus "parte alta"): ci si aspetta comunque una sessione valida, ripetendo esercizi recenti piuttosto che fallire. Test in Task 4.
2. **Storico vuoto o corrotto in `localStorage`** (JSON non valido, versione futura): l'app parte coi default e non cancella in silenzio il dato originale (lo conserva sotto `allenamento-casa:v1:corrotto`). Test in Task 6.
3. **Telefono in pausa o scheda in background durante la sessione**: la timeline si basa sull'orologio, non sul conteggio dei tick, quindi al ritorno il tempo trascorso è corretto. Test in Task 7.
4. **Esercizi esclusi che svuotano un movimento**: il movimento si salta e la sessione resta nel budget di tempo. Test in Task 4.
5. **Formati a ripetizioni più lenti del previsto**: allo scadere del tempo limite del blocco si passa al defaticamento. Test in Task 7.

---

### Task 1: Scaffold, regole e RNG

**Files:**
- Create: `package.json`, `README.md`, `LICENSE` (MIT), `.gitignore`, `AGENTS.md`, `CLAUDE.md` (rimanda ad `AGENTS.md`)
- Create: `js/core/rules.js`, `js/core/rng.js`
- Test: `test/rules.test.js`, `test/rng.test.js`

**Interfaces:**
- Produces: `RULES` (oggetto congelato) con `SPLIT` `{15:[3,9,3],20:[4,12,4],30:[5,20,5],45:[7,31,7]}`, `LEVEL_MIN=1`, `LEVEL_MAX=10`, `LEVEL_START=3`, `MOVEMENTS=['gambe','anca','spinta','trazione','core','cardio']`, `RECENT_SESSIONS_AVOID=2`, `LIGHT_EVERY=3`, `STRETCH_HOLD_SEC=30`, `WARMUP_ITEM_SEC=30`, `REPS` (tabella livello → ripetizioni base), `INTERVALS` (tabella livello → coppie lavoro:recupero ammesse), `GRADINO_MAX(level)`.
- Produces: `createRng(seed: number) => { next(): number /*[0,1)*/, int(min,max), pick(arr), shuffle(arr) }` (mulberry32).

- [ ] **Step 1: Test** `rng: stesso seme stessa sequenza` (due rng con seme 42 producono gli stessi 10 valori; seme 43 diverso); `rng: int nei limiti` (10 000 estrazioni di `int(1,6)` tutte in [1,6] e tutti i valori presenti).
- [ ] **Step 2: Test** `rules: split somma alla durata` (per ogni chiave di `SPLIT` la somma = durata); `rules: GRADINO_MAX` (`1→1, 3→1, 4→2, 7→3, 10→4`, cioè `1 + floor((level-1)/3)`).
- [ ] **Step 3:** `node --test` → FAIL (moduli assenti).
- [ ] **Step 4:** Implementa. Valori tabelle: `REPS` livello 1..10 = `[6,8,8,10,10,12,12,14,15,16]`; `INTERVALS` livelli 1-3 `['20:20','30:30']`, 4-6 `['20:20','30:30','30:15','10:10']`, 7-10 `['30:15','40:20','10:10','30:30']`.
- [ ] **Step 5:** `node --test` → PASS. `package.json` con `"type":"module"`, script `test: node --test`, `serve: python -m http.server 8090`.
- [ ] **Step 6:** Commit `chore: scaffold, regole e rng`.

### Task 2: Catalogo esercizi e immagini

**Files:**
- Create: `js/core/catalog.js`, `tools/import-images.mjs`, `img/ex/<id>.jpg` (generati), `img/ex/SOURCES.md`
- Test: `test/catalog.test.js`

**Interfaces:**
- Produces: `CATALOG: Exercise[]` e `byId(id): Exercise`.
  `Exercise = { id, nome, ruolo: 'blocco'|'riscaldamento'|'defaticamento', movimento: one of RULES.MOVEMENTS | 'mobilita' | 'stretching', attrezzo: 'corpo'|'manubri'|'trave', salto: boolean, unilaterale: boolean, scala: string|null, gradino: 1..4, secPerRep: number, istruzione: string, img: string|null, fedb: string|null, stretchFor?: string[] }`

- [ ] **Step 1: Test** `catalog: campi validi` (id univoci, enum rispettati, `istruzione` non vuota e senza trattino lungo `—`); `catalog: scale coerenti` (per ogni `scala`, i gradini partono da 1 senza buchi); `catalog: trave solo prese ampie` (ogni esercizio `attrezzo:'trave'` ha `istruzione` che contiene "prese ampie").
- [ ] **Step 2: Test** `catalog: copertura` — per ciascuna delle 4 combinazioni `{manubri, trave}` e per `salto` ammesso/escluso, ogni movimento disponibile ha ≥3 esercizi `ruolo:'blocco'` con `gradino===1` o raggiungibili; `trazione` ha ≥2 esercizi se manubri o trave; ≥8 esercizi `riscaldamento`; ≥10 `defaticamento` che coprono gambe, anca, spinta, trazione, core.
- [ ] **Step 3:** `node --test test/catalog.test.js` → FAIL.
- [ ] **Step 4:** Scrivi il catalogo (60-80 voci) partendo da free-exercise-db (`dist/exercises.json`, licenza Unlicense), solo esercizi da fermo; nomi e istruzioni in italiano, una riga. Esercizi alla trave e quelli assenti nel dataset aggiunti a mano con `fedb:null`, `img:null`. Scale minime: piegamenti (ginocchia → standard → piedi rialzati → esplosivi), squat (aria → con pausa → bulgaro → pistol assistito), trazione trave (appeso attivo → scapular pull → negative → trazioni), plank (base → toccate spalle → plank laterale → body saw).
- [ ] **Step 5:** `tools/import-images.mjs <path-exercises-dir>`: copia la prima immagine (`0.jpg`) di ogni `fedb` in `img/ex/<id>.jpg` e scrive `SOURCES.md` con attribuzione e licenza.
- [ ] **Step 6:** `node --test` → PASS. Commit `feat: catalogo esercizi`.

### Task 3: Formati del blocco centrale

**Files:**
- Create: `js/core/formats.js`
- Test: `test/formats.test.js`

**Interfaces:**
- Consumes: `RULES`, `createRng`, `Exercise`.
- Produces: `FORMATS: Format[]`, `Format = { id: 'intervalli'|'blocchi'|'giri'|'piramide', nome, minMin: number, build(ctx) => Step[] }` dove `ctx = { minuti, esercizi: Exercise[], level: number, rng, leggera: boolean }`.
  `Step = { fase: 'riscaldamento'|'blocco'|'pausa'|'defaticamento', tipo: 'tempo'|'ripetizioni', sec?: number, reps?: number, esercizioId?: string, blocco: number, giro: number, capSec?: number }` (`capSec` sul primo step di un blocco a ripetizioni = durata massima del blocco).

- [ ] **Step 1: Test** per ogni formato con `minuti` 9, 12, 20, 31: durata stimata (somma `sec` + `reps*secPerRep`) entro ±10% di `minuti*60`; i formati a ripetizioni hanno `capSec === minuti*60`; nessuno step consecutivo dello stesso movimento negli `intervalli`; `blocchi` disponibile solo se `minuti >= 12` e produce 2 blocchi con pausa di 120 s in mezzo (per 12: 2×5 min + 2; per ≥14: 2×6 + 2 e il resto in un terzo giro breve); con `leggera:true` il recupero è almeno pari al lavoro.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementa: `intervalli` sceglie coppia da `RULES.INTERVALS[level]` (con `leggera` forza `20:20`/`30:30`), 4-6 esercizi, giri fino a riempire; `giri` 3-4 esercizi, reps da `RULES.REPS[level]`, giri = budget/tempo stimato del giro (min 2); `piramide` 2-3 esercizi, scala `10-8-6-4-2` scalata per livello.
- [ ] **Step 4:** PASS. Commit `feat: formati del blocco centrale`.

### Task 4: Generatore della sessione

**Files:**
- Create: `js/core/generator.js`
- Test: `test/generator.test.js`

**Interfaces:**
- Consumes: Task 1-3.
- Produces: `generateSession(input) => Session`.
  `input = { durataMin: 15|20|30|45, attrezzi: { manubri: boolean, trave: boolean }, pers?: { umore?: 'leggera'|'normale'|'spinta', focus?: 'tutto'|'gambe'|'alto'|'core', escludi?: string[], includi?: string[], senzaSalti?: boolean }, levels: Levels, history: HistoryEntry[], seed: number, now: string /*ISO*/ }`
  `Levels = { gambe, anca, spinta, trazione, core, cardio, generale: number, streak: {[movimento]: number} }`
  `Session = { id, creata, durataMin, attrezzi, pers, formatoId, leggera: boolean, seed, steps: Step[], esercizi: string[] }`

- [ ] **Step 1: Test** determinismo (stesso input ⇒ `deepEqual`); struttura (prima `riscaldamento`, poi `blocco`/`pausa`, poi `defaticamento`; minuti di ogni fase = `SPLIT` ±10%); attrezzi rispettati (nessun esercizio `manubri`/`trave` se spento); `senzaSalti` ⇒ nessun `salto:true`; `escludi` rispettato, `includi` presente nel blocco; trave mai primo esercizio del blocco e, se presente, nel riscaldamento c'è un appeso a piedi a terra; il formato è diverso da `history[0].formatoId`; gli esercizi di blocco delle ultime `RECENT_SESSIONS_AVOID` sessioni non ricorrono se ne esistono alternative; defaticamento con stretching dei movimenti lavorati, `STRETCH_HOLD_SEC` ciascuno; un esercizio presente in `saltati` in ≥2 delle ultime 5 sessioni non viene scelto se il movimento ha alternative.
- [ ] **Step 2: Test** leggerezza: con 2 sessioni non leggere in coda allo storico (indice `LIGHT_EVERY`), `leggera:true`; `umore:'leggera'` ⇒ `leggera:true`; `umore:'spinta'` usa livelli +1 senza modificarli.
- [ ] **Step 3: Test (Review Focus 1, 4)** solo corpo libero + `senzaSalti` + `focus:'alto'` + storico che ha usato tutto ⇒ sessione valida (ripete recenti); `escludi` di tutti gli esercizi `core` ⇒ sessione valida senza `core`, durata nel budget.
- [ ] **Step 4:** FAIL. **Step 5:** Implementa: scelta varianti con `gradino <= GRADINO_MAX(level del movimento)` preferendo il più alto; focus pesa la scelta dei movimenti (es. `alto` ⇒ spinta, trazione, core); riscaldamento = mobilità (`ruolo:'riscaldamento'`) + gradino 1 di 2 esercizi del blocco, `WARMUP_ITEM_SEC` ciascuno. **Step 6:** PASS. Commit `feat: generatore della sessione`.

### Task 5: Adattamento

**Files:**
- Create: `js/core/adapt.js`
- Test: `test/adapt.test.js`

**Interfaces:**
- Consumes: `Session`, `Levels`, `RULES`.
- Produces: `defaultLevels() => Levels` (tutti `LEVEL_START`, streak 0); `applyVote(levels, session, voto: 'facile'|'giusta'|'faticosa'|'difficile', saltati: string[]) => Levels` (puro); `onWeightChange(levels, oldKg, newKg) => Levels` (se `newKg > oldKg`, gambe/anca/spinta/trazione −2 con clamp; altrimenti invariati).

- [ ] **Step 1: Test** con i movimenti presenti nella sessione: `facile` +1; `giusta` +1 solo al secondo `giusta` consecutivo (streak azzerata dopo l'aumento); `faticosa` invariato e streak azzerata; `difficile` −1; clamp a [1,10]; movimenti non presenti invariati; movimento i cui esercizi sono tutti in `saltati` non sale; `session.leggera` ⇒ solo `difficile` ha effetto; `generale` segue le stesse regole se il formato è a tempo.
- [ ] **Step 2:** FAIL. **Step 3:** Implementa. **Step 4:** PASS. Commit `feat: adattamento dei livelli`.

### Task 6: Persistenza

**Files:**
- Create: `js/core/storage.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Produces: `createStore(backend: {getItem,setItem,removeItem})` ⇒ `{ load(): State, save(state: State): void, exportJson(state): string, importJson(text): State }`.
  `State = { schemaVersion: 1, settings: { durataMin, attrezzi, pesoManubri: 10, voce: true, suoni: true }, levels: Levels, history: HistoryEntry[] }`
  `HistoryEntry = { sessionId, data, durataMin, formatoId, esercizi: string[], saltati: string[], voto: string|null, leggera: boolean }`

- [ ] **Step 1: Test** backend vuoto ⇒ default (durata 20, attrezzi spenti, peso 10); round-trip save/load; export/import round-trip; import di JSON non valido ⇒ eccezione con messaggio italiano e stato invariato; **(Review Focus 2)** valore corrotto o `schemaVersion` 99 ⇒ `load()` ritorna default e copia l'originale in `allenamento-casa:v1:corrotto`; storico troncato alle ultime 500 sessioni.
- [ ] **Step 2:** FAIL. **Step 3:** Implementa. **Step 4:** PASS. Commit `feat: persistenza locale con esporta/importa`.

### Task 7: Timeline e player

**Files:**
- Create: `js/core/player.js`
- Test: `test/player.test.js`

**Interfaces:**
- Consumes: `Session.steps`, `byId`.
- Produces: `createPlayer(steps, nowMs) => Player`; `Player = { state(nowMs) => { index, step, remainingSec|null, phaseEndsInSec|null, finished, paused }, pause(nowMs), resume(nowMs), next(nowMs) /*fatto o salta*/, skip(nowMs) /*registra saltato*/, skipped(): string[], cues(prevState, state) => Cue[] }`; `Cue = { kind: 'annuncia'|'bip'|'bipFine'|'fineBlocco'|'fine', text?: string }`.

- [ ] **Step 1: Test** step a tempo avanzano da soli calcolando dall'orologio; step a ripetizioni restano fermi finché `next`; pausa congela il tempo; **(Review Focus 3)** salto di 95 s dell'orologio in un 30:30 posiziona l'indice corretto; **(Review Focus 5)** blocco a ripetizioni con `capSec` 540 superato ⇒ salta al primo step di `defaticamento`; `cues` produce `bip` a 3, 2, 1 secondi, `annuncia` con nome esercizio e "poi: <successivo>" al cambio step, `fine` alla conclusione.
- [ ] **Step 2:** FAIL. **Step 3:** Implementa basando tutto su timestamp (`startedAt`, `pausedTotal`). **Step 4:** PASS. Commit `feat: player basato sull'orologio`.

> **Gate Codex (dopo Task 7):** `/codex:adversarial-review` focalizzata su generatore, adattamento e player (determinismo, budget di tempo, casi limite). Correggere i rilievi fondati prima di proseguire.

### Task 8: Interfaccia, PWA e collegamento diretto

**Files:**
- Create: `index.html`, `css/style.css`, `js/ui/app.js`, `js/ui/screens.js`, `js/ui/cues.js`, `js/ui/deeplink.js`, `manifest.webmanifest`, `sw.js`, `icons/*`, `tools/make-icons.py`, `tools/smoke-test.mjs`
- Test: `test/deeplink.test.js`

**Interfaces:**
- Consumes: tutto il nucleo.
- Produces: `parseDeepLink(search: string) => Partial<{durataMin, attrezzi, focus, senzaSalti, avvia: boolean}>` (valori non validi ignorati); `buildDeepLink(base, opts) => string`.

- [ ] **Step 1: Test** `parseDeepLink('?durata=20&attrezzi=manubri,trave&focus=gambe')`; `durata=17` ignorata; `attrezzi=bilanciere` ignorato; round-trip con `buildDeepLink`.
- [ ] **Step 2:** FAIL → implementa → PASS.
- [ ] **Step 3:** Gate UI leggero con `product-ui-design` (una direzione, leggibile a 2 m, contrasto AA, target ≥48 px). Schermate: Avvio (durata a 4 bottoni, interruttori attrezzi, anteprima, "rigenera", pannello "Personalizza", "Via"); Sessione (fase, immagine, tempo/ripetizioni grandi, successivo, pausa, salta, fatto, termina; avviso fisso trave "Prese ampie, mano aperta"); Fine (4 voti ancorati con la descrizione della spec, riepilogo); Storico (lista, modifica voto, esporta/importa, peso manubri, voce/suoni).
- [ ] **Step 4:** `cues.js`: `speak(text)` con `speechSynthesis` voce `it-*` se disponibile; `beep(kind)` con `AudioContext` creato al tocco di "Via"; wake lock richiesto a inizio sessione e ripreso su `visibilitychange`. Ogni funzione è no-op se l'API manca.
- [ ] **Step 5:** PWA come Flip7 (manifest, icone, `sw.js` con precache di tutti i moduli e `VERSION='v1'`).
- [ ] **Step 6:** `tools/smoke-test.mjs` (Chrome headless via CDP come Flip7): apre `?durata=15`, preme "Via", verifica che compaia il primo esercizio di riscaldamento e che non ci siano errori in console; screenshot a 390 e 1024 px.
- [ ] **Step 7:** `node --test` + smoke test PASS. Commit `feat: interfaccia e PWA`.

### Task 9: CLI, skill del brain, pubblicazione

**Files:**
- Create: `tools/genera.mjs` (app); nel brain `.claude/skills/allenamento/SKILL.md`, `.claude/skills/allenamento/agents/openai.yaml`
- Modify (brain): `SITI E APP - WORKSPACE/CLAUDE.md` (riga progetto), `guida-sviluppo-app.md` (caso studio), root `CLAUDE.md` (elenco skill, conteggio 25)

**Interfaces:**
- Consumes: `generateSession`, `defaultLevels`, `buildDeepLink`.
- Produces: `node tools/genera.mjs --durata 20 --attrezzi manubri [--focus gambe] [--senza-salti] [--seed N] [--json]` ⇒ testo con anteprima (fasi, formato, esercizi) + link; `--json` ⇒ Session JSON.

- [ ] **Step 1: Test** `test/cli.test.js`: esecuzione con `--json --seed 7` produce JSON con `durataMin` 20; argomenti non validi ⇒ codice d'uscita 2 e messaggio italiano.
- [ ] **Step 2:** FAIL → implementa → PASS. Commit.
- [ ] **Step 3:** Skill `allenamento` (frontmatter valido senza `": "` nella description, verificato con parser YAML) + `openai.yaml`; junction `~/.codex/skills/allenamento`.
- [ ] **Step 4:** Repo GitHub pubblica `allenamento-casa`, push, GitHub Pages da `main` root. Verifica che l'URL `https://matteozanoni97.github.io/allenamento-casa/` risponda 200 e che lo smoke test passi sull'URL pubblico. Il sottodominio richiede un record DNS su Hostinger: istruzioni a Matteo, `CNAME` aggiunto solo dopo.
- [ ] **Step 5:** Gate Codex finale `/codex:review` sulla branch. Correzioni, commit, push di app e brain.
