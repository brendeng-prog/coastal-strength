# Coastal Strength — slice 1 delivery

Single-file, local-first strength log built to `coastal-strength-build-prompt.md`.
This delivery covers the first five slices in the spec's order: **persistence → workout logger → progression engine**, plus the parts of Today/Profile they need. History/Progress, nutrition, recovery/cardio, export/import and polish are **not built** and the app says so in place rather than showing anything invented.

## Run it

- **Preview:** open `dist/coastal-strength.html` (identical to `dist/index.html`). Everything — CSS, JS, icons, manifest — is inline.
- **iPhone home screen:** host the `dist/` folder over HTTPS (GitHub Pages works), open it in Safari, Share → Add to Home Screen. `file://` can't be installed and won't persist reliably on iOS.
- **Dev:** `node build.js` builds `dist/`; `node --test test/core.test.js` runs the logic tests; `npm install` then `node --test test/flow.test.js` runs the jsdom flow.

## What's implemented

- **Onboarding** (5 steps, 2 skippable): name, units, timezone, weight (must be confirmed or corrected — 172 lb is offered, never assumed), weigh-in date, height, week schedule, equipment, the four "OR" picks, nutrition mode, optional calorie target, experience, limitations, the goal framing with the frame statement (shown once), effort guidance and the RIR definition. Ends on Today.
- **Plan** seeded exactly per §6 (verified by test). Sessions snapshot their prescriptions at creation, so later plan edits can't rewrite history.
- **Today:** one primary action (Start / Resume), week ring (completed ÷ scheduled lifting sessions; cardio and rest days excluded), weight card with a defined 7-day average (only with 3+ weigh-ins), up to two log-derived observations. Rest-day Today is intentional. Protein and check-in cards are absent, not faked.
- **Logger:** pre-session view with prescription, last performance and any pending suggestion; per-set load / reps (or seconds) / RIR / done; prefill from the last comparable performance that is never counted as completed; one-tap complete and undo; add, delete, warm-up ↔ working toggle; skip with reason; substitute (separate history; refused after sets are logged); reorder this session only; per-exercise rest default and cues; notes; plate math for barbells; pause/resume/finish with a counts confirmation. Elapsed time is computed from timestamps.
- **Exercise types** modelled explicitly: per-dumbbell, total bar, machine stack, bodyweight, assisted (less assistance is progress), weighted bodyweight, unilateral (linked or separate L/R rows), timed holds. Pull-ups, assisted pull-ups and lat pulldowns are three histories.
- **Rest timer:** timestamp-based, persisted in the database so it survives navigation and reload; ±30 s, pause, dismiss; vibration/beep where the platform allows, with the background-alert caveat stated in Profile.
- **Progression engine:** transparent double progression with every reason listed. Warm-ups excluded; incomplete sessions, missing prescribed sets, extra sets and mixed loads never trigger; per-exercise increments per unit; assisted → less assistance; bodyweight → reps and control first; timed → upper bound. RIR 0 flags "holding may be appropriate"; absent RIR is stated. Suggestions are accepted / dismissed / overridden on the completion summary (or the next session's pre-view) and prefill the next session — they never rewrite a workout. Repeated decline produces a neutral prompt, no diagnosis.
- **Completion summary:** counts, active time, top-set comparison with the previous session of the same template, suggestions with reasons, optional energy/difficulty/soreness/notes.
- **Profile:** everything from onboarding is editable; rest-timer settings; theme; a plain statement of where data lives; typed-confirmation delete-all.
- **Accessibility:** labelled controls, `aria-pressed` on toggles, visible focus rings, reduced-motion respected, large touch targets, numeric keyboards via `inputmode`, tabular numerals, both themes on the spec's tokens.

## Storage and privacy — read this

There is no server, no account, no cloud sync. The whole database is one JSON document written atomically (a retried write can never duplicate a set).

| Where it runs | Backend used | What that means |
|---|---|---|
| claude.ai preview | the preview's per-user key-value storage | Tied to your claude.ai account and this artifact. Not on a phone. Deleted with the artifact. |
| Hosted page / home-screen app | IndexedDB (falls back to localStorage) | Device- and browser-specific. Clearing site data, private browsing, or another browser = a different or empty copy. |
| Neither available | memory only | A red "Not saving" indicator is shown; nothing survives a reload. |

Profile shows which backend is live. **There is no export/import yet (slice 7), so there is no backup.** Treat this as a working copy until that ships. Photos are not built. No Apple Health, HealthKit, Watch, push notifications or cross-device sync are claimed.

## Test results (§17)

Method key: **auto** = `node --test`, runs against the built bundle; **jsdom** = automated flow in jsdom (no layout engine, not Safari); **manual** = checked by reading code/output, not executed in a browser.

| # | Test | Method | Result | Notes |
|---|---|---|---|---|
| 1 | Onboarding produces the exact default plan | auto + jsdom | pass | Plan versions, picks, prescription snapshots |
| 2 | Seeded exercises, set counts, rep ranges match §6 | auto | pass | Encoded verbatim in the test |
| 3 | Start → partially log → refresh → resume, no data loss | jsdom | pass | Reload simulated with a second window on the same storage; values, completion flags, elapsed time and rest timer survive |
| 4 | Prefilled values not counted as completed | auto + jsdom | pass | |
| 5 | Undo corrects all totals | auto + jsdom | pass | |
| 6 | Finishing updates history and the week ring | auto + jsdom | pass | |
| 7 | 4 × 10 produces the correct increase | auto + jsdom | pass | 50 → 55 lb per dumbbell; 60 → 62.5 kg barbell |
| 8 | Missing set and 10/10/9/8 produce no increase | auto | pass | Also: extra sets, mixed loads, warm-ups, unfinished sessions |
| 9 | Assisted pull-up progression reduces assistance | auto | pass | 40 → 35 lb; series stay separate |
| 10 | Substitutions keep separate histories | auto | pass | Substitution refused after logged sets |
| 11 | Plan edits don't alter completed sessions | manual | **not verified** | Snapshots exist; the plan-editing UI is not built, so no test exercises it |
| 12 | Nutrition add/edit/delete totals | — | **not verified** | Not built |
| 13 | Weight averages handle missing observations | auto | pass | No average below 3 observations; no zeros |
| 14 | Rest days don't reduce lifting adherence | auto | pass | Rescheduled-within-week counts once |
| 15 | Timers accurate across backgrounding | auto | pass | Timestamp math tested with simulated gaps; real iOS backgrounding **not verified** |
| 16 | Export → import round-trip | — | **not verified** | Not built |
| 17 | Invalid import can't corrupt data | — | **not verified** | Not built |
| 18 | No horizontal overflow at 390 px | manual | **not verified** | Layout uses fixed+fr grids and `overflow-x: hidden`; no real browser available here |
| 19 | Cross-user access impossible | n/a | pass by construction | No backend; nothing leaves the device/account storage |
| 20 | Photos unreachable via public URLs | n/a | pass by construction | Photos not built |
| — | Storage fallback order, save serialization, retry after failure | auto | pass | |
| — | Timezone-correct local dates, unit conversion, input validation | auto | pass | |
| — | localStorage backend when the preview API is absent | jsdom | pass | |
| — | Delete-all requires typed confirmation | jsdom | pass | |

22 logic tests and 3 flow tests pass. Anything marked not verified was not run.

## Tap counts (measured on the built UI)

- See today's plan: **0 taps** (Today lists the session and its exercises).
- Start it: **1 tap** (Start workout).
- Log a set: **1 tap** (the check) when the prefilled load and reps are what you did; otherwise type the numbers, then 1 tap. Typing never marks a set complete.

## Not built yet (in the spec's finish order)

1. History / Progress tab: per-exercise history, rep-range climb view, PR ledger, milestones, measurements beyond weight, consistency calendar, Sunday recap.
2. Nutrition tab.
3. Recovery check-in, Zone 2 logging, Saturday interval timer. (The Saturday abs circuit already logs through the normal logger; the cardio half does not.)
4. Export / import (JSON, CSV) — and therefore backups.
5. Scheduling & plan editing: move a session to a date, skip with reason from the week view, swap variants going forward, adjust prescriptions, reset to the original plan, plan versioning UI. Sessions already snapshot prescriptions and plan versions exist in the model.
6. Per-exercise increment editing (defaults are set; the engine respects the field).
7. Service worker for offline-after-first-load when hosted.
8. Demo mode, visual polish pass, real-device QA.

## Decision log

- **Single HTML file, vanilla JS, no framework or build dependencies.** Runs as a preview here, hosts anywhere, and stays inspectable. `build.js` only concatenates.
- **Storage adapter with four backends** rather than one, because the preview sandbox and a hosted page expose different APIs. Whole-document writes, debounced 250 ms, serialized, retried after failure, flushed on `visibilitychange`/`pagehide`. The status dot is real.
- **One session per template per local date.** Starting the same template twice on a day resumes rather than duplicates. A different template can be started on any day ("Start today"), which is how a missed session is made up until the scheduling slice lands.
- **Any open session is Today's primary action**, even if it isn't the scheduled template. Found and fixed by the flow test.
- **Suggestions are decided by you, applied at next-session creation, then marked consumed.** Undecided ones reappear in the next session's pre-view with Use / Not now.
- **Unilateral default is linked** (one row = both sides); "Log left and right separately" splits into L/R rows. Progression collapses a pair to one logical set using the lower rep count and requires equal loads.
- **Rear-delt flyes default to the machine (reverse pec deck)**; a dumbbell variant exists as a substitute with its own history. "Rope triceps pushdowns" and "Triceps pushdowns" are separate exercises since the plan names them differently.
- **"Both curl variants" tagged as priority = incline dumbbell curls + hammer curls** (the two on Pull day). Cable curls are not tagged. Say the word and I'll flip it.
- **Priority tagging is on the exercise records** and drives nothing yet; the Progress filter that uses it is in the history slice.
- **The TV-character reference is not in the app.** Onboarding describes the build in the spec's own words ("lean, athletic…") and the four leverage points; no name, no imagery, no comparison feature.
- **Effort guidance and the RIR definition** appear once in onboarding, in the logger's "Effort & RIR" sheet, and in Profile.
- **Mark:** one stroke, crest curls into the C. Rendered to PNG by sampling the same bezier path used in the SVG, so the icons and favicon are the same shape.
- **Dropped `maximum-scale=1`.** Inputs are ≥ 16 px so iOS won't auto-zoom, and pinch-zoom stays available.
