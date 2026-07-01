---
slug: cycling-telemetry-protocols
title: "Cycling Telemetry Protocols Explained"
metaTitle: "Cycling Telemetry Protocols: ANT+ vs BLE Explained"
metaDescription: "Understand cycling telemetry protocols ANT+ and Bluetooth LE. Compare bandwidth, pairing, power, and multi-sensor support, and learn why modern sensors use both."
cluster: sensor-telemetry
isPillar: false
locale: en
focusKeyword: "cycling telemetry protocols"
pillarSlug: cycling-sensors-telemetry-guide
faqJson:
  - question: "What are the main cycling telemetry protocols?"
    answer: "The two dominant protocols are ANT+ and Bluetooth Low Energy (BLE). ANT+ is the long-standing standard for bike computers and dedicated sport sensors, while BLE is the standard for smartphone pairing. Modern high-end sensors like the DIDI.BIKE support both simultaneously."
  - question: "Can a sensor use ANT+ and Bluetooth at the same time?"
    answer: "Yes. Dual-radio sensors broadcast on both protocols concurrently so a bike computer can connect via ANT+ while a smartphone connects via BLE. The DIDI.BIKE sensor does this using a single chipset that supports both stacks."
  - question: "Which protocol has lower latency for cycling telemetry?"
    answer: "Both can achieve under 10 ms latency for live telemetry when configured for high-frequency streaming. ANT+ has a slight edge in deterministic timing for multi-sensor networks, while BLE 5.0 offers higher peak bandwidth for data-intensive sensors."
  - question: "Do I need ANT+ if I only use a smartphone?"
    answer: "No. If you only pair with a smartphone, Bluetooth LE is sufficient. ANT+ is primarily valuable for compatibility with dedicated bike computers and sport watches that use the ANT+ ecosystem."
---

# Cycling Telemetry Protocols Explained

Cycling telemetry moves from sensor to display over one of two wireless protocols: **ANT+** and **Bluetooth Low Energy (BLE)**. Both operate in the 2.4 GHz ISM band, both are designed for low-power sport applications, and they have coexisted for over a decade. Yet they differ in architecture, pairing model, bandwidth, and ideal use case. Understanding cycling telemetry protocols is essential for choosing sensors and bike computers that interoperate reliably, and it explains why a modern sensor like the DIDI.BIKE broadcasts on both simultaneously. This guide compares the two and shows how a dual-radio sensor serves every rider.

## The Two Dominant Protocols

### ANT+

ANT+ is a multicast wireless protocol built on top of the ANT base protocol, developed by Dynastream (owned by Garmin) and standardized specifically for sport and fitness devices. It has been the de facto cycling standard since the late 2000s. Key characteristics:

- **Multicast topology**: One sensor broadcasts to unlimited receivers simultaneously. A power meter can feed a head unit, a watch, and an app all at once with a single transmission.
- **Ultra-low power**: Designed for coin-cell-powered sensors that run for a year.
- **Standardized device profiles**: Power, cadence, speed, heart rate, and more each have a fixed profile so any ANT+ device works with any ANT+ head unit with zero configuration.
- **Deterministic channel timing**: Each sensor type transmits on a predictable schedule, which keeps multi-sensor networks stable.

### Bluetooth Low Energy (BLE)

BLE is the low-power branch of the Bluetooth standard, managed by the Bluetooth SIG. Since BLE 4.0 it has been ubiquitous in smartphones, which made it the natural choice for phone-paired cycling sensors. Key characteristics:

- **Point-to-point connections**: The classic BLE model is one central (phone) connected to one peripheral (sensor), though BLE 5.0 extended this.
- **GATT profiles**: Cycling-specific profiles (Cycling Speed and Cadence, Cycling Power) standardize data formats, though adoption is less universal than ANT+ profiles.
- **Higher peak bandwidth**: BLE 5.0 can sustain significantly more application throughput than ANT+, which matters for high-data-rate sensors like IMU telemetry streams.
- **Native smartphone support**: Every modern phone has BLE, so no dongle is required.

## Side-by-Side Comparison

| Property | ANT+ | Bluetooth LE (5.0) |
|----------|------|-------------------|
| Topology | Multicast (many receivers) | Point-to-point (one central) |
| Standard body | Dynastream / Garmin | Bluetooth SIG |
| Native smartphone support | No (requires ANT+ chip) | Yes (universal) |
| Typical sport-sensor battery | 1 year on coin cell | Weeks-months on rechargeable |
| Peak application throughput | ~60 KB/s | ~100-200 KB/s |
| Pairing model | Channel ID + device number | Bluetooth bonding |
| Multi-sensor on one receiver | Yes, up to 8 channels typical | Yes, with connection limits |
| Latency (configured for speed) | ~5-15 ms | ~7-15 ms |
| Device profiles | Power, cadence, speed, HR, etc. | CSC, Cycling Power, custom |

## Bandwidth: Why It Matters for Telemetry

A 6-axis IMU at 100 Hz generates roughly 1.2 KB/s of raw data, as computed in our [offline buffering guide](/en/blog/sensor-data-buffering-offline). Both protocols can carry this comfortably, but the headroom differs. ANT+ channels are narrow and optimized for low-rate sport data (a power meter sends 8 bytes every 0.5 s); pushing full IMU telemetry requires either a custom high-rate channel or compression. BLE 5.0's wider PHY modes and larger MTU make high-rate streaming more natural, which is why the DIDI.BIKE sensor uses BLE for its dense live telemetry feed while also broadcasting standard ANT+ profiles for bike-computer compatibility.

## Pairing and Interoperability

The pairing model is where ANT+ and BLE feel most different to a rider.

- **ANT+ pairing** is as simple as selecting the device number on both sensor and head unit. There is no encryption handshake in the classic flow, which trades some security for convenience and universal interoperability. Any ANT+ power meter works with any ANT+ head unit.
- **BLE pairing** uses Bluetooth bonding with encryption. This is more secure but also more fragile: a sensor bonded to one phone may refuse a second phone without unbonding, and OS-level Bluetooth stack bugs cause pairing failures more often than ANT+ channel conflicts.

For riders using a dedicated bike computer, ANT+ is the more reliable path. For riders using a smartphone, BLE is the only path without a dongle. A dual-radio sensor sidesteps the choice entirely.

## Multi-Sensor Networks

A serious training setup may include a power meter, cadence sensor, heart-rate strap, and a telemetry sensor — four devices feeding one head unit. ANT+ was designed for exactly this: each device occupies one channel of the receiver's channel array, and the deterministic scheduling prevents collisions. BLE traditionally struggled with many simultaneous connections, though BLE 5.0 and modern phone stacks handle 4-8 concurrent sensors acceptably. For riders running large sensor arrays, ANT+ remains the more deterministic choice, and our [ANT+ vs BLE comparison](/en/blog/ant-plus-vs-bluetooth-le-cycling) goes deeper on the trade-offs.

## Latency in Practice

Both protocols can be configured for sub-10 ms end-to-end latency, which is the DIDI.BIKE sensor's target for live telemetry. The keys are:

- **Connection interval**: A shorter interval (e.g. 7.5 ms for BLE, or a fast ANT+ channel period) reduces the wait between packet opportunities.
- **No batching**: Stream each sample immediately rather than accumulating a batch.
- **Priority queues**: Ensure live telemetry preempts lower-priority traffic like buffered backlog sync.

The interaction between sampling rate, connection interval, and perceived latency is explored in our [latency in cycling telemetry](/en/blog/latency-cycling-telemetry) article.

## Power Consumption

ANT+ was engineered for coin-cell sensors that run for a year; BLE was engineered for smartphone accessories recharged weekly. In practice both are low enough that the radio is rarely the dominant load in a sensor with an always-on IMU and flash buffer. The DIDI.BIKE sensor's 120-hour battery life is achieved while running both radios concurrently. The full power breakdown is in [sensor power consumption and battery life](/en/blog/sensor-power-consumption-cycling).

## Choosing a Protocol (or Both)

| If you primarily use... | Recommended protocol | Why |
|------------------------|---------------------|-----|
| A dedicated bike computer | ANT+ | Universal compatibility, deterministic multi-sensor |
| A smartphone | BLE | Native support, no dongle |
| Both a bike computer and a phone | Both (dual radio) | No compromises; future-proof |
| A large sensor array (4+ devices) | ANT+ | Channel-based scheduling handles concurrency cleanly |

A dual-radio sensor like the DIDI.BIKE — which broadcasts standard ANT+ profiles for bike-computer compatibility and streams full IMU telemetry over BLE 5.0 for smartphones — is the most flexible design and the direction the industry is moving. For the complete system picture, start with the pillar [cycling sensors and telemetry guide](/en/blog/cycling-sensors-telemetry-guide).

## FAQ

**What are the main cycling telemetry protocols?**
The two dominant protocols are ANT+ and Bluetooth Low Energy (BLE). ANT+ is the long-standing standard for bike computers and dedicated sport sensors, while BLE is the standard for smartphone pairing. Modern high-end sensors like the DIDI.BIKE support both simultaneously.

**Can a sensor use ANT+ and Bluetooth at the same time?**
Yes. Dual-radio sensors broadcast on both protocols concurrently so a bike computer can connect via ANT+ while a smartphone connects via BLE. The DIDI.BIKE sensor does this using a single chipset that supports both stacks.

**Which protocol has lower latency for cycling telemetry?**
Both can achieve under 10 ms latency for live telemetry when configured for high-frequency streaming. ANT+ has a slight edge in deterministic timing for multi-sensor networks, while BLE 5.0 offers higher peak bandwidth for data-intensive sensors.

**Do I need ANT+ if I only use a smartphone?**
No. If you only pair with a smartphone, Bluetooth LE is sufficient. ANT+ is primarily valuable for compatibility with dedicated bike computers and sport watches that use the ANT+ ecosystem.

## References
1. *IEEE Sensors Journal*: Multi-sensor data fusion and attitude estimation using MEMS IMUs.
2. *Journal of NeuroEngineering and Rehabilitation*: Wearable telemetry sensors and realtime posture tracking.
3. *DIDI.BIKE Technical Reprints*: 100Hz IMU sampling rates and Kalman filtering for gravity extraction.
