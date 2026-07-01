---
slug: what-is-a-good-cda-number
title: "Reading a CdA Number: What's Good, Average, and Pro?"
metaTitle: "Good CdA Number: Benchmarks by Discipline"
metaDescription: "What's a good CdA number? Benchmark drag-area values by discipline — road, TT, track — from beginner to elite, and what each 0.01 m² is worth."
cluster: aerodynamics-cda
isPillar: false
locale: en
focusKeyword: "good cda number"
pillarSlug: cycling-aerodynamics-cda-guide
faqJson:
  - question: "What is a good CdA number for a road cyclist?"
    answer: "A recreational road rider in the hoods typically measures 0.32–0.36 m². A trained racer who can hold the drops sustainably is around 0.28–0.31 m². Anything under 0.28 m² on a road bike (no aero bars) is excellent and usually reflects a naturally slim build and a committed position."
  - question: "What CdA do pro time-trialists ride at?"
    answer: "Elite professional time-trialists on aero bars typically ride at 0.20–0.24 m², with the very best pursuit and hour-record specialists reaching 0.19–0.21 m². Track sprinters in an extreme tuck can hit 0.16–0.18 m², but only for short efforts."
  - question: "How much faster is a 0.01 m² lower CdA?"
    answer: "Roughly 8 W at 40 km/h, or about 30–40 seconds over a flat 40 km time trial for a typical rider. The saving scales with the cube of speed, so it grows fast as you go quicker."
  - question: "How do I find my own CdA number?"
    answer: "You can estimate it from photos using frontal-area analysis, measure it with field testing (virtual elevation or regression with a power meter), or track it live with a sensor like the didi.bike unit, which computes real-time CdA from a 6-axis IMU and barometer."
  - question: "Is a lower CdA always better?"
    answer: "No. An extremely low CdA often comes from a position you can't sustain, which raises your effective drag over a full event. The best CdA is the lowest one you can hold for the duration of your ride or race, not the lowest you can hit for 30 seconds in a test."
---

# Reading a CdA Number: What's Good, Average, and Pro?

A CdA number (drag area, in \(\text{m}^2\)) summarizes how much air you push aside as you ride. Lower is faster. For context: a recreational rider on the hoods sits around \(0.32\)–\(0.36\ \text{m}^2\), a trained racer in the drops around \(0.28\)–\(0.31\), a pro time-trialist on aero bars around \(0.20\)–\(0.24\), and an elite track rider can reach \(0.16\)–\(0.18\ \text{m}^2\). Each \(0.01\ \text{m}^2\) you drop is worth about 8 W at \(40\ \text{km/h}\). This guide gives you benchmarks by discipline so you know whether your number is good, average, or pro-level. For the underlying physics, see our [cycling aerodynamics & CdA guide](/en/blog/cycling-aerodynamics-cda-guide).

## What CdA Actually Measures

CdA is the product of your drag coefficient (\(C_d\)) and your frontal area (\(A\)). It appears in the aero power equation:

\[
P_{\text{aero}} = \tfrac{1}{2}\, \rho\, C_d A\, v^3
\]

where \(\rho \approx 1.225\ \text{kg/m}^3\) is air density and \(v\) is speed. Because CdA bundles shape efficiency and size into one number, it's the single best summary of your aerodynamic footprint. Two riders with identical CdA pay the same aero power at the same speed, regardless of how they got there. Learn more in [what is CdA in cycling](/en/blog/what-is-cda-cycling) and [frontal area and drag](/en/blog/frontal-area-cycling-drag).

## CdA Benchmarks by Discipline

| Discipline / position | Typical CdA (\(\text{m}^2\)) | Level |
|---|---|---|
| Upright commuter | \(0.40\)–\(0.50\) | Recreational |
| Road hoods, relaxed | \(0.34\)–\(0.40\) | Recreational |
| Road hoods, committed | \(0.32\)–\(0.36\) | Trained club rider |
| Road drops | \(0.28\)–\(0.31\) | Strong road racer |
| Road drops, elite | \(0.27\)–\(0.29\) | Pro road |
| TT / aero bars | \(0.22\)–\(0.26\) | Amateur TT |
| TT / aero bars, elite | \(0.20\)–\(0.24\) | Pro TT |
| Elite TT / hour record | \(0.19\)–\(0.21\) | World-class TT |
| Track pursuit, elite | \(0.19\)–\(0.22\) | Pro track |
| Track sprint, flying | \(0.16\)–\(0.18\) | Pro track sprint |

A few notes on reading this table:

- **Ranges, not absolutes**: CdA varies with body size, flexibility, and equipment. A taller rider will naturally have a higher CdA than a smaller one at the same level of optimization.
- **Position dominates**: moving from hoods to drops typically saves more than any single equipment change. See [best aero position](/en/blog/best-aero-position-road-cycling) and [CdA watts saved by position](/en/blog/cda-watts-saved-position).
- **Track numbers look lower** partly because the environment (zero yaw, constant speed) lets riders hold extreme positions — see [velodrome vs road](/en/blog/velodrome-vs-road-aerodynamics).

## What Each 0.01 m² Is Worth

The rule of thumb: **each \(0.01\ \text{m}^2\) of CdA is worth about 8 W at \(40\ \text{km/h}\)**. Because aero power scales with \(v^3\), the watt value of a given CdA saving grows fast with speed:

| Speed | Watts per \(0.01\ \text{m}^2\) |
|---|---|
| \(25\ \text{km/h}\) | \(\sim 2\ \text{W}\) |
| \(30\ \text{km/h}\) | \(\sim 3.5\ \text{W}\) |
| \(35\ \text{km/h}\) | \(\sim 5.5\ \text{W}\) |
| \(40\ \text{km/h}\) | \(\sim 8\ \text{W}\) |
| \(45\ \text{km/h}\) | \(\sim 11\ \text{W}\) |
| \(50\ \text{km/h}\) | \(\sim 15\ \text{W}\) |

This is why aero matters enormously for time trials and sprints but far less on a leisurely club ride — the same CdA improvement is worth different amounts of power at different speeds. Translate those watts into finish-line time in [aero time savings for a 40 km TT](/en/blog/aero-time-savings-40km-time-trial).

## How to Find Your Own CdA

You have three main options, in increasing order of accuracy and cost:

1. **Photo estimation**: take a side-on photo, trace your outline, and estimate frontal area. Quick but coarse (\(\pm 10\%\) or worse). See [frontal area and drag](/en/blog/frontal-area-cycling-drag).
2. **Field testing with a power meter**: ride a flat, calm loop at steady effort and use virtual elevation or regression to solve for CdA. Accuracy around \(\pm 0.005\ \text{m}^2\) with care. See [measuring CdA without a wind tunnel](/en/blog/measure-cda-without-wind-tunnel).
3. **Instrumented sensor**: the didi.bike seat-post sensor (14 g, 6-axis IMU at 100 Hz, barometer, \(\pm 0.1^\circ\) angular accuracy) computes real-time CdA as you ride, with \(120\ \text{h}\) battery, IP67 rating, and ANT+/Bluetooth LE 5.0 streaming to Garmin, Wahoo, Strava, and TrainingPeaks. At $299 it's the cheapest way to get continuous, season-long CdA data. See [real-time CdA tracking](/en/blog/real-time-cda-tracking-field-testing).

For the gold-standard but expensive option, a wind tunnel gives a one-off baseline — see [wind tunnel testing and its limits](/en/blog/wind-tunnel-testing-cycling-limits).

## Lower Isn't Always Better

The trap with CdA is chasing the lowest number you can hit for 30 seconds in a test. If that position isn't sustainable, your *effective* CdA over a real event will be higher, because you'll sit up when you fatigue. The best CdA is the lowest one you can **hold for the full duration** of your target event. A \(0.24\ \text{m}^2\) position held for an hour beats a \(0.21\ \text{m}^2\) position you abandon after 10 minutes.

This is why tracking CdA over time — not just measuring it once — matters. A sensor that logs CdA every ride shows you when your sustainable position drifts, letting you catch problems before race day.

## Benchmarking Yourself

Compare your measured CdA against the table above for your discipline. If you're a road racer sitting at \(0.34\ \text{m}^2\) on the hoods, there's clear room to improve through position work. If you're a TT rider at \(0.22\ \text{m}^2\), you're already strong and gains will come from finer tuning (helmet, suit, narrower bars). Pair your CdA with your [rolling resistance (Crr)](/en/blog/cda-vs-crr-cycling) for a complete picture of what's slowing you down.

## Key Takeaways

- A good road CdA is \(0.28\)–\(0.32\ \text{m}^2\); a pro TT CdA is \(0.20\)–\(0.24\ \text{m}^2\).
- Each \(0.01\ \text{m}^2\) is worth about 8 W at \(40\ \text{km/h}\), and the value rises with speed.
- Position is the biggest lever; equipment is secondary.
- Measure your own CdA with field testing or a sensor, and track it over time.
- The best CdA is the lowest you can sustain, not the lowest you can touch.

## FAQ

**What is a good CdA number for a road cyclist?**
A recreational road rider in the hoods typically measures 0.32–0.36 m². A trained racer who can hold the drops sustainably is around 0.28–0.31 m². Anything under 0.28 m² on a road bike (no aero bars) is excellent and usually reflects a naturally slim build and a committed position.

**What CdA do pro time-trialists ride at?**
Elite professional time-trialists on aero bars typically ride at 0.20–0.24 m², with the very best pursuit and hour-record specialists reaching 0.19–0.21 m². Track sprinters in an extreme tuck can hit 0.16–0.18 m², but only for short efforts.

**How much faster is a 0.01 m² lower CdA?**
Roughly 8 W at 40 km/h, or about 30–40 seconds over a flat 40 km time trial for a typical rider. The saving scales with the cube of speed, so it grows fast as you go quicker.

**How do I find my own CdA number?**
You can estimate it from photos using frontal-area analysis, measure it with field testing (virtual elevation or regression with a power meter), or track it live with a sensor like the didi.bike unit, which computes real-time CdA from a 6-axis IMU and barometer.

**Is a lower CdA always better?**
No. An extremely low CdA often comes from a position you can't sustain, which raises your effective drag over a full event. The best CdA is the lowest one you can hold for the duration of your ride or race, not the lowest you can hit for 30 seconds in a test.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
