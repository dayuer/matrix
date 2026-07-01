---
slug: cda-vs-crr-cycling
title: "CdA vs Crr: Aerodynamic Drag vs Rolling Resistance"
metaTitle: "CdA vs Crr: Aero Drag vs Rolling Resistance"
metaDescription: "CdA and Crr are the two forces that dominate cycling speed. Learn how they differ, how they scale, and when each one matters more on your rides."
cluster: aerodynamics-cda
isPillar: false
pillarSlug: "cycling-aerodynamics-cda-guide"
locale: en
focusKeyword: "cda vs crr"
faqJson:
  - question: "What is the difference between CdA and Crr?"
    answer: "CdA (drag area, in m²) measures aerodynamic drag and grows with the cube of speed. Crr (coefficient of rolling resistance, dimensionless) measures tire drag and grows roughly linearly with speed. Aero dominates at high speed; rolling dominates at low speed and on rough surfaces."
  - question: "At what speed does aerodynamic drag overtake rolling resistance?"
    answer: "On a smooth flat road with road tires, aero and rolling are roughly equal around 15–20 km/h. Above that, aero pulls ahead and by 40 km/h accounts for roughly 70–80% of total resistance."
  - question: "Should I focus on lowering CdA or Crr first?"
    answer: "For most road and time-trial riding above 25 km/h, lowering CdA yields bigger gains because aero power scales with v³. For slow, rough, or climbing-heavy riding, tire choice and pressure (Crr) can matter more."
  - question: "What is a good Crr value for road cycling tires?"
    answer: "Modern road tires typically have Crr in the range of 0.004–0.006. Premium racing tires on a smooth surface can reach below 0.004, while heavier puncture-resistant tires may be 0.006–0.008."
  - question: "Do wider tires have lower Crr?"
    answer: "Generally yes. At equal pressure a wider tire has a lower Crr because it deforms less, and it can be run at lower pressure without pinch-flatting. The trade-off is a small increase in frontal area, which is negligible at the front wheel compared to the rider."
---

# CdA vs Crr: Aerodynamic Drag vs Rolling Resistance

Every watt you produce on a bike is spent overcoming exactly two rolling-resistance-style forces and air: aerodynamic drag (governed by **CdA**) and rolling resistance (governed by **Crr**), plus gravity when you climb. On flat ground, CdA and Crr are the whole game, and understanding how they differ — and when each dominates — is the key to going faster efficiently. Aero drag scales with the **cube of speed**, rolling resistance scales roughly **linearly** with speed, so the balance shifts dramatically as you ride faster. This article compares the two directly. For definitions, see [what is CdA in cycling](/en/blog/what-is-cda-cycling); for the big picture start with the [aerodynamics & CdA guide](/en/blog/cycling-aerodynamics-cda-guide).

## The Two Forces, Side by Side

Total resistance power on the flat (\(\theta \approx 0\)) is:

\[
P_{\text{total}} = \underbrace{\tfrac{1}{2}\rho C_d A v^3}_{P_{\text{aero}}} + \underbrace{C_{rr} m g v}_{P_{\text{rolling}}}
\]

| Property | Aerodynamic drag (CdA) | Rolling resistance (Crr) |
|---|---|---|
| Symbol | \(C_d A\) | \(C_{rr}\) |
| Units | \(\text{m}^2\) | dimensionless |
| Typical road value | \(0.32\)–\(0.36\ \text{m}^2\) (hoods) | \(0.004\)–\(0.006\) |
| Speed dependence | \(\propto v^3\) | \(\propto v\) |
| Controlled by | Position, helmet, clothing, wheels, frame | Tire, pressure, width, surface, inner tube |
| Dominates | Above ~\(20\ \text{km/h}\) flat | Below ~\(20\ \text{km/h}\), rough roads, climbs |

The cubic-vs-linear scaling is the crux. Double your speed and aero power rises eight-fold; rolling power only doubles. That single fact dictates almost every equipment and position decision in cycling.

## How Each Scales With Speed

Take a typical rider: mass \(m = 80\ \text{kg}\) (rider + bike), CdA \(= 0.35\ \text{m}^2\), \(C_{rr} = 0.005\), \(\rho = 1.225\ \text{kg/m}^3\).

| Speed \((\text{km/h})\) | \(P_{\text{aero}}\) (W) | \(P_{\text{rolling}}\) (W) | Aero share |
|---|---|---|---|
| 10 | ~5 | ~11 | 31% |
| 15 | ~17 | ~16 | 51% |
| 20 | ~40 | ~22 | 65% |
| 25 | ~78 | ~27 | 74% |
| 30 | ~135 | ~33 | 80% |
| 40 | ~320 | ~44 | 88% |

(Values approximate; exact numbers depend on drivetrain losses and real \(\rho\).)

The crossover sits around \(15\)–\(20\ \text{km/h}\). By \(40\ \text{km/h}\), roughly **88% of your flat-road power is air resistance**. This is why a time-triallist chasing seconds obsesses over CdA while a commuter on a city bike barely notices it.

## CdA in More Detail

CdA captures everything aerodynamic: your body shape and size, your equipment, and how you sit on the bike. The rider accounts for **70–80% of total drag**, which is why position is the highest-leverage variable. Typical values:

| Position | CdA \((\text{m}^2)\) |
|---|---|
| Road hoods | \(0.32\)–\(0.36\) |
| Road drops | \(0.28\)–\(0.31\) |
| TT / aero bars | \(0.20\)–\(0.24\) |
| Track | \(0.16\)–\(0.18\) |

Each \(0.01\ \text{m}^2\) cut saves about **8 W at \(40\ \text{km/h}\)**. Learn more in [best aero riding position](/en/blog/best-aero-position-road-cycling) and [frontal area and drag](/en/blog/frontal-area-cycling-drag).

## Crr in More Detail

Crr is the dimensionless coefficient that converts normal force into rolling drag: \(F_{\text{rolling}} = C_{rr} m g\). It is a property of the tire, the inner tube, the pressure, the width, and the surface.

### What lowers Crr

| Factor | Effect on Crr |
|---|---|
| **Smoother tire / supple casing** | Large reduction |
| **Higher pressure** (on smooth surface) | Reduction, up to a point |
| **Wider tire** (at same pressure) | Slight reduction — deforms less |
| **Tubeless vs latex tube** | Reduction vs butyl |
| **Rougher road surface** | Large increase — lower pressure then wins |
| **Heavier puncture belt** | Increase |

Modern road racing tires land around \(C_{rr} = 0.004\)–\(0.005\) on smooth asphalt; training or puncture-resistant tires can be \(0.006\)–\(0.008\). For the full picture, see [tire pressure, width, and rolling resistance](/en/blog/tire-pressure-width-rolling-resistance).

A useful rule: a \(0.001\) drop in Crr saves roughly \(5\)–\(6\ \text{W}\) at \(40\ \text{km/h}\) for an \(80\ \text{kg}\) system. That is real, but smaller than the \(8\ \text{W}\) per \(0.01\ \text{m}^2\) you get from CdA — and Crr is much harder to push past the floor set by your tire choice.

## When CdA Wins

On flat to rolling terrain at typical riding speeds (\(>25\ \text{km/h}\)), aero is the bigger lever by a wide margin. A handful of common upgrades and their rough watt costs at \(40\ \text{km/h}\):

| Change | Approx. watts saved |
|---|---|
| TT position vs road hoods | 60–100 W |
| Aero helmet | 5–15 W |
| Skinsuit vs jersey + shorts | 10–25 W |
| Deep-section wheels | 10–30 W |

Stacking a better position with a helmet and clothing can easily save 50+ W — more than any tire swap will ever return. See [CdA, watts saved by position](/en/blog/cda-watts-saved-position) and [aero helmets: are they faster](/en/blog/aero-helmets-faster-cycling).

## When Crr Wins

Rolling resistance takes over in three situations:

1. **Slow speeds** — below ~\(15\)–\(20\ \text{km/h}\), rolling is comparable to or larger than aero. This includes steep climbs, headwind grinds, and technical off-road.
2. **Rough surfaces** — chip-seal, gravel, and cobbles multiply Crr dramatically. Here, lowering pressure (which raises Crr on smooth tarmac) actually *lowers* it because the bike stops vibrating over every bump.
3. **Climbing** — on steep grades gravity dominates everything, but among the resistance forces Crr matters more than aero because speeds are low. See [aero vs weight in cycling](/en/blog/aero-vs-weight-cycling).

## The Climb Crossover: Aero vs Weight vs Crr

On a climb, gravity (\(m g v \sin\theta\)) enters the equation. The **aero-vs-weight crossover** sits around \(6\)–\(8\%\) gradient: below that, lower CdA still wins; above it, less mass (and the lower speed that comes with it) makes Crr and gravity the priority. Tire choice (Crr) matters throughout but is most felt when speeds are low and the road is rough.

## Practical Priorities

| If you ride… | Prioritise |
|---|---|
| Flat TT / triathlon | CdA above all (position, aero bars, skinsuit, helmet, wheels) |
| Road racing, flat | CdA first, then Crr (good tires, sensible pressure) |
| Climbing events | Weight, then Crr, then CdA |
| Gravel / rough roads | Crr (pressure, width), then CdA at race speed |
| Commuting / touring | Crr (durability) and comfort |

## Measuring Both

Field testing can solve for CdA and Crr simultaneously if you gather data at multiple speeds (the linear-regression method described in [how to measure CdA without a wind tunnel](/en/blog/measure-cda-without-wind-tunnel)). For Crr specifically, drum-test databases (Bicycle Rolling Resistance) give you per-tire numbers so you don't have to guess. And a barometric, IMU-equipped aero sensor can separate aero from rolling in real time by combining virtual-elevation analysis with gradient data — useful when you want to know whether your new tires actually helped or your new position did.

## FAQ

**What is the difference between CdA and Crr?**
CdA (drag area, in m²) measures aerodynamic drag and grows with the cube of speed. Crr (coefficient of rolling resistance, dimensionless) measures tire drag and grows roughly linearly with speed. Aero dominates at high speed; rolling dominates at low speed and on rough surfaces.

**At what speed does aerodynamic drag overtake rolling resistance?**
On a smooth flat road with road tires, aero and rolling are roughly equal around 15–20 km/h. Above that, aero pulls ahead and by 40 km/h accounts for roughly 70–80% of total resistance.

**Should I focus on lowering CdA or Crr first?**
For most road and time-trial riding above 25 km/h, lowering CdA yields bigger gains because aero power scales with v³. For slow, rough, or climbing-heavy riding, tire choice and pressure (Crr) can matter more.

**What is a good Crr value for road cycling tires?**
Modern road tires typically have Crr in the range of 0.004–0.006. Premium racing tires on a smooth surface can reach below 0.004, while heavier puncture-resistant tires may be 0.006–0.008.

**Do wider tires have lower Crr?**
Generally yes. At equal pressure a wider tire has a lower Crr because it deforms less, and it can be run at lower pressure without pinch-flatting. The trade-off is a small increase in frontal area, which is negligible at the front wheel compared to the rider.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
