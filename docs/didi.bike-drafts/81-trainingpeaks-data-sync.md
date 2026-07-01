---
slug: trainingpeaks-data-sync
title: "TrainingPeaks Data Sync Explained"
metaTitle: "TrainingPeaks Data Sync: Connect DIDI.BIKE & Plan"
metaDescription: "Sync DIDI.BIKE rides into TrainingPeaks via auto-sync or file upload, map power to your FTP, and turn raw data into structured training plans and metrics."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "trainingpeaks data sync"
pillarSlug: "cycling-data-ecosystem-guide"
faqJson:
  - question: "How do I sync DIDI.BIKE rides to TrainingPeaks?"
    answer: "The simplest path is auto-sync: pair the sensor to a Garmin or Wahoo head unit, then connect that device's account (Garmin Connect or Wahoo) to TrainingPeaks under Settings > Account > Sync. Rides flow in automatically after each ride."
  - question: "Does TrainingPeaks support power, cadence, and heart rate from the sensor?"
    answer: "Yes. When the uploaded .fit file includes those channels — which it does when recorded from the DIDI.BIKE sensor — TrainingPeaks displays full power curves, heart-rate zones, and cadence distribution in the activity detail view."
  - question: "What is the difference between TrainingPeaks and Strava for analysis?"
    answer: "Strava is social and segment-focused, while TrainingPeaks is built around structured coaching: planned workouts, the Performance Management Chart (CTL/ATL/TSB), and metrics like normalized power and efficiency factor that drive training decisions."
  - question: "Can a coach see my rides automatically?"
    answer: "Yes. Once your TrainingPeaks account is connected to a coach's account, every synced ride — including power data from the DIDI.BIKE sensor — appears in the coach's dashboard immediately after upload."
  - question: "Why is my trainingpeaks data sync missing the power channel?"
    answer: "The uploaded file is likely a .gpx, which drops power. Re-export the original .fit file from your head unit or companion app and re-upload — TrainingPeaks will then populate the power analysis."
---

# TrainingPeaks Data Sync Explained

TrainingPeaks is the platform of choice for structured, coach-driven training. Syncing your DIDI.BIKE rides into it means every power, cadence, and heart-rate sample lands in a system that turns the data into planned workouts, fitness tracking, and fatigue management. We break down how to set up TrainingPeaks data sync and how to read the metrics it produces.

## Why TrainingPeaks over (or alongside) Strava

| Dimension | Strava | TrainingPeaks |
|-----------|--------|---------------|
| Focus | Social, segments | Coaching, planning |
| Planned workouts | No | Yes, with structured intervals |
| Performance Management Chart | Basic (premium) | Full CTL/ATL/TSB model |
| Coach–athlete sharing | Limited | Native |
| Cost | Free / Premium | Free / Premium |

Many riders run both: Strava for community, TrainingPeaks for the training plan. Because both can pull from the same head-unit account, the DIDI.BIKE sensor feeds both with no extra effort.

## Method 1: Auto-sync through a head-unit account

This is the recommended, hands-off approach.

| Step | Action |
|------|--------|
| 1 | Pair the DIDI.BIKE sensor to your Garmin or Wahoo head unit |
| 2 | Sign in to TrainingPeaks and open **Settings → Account → Devices & Apps** |
| 3 | Find **Garmin Connect** or **Wahoo ELEMNT** and click **Connect** |
| 4 | Authorize the link |
| 5 | Finish a ride and sync the head unit to its companion app — the ride lands in TrainingPeaks within minutes |

From then on, every ride uploads automatically with all sensor channels intact.

## Method 2: Direct file upload

For a ride that did not auto-sync, upload the `.fit` file manually:

1. Export the `.fit` file from the head unit or companion app.
2. In TrainingPeaks, click **+ Add Workout** (top-right calendar).
3. Choose **Upload File** and select the `.fit`.
4. Confirm the date, activity type, and title.

Always use `.fit`. A `.gpx` will import the route but strip the power, cadence, and heart-rate data that TrainingPeaks needs for its analytics.

## Reading the Performance Management Chart

The Performance Management Chart (PMC) is the heart of TrainingPeaks. It models fitness and fatigue from your training load using exponentially weighted moving averages of daily TSS:

$$ \text{CTL} = \text{TSS}_{\text{today}} \cdot \frac{1}{42} + \text{CTL}_{\text{yesterday}} \cdot \left(1 - \frac{1}{42}\right) $$

$$ \text{ATL} = \text{TSS}_{\text{today}} \cdot \frac{1}{7} + \text{ATL}_{\text{yesterday}} \cdot \left(1 - \frac{1}{7}\right) $$

$$ \text{TSB} = \text{CTL} - \text{ATL} $$

Where:

- **CTL (Chronic Training Load)** — fitness, a 42-day weighted average of TSS.
- **ATL (Acute Training Load)** — fatigue, a 7-day weighted average.
- **TSB (Training Stress Balance)** — form, the difference between fitness and fatigue. A slightly negative TSB means you are training hard; a positive TSB means you are tapered and ready to perform.

Accurate TSS depends on accurate power, which is why sensor calibration matters. The DIDI.BIKE sensor's stable wattage keeps your CTL trend honest.

## Setting your zones

TrainingPeaks applies your thresholds to every synced ride. To configure them:

1. Go to **Account → Zones**.
2. Under **Power**, enter your FTP (functional threshold power).
3. Under **Heart Rate**, enter your lactate threshold heart rate (LTHR) or max HR, depending on the model you prefer.
4. Save. Past rides recompute against the new zones automatically.

Revisit these numbers every 4–6 weeks, or whenever you do a fresh FTP test, so the metrics reflect your current fitness.

## Working with a coach

If you have a coach, TrainingPeaks is built for the relationship:

- Your coach builds structured workouts and pushes them to your head unit's calendar (Garmin and Wahoo both support workout sync).
- Your completed rides, with full sensor data, appear on the coach's dashboard automatically.
- The coach adjusts future workouts based on your TSB trend and the power profile of each ride.

No manual file-sharing is required once the accounts are linked.

## Troubleshooting

**Sync stopped working**: in TrainingPeaks, go to **Settings → Devices & Apps** and click **Disconnect**, then **Connect** again to refresh the authorization token.

**Power missing from the activity**: you uploaded a `.gpx` instead of `.fit`. Re-upload the original `.fit` file.

**Duplicate rides**: if both Garmin Connect and the DIDI.BIKE companion app push the same activity, delete the duplicate and disable one source.

For deeper, free analysis outside the TrainingPeaks subscription paywall, export the same rides to Golden Cheetah — see [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis).

## Related articles

- [The Cycling Data Ecosystem: Integrations & API Guide](/en/blog/cycling-data-ecosystem-guide)
- [How to Export and Analyze Rides on Strava](/en/blog/export-ride-data-strava)
- [Intervals.icu Cycling](/en/blog/intervals-icu-cycling)
- [Golden Cheetah Cycling Analysis](/en/blog/golden-cheetah-cycling-analysis)

## FAQ

**How do I sync DIDI.BIKE rides to TrainingPeaks?**
The simplest path is auto-sync: pair the sensor to a Garmin or Wahoo head unit, then connect that device's account (Garmin Connect or Wahoo) to TrainingPeaks under Settings > Account > Sync. Rides flow in automatically after each ride.

**Does TrainingPeaks support power, cadence, and heart rate from the sensor?**
Yes. When the uploaded .fit file includes those channels — which it does when recorded from the DIDI.BIKE sensor — TrainingPeaks displays full power curves, heart-rate zones, and cadence distribution in the activity detail view.

**What is the difference between TrainingPeaks and Strava for analysis?**
Strava is social and segment-focused, while TrainingPeaks is built around structured coaching: planned workouts, the Performance Management Chart (CTL/ATL/TSB), and metrics like normalized power and efficiency factor that drive training decisions.

**Can a coach see my rides automatically?**
Yes. Once your TrainingPeaks account is connected to a coach's account, every synced ride — including power data from the DIDI.BIKE sensor — appears in the coach's dashboard immediately after upload.

**Why is my trainingpeaks data sync missing the power channel?**
The uploaded file is likely a .gpx, which drops power. Re-export the original .fit file from your head unit or companion app and re-upload — TrainingPeaks will then populate the power analysis.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
