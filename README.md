# GT7 Tuning Lab

A setup companion for **Gran Turismo 7** (PS5). Pick a car, a track and the event you're entering,
and get a complete, ready-to-enter tuning sheet — tyres, suspension, differential, aero, gearing,
brakes, a PP-limit plan and a pit strategy.

**Live site:** https://alisahba.github.io/GT7-Tuning/

## Features

- **584 cars** with official GT7 groups (N, Gr.4, Gr.3, Gr.2, Gr.1, Gr.B, Gr.X), power, weight,
  drivetrain and PP — measured stock PP for ~400 cars, estimated for the rest.
- **121 track layouts** at 41 locations, filterable by World Circuits region (**Europe, America,
  Asia-Oceania**), with maps traced from real in-game laps.
- **Events** — GT7 World Circuits series (Sunday Cup, Clubman Cup Plus, Japanese Clubman Cup 550,
  American Clubman Cup 700, World Touring Car 600–900, GT Cup Gr.3/Gr.4, Gr.1 Prototype Series …)
  with PP limits, typical laps and an eligibility check for your car. Every regulation (max PP, laps,
  required tyres, fuel/tyre multipliers, BoP) can be edited to match the in-game Regulations screen.
- **PP planner** — how to get under a PP limit (power restrictor %, ballast kg and position, harder
  tyres or a combination), or how to use spare PP.
- **Race strategy** — fuel per lap, tyre life, number of stops and what to do at each one.
- **Parts checklist**, engineer's notes and a fine-tuning guide (understeer/oversteer fixes).
- **My garage** — favourite cars and saved setups (stored in the browser), plus recent cars.
- Light/dark theme, km/h–mph, hp–PS, kg–lb, shareable links, copy-as-text and print.
  Press <kbd>/</kbd> to search.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests: GT7 setting ranges, PP plans, events, strategy
npm run build      # static site in dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## How it works

| Module | |
|---|---|
| `src/lib/tuning.ts` | Builds the setup from car class, drivetrain, weight split, power-to-weight, the track's layout data (turns/km, longest straight, bumps, surface) and the race/event. |
| `src/lib/pp.ts` | PP from measured stock values, scaled for upgrades with a model fitted on them (PP ∝ hp^0.33 · kg^-0.23 × compound ratio). |
| `src/lib/events.ts` | Event series catalogue and eligibility rules. |
| `src/lib/strategy.ts` | Fuel/tyre stint planner. |

Ride height is shown in mm above the car's minimum and downforce as a % of the car's range, because
those ranges differ per car in GT7. Top speed for the transmission is simulated along the track's
longest straight.

**Event data caveat:** Polyphony adjusts World Circuits events between updates and there is no
official machine-readable list, so lap counts and rounds are the community-reported values — the app
lets you correct any of them.

## Car pictures

Each card tries the official GT7 car-list render on gran-turismo.com (URL template in
`src/lib/carImages.ts`), then the lead photo of the matching Wikipedia article, then a generated
illustration.

## Data

`npm run data` rebuilds `src/data/*.json` from `data/`:

- `data/source/gt7info/` — cars, makers, official groups (`cargrp.csv`) and stock PP per tyre
  (`stockperf.csv`) from [ddm999/gt7info](https://github.com/ddm999/gt7info) (MIT-0).
- `data/car-specs.csv` — drivetrain, aspiration, stock hp, kg and front weight % for every car
  (approximate; correct any row and re-run `npm run data`).
- `data/source/gt7-track-data/` — layout catalogue and in-game racing lines from
  [jbhoorasingh/gt7-datalogger-track-data](https://github.com/jbhoorasingh/gt7-datalogger-track-data) (CC0),
  including lap captures from [zetetos/gt-telemetry](https://github.com/zetetos/gt-telemetry) (MIT, see `gt-telemetry-LICENSE`).

Fan-made tool, not affiliated with Sony Interactive Entertainment or Polyphony Digital.
"Gran Turismo" is a registered trademark of Sony Interactive Entertainment.
