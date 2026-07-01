---
slug: torque-effectiveness-pedaling
title: "Torque Effectiveness and Pedal Smoothness"
metaTitle: "Torque Effectiveness & Pedal Smoothness Explained"
metaDescription: "Torque effectiveness and pedal smoothness reveal how efficiently you deliver power each stroke. Learn what these metrics mean, ideal ranges, and how to improve them."
cluster: power-pedaling
isPillar: false
locale: en
focusKeyword: "torque effectiveness pedaling"
pillarSlug: cycling-power-pedaling-guide
faqJson:
  - question: "What is torque effectiveness in cycling?"
    answer: "Torque effectiveness measures how much of the positive force you apply to the pedal is canceled out by negative (opposing) force during each revolution, expressed as a percentage. A perfect pedal stroke scores 100%."
  - question: "What is a good torque effectiveness score?"
    answer: "Typical torque effectiveness ranges from 60% to 100%. Trained cyclists usually score 90–100% on the positive side, while lower scores indicate the leg is resisting the pedal during the upstroke."
  - question: "What is pedal smoothness in cycling?"
    answer: "Pedal smoothness measures how evenly power is distributed throughout the pedal stroke, calculated as average power divided by peak power within a revolution. A perfectly even stroke scores 100%."
  - question: "Do I need a dual-sided power meter to measure torque effectiveness?"
    answer: "Yes, per-leg torque effectiveness requires a dual-sided pedal or spider power meter that can measure force direction independently for each leg throughout the stroke."
  - question: "Can improving torque effectiveness make me faster?"
    answer: "Modestly. Reducing negative force frees up wasted energy, but gains are usually small (1–3%). The bigger benefit is efficiency and fatigue resistance over long efforts."
---

# Torque Effectiveness and Pedal Smoothness

Torque effectiveness pedaling metrics tell you how cleanly you deliver force to the pedal through every degree of the stroke. While average power tells you *how much* work you did, torque effectiveness (TE) and pedal smoothness (PS) tell you *how well* you did it—whether you are fighting your own leg on the upstroke or letting power sag at the top and bottom dead spots. These two advanced metrics, available from dual-sided power meters, turn raw wattage into a picture of your technique.

For the foundation, read the [power pedaling guide](/en/blog/cycling-power-pedaling-guide) and our overview of [pedaling efficiency and smoothness](/en/blog/pedaling-efficiency-smoothness).

## What Is Torque Effectiveness?

Torque effectiveness measures, for each leg, the ratio of net useful torque to the maximum positive torque applied during a pedal revolution. In plain terms: how much of your pushing is undone by your leg resisting the pedal on the way back up.

The Garmin/ANT+ definition computes two values per leg per revolution:

\[ TE = \frac{P_{avg}}{P_{max+}} \times 100\% \]

where \( P_{avg} \) is the average power over the revolution and \( P_{max+} \) is the peak instantaneous power in the positive (driving) direction. When a leg pushes down hard but also pulls up against the pedal (negative torque), the average drops relative to the peak, lowering TE.

| TE value | Meaning |
|---|---|
| 100% | No negative force; the leg only drives or rests |
| 90–100% | Excellent; typical of trained cyclists |
| 70–90% | Moderate; some upstroke resistance |
| Below 70% | Poor; significant wasted effort |

A TE below 100% does not necessarily mean your pedaling is bad—some riders naturally rest the recovering leg with light contact. But a persistently low TE on one side can reveal a flexibility issue, a cleat setup problem, or fatigue late in a long ride.

## What Is Pedal Smoothness?

Pedal smoothness measures how evenly power is distributed across the full 360 degrees of the stroke. It is defined as:

\[ PS = \frac{P_{avg}}{P_{max}} \times 100\% \]

where \( P_{avg} \) is average power over one revolution and \( P_{max} \) is the peak instantaneous power. A perfectly constant force application (impossible in practice) would score 100%. Real-world values are much lower because the downstroke dominates.

| PS value | Interpretation |
|---|---|
| 20–30% | Typical for road cyclists |
| 30–40% | Smooth, well-trained spin |
| Above 40% | Exceptionally round stroke (rare) |

Note that PS values look low compared to TE—this is expected, because even the smoothest rider still produces far more power on the downstroke than at the dead spots. The goal is not to reach 100%, but to track your own trend over time.

## How the Metrics Are Calculated

Both metrics require a power meter that measures instantaneous tangential force at a high sample rate—typically a dual-sided pedal meter. The meter must resolve force *direction*, not just magnitude, which is why crank-arm and hub meters cannot report TE or PS.

The DIDI.BIKE pedal sensor is built for this: a 6-axis IMU samples at 100 Hz, capturing angular position and acceleration alongside force, which lets the firmware decompose each stroke into directional torque and compute TE and PS per leg. With its 14 g weight, ±1.5% power correlation, and 120-hour battery, it provides these advanced metrics without the weight penalty of traditional dual-sided pedal systems.

For the positional context, see [crank vs pedal vs hub power meter](/en/blog/crank-vs-pedal-vs-hub-power-meter).

## Ideal Ranges and What Affects Them

### Factors that lower TE and PS

| Factor | Effect on TE | Effect on PS |
|---|---|---|
| Fatigue | Drops late in ride | Drops as stroke gets sloppy |
| High cadence | Slightly higher | Lower (less time to push) |
| Low cadence / big gear | Higher | Lower (peakier stroke) |
| Cleat or saddle misalignment | Asymmetric TE | Irregular PS |
| Cold muscles | Lower | Lower |

### Cadence interaction

At very high cadence (110+ rpm), each pedal stroke has less time for force application, so PS tends to drop even though the rider is spinning quickly. At low cadence (60–70 rpm) on a big gear, TE stays high because the rider is purely pushing, but PS also drops because the stroke becomes peakier. The sweet spot for both metrics typically sits around 85–95 rpm for most riders—a range worth exploring if you want to understand your own stroke. Compare this with the relationship in [cadence vs power](/en/blog/cadence-vs-power-cycling).

## How to Improve Torque Effectiveness and Smoothness

### Single-leg drills

Ride with one foot unclipped for 30–60 seconds per leg at a moderate cadence. This forces you to pull through the bottom and over the top of the stroke, training the muscles that normally rest. It directly raises TE by eliminating the dead spots.

### High-cadence spin-ups

Accelerate to your maximum sustainable cadence in a light gear, holding it for 30 seconds. This trains neuromuscular coordination and smoothness without the fatigue of high power.

### Check your position

A saddle that is too high reduces your ability to drive through the bottom of the stroke; a saddle too far back shifts the peak force late in the downstroke. A professional bike fit often improves TE and PS more than any drill.

### Track the trend, not the number

TE and PS vary ride to ride with fatigue, terrain, and intensity. Watch the long-term trend across weeks of similar workouts rather than chasing a single high reading. For how these metrics fit into the broader efficiency picture, see [pedaling efficiency and smoothness](/en/blog/pedaling-efficiency-smoothness).

## FAQ

**What is torque effectiveness in cycling?**
Torque effectiveness measures how much of the positive force you apply to the pedal is canceled out by negative (opposing) force during each revolution, expressed as a percentage. A perfect pedal stroke scores 100%.

**What is a good torque effectiveness score?**
Typical torque effectiveness ranges from 60% to 100%. Trained cyclists usually score 90–100% on the positive side, while lower scores indicate the leg is resisting the pedal during the upstroke.

**What is pedal smoothness in cycling?**
Pedal smoothness measures how evenly power is distributed throughout the pedal stroke, calculated as average power divided by peak power within a revolution. A perfectly even stroke scores 100%.

**Do I need a dual-sided power meter to measure torque effectiveness?**
Yes, per-leg torque effectiveness requires a dual-sided pedal or spider power meter that can measure force direction independently for each leg throughout the stroke.

**Can improving torque effectiveness make me faster?**
Modestly. Reducing negative force frees up wasted energy, but gains are usually small (1–3%). The bigger benefit is efficiency and fatigue resistance over long efforts.

## References
1. *Sports Medicine*: Biomechanical analysis of force application and pedaling effectiveness.
2. *European Journal of Applied Physiology*: Muscle co-contraction and efficiency in high-torque cycling.
3. *DIDI.BIKE Technical Reprints*: Strain gauge Wheatstone bridge calibration and bottom bracket flex calculations.
