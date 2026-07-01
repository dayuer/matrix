---
slug: intervals-icu-cycling
title: "Intervals.icu for Cycling Training"
metaTitle: "Intervals.icu Cycling Training: Complete Guide"
metaDescription: "Learn how to use Intervals.icu for cycling training analysis. Set zones, track fitness trends, analyze intervals, and sync with your sensor platforms."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "intervals.icu cycling"
pillarSlug: cycling-data-ecosystem-guide
faqJson:
  - question: "Is Intervals.icu free to use?"
    answer: "Intervals.icu offers a generous free tier that covers most individual cyclists, including fitness tracking, interval detection, and basic charts. A paid subscription adds advanced features like multi-sport support, custom metrics, and longer data retention."
  - question: "Does Intervals.icu work with Garmin and Wahoo?"
    answer: "Yes. Intervals.icu auto-syncs from Garmin Connect, Wahoo, Strava, TrainingPeaks, and many other platforms. Once connected, rides appear automatically without manual uploads."
  - question: "How does Intervals.icu calculate fitness and freshness?"
    answer: "Intervals.icu uses Training Stress Score (TSS) from your power data to compute Chronic Training Load (fitness), Acute Training Load (fatigue), and Training Stress Balance (form). These values update automatically as new rides are synced."
  - question: "Can I share my Intervals.icu data with a coach?"
    answer: "Yes. Intervals.icu has built-in coach-athlete sharing. Your coach can view your calendar, analyze rides, and add notes or planned workouts, making it a strong alternative to TrainingPeaks for remote coaching."
---

# Intervals.icu for Cycling Training

Intervals.icu has become the go-to training analysis platform for self-cooked cyclists and data-minded coaches. It combines automatic fitness tracking, smart interval detection, and a clean calendar view—much of it free. This guide walks through setup, core features, and how Intervals.icu fits into a broader [cycling data ecosystem](/en/blog/cycling-data-ecosystem-guide).

## What Makes Intervals.icu Different

Intervals.icu occupies a sweet spot between the simplicity of Strava and the depth of Golden Cheetah. It runs in the browser, requires no installation, and auto-syncs from nearly every popular platform. The interface prioritizes clarity: fitness trends, interval analysis, and weekly volume are visible at a glance.

Standout qualities:

- **Automatic sync** from Garmin, Wahoo, Strava, and more
- **Smart interval detection** that highlights hard efforts
- **Fitness/freshness chart** with TSB overlay
- **Coach sharing** built in
- **Free tier** that satisfies most riders

## Getting Started

### Step 1: Create an Account and Connect Sources

Sign up at [intervals.icu](https://intervals.icu). On first login, connect your primary data source. The most common choice is Garmin Connect, since most modern head units upload there automatically.

| Source | Sync Method | Latency |
|--------|-------------|---------|
| Garmin Connect | OAuth | Minutes |
| Strava | OAuth | Minutes |
| Wahoo | OAuth | Minutes |
| TrainingPeaks | API | Hourly |
| Apple Health | Manual export | Manual |
| FIT/TCX upload | File | Instant |

Once connected, Intervals.icu backfills your historical rides automatically.

### Step 2: Set Your Power and HR Zones

Navigate to **Settings → Zones** and enter your FTP, or use Intervals.icu's auto-detection, which estimates FTP from your recent maximal efforts. Heart rate zones follow similarly.

Accurate zones matter—they drive every downstream metric, from TSS to interval classification.

### Step 3: Configure Your Calendar

The calendar is the home screen. By default it shows each ride with TSS, duration, and intensity. You can toggle to a weekly or monthly view for volume planning.

## Core Features

### Fitness and Freshness Tracking

Intervals.icu computes the classic fitness triad from your power data:

- **Fitness (CTL)** — 42-day weighted average of daily TSS
- **Fatigue (ATL)** — 7-day weighted average of daily TSS
- **Form (TSB)** — Fitness minus Fatigue

The chart overlays all three on a timeline. A positive TSB means you are relatively fresh; a negative TSB means you are carrying fatigue. The platform highlights ideal "form" ranges for different goals (training vs. peak performance).

### Smart Interval Detection

This is where Intervals.icu shines. Every ride is scanned for meaningful efforts, and each detected interval is annotated with power, duration, heart rate, and TSS. You can filter intervals by type—sprint, threshold, VO2max—and compare them across rides.

The detection algorithm groups short bursts into composite efforts, so a set of 5x5-minute threshold repeats shows up as a single structured session rather than five isolated peaks.

### Ride Analysis View

For any individual ride, Intervals.icu shows:

- Power profile with normalized and average power
- Heart rate overlay
- Cadence and gear data (if available)
- Map with gradient-colored segments
- Interval list with per-effort metrics

A built-in power-duration curve for the ride lets you spot where each effort sits relative to your season best.

### Training Plan and Planned Workouts

Intervals.icu supports structured workout planning. You can:

- Import ERG-format workouts
- Drag planned sessions onto the calendar
- Sync planned workouts to Garmin head units for execution
- Compare planned vs. actual intensity after the ride

This makes Intervals.icu viable as a lightweight training planning tool, not just an analysis platform.

## Comparing Intervals.icu to Alternatives

| Feature | Intervals.icu | TrainingPeaks | Golden Cheetah |
|---------|---------------|---------------|----------------|
| Price | Free tier + paid | Subscription only | Free |
| Platform | Web + mobile web | Web + mobile app | Desktop app |
| Interval detection | Automatic | Manual | Manual |
| Coach sharing | Built-in | Built-in | Manual export |
| Offline use | No | No | Yes |
| Custom metrics | Limited (paid) | Limited | Full expression engine |

For a deeper desktop-only analysis tool, see our [Golden Cheetah cycling analysis](/en/blog/golden-cheetah-cycling-analysis) guide. For structured coaching workflows, [TrainingPeaks data sync](/en/blog/trainingpeaks-data-sync) covers that platform.

## Using Intervals.icu With Sensor Streaming Platforms

Intervals.icu ingests standard FIT and TCX files, which means it pairs naturally with platforms that capture high-resolution sensor data. The DIDI.BIKE Developer API, for example, streams raw 6-axis IMU data at 100 Hz via WebSocket and exposes REST endpoints that export sessions as FIT files. At $299, it is a practical way to capture ride data that flows straight into Intervals.icu.

A typical workflow:

1. Record a ride with the DIDI.BIKE sensor streaming active.
2. Use the REST API to export the session as FIT.
3. Upload the FIT file to Intervals.icu (or sync through Garmin Connect if the head unit forwarded the data).

For developers, the [cycling SDK libraries](/en/blog/cycling-sdk-libraries) article covers Python, JavaScript, and Java options for automating this export pipeline.

## Tips for Better Analysis

- **Trust the interval detection.** Review flagged efforts each week rather than re-analyzing every ride manually.
- **Watch the form trend, not daily values.** TSB swings day to day; the 7-day trend is more actionable.
- **Use the compare feature.** Overlay two rides on the same segment to track progress.
- **Tag your rides.** Consistent naming (e.g., "Threshold 4x8") makes filtering and search far more powerful.
- **Review your power-duration curve monthly.** It is the clearest single indicator of fitness changes.

## FAQ

### Is Intervals.icu free to use?
Intervals.icu offers a generous free tier that covers most individual cyclists, including fitness tracking, interval detection, and basic charts. A paid subscription adds advanced features like multi-sport support, custom metrics, and longer data retention.

### Does Intervals.icu work with Garmin and Wahoo?
Yes. Intervals.icu auto-syncs from Garmin Connect, Wahoo, Strava, TrainingPeaks, and many other platforms. Once connected, rides appear automatically without manual uploads.

### How does Intervals.icu calculate fitness and freshness?
Intervals.icu uses Training Stress Score (TSS) from your power data to compute Chronic Training Load (fitness), Acute Training Load (fatigue), and Training Stress Balance (form). These values update automatically as new rides are synced.

### Can I share my Intervals.icu data with a coach?
Yes. Intervals.icu has built-in coach-athlete sharing. Your coach can view your calendar, analyze rides, and add notes or planned workouts, making it a strong alternative to TrainingPeaks for remote coaching.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
