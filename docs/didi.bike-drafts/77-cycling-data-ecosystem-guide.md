---
slug: cycling-data-ecosystem-guide
title: "The Cycling Data Ecosystem: Integrations & API Guide"
metaTitle: "Cycling Data Ecosystem: Integrations & API Guide"
metaDescription: "A complete guide to cycling data integrations: stream sensors to Garmin, Wahoo, and Zwift, sync rides to Strava and TrainingPeaks, and build with the DIDI.BIKE API."
cluster: integrations
isPillar: true
locale: en
focusKeyword: "cycling data integrations"
pillarSlug:
faqJson:
  - question: "What is a cycling data ecosystem?"
    answer: "A cycling data ecosystem is the network of sensors, head units, apps, and APIs that capture, transmit, store, and analyze ride data. It spans real-time protocols like ANT+ and BLE, cloud platforms like Strava, and developer tools for custom analysis."
  - question: "Which protocols does the DIDI.BIKE sensor use?"
    answer: "The DIDI.BIKE sensor broadcasts power, cadence, heart rate, and IMU data over both ANT+ and Bluetooth Low Energy (BLE) 5.0, making it compatible with Garmin, Wahoo, Hammerhead, and Zwift without extra bridges."
  - question: "Can I stream raw sensor data to my own application?"
    answer: "Yes. The DIDI.BIKE Developer API provides WebSocket streaming at 100 Hz, a REST interface for historical queries, and SDKs for Python and JavaScript so you can build custom dashboards and training tools."
  - question: "How much does the DIDI.BIKE sensor cost?"
    answer: "The DIDI.BIKE sensor retails for $299 and includes dual ANT+/BLE 5.0 broadcasting, cloud sync to major training platforms, and access to the Developer API."
  - question: "Does the ecosystem work without internet during a ride?"
    answer: "Yes. Sensor data streams to your head unit over ANT+/BLE in real time regardless of connectivity. Cloud sync to Strava, TrainingPeaks, and other platforms happens after the ride when your device reconnects."
---

# The Cycling Data Ecosystem: Integrations & API Guide

Modern cycling generates more data than ever. Every pedal stroke, heart-beat, and cornering line can be captured, transmitted, and analyzed. This guide maps the full cycling data ecosystem — from the sensors on your bike to the cloud platforms and APIs that turn raw numbers into actionable insight. Whether you stream power to a Garmin Edge, sync rides to Strava, or build custom analysis tools, understanding how the pieces connect helps you get more from every ride.

The DIDI.BIKE sensor sits at the center of this ecosystem. It broadcasts power, cadence, heart rate, and inertial-measurement-unit (IMU) data over both ANT+ and Bluetooth Low Energy (BLE) 5.0, pairs directly with Garmin, Wahoo, and Hammerhead head units, syncs to Strava, TrainingPeaks, Golden Cheetah, and Intervals.icu, and exposes a Developer API with WebSocket 100 Hz streaming, REST endpoints, and SDKs. Priced at $299, it is designed to be the single sensor that feeds every tool in your stack.

## In this guide

This is the pillar for the **integrations** cluster. Each article below dives deep into one connection point:

- [How to Stream Sensor Data to a Garmin Edge](/en/blog/stream-sensor-data-garmin-edge)
- [How to Export and Analyze Rides on Strava](/en/blog/export-ride-data-strava)
- [Wahoo Head Unit Integration Guide](/en/blog/wahoo-head-unit-integration)
- [TrainingPeaks Data Sync Explained](/en/blog/trainingpeaks-data-sync)
- [Zwift and Real-Time Sensor Data](/en/blog/zwift-real-time-sensor-data)
- [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis)
- [Intervals.icu Cycling Analytics](/en/blog/intervals-icu-cycling)
- [Developer API: Raw IMU Data](/en/blog/developer-api-raw-imu-data)
- [Cycling Data Webhooks](/en/blog/cycling-data-webhooks)
- [Cycling SDK Libraries](/en/blog/cycling-sdk-libraries)

## The layers of a cycling data ecosystem

A functioning ecosystem has four layers. Data flows top-down during a ride and bottom-up when you analyze it afterward.

| Layer | What it does | Examples |
|-------|-------------|----------|
| **Capture** | Records physical phenomena as electrical signals | Strain gauges, accelerometers, optical heart-rate sensors |
| **Transmit** | Moves data from sensor to receiver in real time | ANT+, BLE 5.0, Wi-Fi |
| **Process & Store** | Head units log the ride; cloud platforms store it long-term | Garmin Edge, Wahoo ELEMNT, Strava, TrainingPeaks |
| **Analyze & Extend** | Turns raw files into insight and lets developers build on top | Golden Cheetah, Intervals.icu, Developer API, SDKs |

A weak link at any layer limits the whole system. A great sensor with a poor head unit drops packets; a perfect ride file in an app with weak analytics hides the signal inside the noise.

### Layer 1: Capture — what a sensor measures

| Data type | Unit | Typical source | Why it matters |
|-----------|------|---------------|----------------|
| Power | Watts | Strain-gauge power meter | The most objective measure of training load |
| Cadence | rpm | Cadence sensor / crank magnet | Pedaling efficiency and muscular demand |
| Heart rate | bpm | Chest strap / optical sensor | Physiological strain and recovery |
| Speed & distance | km/h, km | Wheel sensor / GPS | Pace and route |
| IMU (accel + gyro) | m/s², °/s | Inertial sensor | Bike handling, cornering, crashes, road surface |
| Gradient | % | Barometric altimeter / GPS | Effort context on climbs |

The DIDI.BIKE sensor bundles power, cadence, heart-rate proxy signals, and a six-axis IMU into one unit, which means one device populates most of the table above.

#### Sampling-rate fundamentals

A sensor's usefulness depends on how often it samples. Power and heart rate change slowly relative to pedaling dynamics, so 1 Hz is acceptable for those channels. IMU data is different: handling events — a sharp swerve, a pothole impact — happen in tens of milliseconds. Nyquist's theorem tells us that to reconstruct an event of frequency $f$ we must sample at least at $2f$.

$$ f_{\text{sample}} \geq 2 f_{\text{signal}} $$

If a road-surface vibration has meaningful content up to 40 Hz, the sensor must sample at 80 Hz or higher to represent it faithfully. This is why the DIDI.BIKE Developer API streams IMU channels at 100 Hz — well above the $2 \times 40 = 80$ Hz minimum for typical road vibrations.

### Layer 2: Transmit — ANT+ vs BLE 5.0

The two dominant real-time protocols are ANT+ and Bluetooth Low Energy. They are not mutually exclusive; the DIDI.BIKE sensor broadcasts on both simultaneously.

| Feature | ANT+ | BLE 5.0 |
|---------|------|---------|
| Topology | Mesh / many-to-many | Star / one-to-many |
| Latency | ~4 Hz typical | Up to 10 Hz (connection interval dependent) |
| Pairing | Device profiles (power, HR, cadence) | GATT services |
| Phone support | Requires ANT+ radio (rare on phones) | Universal on modern phones |
| Head-unit support | Garmin, Wahoo, Hammerhead, Bryton | Wahoo, Hammerhead, Karoo, phones |

The practical takeaway: ANT+ is the reliable backbone for head units, while BLE 5.0 is the bridge to phones, indoor-training apps like Zwift, and custom apps built on the DIDI.BIKE SDK.

### Layer 3: Process & store — head units and cloud platforms

The head unit is the on-bike computer that receives sensor broadcasts, adds GPS and timing, and writes a ride file — almost always a `.fit` file. After the ride, that file is uploaded to one or more cloud platforms.

| Platform | Primary role | Auto-sync from DIDI.BIKE |
|----------|-------------|--------------------------|
| Garmin Connect | Head-unit companion + basic analysis | Via Garmin head unit |
| Strava | Social segments, route discovery | Yes |
| TrainingPeaks | Coach-driven structured planning | Yes |
| Golden Cheetah | Deep, offline analysis (free, open-source) | Manual / API export |
| Intervals.icu | Automated fitness-and-fatigue tracking | Yes |

Auto-sync means the DIDI.BIKE sensor's data reaches the platform without manual export — the ride lands in your account as soon as the head unit or phone reconnects to the internet.

### Layer 4: Analyze & extend — APIs, SDKs, and webhooks

Cloud platforms give you dashboards. The Developer API lets you build your own.

- **WebSocket streaming (100 Hz)** — real-time access to every IMU sample, useful for live handling analysis or a custom heads-up display.
- **REST API** — query historical rides, sessions, and aggregated metrics with standard HTTP requests.
- **SDKs** — Python and JavaScript libraries that wrap the API so you can pull data in a few lines of code.
- **Webhooks** — push notifications when a ride finishes, so your pipeline or coaching tool reacts automatically.

For a hands-on tour, read [Developer API: Raw IMU Data](/en/blog/developer-api-raw-imu-data), [Cycling Data Webhooks](/en/blog/cycling-data-webhooks), and [Cycling SDK Libraries](/en/blog/cycling-sdk-libraries).

## Choosing the right integration path

Your stack depends on what you are trying to achieve. The table below matches common goals to the relevant cluster articles.

| Goal | Start here |
|------|-----------|
| See live power on a Garmin Edge | [Stream Sensor Data to Garmin Edge](/en/blog/stream-sensor-data-garmin-edge) |
| Use a Wahoo ELEMNT or BOLT | [Wahoo Head Unit Integration](/en/blog/wahoo-head-unit-integration) |
| Ride indoors on Zwift | [Zwift and Real-Time Sensor Data](/en/blog/zwift-real-time-sensor-data) |
| Share rides and chase segments | [Export Ride Data to Strava](/en/blog/export-ride-data-strava) |
| Follow a structured training plan | [TrainingPeaks Data Sync](/en/blog/trainingpeaks-data-sync) |
| Do deep, free analysis | [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis) |
| Track fitness over time automatically | [Intervals.icu Cycling](/en/blog/intervals-icu-cycling) |
| Build a custom app or dashboard | [Cycling SDK Libraries](/en/blog/cycling-sdk-libraries) |

## A note on data fidelity

Not all data is equal. A power number that drifts 5% over a season silently corrupts your training metrics — chronic training load (CTL), acute training load (ATL), and training stress balance (TSB) all inherit the error. The ecosystem rewards accuracy at the capture layer. A sensor with a stable calibration curve and high sampling rate on handling channels gives every downstream tool better raw material.

## Getting started

If you are new to the ecosystem, the fastest path is:

1. Mount the DIDI.BIKE sensor.
2. Pair it with whatever head unit you already own — see the Garmin or Wahoo articles.
3. Connect your Strava and TrainingPeaks accounts for automatic sync.
4. When you want more than the dashboards offer, explore the Developer API and SDKs.

Everything else — deep analysis, webhooks, custom coaching tools — builds on that foundation.

## FAQ

**What is a cycling data ecosystem?**
A cycling data ecosystem is the network of sensors, head units, apps, and APIs that capture, transmit, store, and analyze ride data. It spans real-time protocols like ANT+ and BLE, cloud platforms like Strava, and developer tools for custom analysis.

**Which protocols does the DIDI.BIKE sensor use?**
The DIDI.BIKE sensor broadcasts power, cadence, heart rate, and IMU data over both ANT+ and Bluetooth Low Energy (BLE) 5.0, making it compatible with Garmin, Wahoo, Hammerhead, and Zwift without extra bridges.

**Can I stream raw sensor data to my own application?**
Yes. The DIDI.BIKE Developer API provides WebSocket streaming at 100 Hz, a REST interface for historical queries, and SDKs for Python and JavaScript so you can build custom dashboards and training tools.

**How much does the DIDI.BIKE sensor cost?**
The DIDI.BIKE sensor retails for $299 and includes dual ANT+/BLE 5.0 broadcasting, cloud sync to major training platforms, and access to the Developer API.

**Does the ecosystem work without internet during a ride?**
Yes. Sensor data streams to your head unit over ANT+/BLE in real time regardless of connectivity. Cloud sync to Strava, TrainingPeaks, and other platforms happens after the ride when your device reconnects.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
