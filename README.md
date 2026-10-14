# GT7 Tuning Lab

A web app for **Gran Turismo 7** (PS5): pick a car, a track and a race type and get a complete,
ready-to-enter tuning sheet — tyres, suspension, differential, aero, gearing, brakes and assists.

- **584 cars** — every car in the GT7 database, with photos, power, weight and drivetrain.
- **121 track layouts** (41 locations, forward and reverse) with maps traced from real in-game laps.
- **5 race types** — Time Trial, Sprint, Endurance, Drift, Drag — plus dry/wet, a stable↔agile
  handling slider, and your car's current (upgraded) power and weight.
- Shareable links (the whole selection lives in the URL), copy-as-text and print.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tuning-engine tests (every output stays inside GT7's setting ranges)
npm run build      # static site in dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(enable it once under *Settings → Pages → Source: GitHub Actions*).

## How the setup is calculated

`src/lib/tuning.ts` builds the setup from:

| Input | Used for |
|---|---|
| Car category (Road, Gr.4, Gr.3, Gr.2, Gr.1, Gr.B, Race, Formula, Kart) | baseline spring frequency, camber, ride height, tyre family |
| Drivetrain & weight split | front/rear anti-roll bar and spring balance, toe, LSD layout, brake balance |
| Power-to-weight | LSD acceleration lock, traction control, gearing |
| Track turns/km, longest straight, elevation, surface | downforce level, bump compliance, rally setup on dirt/snow |
| Race type, weather, handling slider | compound, camber (tyre wear), diff locking, softness |

Top speed for the transmission is found by simulating full throttle along the track's longest
straight with the car's power, weight and drag. Ride height is given in mm above the car's minimum
and downforce as a % of the car's range, because those ranges differ per car in GT7.

## Car pictures

Each card tries, in order: the official GT7 car-list render on gran-turismo.com (by internal car
ID — URL template in `src/lib/carImages.ts`), then the lead photo of the matching Wikipedia article
(cached in the browser), then a generated illustration.

## Data

`npm run data` rebuilds `src/data/*.json` from `data/`:

- `data/source/gt7info/` — car, maker and track lists from [ddm999/gt7info](https://github.com/ddm999/gt7info) (MIT-0).
- `data/car-specs.csv` — category, drivetrain, aspiration, stock hp, kg and front weight % for every car
  (approximate stock values; edit and re-run `npm run data` to correct any car).
- `data/source/gt7-track-data/` — layout catalogue and in-game racing lines from
  [jbhoorasingh/gt7-datalogger-track-data](https://github.com/jbhoorasingh/gt7-datalogger-track-data) (CC0),
  including lap captures from [zetetos/gt-telemetry](https://github.com/zetetos/gt-telemetry) (MIT, see `gt-telemetry-LICENSE`).
  Eight layouts with no recording of their own show their venue's main layout ("Venue map").

Fan-made tool, not affiliated with Sony Interactive Entertainment or Polyphony Digital.
"Gran Turismo" is a registered trademark of Sony Interactive Entertainment.
