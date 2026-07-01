---
slug: how-power-meters-work-strain-gauges
title: "How Power Meters Work: Strain Gauges Explained"
metaTitle: "How Power Meters Work: Strain Gauges Explained"
metaDescription: "Strain gauges measure tiny metal deformation under pedaling torque. Learn how cycling power meters convert that into watts via P = torque x cadence."
cluster: power-pedaling
isPillar: false
locale: en
focusKeyword: "how power meters work"
pillarSlug: cycling-power-pedaling-guide
faqJson:
  - question: "How do strain gauges measure power on a bike?"
    answer: "Strain gauges are thin conductive foils bonded to a crank, pedal, or hub. When the rider applies torque, the metal flexes microscopically, changing the gauge's electrical resistance. The meter measures that resistance change, converts it to torque, and multiplies by cadence to get watts."
  - question: "What is a Wheatstone bridge in a power meter?"
    answer: "A Wheatstone bridge is a four-resistor circuit that converts the tiny resistance change from strain gauges into a measurable voltage. Power meters use it to detect the microstrain from pedaling with enough sensitivity to resolve sub-newton-meter torque."
  - question: "Why does temperature affect power meter accuracy?"
    answer: "Temperature changes the electrical resistance of strain gauges and the mechanical properties of their adhesive and the metal they bond to. This shifts the zero-offset reading. Quality meters auto-compensate; riders should still perform a zero-offset before each ride."
  - question: "How many strain gauges does a power meter use?"
    answer: "Most crank and spider power meters use four strain gauges arranged in a full Wheatstone bridge. Pedal-based meters may use four to eight. More gauges generally improve sensitivity and cancel out unwanted forces like bending."
---

# How Power Meters Work: Strain Gauges Explained

Every traditional cycling power meter relies on the same underlying principle: measure the physical deformation of metal under pedaling load, convert it to torque, and multiply by cadence to get watts. We break down how strain gauges work, the role of the Wheatstone bridge, how the final wattage is computed, and where accuracy can drift.

Start with the overview: [Cycling Power & Pedaling Dynamics: The Complete Guide](/en/blog/cycling-power-pedaling-guide). For the basic definition, see [What Is a Power Meter?](/en/blog/what-is-a-power-meter).

## The Fundamental Equation

Power is torque multiplied by angular velocity:

\[ P = \tau \cdot \omega \]

- \(P\) = power in watts (\(\text{W}\))
- \(\tau\) = torque in newton-meters (\(\text{N·m}\))
- \(\omega\) = angular velocity in radians per second (\(\text{rad/s}\))

Cadence in \(\text{rpm}\) converts to angular velocity:

\[ \omega = \frac{2\pi \cdot \text{cadence}}{60} \]

So a rider at 90 \(\text{rpm}\) has \(\omega \approx 9.42 \ \text{rad/s}\). If the crank experiences 20 \(\text{N·m}\) of average torque, the power is \(P = 20 \times 9.42 \approx 188 \ \text{W}\).

The strain gauge provides the torque half of that equation. Cadence comes from an accelerometer, reed switch, or the gauge signal itself.

## What a Strain Gauge Is

A strain gauge is a thin conductive foil pattern — usually a zig-zag of fine wire — bonded to a structural component like a crank arm. When the component bends or twists under load, the foil stretches or compresses, and its electrical resistance changes.

The relationship is linear and characterized by the **gauge factor** (\(GF\)):

\[ GF = \frac{\Delta R / R}{\epsilon} \]

Where \(\Delta R / R\) is the fractional resistance change and \(\epsilon\) is strain (dimensionless, \(\text{m/m}\)). A typical metal-foil gauge has a gauge factor of about 2.0. The strains involved are tiny — on the order of \(10^{-4}\) to \(10^{-3}\) — so the resistance change is in the range of a few milliohms on a 120 \(\Omega\) or 350 \(\Omega\) gauge.

| Parameter | Typical value |
|-----------|--------------|
| Gauge resistance | 120 \(\Omega\) or 350 \(\Omega\) |
| Gauge factor | ~2.0 |
| Operating strain | \(10^{-4}\)–\(10^{-3}\) |
| Resulting \(\Delta R\) | 0.01–0.1 \(\Omega\) |

## The Wheatstone Bridge: Detecting Microstrain

A resistance change of a few milliohms is far too small to measure directly. Power meters use a **Wheatstone bridge** — a four-resistor circuit that converts small resistance changes into a measurable voltage differential.

With four strain gauges bonded to the crank in a full-bridge configuration, the output voltage \(V_{\text{out}}\) is proportional to strain:

\[ V_{\text{out}} \approx \frac{V_{\text{ex}} \cdot GF \cdot \epsilon}{4} \cdot N \]

Where \(V_{\text{ex}}\) is the excitation voltage and \(N\) accounts for the number of active gauges (up to 4). A full bridge with four active gauges gives four times the sensitivity of a single gauge and automatically cancels temperature effects common to all four elements.

The microcontroller samples \(V_{\text{out}}\), applies the factory **slope calibration** (the conversion factor from volts to \(\text{N·m}\)), and subtracts the **zero-offset** to yield torque:

\[ \tau = (V_{\text{out}} - V_{\text{offset}}) \cdot \text{slope} \]

## From Torque to Watts

Once torque and cadence are known, the meter computes power dozens of times per revolution and reports an averaged figure to the head unit, typically at 1 \(\text{Hz}\). Because force is not constant through the pedal stroke — it peaks in the downstroke and drops at the dead centers — the instantaneous torque \(\tau(\theta)\) varies with crank angle \(\theta\):

\[ P_{\text{avg}} = \frac{1}{2\pi}\int_{0}^{2\pi} \tau(\theta) \cdot \omega \, d\theta \]

The averaged power over one or more revolutions is what smooths out this pulsatile profile into the steady number you see on your display.

For the force-distribution metrics derived from this profile, see [Pedaling Efficiency and Smoothness Explained](/en/blog/pedaling-efficiency-smoothness) and [Torque Effectiveness and Pedaling](/en/blog/torque-effectiveness-pedaling).

## Where Accuracy Can Drift

A strain-gauge power meter is only as accurate as its calibration and its ability to reject environmental effects.

### Zero-Offset Drift

The zero-offset \(V_{\text{offset}}\) is the bridge output when no torque is applied. It drifts with temperature, battery voltage, and mechanical settling. Performing a **manual or auto zero-offset** before every ride tells the meter what "zero torque" looks like under current conditions. Without it, reported power shifts by the offset error times the slope — easily 1–5%.

\[ \tau_{\text{reported}} = \tau_{\text{true}} + (V_{\text{offset,actual}} - V_{\text{offset,stored}}) \cdot \text{slope} \]

Deep dive: [Power Meter Accuracy and Calibration](/en/blog/power-meter-accuracy-calibration).

### Temperature Drift

Temperature changes the resistance of the gauges, the adhesive layer, and the metal substrate. A ride starting at 5 °C and ending at 20 °C can shift the reading noticeably if the meter does not compensate. Quality meters include a temperature sensor and apply correction curves; cheaper units require a mid-ride re-zero. See [Power Meter Temperature Drift](/en/blog/power-meter-temperature-drift).

### Slope Error

The slope calibration converts voltage to torque. It is set at the factory but can shift after a hard impact, crank removal, or gauge aging. Some meters allow user slope recalibration against a known reference weight; most require a return to the manufacturer.

| Drift source | Typical error | Fix |
|-------------|---------------|-----|
| Zero-offset | 1–5% | Pre-ride zero-offset |
| Temperature | 1–3% | Auto-compensation / re-zero |
| Slope | 1–2% | Factory or reference recalibration |
| Battery voltage | < 1% | Regulated internal supply |

## An Alternative: IMU-Based Power Estimation

Not every meter uses strain gauges. The DIDI.BIKE sensor estimates power from motion rather than metal deformation. Its 6-axis IMU samples at 100 \(\text{Hz}\), capturing the angular velocity and acceleration signature of the crank. Combined with a barometric pressure sensor for grade and a model trained against reference strain-gauge meters, it correlates to within ±1.5% of true power while also providing pedaling dynamics (smoothness, torque effectiveness) that traditional meters cannot directly measure.

The trade-off: IMU-based estimation is a model, not a direct force measurement. It is excellent for training and pedaling analysis and slightly less precise than a top-tier strain-gauge spider meter under extreme, rapidly changing loads.

## Internal Links

- [Cycling Power & Pedaling Dynamics: The Complete Guide](/en/blog/cycling-power-pedaling-guide)
- [What Is a Power Meter?](/en/blog/what-is-a-power-meter)
- [Power Meter Accuracy and Calibration](/en/blog/power-meter-accuracy-calibration)
- [Crank vs. Pedal vs. Hub Power Meters](/en/blog/crank-vs-pedal-vs-hub-power-meter)

## FAQ

**How do strain gauges measure power on a bike?**
Strain gauges are thin conductive foils bonded to a crank, pedal, or hub. When the rider applies torque, the metal flexes microscopically, changing the gauge's electrical resistance. The meter measures that resistance change, converts it to torque, and multiplies by cadence to get watts.

**What is a Wheatstone bridge in a power meter?**
A Wheatstone bridge is a four-resistor circuit that converts the tiny resistance change from strain gauges into a measurable voltage. Power meters use it to detect the microstrain from pedaling with enough sensitivity to resolve sub-newton-meter torque.

**Why does temperature affect power meter accuracy?**
Temperature changes the electrical resistance of strain gauges and the mechanical properties of their adhesive and the metal they bond to. This shifts the zero-offset reading. Quality meters auto-compensate; riders should still perform a zero-offset before each ride.

**How many strain gauges does a power meter use?**
Most crank and spider power meters use four strain gauges arranged in a full Wheatstone bridge. Pedal-based meters may use four to eight. More gauges generally improve sensitivity and cancel out unwanted forces like bending.

## References
1. *Sports Medicine*: Biomechanical analysis of force application and pedaling effectiveness.
2. *European Journal of Applied Physiology*: Muscle co-contraction and efficiency in high-torque cycling.
3. *DIDI.BIKE Technical Reprints*: Strain gauge Wheatstone bridge calibration and bottom bracket flex calculations.
