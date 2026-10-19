# DESIGN - Allenamento Casa

Stato: **proposta** (19/10/2026), da approvare da Matteo dopo la prova sul telefono.

## Tesi visuale

Un tabellone da palestra, caldo: si legge da terra, a 2 metri, con le mani occupate.
Le schermate di preparazione sono chiare e calme; la schermata di sessione è scura,
con un solo numero enorme e il nome dell'esercizio. Evoluzione dello stile MZ
(`_shared/styles/StyleSiteMZ.md`), perché è un prodotto di Matteo.

## Invarianti

- Palette MZ: quasi nero `#1A1A1A`, verde bottiglia `#2E4B3C` per le azioni piene,
  arancio `#B85C00` solo per enfasi grafica, `#A45200` quando è testo, fondi caldi
  `#F7F2ED` / `#FDF0E6`, bordo `#E0D3C6`.
- Sessione su fondo `#14201A` (verde quasi nero) con testo `#FFFFFF`; numeri in
  monospazio, `tabular-nums`, 30-40% dell'altezza dello schermo.
- La fase (Riscaldamento, Circuito, Recupero, Defaticamento) è sempre scritta a
  parole; il colore della barra di fase la rinforza, non la sostituisce.
- Font di sistema (`system-ui`, `ui-monospace`): niente font esterni, l'app deve
  funzionare offline.
- Target tattili ≥ 56 px nella sessione, ≥ 48 px altrove. Contrasto AA.
- Nessun dialogo del browser: "Termina" chiede conferma con un secondo tocco.
- Mai trattino lungo o medio nei testi.

## Schermate

1. **Avvio**: durata (4 bottoni), attrezzi (interruttori), anteprima della sessione,
   "Rigenera", pannello "Personalizza" chiuso, bottone "Via" in basso a tutta
   larghezza.
2. **Sessione**: barra di fase in alto, numero grande, nome esercizio, immagine,
   istruzione, "Poi: ...", comandi in basso (Pausa, Salta, Fatto per le ripetizioni,
   Termina).
3. **Fine**: "Com'è andata?" con 4 risposte ancorate a tutta larghezza.
4. **Storico e impostazioni**: elenco sessioni, voto modificabile per l'ultima,
   peso manubri, voce e suoni, esporta e importa.
