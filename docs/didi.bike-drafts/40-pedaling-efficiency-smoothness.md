---
slug: pedaling-efficiency-smoothness
title: "Pedaling Efficiency and Smoothness Explained"
metaTitle: "Pedaling Efficiency and Smoothness Explained"
metaDescription: "Torque effectiveness and pedaling smoothness quantify how evenly you apply force. Learn what good pedaling efficiency is and how to improve it."
cluster: power-pedaling
isPillar: false
locale: en
focusKeyword: "pedaling efficiency cycling"
pillarSlug: cycling-power-pedaling-guide
faqJson:
  - question: "What is pedaling efficiency in cycling?"
    answer: "Pedaling efficiency describes how effectively a cyclist converts muscular effort into forward propulsion. It is quantified by two metrics: torque effectiveness (propulsive vs. negative force) and pedaling smoothness (how evenly force is applied through the stroke)."
  - question: "What is a good pedaling smoothness value?"
    answer: "Typical pedaling smoothness values range from 10% to 40%. Most amateur riders fall between 10% and 25%. Higher values indicate more even force application. Elite cyclists often achieve 20% to 30% smoothness."
  - question: "What is torque effectiveness in cycling?"
    answer: "Torque effectiveness is the ratio of positive (propulsive) torque to the sum of positive and negative torque over one pedal stroke. A value of 90% means 10% of your effort was wasted opposing the rising pedal. Good values are 80-100%."
  - question: "How can I improve my pedaling efficiency?"
    answer: "Raise cadence to 85-95 rpm, practice single-leg drills to eliminate dead spots, ensure a proper bike fit, and use a sensor that reports torque effectiveness and smoothness so you can get feedback during training."
---

# Pedaling Efficiency and Smoothness Explained

Pedaling efficiency in cycling refers to how effectively you convert muscular effort into forward motion. Two metrics quantify this: **torque effectiveness (TE)**, which measures how much of your force is propulsive versus wasted, and **pedaling smoothness (PS)**, which measures how evenly you apply force throughout the pedal stroke. We break down both metrics, what the numbers mean, and how to improve them.

For the broader context, see [Cycling Power & Pedaling Dynamics: The Complete Guide](/en/blog/cycling-power-pedaling-guide).

## Why Pedaling Efficiency Matters

Force on a bike is not constant. It peaks during the downstroke (roughly 1 o'clock to 5 o'clock) and drops to near zero at the top and bottom dead centers. Some riders even apply negative force — pushing down on the rising pedal — wasting energy. The more even and purely propulsive your force application, the more of your muscular effort goes into moving the bike forward.

Inefficiency has a cost: at the same power output, a jerky pedal stroke recruits muscle fibers less optimally, fatigues them faster, and can strain the knee joint. Smooth, effective pedaling lets you sustain power longer.

## Torque Effectiveness (TE)

Torque effectiveness is the ratio of the average positive (propulsive) torque to the average absolute torque over one crank revolution, expressed as a percentage:

\[ \text{TE} = \frac{\tau_{\text{positive}}}{\tau_{\text{positive}} + |\tau_{\text{negative}}|} \times 100\% \]

If you never apply negative torque, TE is 100%. Every bit of force opposing the rising pedal lowers the value. Most trained cyclists ride at 80–100% TE; values below 70% indicate significant counterproductive force.

| TE range | Interpretation |
|----------|---------------|
| 90–100% | Excellent, minimal wasted force |
| 80–90% | Good |
| 70–80% | Fair, some negative torque |
| < 70% | Poor, significant wasted effort |

TE is strongly affected by cadence. At very low cadence with high torque, riders tend to mash and produce more negative force at the bottom of the stroke. At higher cadence, the force is lighter and more circular.

Related: [Torque Effectiveness and Pedaling](/en/blog/torque-effectiveness-pedaling).

## Pedaling Smoothness (PS)

Pedaling smoothness measures how uniform the instantaneous power is through the pedal stroke:

\[ \text{PS} = \frac{P_{\text{average}}}{P_{\text{max, instantaneous}}} \times 100\% \]

If you applied perfectly constant torque all the way around, PS would be 100%. In reality, force is concentrated in the downstroke, so PS is much lower. Typical values:

| PS range | Interpretation |
|----------|---------------|
| 30–40% | Excellent (elite track sprinters, high cadence) |
| 20–30% | Very good |
| 10–20% | Typical amateur |
| < 10% | Jerky, mash-heavy stroke |

Note that PS is inherently low because of the physics of pedaling — even world-class riders rarely exceed 30–40%. The metric is most useful for tracking relative change and comparing left vs. right legs.

See also: [Left-Right Power Balance](/en/blog/left-right-power-balance).

## How TE and PS Relate

The two metrics describe different aspects of the same stroke:

| Metric | What it captures | Best when... |
|--------|-----------------|--------------|
| Torque Effectiveness | Direction of force (positive vs. negative) | You eliminate negative force |
| Pedaling Smoothness | Distribution of force (peak vs. average) | Force is spread evenly |

You can have high TE with low PS (no negative force, but a peaky downstroke) or high PS with moderate TE (even force, but some of it is negative). The goal is high values on both.

## Measuring Efficiency: What You Need

Traditional strain-gauge power meters report TE and PS for each leg, but only if they are dual-sided. Single-sided meters cannot report per-leg dynamics. Sensor-based systems can also capture these metrics from the motion signature of the crank.

The DIDI.BIKE sensor, for example, uses a 6-axis IMU at 100 \(\text{Hz}\) to derive pedaling dynamics including smoothness and torque effectiveness, with power correlation within ±1.5% and cadence precision of ±0.1°. At 14 \(\text{g}\) and $299, it offers efficiency analysis without a dual-sided crank meter.

| Approach | TE/PS available? | Per-leg? |
|----------|-----------------|----------|
| Single-sided strain gauge | No (total only) | No |
| Dual-sided strain gauge | Yes | Yes |
| IMU sensor (e.g. DIDI.BIKE) | Yes | Estimated |

## How to Improve Pedaling Efficiency

### 1. Raise Your Cadence

Low-cadence mashing produces peaky, jerky force. Riding at 85–95 \(\text{rpm}\) spreads the workload across more revolutions, smoothing the power profile. The same wattage at higher cadence means lower torque per stroke:

\[ \tau = \frac{P}{\omega} \]

So \(250 \ \text{W}\) at 60 \(\text{rpm}\) (\(\omega \approx 6.28\)) requires ~40 \(\text{N·m}\), while at 95 \(\text{rpm}\) (\(\omega \approx 9.95\)) it requires ~25 \(\text{N·m}\).

More on this: [Cadence vs. Power in Cycling](/en/blog/cadence-vs-power-cycling).

### 2. Single-Leg Drills

Ride with one foot unclipped for 30–60 seconds per leg. This forces you to pull through the bottom and over the top of the stroke, eliminating dead spots. It is the single most effective drill for raising TE and PS.

### 3. Bike Fit

A saddle too low or too far back concentrates force in a narrow downstroke window and often introduces negative torque at the bottom. A professional fit can measurably improve both metrics.

### 4. Use Feedback

Train with a device that reports TE and PS in real time. Watching the numbers while you consciously alter your stroke creates a feedback loop that accelerates improvement.

## Should You Chase High Smoothness?

Not blindly. Some elite riders — particularly sprinters — have relatively low PS because their explosive downstroke is so powerful. Smoothness is a tool for efficiency, not an end in itself. If raising your PS from 15% to 22% lets you hold 250 \(\text{W}\) for an extra 10 minutes, it was worth it. If it makes you slower, it was not.

The right use of these metrics is diagnostic: identify gross inefficiencies (low TE from negative force, very low PS from mashing) and address them, then let your natural style emerge.

## Internal Links

- [Cycling Power & Pedaling Dynamics: The Complete Guide](/en/blog/cycling-power-pedaling-guide)
- [Torque Effectiveness and Pedaling](/en/blog/torque-effectiveness-pedaling)
- [Left-Right Power Balance](/en/blog/left-right-power-balance)
- [Cadence vs. Power in Cycling](/en/blog/cadence-vs-power-cycling)

## FAQ

**What is pedaling efficiency in cycling?**
Pedaling efficiency describes how effectively a cyclist converts muscular effort into forward propulsion. It is quantified by two metrics: torque effectiveness (propulsive vs. negative force) and pedaling smoothness (how evenly force is applied through the stroke).

**What is a good pedaling smoothness value?**
Typical pedaling smoothness values range from 10% to 40%. Most amateur riders fall between 10% and 25%. Higher values indicate more even force application. Elite cyclists often achieve 20% to 30% smoothness.

**What is torque effectiveness in cycling?**
Torque effectiveness is the ratio of positive (propulsive) torque to the sum of positive and negative torque over one pedal stroke. A value of 90% means 10% of your effort was wasted opposing the rising pedal. Good values are 80-100%.

**How can I improve my pedaling efficiency?**
Raise cadence to 85-95 rpm, practice single-leg drills to eliminate dead spots, ensure a proper bike fit, and use a sensor that reports torque effectiveness and smoothness so you can get feedback during training.

## References
1. *Sports Medicine*: Biomechanical analysis of force application and pedaling effectiveness.
2. *European Journal of Applied Physiology*: Muscle co-contraction and efficiency in high-torque cycling.
3. *DIDI.BIKE Technical Reprints*: Strain gauge Wheatstone bridge calibration and bottom bracket flex calculations.
