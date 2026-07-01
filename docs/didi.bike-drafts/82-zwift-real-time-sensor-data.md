---
slug: zwift-real-time-sensor-data
title: "Zwift and Real-Time Sensor Data"
metaTitle: "Zwift Real-Time Sensor Data: Pair DIDI.BIKE Sensor"
metaDescription: "Pair the DIDI.BIKE sensor to Zwift over BLE 5.0 for real-time power and cadence. Setup, connection troubleshooting, and pairing with Zwift Companion."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "zwift real time sensor data"
pillarSlug: "cycling-data-ecosystem-guide"
faqJson:
  - question: "Does the DIDI.BIKE sensor work with Zwift?"
    answer: "Yes. The DIDI.BIKE sensor broadcasts power and cadence over Bluetooth Low Energy 5.0, which Zwift pairs with natively on Windows, Mac, Apple TV, and mobile. No dongle or bridge is required."
  - question: "Should I use ANT+ or Bluetooth to connect to Zwift?"
    answer: "Use Bluetooth. Zwift is designed around BLE for direct sensor pairing. ANT+ works on Windows with an ANT+ USB stick, but BLE is simpler and is the only option on Apple TV and most tablets."
  - question: "What data does Zwift use from the sensor in real time?"
    answer: "Zwift primarily uses power (watts) to drive your avatar's speed, plus cadence for the on-screen readout and spin-scan pedal analysis. Heart rate can also be paired for workout intensity display."
  - question: "Why does my avatar stutter or freeze in Zwift?"
    answer: "Stuttering is usually a Bluetooth signal issue. Keep the sensor close to the receiver, close other BLE apps that may grab the connection, and avoid placing a Wi-Fi router between the trainer and the device."
  - question: "Can I use the DIDI.BIKE sensor for Zwift racing?"
    answer: "Yes. The sensor's real-time power broadcast is suitable for Zwift racing and events. For official racing categories, ensure your setup records power accurately, as Zwift verifies results against the power data."
---

# Zwift and Real-Time Sensor Data

Zwift turns indoor training into a multiplayer world, and the engine that drives your avatar is real-time power data. The DIDI.BIKE sensor pairs directly with Zwift over Bluetooth Low Energy (BLE) 5.0, sending live power and cadence to the app with no bridge or dongle. We analyze pairing, the data channels Zwift actually uses, and how to keep the connection stable during a race.

## How Zwift uses sensor data

Zwift's physics model converts your wattage into avatar speed using your weight, the virtual gradient, and rolling-resistance constants. The relationship is grounded in the power equation for cycling:

$$ P = F_{\text{total}} \cdot v = \left( m g \sin\theta + C_{rr} m g \cos\theta + \tfrac{1}{2} \rho C_d A \, v^{2} + m a \right) v $$

Where $P$ is power, $m$ mass, $g$ gravity, $\theta$ road gradient, $C_{rr}$ rolling resistance coefficient, $\rho$ air density, $C_d A$ drag area, and $v$ and $a$ speed and acceleration. Because power is the dominant input, an accurate, low-latency sensor is what makes Zwift feel responsive.

## What you need

- A DIDI.BIKE sensor ($299) on your bike or trainer
- A Zwift account and a device running Zwift (Windows, Mac, Apple TV, iOS, or Android)
- A trainer (smart or dumb — Zwift works in "zPower" mode with a speed sensor if you lack a smart trainer, but real power from the DIDI.BIKE sensor is more accurate)

## Step 1: Pair the sensor over Bluetooth

Zwift's pairing screen appears when you start a ride.

| Step | Action |
|------|--------|
| 1 | Wake the DIDI.BIKE sensor by spinning the crank or tapping it |
| 2 | In Zwift, click **Menu → Pair** (or it opens automatically at launch) |
| 3 | Under **Power Source**, select the DIDI.BIKE sensor when it appears |
| 4 | Under **Cadence**, select the sensor again (it exposes both profiles over BLE) |
| 5 | Under **Heart Rate**, pair a chest strap if you have one |
| 6 | Click **Done** and enter the game |

Zwift pairs each data type separately, so you may see the DIDI.BIKE sensor listed under several categories. Select it for Power and Cadence.

## Step 2: Verify the connection is live

Once in the world, glance at the top-left HUD:

- **Power** updates within a second of each pedal stroke.
- **Cadence** reflects your rpm.
- **Heart rate** (if paired) tracks your effort.

If power reads zero while you pedal, the sensor may have gone back to sleep. Spin the crank firmly for a few seconds to wake it.

## Step 3: Configure spin-scan and workout screens

Zwift's workout mode uses live cadence and power to guide you through intervals. The spin-scan polar plot, available on the workout screen, visualizes your pedaling smoothness using the rapid cadence and torque samples the DIDI.BIKE sensor streams over BLE.

To enable it:

1. Start a workout (Menu → Training → pick a plan or single workout).
2. During the workout, click the screen icon to switch to the **spin-scan view**.
3. Watch for an even "peanut" shape — a sign of balanced left/right power delivery and smooth pedaling.

## Keeping the connection stable

BLE is line-of-sight and 2.4 GHz, so it shares the band with Wi-Fi. Stability tips:

| Problem | Fix |
|---------|-----|
| Avatar stutters or freezes | Move the device closer to the bike; reduce Bluetooth interference from other devices |
| Power drops to zero briefly | Replace or charge the sensor battery; check for nearby microwave ovens or routers |
| Zwift shows "No Signal" | Quit other apps (TrainerRoad, Rouvy) that may hold the BLE connection |
| Cadence stuck at zero | Re-pair the cadence profile on the pairing screen |

Apple TV is a special case: its Bluetooth radio is relatively weak and supports only a limited number of concurrent connections. If you pair a smart trainer, the DIDI.BIKE sensor, and a heart-rate strap, you may hit the limit. Use the Zwift Companion app on a phone as a bridge for the heart-rate strap if needed.

## Using the DIDI.BIKE sensor with Zwift Companion

The Zwift Companion app (phone) can relay sensor data to the main Zwift device, which is useful when the primary device has a poor Bluetooth range. Pair the DIDI.BIKE sensor to the phone in the Companion app, then let the phone forward data to the Apple TV or tablet over Wi-Fi.

## Racing and verification

Zwift racing categorizes riders by power-to-weight ratio and verifies results using the power file. Because the DIDI.BIKE sensor records every watt, your race results are backed by a defensible data record. After an event, you can export the activity to Strava ([How to Export and Analyze Rides on Strava](/en/blog/export-ride-data-strava)) or into TrainingPeaks ([TrainingPeaks Data Sync Explained](/en/blog/trainingpeaks-data-sync)) for post-race analysis.

## Related articles

- [The Cycling Data Ecosystem: Integrations & API Guide](/en/blog/cycling-data-ecosystem-guide)
- [How to Stream Sensor Data to a Garmin Edge](/en/blog/stream-sensor-data-garmin-edge)
- [Wahoo Head Unit Integration Guide](/en/blog/wahoo-head-unit-integration)
- [TrainingPeaks Data Sync Explained](/en/blog/trainingpeaks-data-sync)

## FAQ

**Does the DIDI.BIKE sensor work with Zwift?**
Yes. The DIDI.BIKE sensor broadcasts power and cadence over Bluetooth Low Energy 5.0, which Zwift pairs with natively on Windows, Mac, Apple TV, and mobile. No dongle or bridge is required.

**Should I use ANT+ or Bluetooth to connect to Zwift?**
Use Bluetooth. Zwift is designed around BLE for direct sensor pairing. ANT+ works on Windows with an ANT+ USB stick, but BLE is simpler and is the only option on Apple TV and most tablets.

**What data does Zwift use from the sensor in real time?**
Zwift primarily uses power (watts) to drive your avatar's speed, plus cadence for the on-screen readout and spin-scan pedal analysis. Heart rate can also be paired for workout intensity display.

**Why does my avatar stutter or freeze in Zwift?**
Stuttering is usually a Bluetooth signal issue. Keep the sensor close to the receiver, close other BLE apps that may grab the connection, and avoid placing a Wi-Fi router between the trainer and the device.

**Can I use the DIDI.BIKE sensor for Zwift racing?**
Yes. The sensor's real-time power broadcast is suitable for Zwift racing and events. For official racing categories, ensure your setup records power accurately, as Zwift verifies results against the power data.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
