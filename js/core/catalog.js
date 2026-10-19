// Catalogo esercizi, curato per una stanza di 2 x 1,5 m: solo esercizi da fermo.
// Base: free-exercise-db (Unlicense). `fedb` e' l'id d'origine, da cui arriva l'immagine;
// gli esercizi alla trave e quelli assenti dal dataset hanno fedb null e nessuna immagine.
//
// gradino: posizione nella scala di progressione (1 = piu' facile). Gli esercizi fuori
// scala hanno gradino 1. secPerRep: tempo stimato per ripetizione (formati a ripetizioni).

const ex = (id, nome, ruolo, movimento, attrezzo, istruzione, o = {}) => ({
  id,
  nome,
  ruolo,
  movimento,
  attrezzo,
  salto: o.salto ?? false,
  unilaterale: o.unilaterale ?? false,
  isometrico: o.isometrico ?? false,
  scala: o.scala ?? null,
  gradino: o.gradino ?? 1,
  secPerRep: o.secPerRep ?? 3,
  istruzione,
  fedb: o.fedb ?? null,
  img: o.fedb ? `img/ex/${id}.jpg` : null,
  ...(o.stretchFor ? { stretchFor: o.stretchFor } : {}),
})

const B = 'blocco'
const R = 'riscaldamento'
const D = 'defaticamento'
const TRAVE = 'Prese ampie in alto ai lati, mano aperta.'

export const CATALOG = Object.freeze([
  // --- Gambe ---
  ex('squat', 'Squat', B, 'gambe', 'corpo', 'Piedi larghi quanto le spalle, scendi col bacino indietro, ginocchia in linea con le punte.', { scala: 'squat', gradino: 1, fedb: 'Bodyweight_Squat' }),
  ex('squat-pausa', 'Squat con pausa', B, 'gambe', 'corpo', 'Come lo squat, ma fermati 2 secondi in basso prima di risalire.', { scala: 'squat', gradino: 2, secPerRep: 4 }),
  ex('squat-bulgaro', 'Squat bulgaro', B, 'gambe', 'corpo', 'Piede dietro appoggiato su sedia o letto, scendi in verticale sulla gamba davanti.', { scala: 'squat', gradino: 3, unilaterale: true, secPerRep: 4, fedb: 'Split_Squats' }),
  ex('pistol-assistito', 'Pistol squat assistito', B, 'gambe', 'corpo', 'Su una gamba, tenendoti a uno stipite, scendi più che puoi con controllo.', { scala: 'squat', gradino: 4, unilaterale: true, secPerRep: 5 }),
  ex('affondo-indietro', 'Affondo indietro alternato', B, 'gambe', 'corpo', 'Fai un passo indietro e scendi finché il ginocchio sfiora il pavimento, poi torna su.', { unilaterale: true, fedb: 'Crossover_Reverse_Lunge' }),
  ex('affondo-laterale', 'Affondo laterale', B, 'gambe', 'corpo', 'Passo di lato, siedi sulla gamba piegata tenendo l\'altra tesa, alterna i lati.', { unilaterale: true }),
  ex('wall-sit', 'Sedia al muro', B, 'gambe', 'corpo', 'Schiena al muro, cosce parallele al pavimento, tieni la posizione.', { isometrico: true, secPerRep: 1 }),
  ex('squat-sumo-pulse', 'Squat sumo a molla', B, 'gambe', 'corpo', 'Gambe larghe e punte in fuori, resta in basso e fai piccoli rimbalzi.', { secPerRep: 1.5 }),
  ex('jump-squat', 'Squat saltato', B, 'gambe', 'corpo', 'Squat e salto verticale, atterra morbido e riparti.', { salto: true, fedb: 'Freehand_Jump_Squat' }),
  ex('affondi-saltati', 'Affondi saltati', B, 'gambe', 'corpo', 'Da affondo salta e cambia gamba in aria, atterra morbido.', { salto: true, unilaterale: true, fedb: 'Split_Jump' }),
  ex('goblet-squat', 'Goblet squat', B, 'gambe', 'manubri', 'Un manubrio al petto tenuto in verticale, squat profondo col busto dritto.', { fedb: 'Goblet_Squat' }),
  ex('affondo-manubri', 'Affondo indietro con manubri', B, 'gambe', 'manubri', 'Un manubrio per mano lungo i fianchi, passo indietro e scendi.', { unilaterale: true, secPerRep: 3.5, fedb: 'Dumbbell_Rear_Lunge' }),
  ex('split-squat-manubri', 'Split squat con manubri', B, 'gambe', 'manubri', 'Gambe sfalsate e ferme, scendi e risali in verticale, poi cambia lato.', { unilaterale: true, fedb: 'Split_Squat_with_Dumbbells' }),
  ex('squat-sumo-manubrio', 'Squat sumo con manubrio', B, 'gambe', 'manubri', 'Gambe larghe, un manubrio tenuto a braccia tese tra le gambe.', { fedb: 'Plie_Dumbbell_Squat' }),

  // --- Anca ---
  ex('ponte', 'Ponte glutei', B, 'anca', 'corpo', 'Supino, piedi a terra, spingi il bacino in alto stringendo i glutei.', { scala: 'ponte', gradino: 1, secPerRep: 2.5, fedb: 'Butt_Lift_Bridge' }),
  ex('ponte-una-gamba', 'Ponte su una gamba', B, 'anca', 'corpo', 'Come il ponte, con una gamba tesa in aria. Alterna i lati.', { scala: 'ponte', gradino: 2, unilaterale: true, fedb: 'Single_Leg_Glute_Bridge' }),
  ex('ponte-pausa-una-gamba', 'Ponte su una gamba con pausa', B, 'anca', 'corpo', 'Ponte su una gamba, tieni 2 secondi in alto a ogni ripetizione.', { scala: 'ponte', gradino: 3, unilaterale: true, secPerRep: 4 }),
  ex('superman', 'Superman', B, 'anca', 'corpo', 'Prono, solleva insieme braccia e gambe tese, tieni un attimo e scendi.', { fedb: 'Superman' }),
  ex('stacco-una-gamba', 'Stacco su una gamba', B, 'anca', 'corpo', 'Su una gamba, busto avanti e gamba dietro in linea, schiena dritta.', { unilaterale: true, secPerRep: 3.5 }),
  ex('kickback', 'Slancio dietro in quadrupedia', B, 'anca', 'corpo', 'A quattro zampe, spingi un tallone verso il soffitto, alterna.', { unilaterale: true, secPerRep: 2, fedb: 'Glute_Kickback' }),
  ex('stacco-rumeno-manubri', 'Stacco rumeno con manubri', B, 'anca', 'manubri', 'Manubri davanti alle cosce, bacino indietro e schiena dritta, risali stringendo i glutei.', { fedb: 'Stiff-Legged_Dumbbell_Deadlift' }),
  ex('swing-manubrio', 'Swing con manubrio', B, 'anca', 'manubri', 'Un manubrio a due mani, spinta d\'anca esplosiva fino al petto.', { secPerRep: 2, fedb: 'Vertical_Swing' }),
  ex('hip-thrust-manubrio', 'Ponte con manubrio', B, 'anca', 'manubri', 'Ponte glutei con un manubrio appoggiato sul bacino.', { secPerRep: 2.5 }),

  // --- Spinta ---
  ex('piegamenti-ginocchia', 'Piegamenti sulle ginocchia', B, 'spinta', 'corpo', 'Ginocchia a terra, corpo dritto dalle ginocchia alle spalle, petto verso il pavimento.', { scala: 'piegamenti', gradino: 1, secPerRep: 2.5 }),
  ex('piegamenti', 'Piegamenti', B, 'spinta', 'corpo', 'Corpo dritto come in plank, scendi col petto e spingi via il pavimento.', { scala: 'piegamenti', gradino: 2, fedb: 'Pushups' }),
  ex('piegamenti-piedi-rialzati', 'Piegamenti con piedi rialzati', B, 'spinta', 'corpo', 'Piedi su sedia o letto, mani a terra, piegamenti controllati.', { scala: 'piegamenti', gradino: 3, fedb: 'Push-Ups_With_Feet_Elevated' }),
  ex('piegamenti-esplosivi', 'Piegamenti esplosivi', B, 'spinta', 'corpo', 'Piegamento con spinta veloce che stacca le mani da terra.', { scala: 'piegamenti', gradino: 4, fedb: 'Plyo_Push-up' }),
  ex('piegamenti-inclinati', 'Piegamenti inclinati', B, 'spinta', 'corpo', 'Mani su letto o divano, corpo dritto, petto verso il bordo.', { secPerRep: 2.5, fedb: 'Incline_Push-Up' }),
  ex('dip-sedia', 'Dip su sedia', B, 'spinta', 'corpo', 'Mani sul bordo di una sedia stabile dietro di te, scendi piegando i gomiti.', { fedb: 'Bench_Dips' }),
  ex('piegamento-plank-laterale', 'Piegamento e plank laterale', B, 'spinta', 'corpo', 'Un piegamento, poi ruota in plank laterale col braccio al soffitto. Alterna.', { secPerRep: 4, fedb: 'Push_Up_to_Side_Plank' }),
  ex('pike-push-up', 'Piegamenti a V', B, 'spinta', 'corpo', 'Bacino alto a V rovesciata, testa verso terra tra le mani, spingi su.', { gradino: 1, secPerRep: 3 }),
  ex('spinta-manubri', 'Spinta sopra la testa', B, 'spinta', 'manubri', 'In piedi, manubri alle spalle, spingi in alto senza inarcare la schiena.', { fedb: 'Standing_Dumbbell_Press' }),
  ex('floor-press', 'Distensioni a terra', B, 'spinta', 'manubri', 'Supino, manubri sopra il petto, scendi finché i gomiti toccano terra.', { fedb: 'Dumbbell_Floor_Press' }),
  ex('thruster', 'Thruster', B, 'spinta', 'manubri', 'Squat coi manubri alle spalle e, risalendo, spingi sopra la testa.', { secPerRep: 3.5 }),

  // --- Trazione ---
  ex('angelo-inverso', 'Angelo nella neve prono', B, 'trazione', 'corpo', 'Prono, braccia sollevate da terra, disegna un arco dai fianchi sopra la testa.', { secPerRep: 3 }),
  ex('ytw', 'Y-T-W a terra', B, 'trazione', 'corpo', 'Prono, solleva le braccia a Y, poi a T, poi a W stringendo le scapole.', { secPerRep: 4 }),
  ex('rematore-manubri', 'Rematore con manubri', B, 'trazione', 'manubri', 'Busto inclinato e schiena dritta, tira i manubri verso i fianchi.', { fedb: 'Bent_Over_Two-Dumbbell_Row' }),
  ex('rematore-una-mano', 'Rematore a un braccio', B, 'trazione', 'manubri', 'Mano libera appoggiata sul ginocchio, tira il manubrio verso l\'anca. Alterna.', { unilaterale: true, fedb: 'One-Arm_Dumbbell_Row' }),
  ex('alzate-posteriori', 'Alzate posteriori', B, 'trazione', 'manubri', 'Busto inclinato, apri le braccia di lato fino all\'altezza delle spalle.', { fedb: 'Reverse_Flyes' }),
  ex('renegade-row', 'Rematore in plank', B, 'trazione', 'manubri', 'In plank sui manubri, tira un manubrio al fianco senza ruotare il bacino. Alterna.', { unilaterale: true, secPerRep: 3.5, fedb: 'Alternating_Renegade_Row' }),
  ex('appeso-attivo', 'Appeso attivo', B, 'trazione', 'trave', `${TRAVE} Braccia tese, abbassa le spalle lontano dalle orecchie e tieni.`, { isometrico: true, scala: 'trazioni-trave', gradino: 1, secPerRep: 1 }),
  ex('scapular-pull', 'Trazioni scapolari', B, 'trazione', 'trave', `${TRAVE} Braccia tese, solleva il corpo solo abbassando le scapole.`, { scala: 'trazioni-trave', gradino: 2, secPerRep: 2.5 }),
  ex('trazioni-negative', 'Trazioni negative', B, 'trazione', 'trave', `${TRAVE} Parti in alto (salendo da una sedia) e scendi lento in 4 secondi.`, { scala: 'trazioni-trave', gradino: 3, secPerRep: 6 }),
  ex('trazioni', 'Trazioni', B, 'trazione', 'trave', `${TRAVE} Tira il petto verso la trave e scendi controllato.`, { scala: 'trazioni-trave', gradino: 4, secPerRep: 3.5, fedb: 'Pullups' }),
  ex('appeso-passivo', 'Appeso passivo', B, 'trazione', 'trave', `${TRAVE} Lasciati appeso rilassando le spalle, piedi staccati.`, { isometrico: true, secPerRep: 1 }),

  // --- Core ---
  ex('plank', 'Plank', B, 'core', 'corpo', 'Avambracci a terra, corpo dritto, addome e glutei contratti.', { isometrico: true, scala: 'plank', gradino: 1, secPerRep: 1, fedb: 'Plank' }),
  ex('plank-toccate', 'Plank con toccate spalle', B, 'core', 'corpo', 'In plank a braccia tese, tocca la spalla opposta senza ruotare il bacino.', { scala: 'plank', gradino: 2, secPerRep: 1.5 }),
  ex('plank-braccio-gamba', 'Plank braccio e gamba', B, 'core', 'corpo', 'In plank a braccia tese, solleva un braccio e la gamba opposta, alterna.', { scala: 'plank', gradino: 3, secPerRep: 2.5 }),
  ex('body-saw', 'Plank a sega', B, 'core', 'corpo', 'In plank sugli avambracci, dondola il corpo avanti e indietro di pochi centimetri.', { scala: 'plank', gradino: 4, secPerRep: 2 }),
  ex('dead-bug', 'Dead bug', B, 'core', 'corpo', 'Supino, braccia e ginocchia in alto, distendi braccio e gamba opposti senza staccare la schiena.', { secPerRep: 3, fedb: 'Dead_Bug' }),
  ex('crunch-inverso', 'Crunch inverso', B, 'core', 'corpo', 'Supino, porta le ginocchia al petto staccando il bacino da terra.', { secPerRep: 2.5, fedb: 'Reverse_Crunch' }),
  ex('plank-laterale', 'Plank laterale', B, 'core', 'corpo', 'Su un avambraccio, corpo dritto di lato. Metà tempo per lato.', { isometrico: true, secPerRep: 1, fedb: 'Side_Bridge' }),
  ex('russian-twist', 'Russian twist', B, 'core', 'corpo', 'Seduto, busto inclinato e piedi sollevati, ruota il busto da un lato all\'altro.', { secPerRep: 1.5, fedb: 'Russian_Twist' }),
  ex('flutter-kicks', 'Sforbiciate', B, 'core', 'corpo', 'Supino, gambe tese sollevate, piccoli colpi alternati con la schiena a terra.', { secPerRep: 1, fedb: 'Flutter_Kicks' }),
  ex('russian-twist-manubrio', 'Russian twist con manubrio', B, 'core', 'manubri', 'Come il russian twist, tenendo un manubrio al petto.', { secPerRep: 2 }),
  ex('ginocchia-appeso', 'Ginocchia al petto da appeso', B, 'core', 'trave', `${TRAVE} Da appeso, porta le ginocchia al petto senza dondolare.`, { secPerRep: 3, fedb: 'Hanging_Leg_Raise' }),

  // --- Cardio ---
  ex('mountain-climber', 'Mountain climber', B, 'cardio', 'corpo', 'In plank a braccia tese, porta le ginocchia al petto alternando, veloce.', { secPerRep: 1, fedb: 'Mountain_Climbers' }),
  ex('ginocchia-alte-marcia', 'Marcia a ginocchia alte', B, 'cardio', 'corpo', 'Sul posto, ginocchia all\'altezza delle anche e braccia che spingono, senza saltare.', { secPerRep: 1 }),
  ex('burpee-senza-salto', 'Burpee senza salto', B, 'cardio', 'corpo', 'Mani a terra, passo indietro in plank, passo avanti e in piedi.', { secPerRep: 4 }),
  ex('shadow-boxing', 'Pugni in guardia', B, 'cardio', 'corpo', 'In guardia, pugni veloci alternati con rotazione del busto.', { secPerRep: 1 }),
  ex('jumping-jack', 'Jumping jack', B, 'cardio', 'corpo', 'Salta aprendo gambe e braccia, poi richiudi.', { salto: true, secPerRep: 1 }),
  ex('burpee', 'Burpee', B, 'cardio', 'corpo', 'Squat, mani a terra, salta in plank, piegamento, torna su e salta.', { salto: true, secPerRep: 4 }),
  ex('corsa-sul-posto', 'Corsa sul posto', B, 'cardio', 'corpo', 'Corsa veloce sul posto, ginocchia alte.', { salto: true, secPerRep: 1, fedb: 'Fast_Skipping' }),
  ex('star-jump', 'Salto a stella', B, 'cardio', 'corpo', 'Da accosciato, salta aprendo braccia e gambe a stella.', { salto: true, secPerRep: 2.5, fedb: 'Star_Jump' }),

  // --- Riscaldamento (mobilita') ---
  ex('marcia', 'Marcia sul posto', R, 'mobilita', 'corpo', 'Marcia tranquilla muovendo le braccia, per scaldarti.', { secPerRep: 1 }),
  ex('circonduzioni-braccia', 'Circonduzioni delle braccia', R, 'mobilita', 'corpo', 'Grandi cerchi con le braccia tese, avanti e poi indietro.', { secPerRep: 1, fedb: 'Arm_Circles' }),
  ex('cerchi-anche', 'Cerchi con le anche', R, 'mobilita', 'corpo', 'Mani sui fianchi, ampi cerchi col bacino nei due sensi.', { secPerRep: 1.5, fedb: 'Standing_Hip_Circles' }),
  ex('gatto-mucca', 'Gatto e mucca', R, 'mobilita', 'corpo', 'A quattro zampe, inarca e arrotonda la schiena seguendo il respiro.', { secPerRep: 3, fedb: 'Cat_Stretch' }),
  ex('inchworm', 'Bruco', R, 'mobilita', 'corpo', 'In piedi, cammina con le mani fino al plank e torna indietro.', { secPerRep: 5, fedb: 'Inchworm' }),
  ex('worlds-greatest', 'Affondo con rotazione', R, 'mobilita', 'corpo', 'Affondo profondo, gomito verso il piede davanti, poi ruota il braccio al soffitto.', { unilaterale: true, secPerRep: 5, fedb: 'Worlds_Greatest_Stretch' }),
  ex('oscillazioni-gambe', 'Oscillazioni delle gambe', R, 'mobilita', 'corpo', 'Tenendoti al muro, slancia una gamba avanti e indietro, poi cambia.', { unilaterale: true, secPerRep: 1.5 }),
  ex('rotazioni-toraciche', 'Rotazioni del busto a quattro zampe', R, 'mobilita', 'corpo', 'A quattro zampe, mano dietro la testa, ruota il gomito verso il soffitto.', { unilaterale: true, secPerRep: 3 }),
  ex('squat-lento', 'Squat lento di mobilità', R, 'mobilita', 'corpo', 'Squat lenti e profondi, fermandoti un attimo in basso.', { secPerRep: 4, fedb: 'Bodyweight_Squat' }),
  ex('appeso-piedi-terra', 'Appeso con piedi a terra', R, 'mobilita', 'trave', `${TRAVE} Piedi a terra, scarica solo parte del peso sulle mani per scaldare le dita.`, { isometrico: true, secPerRep: 1 }),

  // --- Defaticamento (stretching statico) ---
  ex('stretch-quadricipite', 'Allungamento quadricipite', D, 'stretching', 'corpo', 'In piedi, porta il tallone al gluteo tenendo le ginocchia vicine. Metà tempo per lato.', { stretchFor: ['gambe'], fedb: 'Quad_Stretch' }),
  ex('stretch-femorali', 'Allungamento femorali seduto', D, 'stretching', 'corpo', 'Seduto a gambe tese, porta il busto in avanti con la schiena lunga.', { stretchFor: ['anca', 'gambe'], fedb: 'Seated_Floor_Hamstring_Stretch' }),
  ex('stretch-figura-4', 'Allungamento glutei a 4', D, 'stretching', 'corpo', 'Supino, caviglia sul ginocchio opposto, tira la coscia verso il petto. Metà tempo per lato.', { stretchFor: ['anca'], fedb: 'Ankle_On_The_Knee' }),
  ex('stretch-flessori', 'Allungamento flessori dell\'anca', D, 'stretching', 'corpo', 'Ginocchio a terra in affondo, spingi il bacino avanti. Metà tempo per lato.', { stretchFor: ['anca', 'gambe'], fedb: 'Kneeling_Hip_Flexor' }),
  ex('stretch-polpacci', 'Allungamento polpacci al muro', D, 'stretching', 'corpo', 'Mani al muro, una gamba dietro tesa col tallone a terra. Metà tempo per lato.', { stretchFor: ['gambe', 'cardio'], fedb: 'Calf_Stretch_Hands_Against_Wall' }),
  ex('stretch-petto', 'Allungamento petto alla porta', D, 'stretching', 'corpo', 'Avambraccio sullo stipite, ruota il busto dalla parte opposta. Metà tempo per lato.', { stretchFor: ['spinta'], fedb: 'Chest_And_Front_Of_Shoulder_Stretch' }),
  ex('stretch-tricipite', 'Allungamento tricipite', D, 'stretching', 'corpo', 'Mano dietro la nuca, con l\'altra spingi piano il gomito. Metà tempo per lato.', { stretchFor: ['spinta'], fedb: 'Triceps_Stretch' }),
  ex('stretch-spalla', 'Allungamento spalla incrociata', D, 'stretching', 'corpo', 'Braccio teso davanti al petto, tiralo con l\'altro braccio. Metà tempo per lato.', { stretchFor: ['trazione', 'spinta'], fedb: 'Shoulder_Stretch' }),
  ex('stretch-bambino', 'Posizione del bambino', D, 'stretching', 'corpo', 'In ginocchio, siedi sui talloni e allunga le braccia avanti a terra.', { stretchFor: ['trazione', 'core'], fedb: 'Childs_Pose' }),
  ex('stretch-dorsali-laterale', 'Allungamento laterale in piedi', D, 'stretching', 'corpo', 'Braccia sopra la testa, piegati di lato. Metà tempo per lato.', { stretchFor: ['trazione', 'core'], fedb: 'Standing_Lateral_Stretch' }),
  ex('stretch-cobra', 'Cobra', D, 'stretching', 'corpo', 'Prono, spingi con le mani e solleva il petto tenendo il bacino a terra.', { stretchFor: ['core'] }),
  ex('stretch-ginocchia-petto', 'Ginocchia al petto', D, 'stretching', 'corpo', 'Supino, abbraccia le ginocchia e respira lentamente.', { stretchFor: ['core', 'anca'], fedb: 'Hug_Knees_To_Chest' }),
  ex('stretch-torsione', 'Torsione da supino', D, 'stretching', 'corpo', 'Supino, porta un ginocchio dall\'altra parte guardando nella direzione opposta. Metà tempo per lato.', { stretchFor: ['core', 'anca'] }),
  ex('stretch-avambracci', 'Allungamento avambracci', D, 'stretching', 'corpo', 'Braccio teso, tira indietro le dita con l\'altra mano, palmo su e poi giù.', { stretchFor: ['trazione'] }),
])

const INDEX = new Map(CATALOG.map((e) => [e.id, e]))

export function byId(id) {
  return INDEX.get(id)
}
