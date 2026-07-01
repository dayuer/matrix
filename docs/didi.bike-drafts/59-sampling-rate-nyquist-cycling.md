---
slug: sampling-rate-nyquist-cycling
title: "Nyquist and Aliasing: Why Sampling Rate Matters"
metaTitle: "Nyquist Sampling Rate for Cycling Sensors Explained"
metaDescription: "Learn how the Nyquist theorem governs cycling sensor sampling rates, why aliasing corrupts telemetry data, and how a 100 Hz rate captures every relevant cycling motion frequency."
cluster: sensor-telemetry
isPillar: false
locale: en
focusKeyword: "nyquist sampling cycling"
pillarSlug: cycling-sensors-telemetry-guide
faqJson:
  - question: "What is the Nyquist rate in simple terms?"
    answer: "The Nyquist rate is twice the highest frequency present in a signal. To capture a signal accurately you must sample it at least this fast, or the reconstructed data will be corrupted by aliasing."
  - question: "Why does the DIDI.Bike sensor sample at 100 Hz?"
    answer: "At 100 Hz the sensor can faithfully capture signals up to 50 Hz, which covers pedal strokes (1-3 Hz), body movement (under 10 Hz), and road vibration (10-50 Hz). The 2x margin above the highest relevant cycling frequency satisfies the Nyquist criterion."
  - question: "What happens if a sensor samples too slowly?"
    answer: "Frequencies above half the sampling rate fold back into the captured band as false low-frequency signals called aliases. A 150 Hz vibration sampled at 100 Hz would appear as a spurious 50 Hz signal, corrupting road-roughness and cadence analysis."
  - question: "Is a higher sampling rate always better?"
    answer: "Not necessarily. Beyond a certain point, higher rates increase power consumption, storage use, and BLE bandwidth without adding useful information, because there are no cycling-relevant signals above 50 Hz. 100 Hz is the practical sweet spot."
---

# Nyquist and Aliasing: Why Sampling Rate Matters

The **Nyquist-Shannon sampling theorem** is the single most important rule in digital signal processing, and it governs every cycling sensor's ability to capture motion faithfully. In plain terms, to digitize an analog motion signal without losing information, you must sample it at least twice as fast as its highest frequency component. This threshold is the Nyquist rate, written \(f_s = 2f_{\max}\). For cycling telemetry, the relevant motion frequencies top out around 50 Hz, which is why the DIDI.BIKE sensor samples its IMU at 100 Hz — exactly twice that ceiling, satisfying the theorem with margin to spare.

## The Nyquist Theorem in Detail

A continuous signal with a maximum frequency of \(f_{\max}\) can be perfectly reconstructed from discrete samples if and only if the sampling rate \(f_s\) satisfies:

\[
f_s \geq 2f_{\max}
\]

The frequency \(f_s / 2\) is called the **Nyquist frequency** — the highest frequency the sampled system can represent. Any signal content above this limit cannot be captured correctly and instead corrupts the data through a phenomenon called aliasing.

## Aliasing: What Happens When You Sample Too Slowly

Aliasing occurs because, in the discrete domain, a high-frequency sine wave can produce the exact same set of sample points as a lower-frequency sine wave. The sampling process cannot tell them apart. The high-frequency signal "folds" down into the representable band as a phantom low-frequency signal.

The aliased frequency is:

\[
f_{\text{alias}} = |f_{\text{signal}} - n \cdot f_s|
\]

where \(n\) is the integer that brings the result closest to zero. For a concrete cycling example: imagine a rough chip-seal road exciting frame vibration at 150 Hz. If the sensor samples at 100 Hz, the Nyquist frequency is 50 Hz, and the 150 Hz content aliases down to:

\[
f_{\text{alias}} = |150 - 1 \cdot 100| = 50\text{ Hz}
\]

A 150 Hz vibration now masquerades as a 50 Hz signal in the data. A downstream algorithm analyzing surface roughness would misclassify the road, and a cadence detector might flag a false high-rpm event. Aliasing does not merely omit high-frequency detail — it actively injects false information into the frequency band you care about.

### Anti-Aliasing Filters

Engineered sensors prevent aliasing with a hardware **anti-aliasing filter** — a low-pass filter placed before the analog-to-digital converter that attenuates frequencies above the Nyquist limit. The DIDI.BIKE sensor applies such filtering so that residual high-frequency noise never folds into the captured band, keeping the 0-50 Hz motion data clean.

## Cycling Motion Frequencies: A Field Survey

To pick a correct sampling rate you first need to know what frequencies matter in cycling. Decades of sports-engineering research have mapped them:

| Signal source | Frequency range | Example |
|---------------|----------------|---------|
| Cadence (pedal rotation) | 0.5-3 Hz | 90 rpm = 1.5 Hz |
| Steering and body lean | 0.5-5 Hz | Cornering transitions |
| Postural sway and bike wobble | 1-10 Hz | Out-of-saddle sprinting |
| Road surface vibration | 5-50 Hz | Cobbles, chip seal, cracks |
| Impact events (potholes, curbs) | Broadband, energy up to ~50 Hz | Single impulses |
| Frame resonant modes | 20-80 Hz | Carbon layup "buzz" |

The highest frequencies carrying useful cycling information sit around 50 Hz. Frame resonance can extend higher, but those frequencies are typically filtered as noise rather than analyzed as signal. Setting \(f_{\max} = 50\text{ Hz}\) gives a Nyquist rate of \(100\text{ Hz}\).

## Why 100 Hz Is the Cycling Sweet Spot

A 100 Hz sampling rate is the established standard for high-quality cycling IMU telemetry for four converging reasons:

1. **Nyquist compliance**: It captures all motion content up to 50 Hz, covering every cycling-relevant signal in the table above.
2. **Anti-aliasing headroom**: The 50 Hz Nyquist frequency leaves room for the anti-aliasing filter's transition band so it can roll off before the folding point.
3. **Battery and bandwidth efficiency**: Doubling to 200 Hz would double the BLE transmit bandwidth and roughly proportionally increase power draw, with no useful new information because there is nothing above 50 Hz to capture. See our analysis in [sensor power consumption and battery life](/en/blog/sensor-power-consumption-cycling).
4. **Storage economy**: At 100 Hz with 6-axis data, the DIDI.BIKE's 8 MB offline buffer holds roughly hours of ride data. Higher rates would shrink that window — details in [sensor data buffering and offline storage](/en/blog/sensor-data-buffering-offline).

## Aliasing in Practice: A Concrete Example

Consider gradient measurement. The tilt signal of interest changes slowly (under 1 Hz), but the sensor is also subjected to pedal-stroke impulses at ~1.5-3 Hz and road vibration at 10-50 Hz. If the sensor sampled at only 10 Hz, the 10-50 Hz vibration content would alias down into the 0-5 Hz band, contaminating the slow tilt signal. The reported gradient would jitter by several percent on smooth roads. At 100 Hz, those high frequencies are captured cleanly and can be filtered out digitally, leaving a stable ±0.1° gradient reading.

## Practical Guidelines for Choosing a Sampling Rate

If you are evaluating or building a cycling sensor, apply this decision process:

1. Identify the highest signal frequency you need to resolve: for most cycling applications, \(f_{\max} = 50\text{ Hz}\).
2. Set the sampling rate to at least \(2f_{\max}\): \(f_s \geq 100\text{ Hz}\).
3. Add 10-20% margin for the anti-aliasing filter transition band.
4. Confirm the wireless protocol can sustain the data rate over BLE or ANT+. At 100 Hz, 6-axis, 16-bit samples produce about 1.2 KB/s — well within BLE 5.0 capacity. Our [cycling telemetry protocols](/en/blog/cycling-telemetry-protocols) article covers the bandwidth math.

## Latency and Real-Time Considerations

Sampling rate also influences the minimum achievable latency. At 100 Hz a new sample arrives every 10 ms, which sets a hard floor on end-to-end telemetry latency. The DIDI.BIKE sensor holds total round-trip latency under 10 ms by streaming samples immediately rather than batching them, a design choice explored in [latency in cycling telemetry](/en/blog/latency-cycling-telemetry). For the full sensor-system overview, start with the pillar [cycling sensors and telemetry guide](/en/blog/cycling-sensors-telemetry-guide).

## FAQ

**What is the Nyquist rate in simple terms?**
The Nyquist rate is twice the highest frequency present in a signal. To capture a signal accurately you must sample it at least this fast, or the reconstructed data will be corrupted by aliasing.

**Why does the DIDI.Bike sensor sample at 100 Hz?**
At 100 Hz the sensor can faithfully capture signals up to 50 Hz, which covers pedal strokes (1-3 Hz), body movement (under 10 Hz), and road vibration (10-50 Hz). The 2x margin above the highest relevant cycling frequency satisfies the Nyquist criterion.

**What happens if a sensor samples too slowly?**
Frequencies above half the sampling rate fold back into the captured band as false low-frequency signals called aliases. A 150 Hz vibration sampled at 100 Hz would appear as a spurious 50 Hz signal, corrupting road-roughness and cadence analysis.

**Is a higher sampling rate always better?**
Not necessarily. Beyond a certain point, higher rates increase power consumption, storage use, and BLE bandwidth without adding useful information, because there are no cycling-relevant signals above 50 Hz. 100 Hz is the practical sweet spot.

## References
1. *IEEE Sensors Journal*: Multi-sensor data fusion and attitude estimation using MEMS IMUs.
2. *Journal of NeuroEngineering and Rehabilitation*: Wearable telemetry sensors and realtime posture tracking.
3. *DIDI.BIKE Technical Reprints*: 100Hz IMU sampling rates and Kalman filtering for gravity extraction.
