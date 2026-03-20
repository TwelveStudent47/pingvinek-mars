# 🐧 Penguin Expedition — Mars Rover Szimuláció

Valós idejű Mars rover szimuláció, amely a Pingvinek csapat projekt keretében készült. A rendszer egy Python FastAPI backendet és egy React + Three.js frontendet kombinál: a backend BFS + clustering algoritmussal tervezi meg a rover útvonalát, a frontend 3D-ben jeleníti meg a missziót.

---

## Tartalomjegyzék

- [Funkciók](#funkciók)
- [Architektúra](#architektúra)
- [API dokumentáció](#api-dokumentáció)
- [Projekt struktúra](#projekt-struktúra)
- [Technológiák](#technológiák)

---

## Funkciók

- **3D Mars felszín** — Three.js alapú térkép szikla akadályokkal, ásványokkal, nap/éjszaka ciklussal és bolygókkal a háttérben
- **Rover animáció** — 4 állapotú GLB modell (alap, álló, mozgó, fúró), folyamatos frame-alapú mozgásinterpoláció, automatikus irányforgatás
- **Backend útvonaltervezés** — BFS + klaszterezés alapú optimális útvonal, `Go`/`Mining` blokkokkal és `speedPlan`-nal
- **8 irányú mozgás** — átlós mozgás támogatása (kardinális + átlós irányok)
- **Energia modell** — napenergia töltés, sebességfüggő fogyasztás (`E = 2v²`), akkumulátor kezelés
- **Misszió értékelés** — S/A/B/C/D osztályzat, energia egyenleg, grafikonok
- **Eredmény modal** — siker / akkumulátor halt / időkeret lejárt állapotok
- **Önálló EXE** — első indításkor automatikusan letölti a Python Embeddable-t, telepíti a függőségeket

---

## Architektúra

```
pingvinek-mars/
├── backend/          ← FastAPI Python szerver
├── frontend/         ← React + Vite + Three.js
├── launcher.py       ← Önálló indító script
└── launcher.spec     ← PyInstaller EXE konfig
```

### Kommunikáció

```
Frontend (React)  ←→  Backend (FastAPI :5000)
     │                      │
     │  GET /map/            │  Térkép betöltés
     │  GET /map/reset       │  Térkép visszaállítás
     │  GET /rover/route     │  Útvonal tervezés
     ↓                      ↓
  Zustand store         MapService (singleton)
  Three.js scene        BFS + Clustering
```

---

## API dokumentáció

**Base URL:** `http://localhost:5000`

### `GET /map/`

Visszaadja a teljes térkép állapotát.

```json
{
  "map": { "34,32": "S", "0,0": ".", "5,3": "#", "12,8": "B" },
  "rows": 50,
  "cols": 50
}
```

**Cellák:** `.` üres, `#` akadály, `B` vízjég, `Y` arany, `G` ritka ásvány, `S` start

### `GET /map/reset`

Visszaállítja a térképet az eredeti CSV állapotba (ásványok visszatöltése bányászás után).

### `GET /rover/route`

Kiszámítja a rover teljes misszió útvonalát BFS + klaszterezéssel. Visszaadja a `Go`/`Mining` blokkokat `speedPlan`-nal és előre kiszámított `timeline`-nal.

```json
{
  "route": [
    {
      "type": "Go",
      "path": [[34,32],[34,33],[35,34]],
      "timelinePath": [[34,32],[35,34]],
      "speedPlan": ["FAST"]
    },
    {
      "type": "Mining",
      "path": [[35,34],[35,34]]
    }
  ],
  "timeline": [
    { "step": 1, "type": "Go", "speed": "FAST", "position": [35,34], "battery": 92, "time": {...} }
  ],
  "battery": 45,
  "time": 12.5
}
```

> ⚠️ A `/rover/route` hívás 15–60 másodpercet vehet igénybe a clustering algoritmus miatt.

---

## Projekt struktúra

```
backend/
├── api/v1/
│   ├── map_router.py         # GET /map/, GET /map/reset
│   └── rover_router.py       # GET /rover/route
├── services/
│   ├── algorithm/
│   │   ├── ore_distance.py   # BFS útvonalkereső (8 irány)
│   │   ├── find_clusters.py  # Ásvány klaszterezés
│   │   ├── top_layer.py      # Misszió tervező fő logika
│   │   └── cluster_go_through.py
│   └── map/map.py            # MapService singleton
├── schemas/
│   ├── JSON/
│   │   ├── rover.py          # Rover entitás + energia logika
│   │   ├── move.py           # GoMove, MiningMove
│   │   └── cluster.py        # Klaszter értékelés
│   └── IN/rover.py
└── data/map.csv              # 50×50 térkép forrás

frontend/src/
├── components/
│   ├── three/
│   │   ├── MarsScene.jsx     # Three.js Canvas + kamera + naprendszer
│   │   ├── Rover.jsx         # Rover 3D modell + mozgás interpoláció
│   │   └── Terrain.jsx       # Talaj, akadályok, ásványok
│   └── dashboard/
│       ├── SimControls.jsx   # Vezérlők, tervezési modal, eredmény modal
│       ├── RoverPreview.jsx  # Bal panel 3D előnézet
│       ├── EnergyBalance.jsx # Energia egyenleg widget
│       ├── MissionScore.jsx  # Misszió értékelés widget
│       └── Charts.jsx        # Grafikonok (recharts)
├── store/store.js            # Zustand állapotkezelő
└── simulation/
    ├── mapData.js            # Térkép generálás + parseApiMap
    └── pathfinding.js        # Helyi A* fallback
```

---

## Technológiák

| Réteg | Technológia |
|---|---|
| Backend | Python 3.11, FastAPI, Uvicorn, Pydantic |
| Frontend | React 18, Vite, Zustand |
| 3D | Three.js r128, @react-three/fiber, @react-three/drei |
| Grafikonok | Recharts |
| EXE | PyInstaller + Python Embeddable |
| Algoritmus | BFS (8 irány), Greedy clustering, speedPlan optimalizáció |

---

## Energiamodell

A backend és frontend ugyanazt az energiamodellt alkalmazza:

| Művelet | Fogyasztás | Töltés (nappal) | Nettó |
|---|---|---|---|
| SLOW mozgás | 2 | +10 | **+8** |
| NORMAL mozgás | 8 | +10 | **+2** |
| FAST mozgás | 18 | +10 | **-8** |
| Bányászat | 2 | +10 | **+8** |
| Nappal: 00:00–16:00 | — | +10/lépés | — |
| Éjszaka: 16:00–24:00 | — | 0 | — |

---

*Pingvinek csapat — 2026*