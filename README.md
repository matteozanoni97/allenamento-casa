# Allenamento Casa

Allenamenti a casa a circuito, in stile Freeletics ma su misura: scegli quanto tempo
hai (15, 20, 30 o 45 minuti) e quali attrezzi usare (corpo libero, manubri, trave da
arrampicata), e l'app genera la sessione completa e la scandisce a tempo:

1. **riscaldamento** dinamico,
2. **circuito** in formati diversi ogni volta (intervalli, blocchi, giri, piramidi),
3. **defaticamento** con stretching.

A fine sessione una domanda ("troppo facile", "giusta", "faticosa", "troppo
difficile") regola la difficoltà della volta successiva. I dati restano sul telefono.

Le regole sono basate sulla letteratura: vedi [`docs/principi-sessione.md`](docs/principi-sessione.md).

## Uso

App installabile dal browser ("Aggiungi a schermata Home"), funziona anche offline.

Collegamento diretto con sessione già impostata, per esempio
`?durata=20&attrezzi=manubri,trave&focus=gambe`.

## Sviluppo

```bash
npm test          # test del nucleo (node --test)
npm run serve     # http://localhost:8090
node tools/genera.mjs --durata 20 --attrezzi manubri   # anteprima da terminale
```

Nessuna dipendenza e nessuna build.

## Crediti

Immagini e dati di base degli esercizi da
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense). Dettagli in
`img/ex/SOURCES.md`.

Licenza del codice: MIT.
