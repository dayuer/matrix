---
slug: why-100hz-sampling-rate-matters
title: "Sampling Rate Explained: Why 100Hz Matters"
metaTitle: "Why 100Hz Sampling Rate Matters in Cycling"
metaDescription: "100Hz sampling rate captures pedal strokes, road vibration, and crash events that 1Hz GPS misses. Learn Nyquist theory and why sample frequency matters."
cluster: sensor-telemetry
isPillar: false
locale: en
focusKeyword: "100hz sampling rate cycling"
pillarSlug: "cycling-sensors-telemetry-guide"
faqJson:
  - question: "What does 100Hz sampling rate mean for a cycling sensor?"
    answer: "It means the sensor records 100 measurements per second, or one sample every 10 milliseconds. This is fast enough to capture pedal-stroke harmonics, road vibration, and crash impact pulses that slower sensors miss entirely."
  - question: "Is 1Hz GPS enough for cycling data?"
    answer: "No. 1Hz GPS captures position and speed once per second, missing all high-frequency motion: lean dynamics, vibration, and impacts. It is adequate for route tracking but not for motion or biomechanical analysis."
  - question: "What is the Nyquist rate for cycling sensor data?"
    answer: "The Nyquist rate is twice the highest signal frequency. Road vibration extends to 50Hz, so the Nyquist minimum is 100Hz. Sampling below this causes aliasing—false low-frequency artifacts in the data."
  - question: "Does higher than 100Hz help on a bike?"
    answer: "Marginally. Frequencies above 50Hz on a bicycle are mostly structural resonance and noise, not useful biomechanical information. 100Hz to 200Hz covers the useful spectrum; beyond that returns diminish rapidly."
  - question: "Why does the DIDI.BIKE sensor use 100Hz?"
    answer: "100Hz balances signal fidelity with battery life and data volume. It captures the full useful cycling motion spectrum, produces 8MB of data per 100 minutes for the offline buffer, and keeps transmit bandwidth within ANT+/BLE limits."
---

# Sampling Rate Explained: Why 100Hz Matters

A \(100\text{ Hz}\) sampling rate means a cycling sensor captures 100 data points per second—one measurement every \(10\text{ ms}\). This frequency is not arbitrary. The useful motion spectrum of a bicycle—pedal-stroke harmonics, road vibration, cornering dynamics, and crash pulses—contains energy from sub-1Hz up to roughly \(50\text{ Hz}\). By the Nyquist-Shannon theorem, faithfully reconstructing a \(50\text{ Hz}\) signal requires sampling above \(100\text{ Hz}\). The DIDI.BIKE sensor's \(100\text{ Hz}\) IMU sits at exactly this threshold, which is why 100Hz sampling rate cycling matters for anyone analyzing ride data beyond simple speed and distance.

## What Is Sampling Rate?

Sampling rate is the frequency at which an analog-to-digital converter records measurements from a sensor. Expressed in hertz (samples per second), it determines the temporal resolution and the highest signal frequency the system can represent.

| Sampling Rate | Time Resolution | Captures |
|---|---|---|
| \(1\text{ Hz}\) | \(1000\text{ ms}\) | Position, average speed, gradient |
| \(10\text{ Hz}\) | \(100\text{ ms}\) | Basic acceleration, sprint power spikes |
| \(100\text{ Hz}\) | \(10\text{ ms}\) | Pedal strokes, vibration, lean, crashes |
| \(1000\text{ Hz}\) | \(1\text{ ms}\) | Structural resonance, audio-band analysis |

The relationship between sample rate \(f_s\) and time resolution is:

\[
\Delta t = \frac{1}{f_s}
\]

At \(100\text{ Hz}\), \(\Delta t = 10\text{ ms}\). A crash impact lasting \(50\text{ ms}\) produces five samples—enough to characterize its shape. At \(1\text{ Hz}\), the same crash produces zero samples; it is invisible.

## The Nyquist-Shannon Theorem

The Nyquist-Shannon sampling theorem states that to reconstruct a signal without information loss, the sampling rate must exceed twice the highest frequency component present in the signal:

\[
f_s > 2 \cdot f_{\text{max}}
\]

This critical minimum, \(2 \cdot f_{\text{max}}\), is the Nyquist rate. Sampling below it causes **aliasing**—high-frequency energy folds back into the low-frequency band as false signals. A \(40\text{ Hz}\) road vibration sampled at \(50\text{ Hz}\) aliases to a fictitious \(10\text{ Hz}\) signal in the data, indistinguishable from a real \(10\text{ Hz}\) component.

### Anti-Aliasing Filters

Real systems apply a low-pass filter before sampling to remove energy above \(f_s/2\). The DIDI.BIKE IMU applies hardware filtering to attenuate frequencies above \(50\text{ Hz}\) before the \(100\text{ Hz}\) analog-to-digital conversion, ensuring alias-free data.

## The Cycling Motion Spectrum

What frequencies actually exist on a moving bicycle?

| Phenomenon | Frequency Range | Useful? |
|---|---|---|
| Gradient change | \(0.01\text{–}0.1\text{ Hz}\) | Yes—altitude, power normalization |
| Cornering lean | \(0.5\text{–}3\text{ Hz}\) | Yes—handling analysis |
| Pedal stroke | \(1\text{–}3\text{ Hz}\) fundamental, harmonics to \(15\text{ Hz}\) | Yes—smoothness, efficiency |
| Road vibration | \(5\text{–}50\text{ Hz}\) | Yes—surface classification |
| Frame/fork resonance | \(30\text{–}80\text{ Hz}\) | Partially—structural health |
| Spoke/bearing noise | \(>100\text{ Hz}\) | No—noise for cycling purposes |

The useful biomechanical and road-interaction spectrum tops out around \(50\text{ Hz}\). The Nyquist minimum is therefore \(100\text{ Hz}\), which is exactly where the DIDI.BIKE sensor operates.

## What 1Hz GPS Misses

Most consumer bike computers rely on \(1\text{ Hz}\) GPS. This is sufficient for route tracking and distance but misses everything interesting about motion:

- **Pedal-stroke micro-acceleration**: At 90 rpm cadence, each pedal revolution takes \(667\text{ ms}\). A \(1\text{ Hz}\) sample captures less than two pedal strokes per data point, averaging away the power phase information.
- **Pothole and bump impacts**: A sharp bump lasts \(20\text{–}50\text{ ms}\). At \(1\text{ Hz}\), the sample interval is \(1000\text{ ms}\)—the bump is entirely between samples.
- **Cornering lean rate**: A typical corner entry takes \(1\text{–}2\text{ s}\). At \(1\text{ Hz}\) you get one or two points; at \(100\text{ Hz}\) you get 100–200, enough to map the lean-in and apex.

A \(1\text{ Hz}\) device tells you *that* you rode. A \(100\text{ Hz}\) IMU tells you *how* you rode.

## Data Volume and the 8MB Buffer

Higher sampling rates produce more data. At \(100\text{ Hz}\) with a 6-axis IMU (2 bytes per axis per sample):

\[
\text{Data rate} = 6 \times 2\text{ bytes} \times 100\text{ Hz} = 1{,}200\text{ bytes/s} \approx 69\text{ KB/min}
\]

The DIDI.BIKE sensor's \(8\text{ MB}\) offline buffer therefore holds approximately:

\[
8{,}000\text{ KB} \div 69\text{ KB/min} \approx 116\text{ minutes}
\]

of continuous raw IMU data—enough for a long training ride. This connects to the buffering strategy covered in the broader [Cycling Sensors & Telemetry Guide](/en/blog/cycling-sensors-telemetry-guide).

## Battery Cost of 100Hz

Sampling at \(100\text{ Hz}\) draws more current than \(10\text{ Hz}\) because the ADC, amplifier, and processor wake more often. The DIDI.BIKE sensor manages this with duty-cycling—keeping only the sensing front-end active continuously while the processor wakes in batches to process and transmit. The result is a \(120\text{h}\) battery life at full \(100\text{ Hz}\), detailed further in the context of [Sensor Calibration and Accuracy in Cycling](/en/blog/sensor-calibration-accuracy-cycling).

## Wireless Bandwidth at 100Hz

Streaming \(1{,}200\text{ bytes/s}\) is within the capabilities of both ANT+ and Bluetooth LE 5.0, but not by a large margin on older protocols. This is relevant to the protocol choice discussed in [ANT+ vs Bluetooth LE for Cycling](/en/blog/ant-plus-vs-bluetooth-le-cycling). BLE 5.0's higher PHY throughput (\(2\text{ Mbps}\)) provides comfortable headroom, while ANT+'s shared channel can become saturated if many sensors stream simultaneously.

## Does More Than 100Hz Help?

Frequencies above \(50\text{ Hz}\) on a bicycle are predominantly structural resonance (frame, fork, post) and mechanical noise (bearings, chain). These are not useful for biomechanical or surface analysis. Sampling at \(200\text{ Hz}\) or \(1000\text{ Hz}\) captures this band but:

- Doubles or 10× the data volume, draining the buffer and battery faster
- Adds no actionable cycling insight
- Increases transmit bandwidth requirements

The cycling industry has converged on \(100\text{ Hz}\) as the sweet spot. The DIDI.BIKE sensor's specification reflects this consensus.

## Real-World Example: Pedal-Stroke Analysis

Consider a rider at 90 rpm cadence (\(1.5\text{ Hz}\) fundamental). The power delivered in each stroke is not uniform—there is a peak during the downstroke and a minimum at top and bottom dead center. The harmonics of this power variation extend to roughly \(15\text{ Hz}\).

At \(100\text{ Hz}\), each pedal revolution (\(667\text{ ms}\)) produces 67 samples. This resolves the power phase into roughly \(5^\circ\) angular increments, enough to identify dead spots and asymmetries. At \(10\text{ Hz}\), only 7 samples per revolution remain—too coarse for phase analysis. This is the practical difference that \(100\text{ Hz}\) makes.

## FAQ

**What does 100Hz sampling rate mean for a cycling sensor?**
It means the sensor records 100 measurements per second, or one sample every 10 milliseconds. This is fast enough to capture pedal-stroke harmonics, road vibration, and crash impact pulses that slower sensors miss entirely.

**Is 1Hz GPS enough for cycling data?**
No. 1Hz GPS captures position and speed once per second, missing all high-frequency motion: lean dynamics, vibration, and impacts. It is adequate for route tracking but not for motion or biomechanical analysis.

**What is the Nyquist rate for cycling sensor data?**
The Nyquist rate is twice the highest signal frequency. Road vibration extends to 50Hz, so the Nyquist minimum is 100Hz. Sampling below this causes aliasing—false low-frequency artifacts in the data.

**Does higher than 100Hz help on a bike?**
Marginally. Frequencies above 50Hz on a bicycle are mostly structural resonance and noise, not useful biomechanical information. 100Hz to 200Hz covers the useful spectrum; beyond that returns diminish rapidly.

**Why does the DIDI.BIKE sensor use 100Hz?**
100Hz balances signal fidelity with battery life and data volume. It captures the full useful cycling motion spectrum, produces \(8\text{ MB}\) of data per 100 minutes for the offline buffer, and keeps transmit bandwidth within ANT+/BLE limits.

## References
1. *IEEE Sensors Journal*: Multi-sensor data fusion and attitude estimation using MEMS IMUs.
2. *Journal of NeuroEngineering and Rehabilitation*: Wearable telemetry sensors and realtime posture tracking.
3. *DIDI.BIKE Technical Reprints*: 100Hz IMU sampling rates and Kalman filtering for gravity extraction.
