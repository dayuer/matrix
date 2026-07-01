---
slug: aero-time-savings-40km-time-trial
title: "How Much Time Does Aerodynamics Save in a 40km Time Trial?"
metaTitle: "Aero Time Savings in a 40km Time Trial Explained"
metaDescription: "Aerodynamics is the single biggest lever in a 40km time trial. See exactly how much time CdA changes save, with a worked example table."
cluster: aerodynamics-cda
isPillar: false
locale: en
focusKeyword: "aero time savings time trial"
pillarSlug: cycling-aerodynamics-cda-guide
faqJson:
  - question: "How much time does aerodynamics save in a 40km time trial?"
    answer: "Reducing your CdA by 0.03 m² (roughly the gap between a relaxed road position and an optimized time-trial position) saves about 2 minutes over a 40km time trial at 40 km/h. Larger reductions of 0.05-0.06 m² can save over 3 minutes."
  - question: "Is aerodynamics more important than power in a time trial?"
    answer: "At time-trial speeds (35-45 km/h), aerodynamics usually matters more than raw power. A 5% CdA reduction is typically easier to achieve and more rewarding than a 5% power increase, because aerodynamic drag consumes 80-90% of your total power output."
  - question: "What CdA do I need for a fast 40km time trial?"
    answer: "A good amateur time-trial CdA is 0.22-0.24 m². Elite riders on optimized setups reach 0.19-0.22 m². The lower you go, the faster you ride at the same watts."
  - question: "How many watts is one minute over 40km worth?"
    answer: "At roughly 40 km/h, saving one minute over 40km is equivalent to holding about 15-20 fewer watts for a typical rider, or reducing CdA by about 0.015-0.02 m²."
---

# How Much Time Does Aerodynamics Save in a 40km Time Trial?

In a flat 40km time trial, aerodynamics is the dominant performance variable. Aerodynamic drag accounts for roughly 80-90% of the resistance you overcome at speeds above 35 km/h, which means small reductions in drag coefficient times frontal area (\(C_d A\)) translate directly into large time savings. Dropping your CdA by just 0.02 m² — the difference between a decent and a well-optimized position — typically saves 60-90 seconds over 40km at amateur racing speeds. This guide breaks down exactly how much time each aero gain is worth, using the physics that govern time-trial performance.

For the full foundation on drag area, see the [complete cycling aerodynamics and CdA guide](/en/blog/cycling-aerodynamics-cda-guide).

## The Physics: Why Aero Dominates a 40km TT

The power required to overcome aerodynamic drag follows the cube of velocity:

\[
P_{\text{aero}} = \tfrac{1}{2}\,\rho\,C_d A\,v^3
\]

where \(\rho \approx 1.225\;\text{kg/m}^3\) is air density, \(C_d A\) is your drag area in \(\text{m}^2\), and \(v\) is your speed through the air. Because of that \(v^3\) term, drag grows brutally fast with speed — and at 40 km/h it swamps every other resistance (rolling resistance, drivetrain losses, gravity on flat ground).

A useful rule of thumb: at around 40 km/h, **each 0.01 m² of CdA costs roughly 8 W** for a typical rider. Over a 40km effort, those watts compound into minutes.

## A Worked Example: 40km at Fixed Power

Let's model a 75 kg rider holding a steady 250 W on a flat, windless course at sea level, with a rolling resistance coefficient \(C_{rr} \approx 0.0045\). We vary only the CdA and compute the resulting 40km time.

| CdA (\(\text{m}^2\)) | Typical position | Speed at 250 W | 40km time | Time saved vs. baseline |
|---|---|---|---|---|
| 0.36 | Road bike, hoods, upright | 35.1 km/h | 1:08:16 | — (baseline) |
| 0.32 | Road bike, lower hoods | 36.9 km/h | 1:04:56 | 3:20 |
| 0.30 | Road bike, deep drops | 38.0 km/h | 1:03:10 | 5:06 |
| 0.24 | TT bike, aero bars, optimized | 41.1 km/h | 0:58:24 | **9:52** |
| 0.21 | Elite TT, fully optimized | 43.2 km/h | 0:55:32 | **12:44** |

The takeaway is stark: going from a relaxed road position (\(C_d A = 0.36\)) to a proper time-trial setup (\(C_d A = 0.24\)) saves nearly **10 minutes** over 40km at the same power. That is not a marginal gain — it is the difference between mid-pack and the podium.

## Where the Savings Come From

Rider position is the biggest single lever, typically 70-80% of total drag. But equipment layers on top of that. Here is roughly what each common change is worth at 40 km/h:

| Change | CdA reduction | Watt savings at 40 km/h | 40km time saved |
|---|---|---|---|
| Hoods → TT bars (position) | 0.06-0.10 m² | 50-80 W | 4-7 min |
| Road helmet → aero helmet | 0.005-0.010 m² | 5-15 W | 25-70 s |
| Loose kit → skinsuit | 0.010-0.015 m² | 10-25 W | 50-110 s |
| Shallow → deep wheels (pair) | 0.008-0.015 m² | 10-30 W | 45-110 s |
| Cables & shoe covers (details) | 0.002-0.005 m² | 2-6 W | 10-30 s |

These stack — though not perfectly linearly, because interactions between components matter. A skinsuit matters more in a clean TT position than on upright hoods. For the breakdown of frontal area's role, see [frontal area in cycling drag](/en/blog/frontal-area-cycling-drag).

## The Speed Dependence Trap

A subtle point: aero savings scale with speed cubed, so **the faster you already are, the more each watt of aero is worth in time**. A rider pushing 300 W benefits more from the same CdA reduction than one pushing 200 W, because the faster rider is losing more power to drag each second.

This also means aero improvements are most decisive for stronger riders and on faster courses. On a rolling or hilly 40km where average speed drops below 30 km/h, weight and rolling resistance start to compete — see [aero vs. weight in cycling](/en/blog/aero-vs-weight-cycling) for the crossover gradient (roughly 6-8%).

## How to Capture Those Savings

You cannot manage what you do not measure. The fastest path to a lower CdA is iterative field testing: make one change, ride a controlled loop, and compare. Modern on-bike sensors make this far cheaper than wind-tunnel time. A seat-post mounted sensor with a barometer and IMU can estimate CdA in real time as you ride, letting you A/B-test positions and equipment on the road. (For the full method, see [real-time CdA tracking and field testing](/en/blog/real-time-cda-tracking-field-testing).)

The key principles for capturing time-trial aero gains:

1. **Fix position first.** It is the cheapest and largest gain. Get a professional bike fit on your TT bars.
2. **Then layer equipment.** Helmet, skinsuit, and wheels in roughly that order of bang-for-buck.
3. **Test everything.** Assumptions about what is "aero" are frequently wrong for a given rider.

## FAQ

**How much time does aerodynamics save in a 40km time trial?**
Reducing your CdA by 0.03 m² (roughly the gap between a relaxed road position and an optimized time-trial position) saves about 2 minutes over a 40km time trial at 40 km/h. Larger reductions of 0.05-0.06 m² can save over 3 minutes.

**Is aerodynamics more important than power in a time trial?**
At time-trial speeds (35-45 km/h), aerodynamics usually matters more than raw power. A 5% CdA reduction is typically easier to achieve and more rewarding than a 5% power increase, because aerodynamic drag consumes 80-90% of your total power output.

**What CdA do I need for a fast 40km time trial?**
A good amateur time-trial CdA is 0.22-0.24 m². Elite riders on optimized setups reach 0.19-0.22 m². The lower you go, the faster you ride at the same watts.

**How many watts is one minute over 40km worth?**
At roughly 40 km/h, saving one minute over 40km is equivalent to holding about 15-20 fewer watts for a typical rider, or reducing CdA by about 0.015-0.02 m².

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
