# Allenamento Casa - istruzioni per gli agenti

PWA statica per allenamenti a casa a circuito. Uso personale di Matteo.

- **Spec:** `docs/superpowers/specs/2026-10-19-allenamento-casa-design.md`.
  **Principi con fonte:** `docs/principi-sessione.md` (copia; l'originale vive nel
  brain in `PERSONALE - WORKSPACE/Allenamento/`).
- **Nucleo puro** in `js/core/` (nessun accesso a DOM o `localStorage`, tranne
  `storage.js` che riceve il backend come parametro). Tutto testato con `node --test`.
- **Numeri e soglie solo in `js/core/rules.js`.** Cambiarne uno = cambiare una regola:
  aggiornare anche `docs/principi-sessione.md` se la motivazione cambia.
- **UI** in `js/ui/`: schermate, voce, bip, wake lock. Ogni API del browser degrada
  senza errori se manca.
- Zero dipendenze, zero build. Si serve con `npm run serve` (porta 8090).
- Testi in italiano, mai il trattino lungo.
- A ogni rilascio alzare `VERSION` in `sw.js`.
- Repo pubblica: niente dati personali nel codice o nei commit.
