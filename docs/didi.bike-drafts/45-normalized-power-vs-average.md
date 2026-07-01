---
slug: normalized-power-vs-average
title: "Normalized Power vs Average Power"
metaTitle: "Normalized Power vs Average Power: The Difference"
metaDescription: "Normalized power vs average power explained: what NP measures, how it weights high-intensity surges, and why it reflects ride strain better than average."
cluster: power-pedaling
isPillar: false
locale: en
focusKeyword: "normalized power vs average power"
pillarSlug: cycling-power-pedaling-guide
faqJson:
  - question: "What is the difference between normalized power and average power?"
    answer: "Average power is the simple mean of all wattage readings during a ride. Normalized power (NP) is a weighted value that accounts for how variable and intense the ride was, making it a better reflection of physiological strain."
  - question: "Why is normalized power usually higher than average power?"
    answer: "Normalized power raises the influence of hard surges above lactate threshold, because those efforts cost disproportionately more energy and cause more fatigue than steady riding at the same average."
  - question: "When is normalized power equal to average power?"
    answer: "On a perfectly steady ride, such as a flat time trial with constant effort, normalized power approaches average power. The closer the two, the steadier the effort."
  - question: "How is normalized power calculated?"
    answer: "Normalized power takes a 30-second rolling average of power, raises each value to the fourth power, averages those, and takes the fourth root. This fourth-power weighting amplifies hard efforts."
---

# Normalized Power vs Average Power

Average power is the straightforward mean of every wattage reading over a ride. Normalized power (NP) is a specially weighted figure that reflects how hard the ride actually felt by amplifying the cost of intense surges. The gap between the two tells you how variable — and how metabolically expensive — your effort was. Understanding normalized power vs average power is essential for tracking training load accurately, a key concept in the [cycling power pedaling guide](/en/blog/cycling-power-pedaling-guide).

## What Each Metric Means

### Average power

Average power (\(P_{\text{avg}}\)) is the arithmetic mean of instantaneous power over the duration \(T\):

\[ P_{\text{avg}} = \frac{1}{T}\int_0^T P(t)\,dt \]

It treats every watt equally: one minute at 100 W followed by one minute at 300 W averages to 200 W, the same as two steady minutes at 200 W.

### Normalized power

The body does not respond linearly to intensity. Above lactate threshold, the metabolic cost of an effort rises faster than the wattage — a doubling of power more than doubles the strain. Normalized power captures this with a fourth-power weighting. The algorithm, developed by Andrew Coggan:

1. Compute a **30-second rolling average** of power, \(\bar{P}_{30}\).
2. Raise each rolling-average value to the fourth power: \(\bar{P}_{30}^{\,4}\).
3. Average all those fourth-power values over the ride.
4. Take the **fourth root** of the result:

\[ P_{\text{NP}} = \left( \frac{1}{T}\int_0^T \bar{P}_{30}(t)^{\,4}\,dt \right)^{1/4} \]

The fourth-power curve means a 400 W surge contributes vastly more to NP than a 200 W steady stretch, mirroring the real physiological damage of hard efforts.

## Why NP Usually Exceeds Average

Because of the weighting, any ride with surges, attacks, or climbs produces an NP higher than its average power. The two converge only when effort is perfectly steady.

| Ride Type | Avg Power | Normalized Power | Variability |
|---|---|---|---|
| Flat time trial (steady) | 250 W | 252 W | Very low |
| Steady group ride | 180 W | 190 W | Low |
| Rolling hills, paced | 200 W | 230 W | Moderate |
| Criterium race | 220 W | 290 W | High |
| Mountain-bike race | 210 W | 285 W | High |

A criterium with frequent accelerations might show average power of 220 W but NP of 290 W — the rider's legs and lungs experienced something much closer to 290 W in strain, which is why NP is the better number for judging how taxing the race was.

## When to Use Which

### Use average power for

- **Time-trial pacing:** on a steady effort, average power is the number that determines your speed and time.
- **Absolute work and energy:** total kilojoules and energy expenditure derive directly from average power.

### Use normalized power for

- **Training load:** metrics like Training Stress Score (TSS) use NP, not average, because NP reflects actual strain.
- **Comparing variable rides:** a hilly group ride and a steady trainer session at the same average power are not equally hard; NP shows the difference.
- **Intensity factor:** the ratio of NP to FTP (\(\text{IF} = P_{\text{NP}} / \text{FTP}\)) quantifies relative intensity regardless of terrain or stops.

## Variability Index

The ratio of NP to average power is called the **variability index (VI)**:

\[ \text{VI} = \frac{P_{\text{NP}}}{P_{\text{avg}}} \]

| VI Range | Interpretation |
|---|---|
| 1.00 | Perfectly steady (time trial) |
| 1.00–1.05 | Steady-paced endurance |
| 1.05–1.15 | Rolling terrain, group ride |
| 1.15–1.30 | Variable race, crit |
| >1.30 | Highly stochastic (MTB, breaks) |

A well-paced time trial should show VI near 1.00. A criterium routinely exceeds 1.20. Tracking VI helps you understand whether you paced a ride smoothly or burned matches with surges.

## The Accuracy Requirement

Normalized power depends entirely on the quality of the underlying power data. Because the fourth-power weighting amplifies spikes, any erroneous high readings — from a poorly calibrated or drifting sensor — inflate NP dramatically. A sensor with tight [power meter accuracy and calibration](/en/blog/power-meter-accuracy-calibration) is therefore critical. The DIDI.BIKE pedal-based power meter (±1.5\(\%\) power correlation, 6-axis IMU at 100 Hz, 120 h battery) keeps transient readings honest so that NP reflects real effort, not sensor noise.

## Putting It Into Practice

For most training analysis, lead with normalized power. It is the number that feeds into your fitness tracking, tells you how hard a variable ride truly was, and lets you compare efforts across different terrains. Reserve average power for steady-state pacing and energy accounting. Pair both with your [cycling power zones](/en/blog/cycling-power-zones-explained) to see whether the intensity you accumulated landed in the zones you intended.

## FAQ

**What is the difference between normalized power and average power?**
Average power is the simple mean of all wattage readings during a ride. Normalized power (NP) is a weighted value that accounts for how variable and intense the ride was, making it a better reflection of physiological strain.

**Why is normalized power usually higher than average power?**
Normalized power raises the influence of hard surges above lactate threshold, because those efforts cost disproportionately more energy and cause more fatigue than steady riding at the same average.

**When is normalized power equal to average power?**
On a perfectly steady ride, such as a flat time trial with constant effort, normalized power approaches average power. The closer the two, the steadier the effort.

**How is normalized power calculated?**
Normalized power takes a 30-second rolling average of power, raises each value to the fourth power, averages those, and takes the fourth root. This fourth-power weighting amplifies hard efforts.

## References
1. *Sports Medicine*: Biomechanical analysis of force application and pedaling effectiveness.
2. *European Journal of Applied Physiology*: Muscle co-contraction and efficiency in high-torque cycling.
3. *DIDI.BIKE Technical Reprints*: Strain gauge Wheatstone bridge calibration and bottom bracket flex calculations.
