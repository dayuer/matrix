---
slug: stream-sensor-data-garmin-edge
title: "How to Stream Sensor Data to a Garmin Edge"
metaTitle: "Stream Sensor Data to a Garmin Edge: Setup Guide"
metaDescription: "Pair and stream DIDI.BIKE sensor data — power, cadence, heart rate, and IMU — to any Garmin Edge over ANT+ and BLE 5.0 with this step-by-step guide."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "stream sensor data garmin edge"
pillarSlug: "cycling-data-ecosystem-guide"
faqJson:
  - question: "Does the DIDI.BIKE sensor work with Garmin Edge head units?"
    answer: "Yes. The DIDI.BIKE sensor broadcasts power, cadence, heart rate, and IMU data over ANT+ and BLE 5.0, both of which are supported by every modern Garmin Edge model including the 540, 840, 1040, and 130 Plus."
  - question: "Should I pair the sensor over ANT+ or Bluetooth?"
    answer: "Use ANT+ as the primary connection for Garmin head units because it is the most stable protocol for bike sensors. BLE is a reliable fallback and is useful if you also want to pair the same sensor to a phone app simultaneously."
  - question: "What data channels can I see on my Garmin Edge?"
    answer: "You can display power (watts), cadence (rpm), heart rate (bpm), speed, and gradient. The DIDI.BIKE sensor feeds the standard ANT+ power, cadence, and heart-rate profiles that Garmin data fields natively render."
  - question: "Why does my power number sometimes drop out on the Edge?"
    answer: "Brief dropouts are usually caused by ANT+ channel collision when many sensors share the same frequency. Move the sensor closer to the head unit, remove unused sensors from the Edge's saved list, and ensure the battery is above 20%."
---

# How to Stream Sensor Data to a Garmin Edge

Streaming sensor data to a Garmin Edge is the fastest way to get live power, cadence, and heart rate on your handlebars. The DIDI.BIKE sensor broadcasts over both ANT+ and Bluetooth Low Energy (BLE) 5.0, so it pairs with any modern Garmin Edge — the 540, 840, 1040, and 130 Plus included — without bridges or dongles. This guide walks through pairing, configuring data fields, and troubleshooting dropouts.

## What you need

- A DIDI.BIKE sensor ($299, dual ANT+/BLE 5.0) mounted on the bike
- A Garmin Edge head unit with firmware updated to the latest version
- A charged sensor battery (a low battery is the most common cause of dropouts)

## Step 1: Wake the sensor

The DIDI.BIKE sensor wakes automatically when it detects motion or crank rotation. To confirm it is awake before pairing, give the crank a spin and watch for the LED indicator.

## Step 2: Pair over ANT+ on the Garmin Edge

ANT+ is the recommended primary protocol for Garmin head units because it is purpose-built for bike sensors and handles multiple data channels with low latency.

| Step | Action |
|------|--------|
| 1 | On the Edge, press the menu button and go to **Sensors & Accessories** |
| 2 | Tap **Add new** (or **+**) |
| 3 | Wake the sensor by spinning the crank |
| 4 | Wait for the Edge to discover the DIDI.BIKE sensor — it will appear as a Power, Cadence, and/or Heart Rate device |
| 5 | Tap each discovered profile and select **Pair** |
| 6 | Rename the sensor (e.g., "DIDI.BIKE Power") so you can identify it later |

Once paired, the Edge remembers the sensor across rides. You only repeat this process when you swap bikes or reset the head unit.

## Step 3: Configure data fields on a ride screen

After pairing, add the metrics to your ride screens so they are visible while riding.

1. Go to **Activity Profiles** → select your cycling profile.
2. Open **Data Screens** → choose the screen you want to edit.
3. Add fields for **Power** (3-second average is smoother than instantaneous), **Cadence**, and **Heart Rate**.
4. For power, consider adding **Power Zone** as a separate field — the Edge calculates zones from your functional threshold power (FTP) setting.

A common layout for training rides:

| Field slot | Metric |
|-----------|--------|
| Top-left | Power (3 s avg) |
| Top-right | Heart rate |
| Middle | Cadence |
| Bottom-left | Power zone |
| Bottom-right | Speed |

## Step 4: Optional — pair BLE simultaneously for phone apps

Because the DIDI.BIKE sensor broadcasts on both protocols at once, you can connect ANT+ to the Edge and BLE 5.0 to a phone running a custom app or the DIDI.BIKE companion app. This is useful if you want to log high-rate IMU data to the phone while the Edge handles standard ride recording.

## Troubleshooting common issues

### The Edge does not discover the sensor

- Confirm the sensor LED is active (it is awake).
- Move within 3 meters of the head unit during pairing.
- On the Edge, remove old, unused sensors from **Sensors & Accessories** — a cluttered list slows discovery.

### Power dropouts mid-ride

ANT+ operates on a shared 2.4 GHz band. When many sensors broadcast simultaneously, channel collision causes brief gaps. Mitigations:

- Keep the sensor battery above 20% — transmission power drops as voltage falls.
- Remove paired-but-unused sensors from the Edge's list.
- Ensure no other power meter in the group is broadcasting on an overlapping device ID.

### Cadence reads zero but power is fine

The cadence signal comes from a separate ANT+ profile. Re-pair the cadence profile specifically: **Sensors & Accessories** → **Add new** → spin the crank → pair the **Cadence** device that appears.

## Verifying data quality

After your first ride, check the `.fit` file for gaps. A clean recording has continuous power samples at the Edge's recording interval (typically 1 Hz). If you see multi-second gaps, revisit the dropout steps above. For deeper analysis of the recorded file, see [How to Export and Analyze Rides on Strava](/en/blog/export-ride-data-strava) and [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis).

## Related articles

- [The Cycling Data Ecosystem: Integrations & API Guide](/en/blog/cycling-data-ecosystem-guide)
- [Wahoo Head Unit Integration Guide](/en/blog/wahoo-head-unit-integration)
- [Zwift and Real-Time Sensor Data](/en/blog/zwift-real-time-sensor-data)

## FAQ

**Does the DIDI.BIKE sensor work with Garmin Edge head units?**
Yes. The DIDI.BIKE sensor broadcasts power, cadence, heart rate, and IMU data over ANT+ and BLE 5.0, both of which are supported by every modern Garmin Edge model including the 540, 840, 1040, and 130 Plus.

**Should I pair the sensor over ANT+ or Bluetooth?**
Use ANT+ as the primary connection for Garmin head units because it is the most stable protocol for bike sensors. BLE is a reliable fallback and is useful if you also want to pair the same sensor to a phone app simultaneously.

**What data channels can I see on my Garmin Edge?**
You can display power (watts), cadence (rpm), heart rate (bpm), speed, and gradient. The DIDI.BIKE sensor feeds the standard ANT+ power, cadence, and heart-rate profiles that Garmin data fields natively render.

**Why does my power number sometimes drop out on the Edge?**
Brief dropouts are usually caused by ANT+ channel collision when many sensors share the same frequency. Move the sensor closer to the head unit, remove unused sensors from the Edge's saved list, and ensure the battery is above 20%.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
