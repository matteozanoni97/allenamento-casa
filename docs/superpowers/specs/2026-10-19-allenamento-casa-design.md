---
name: design-app-allenamento
description: Documento di progetto dell'app di allenamento a casa - sessioni a circuito generate per durata e attrezzi, scandite col timer, adattate col feedback
type: design
stato: bozza da approvare
data: 2026-10-19
---

# App allenamento a casa - documento di progetto

## Intento

Matteo si allena a casa, in sessioni brevi, e per un anno ha usato Freeletics.
Di Freeletics gli mancano due cose: dire "20 minuti" e avere **subito** il
programma completo, e lasciarsi **guidare dal tempo** senza pensare durante la
sessione. Gli piaceva anche che l'app chiedesse a fine allenamento com'era
andata e adattasse la volta successiva.

L'app rifà questo, su misura per la sua stanza e i suoi attrezzi, con regole
basate sulla letteratura ([[principi-sessione]]) invece che su una scatola
chiusa.

## Obiettivi

1. **Dalla app aperta al riscaldamento in due tocchi**: scegli la durata e gli
   attrezzi, poi "Via". Tutto il resto ha un default.
2. **Sessione completa sempre**: riscaldamento, blocco centrale a circuito,
   defaticamento con stretching.
3. **Guida a tempo**: esercizio corrente e successivo, conto alla rovescia,
   voce e segnali sonori, schermo sempre acceso. Si usa dal tappetino senza
   toccare il telefono.
4. **Varietà**: esercizi e formati che cambiano da una sessione all'altra, con
   equilibrio tra i distretti.
5. **Adattamento**: una domanda a fine sessione regola la difficoltà della
   successiva.
6. **Personalizzazione facoltativa**: come ti senti oggi, parte del corpo da
   allenare, esercizi da includere o escludere, "senza salti". Se non tocchi
   niente decide l'app.

## Non obiettivi (v1)

- Server, login, sincronizzazione tra dispositivi.
- Claude o Bot_PA che leggono lo storico (arriverà col server, vedi
  "Evoluzione").
- Video o animazioni degli esercizi: bastano un'immagine e una riga di
  istruzione.
- Programmi a settimane, obiettivi, statistiche avanzate, social.
- Battito cardiaco o dispositivi indossabili.

## Anti-obiettivi

Ciò che farebbe fallire il progetto anche se funziona:

- **Bassa usabilità**: più di due tocchi per partire, testi piccoli, comandi
  da cercare a metà esercizio.
- **Monotonia**: le stesse sessioni o gli stessi esercizi che tornano spesso.
- **Rischio per le dita**: esercizi alla trave su tacche piccole o a freddo.

## Vincoli

- **Spazio**: 2 × 1,5 m. Solo esercizi da fermo: niente spostamenti, affondi
  camminati, gattonate lunghe.
- **Attrezzi**, scelti a ogni sessione con interruttori ricordati
  dall'ultima volta: corpo libero (sempre), **manubri** (due, peso fisso 10 kg,
  impostabile), **trave da arrampicata** (con prese ampie in alto ai lati).
- **Dispositivo**: telefono appoggiato a terra o su un mobile; deve leggersi a
  2 metri.
- **Lingua**: italiano. Nei testi niente trattino lungo.
- **Dati**: restano sul telefono (v1).
- **Costo zero**: GitHub Pages, nessun servizio a pagamento.

## Esperienza d'uso

### Avvio

Una schermata sola:

- **Durata**: 15 · 20 · 30 · 45 min (default: l'ultima usata).
- **Attrezzi**: interruttori manubri e trave (default: l'ultima scelta).
- **Anteprima** del programma generato: blocchi, formato, elenco esercizi.
  Un tasto "rigenera" se non piace.
- **Personalizza** (chiuso di default): come ti senti oggi (più leggera /
  normale / più spinta), parte del corpo (tutto il corpo, gambe, parte alta,
  core), escludi o fissa esercizi, senza salti.
- **Via**.

### Durante

- Fase (riscaldamento, blocco 1, pausa, ...), esercizio corrente con immagine,
  tempo o ripetizioni in grande, esercizio successivo.
- Voce italiana che annuncia l'esercizio e il successivo; tre bip negli
  ultimi 3 secondi; segnale diverso per fine blocco.
- Negli esercizi a ripetizioni, un tasto grande "fatto".
- Pausa, salta esercizio, termina. Schermo sempre acceso.
- Esercizi alla trave con un avviso fisso: "Prese ampie, mano aperta".

### Fine

- Domanda unica, con risposte ancorate:
  - **Troppo facile**: avrei potuto fare molto di più.
  - **Giusta**: impegnativa ma sotto controllo.
  - **Faticosa**: al limite, ma tecnica tenuta fino alla fine.
  - **Troppo difficile**: mi sono fermato o ho perso la tecnica.
- Il voto si può correggere dallo storico più tardi (la letteratura lo vuole a
  circa 30 minuti; chiederlo subito è una deviazione voluta).
- Riepilogo e salvataggio nello storico.

## Generatore della sessione

Funzione pura e testabile: `(durata, attrezzi, personalizzazione, storico,
seme) → sessione`. Stesso input e stesso seme, stessa sessione. Le soglie e i
numeri stanno in **un unico file di regole**, non sparsi nel codice.

### Struttura

- **Ripartizione dei minuti**: riscaldamento circa 20%, blocco centrale circa
  60-65%, defaticamento circa 15-20% (scelta di progetto: nessuna fonte per
  sessioni brevi). Esempio 20 min: 4 + 12-13 + 3-4.
- **Riscaldamento**: attivazione leggera, mobilità dinamica ad ampio raggio,
  poi versioni facili degli esercizi del blocco. Statico eventuale solo dopo
  la parte dinamica e al massimo 30 s per gruppo. Se la trave è nel programma,
  il riscaldamento include appesi leggeri a piedi a terra.
- **Blocco centrale**: uno o più circuiti. Esercizi che alternano i distretti.
- **Defaticamento**: stretching statico dei muscoli lavorati, circa 30 s per
  posizione, più respirazione.

### Formati del blocco centrale

Biblioteca di formati, estendibile:

- **A intervalli**: 10:10, 20:20, 30:30 (1:1), 40:20, 30:15 (2:1). Profilo:
  10:10 più cardiovascolare, 30:30 più muscolare e metabolico.
- **Circuito a blocchi**: per esempio 2 blocchi da 6 min con 2 min di pausa,
  6 esercizi alternati (modello Agudo-Ortega 2026).
- **A ripetizioni contro il tempo**: N giri di 3-4 esercizi con ripetizioni
  fisse, il più in fretta possibile, con record personale (stile Freeletics).
- **Piramide**: ripetizioni discendenti o ascendenti (es. 10-8-6-4-2).

I formati a ripetizioni non hanno durata fissa: il generatore stima il tempo
per ripetizione di ogni esercizio per stare nel budget del blocco, e il blocco
ha un **tempo limite** pari ai minuti assegnati. Allo scadere si passa al
defaticamento e il giro in corso conta come parziale (scelta di progetto).

### Varietà

- Il formato non si ripete uguale nella sessione successiva.
- Ogni sessione copre i movimenti fondamentali secondo gli attrezzi: gambe
  (squat, affondo), anca (ponte, stacco), spinta, trazione (solo con manubri o
  trave), core, esercizi cardio a corpo libero.
- Si evitano gli esercizi usati nelle ultime 2 sessioni, quando il catalogo lo
  permette; gli esercizi saltati spesso vengono proposti meno.
- Alternanza di sessioni più dure e più leggere nell'arco della settimana, per
  non avere un carico sempre uguale (concetto di monotonia di Foster).

### Trave

- Solo prese ampie in alto ai lati, a mano aperta. Niente tacche, niente
  movimenti dinamici.
- Mai come primo esercizio del blocco.
- Esercizi ammessi: trazioni, appesi attivi e passivi, scapular pull,
  sollevamenti di ginocchia da appeso.

## Adattamento

- Un **livello** per ogni movimento fondamentale (es. spinta, trazione,
  gambe), più un livello generale per i formati a tempo.
- Ogni livello sceglie: variante dell'esercizio (scala di progressione, es.
  piegamenti sulle ginocchia → normali → piedi rialzati), ripetizioni, tempi
  di lavoro e recupero.
- Regola di partenza (scelta di progetto, da tarare):
  - Troppo facile: +1 livello.
  - Giusta: +1 livello dopo due "giusta" di fila (ispirata alla regola "2 per 2").
  - Faticosa: livello invariato.
  - Troppo difficile: -1 livello.
- Il voto è uno solo per sessione: si applica ai livelli dei movimenti
  presenti nella sessione. Un movimento i cui esercizi sono stati saltati non
  sale (scelta di progetto).
- Nelle sessioni volutamente più leggere (alternanza settimanale o "come ti
  senti: più leggera") conta solo "troppo difficile" (che abbassa); gli altri
  voti non fanno salire i livelli (scelta di progetto).
- "Come ti senti oggi" sposta temporaneamente la sessione di ±1 livello senza
  cambiare i livelli salvati.
- Peso dei manubri impostabile: quando cambia, gli esercizi con manubri
  ripartono da una stima prudente.

## Catalogo esercizi

- Base: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), di
  dominio pubblico, con immagini.
- Selezione curata di circa 60-80 esercizi adatti alla stanza, con: nome
  italiano, movimento fondamentale, attrezzo, salto sì/no, unilaterale sì/no,
  posizione nella scala di progressione, istruzione in una riga, immagine.
  Gli esercizi alla trave e quelli mancanti nel database si aggiungono a mano.
- **Controllo di copertura** (automatico, nei test): per ogni combinazione di
  attrezzi ci sono abbastanza esercizi per movimento da generare almeno 3
  sessioni consecutive senza ripetizioni.

## Dati

- Salvataggio nel browser (`localStorage`) tramite **un unico modulo** che
  legge e scrive: domani si sostituisce con uno che parla col server.
- Formato con numero di versione: impostazioni, livelli, storico sessioni
  (data, durata, formato, esercizi, saltati, voto).
- **Esporta e importa in JSON** dalle impostazioni, dal primo giorno.

## Tecnica

Come Flip7 (vedi `guida-sviluppo-app.md`):

- HTML, CSS e moduli JavaScript senza build e senza dipendenze runtime.
- PWA installabile e offline; service worker network-first per documento e
  moduli, con `VERSION` da alzare a ogni rilascio.
- Test con `node --test` sul generatore e sulle regole; smoke test nel
  browser come in Flip7.
- Voce: Web Speech API in italiano; bip: Web Audio; schermo acceso: Screen
  Wake Lock API. Se una di queste manca, l'app funziona lo stesso (solo
  visivo).
- Repo pubblica e indipendente in `SITI E APP - WORKSPACE/`, fuori dal brain;
  GitHub Pages con sottodominio `allenamento.matteozanoni.com` (record CNAME).
- **Collegamento diretto**: l'app accetta parametri nell'indirizzo (es.
  `?durata=20&attrezzi=manubri`) per aprirsi con una sessione già impostata.

## Skill

Skill `allenamento` nel brain, v1 leggera:

- Risponde a richieste tipo "allenamento da 20 minuti coi manubri" con il
  collegamento diretto all'app e l'anteprima della sessione, generata dallo
  stesso codice via Node.
- Usa [[principi-sessione]] per le domande su come allenarsi.
- Nessun accesso allo storico in v1.

## Evoluzione (fuori da v1)

- Backend sul VPS (standard della guida: Docker) per storico tra dispositivi e
  lettura da parte di Claude e Bot_PA.
- Domanda "come ti senti" prima della sessione come scelta guidata del formato.
- Nuovi formati e nuovi attrezzi.

## Lasciato a chi costruisce

- Layout e grafica, passando dal gate UI di `product-ui-design`.
- Numeri esatti di ripetizioni e tempi per ogni livello, dentro il file di
  regole, partendo da [[principi-sessione]].
- Scelta della voce italiana disponibile sul telefono e dei suoni.
- Nome della repo.
