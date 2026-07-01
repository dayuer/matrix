---
slug: export-ride-data-strava
title: "How to Export and Analyze Rides on Strava"
metaTitle: "Export Ride Data to Strava: Upload & Analyze Guide"
metaDescription: "Upload DIDI.BIKE rides to Strava, auto-sync via Garmin or Wahoo, export .fit files, and analyze power, segments, and training load step by step."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "export ride data strava"
pillarSlug: "cycling-data-ecosystem-guide"
faqJson:
  - question: "How do I get DIDI.BIKE rides onto Strava?"
    answer: "The easiest method is auto-sync: pair the DIDI.BIKE sensor to a Garmin or Wahoo head unit, connect that head unit's account to Strava in Settings > Applications, and rides upload automatically after each ride."
  - question: "What file format does Strava accept?"
    answer: "Strava accepts .fit, .gpx, and .tcx files. The .fit format is preferred because it preserves power, cadence, and heart-rate channels at full resolution."
  - question: "Can I export my ride data out of Strava for offline analysis?"
    answer: "Yes. On any activity page, click the three-dot menu and select Export original to download the original .fit file, or Export GPX for a route-only file. This lets you import the ride into Golden Cheetah or Intervals.icu."
  - question: "Does Strava show power data from the DIDI.BIKE sensor?"
    answer: "Yes. When the ride file includes power samples, Strava renders a power curve, normalized power, intensity factor, and training stress score in the activity analysis view for subscribers."
  - question: "Why is my Strava ride missing power data?"
    answer: "The most common cause is uploading a .gpx file instead of .fit, because .gpx does not carry power. Always upload the original .fit file from the head unit to preserve all sensor channels."
---

# How to Export and Analyze Rides on Strava

Strava is the social and analytical hub for most cyclists, so getting your ride data there cleanly is essential. Whether you want to export ride data to Strava from a DIDI.BIKE sensor via a head unit, upload a file manually, or pull data back out for deeper analysis, We analyze each path with concrete steps.

## The three ways rides reach Strava

| Method | Automation level | Best for |
|--------|-----------------|----------|
| Head-unit auto-sync | Fully automatic | Everyday rides |
| Direct file upload | Manual | Troubleshooting, multi-sensor merges |
| API / webhook push | Programmatic | Teams and custom pipelines |

## Method 1: Auto-sync via a Garmin or Wahoo head unit

This is the zero-touch path and the one most riders should set up first.

1. Pair the DIDI.BIKE sensor to your head unit over ANT+ — see [How to Stream Sensor Data to a Garmin Edge](/en/blog/stream-sensor-data-garmin-edge) or [Wahoo Head Unit Integration Guide](/en/blog/wahoo-head-unit-integration).
2. Create a free Strava account if you do not have one.
3. In the head unit's companion app (Garmin Connect or Wahoo Element Companion), open **Settings → Applications → Strava → Connect**.
4. Authorize the connection.
5. Finish your next ride and sync the head unit to your phone — the ride appears on Strava within minutes.

From this point, every ride uploads automatically. The DIDI.BIKE sensor's power, cadence, and heart-rate channels ride along inside the `.fit` file.

## Method 2: Manual file upload

Use this when a ride did not auto-sync or when you want to upload from a different source.

| Step | Action |
|------|--------|
| 1 | Connect the head unit to a computer via USB, or open the companion app's activity export |
| 2 | Locate the `.fit` file (the Garmin format is `Activity/` inside the device storage) |
| 3 | On Strava, click the **+** (Upload activity) in the top-right |
| 4 | Drag the `.fit` file into the uploader |
| 5 | Add a title, gear, and description, then publish |

Always upload `.fit` rather than `.gpx` if you want power data. The GPX format carries position and elevation but drops power, cadence, and heart rate.

## Method 3: Programmatic push via the API

For teams or coaching pipelines, the DIDI.BIKE Developer API can push completed rides to Strava automatically through webhooks. This avoids manual exports entirely. See [Cycling Data Webhooks](/en/blog/cycling-data-webhooks) for implementation details, and [The Cycling Data Ecosystem Guide](/en/blog/cycling-data-ecosystem-guide) for the architecture.

## Analyzing your ride on Strava

Once the ride is uploaded, Strava's activity analysis view turns the raw `.fit` data into metrics. Key sections:

### Power analysis

If the file contains power data, Strava (subscription) shows:

- **Average power** and **normalized power** — the latter weights hard efforts to reflect physiological cost.
- **Power curve** — your best sustained efforts across durations from 1 second to the ride length.
- **Intensity Factor (IF)** — normalized power divided by FTP, where $\text{IF} = \frac{\text{NP}}{\text{FTP}}$.

### Training load

Strava computes **Training Stress Score (TSS)**, a composite of duration, intensity, and FTP:

$$ \text{TSS} = \frac{\text{duration (s)} \times \text{NP} \times \text{IF}}{\text{FTP} \times 3600} \times 100 $$

Tracking TSS over weeks reveals your fitness trend. For a more automated take on fitness tracking, connect the same account to [Intervals.icu Cycling](/en/blog/intervals-icu-cycling).

### Segments

Segments compare your time on a stretch of road against every other rider. Power data makes segment comparisons meaningful because it explains *why* you were fast or slow on a given day.

## Exporting data back out of Strava

Strava is not a dead end. You can export the original file for offline tools.

1. Open the activity page.
2. Click the **three-dot menu** (•••) on the right.
3. Choose **Export original** to download the `.fit` file.
4. Import that file into Golden Cheetah for deep analysis — see [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis).

This round-trip — sensor to head unit to Strava to Golden Cheetah — is a common workflow for data-driven riders.

## Troubleshooting

**Missing power on Strava**: you uploaded a `.gpx` file. Re-upload the original `.fit` from the head unit.

**Duplicate activities**: if both Garmin Connect and the DIDI.BIKE companion app push the same ride, delete the duplicate and disable one sync path.

**Segment times look wrong**: check that your GPS recording is set to 1-second recording on the head unit; "smart" recording interpolates and can distort segment timing.

## Related articles

- [The Cycling Data Ecosystem: Integrations & API Guide](/en/blog/cycling-data-ecosystem-guide)
- [How to Stream Sensor Data to a Garmin Edge](/en/blog/stream-sensor-data-garmin-edge)
- [TrainingPeaks Data Sync Explained](/en/blog/trainingpeaks-data-sync)
- [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis)

## FAQ

**How do I get DIDI.BIKE rides onto Strava?**
The easiest method is auto-sync: pair the DIDI.BIKE sensor to a Garmin or Wahoo head unit, connect that head unit's account to Strava in Settings > Applications, and rides upload automatically after each ride.

**What file format does Strava accept?**
Strava accepts .fit, .gpx, and .tcx files. The .fit format is preferred because it preserves power, cadence, and heart-rate channels at full resolution.

**Can I export my ride data out of Strava for offline analysis?**
Yes. On any activity page, click the three-dot menu and select Export original to download the original .fit file, or Export GPX for a route-only file. This lets you import the ride into Golden Cheetah or Intervals.icu.

**Does Strava show power data from the DIDI.BIKE sensor?**
Yes. When the ride file includes power samples, Strava renders a power curve, normalized power, intensity factor, and training stress score in the activity analysis view for subscribers.

**Why is my Strava ride missing power data?**
The most common cause is uploading a .gpx file instead of .fit, because .gpx does not carry power. Always upload the original .fit file from the head unit to preserve all sensor channels.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
