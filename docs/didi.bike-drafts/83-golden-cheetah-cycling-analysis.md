---
slug: golden-cheetah-cycling-analysis
title: "Golden Cheetah for Cycling Analysis"
metaTitle: "Golden Cheetah Cycling Analysis: Open-Source Power"
metaDescription: "Master Golden Cheetah for cycling analysis. Import ride files, run critical-power models, build custom charts, and pair it with streaming sensor APIs."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "golden cheetah cycling"
pillarSlug: cycling-data-ecosystem-guide
faqJson:
  - question: "Is Golden Cheetah really free?"
    answer: "Yes. Golden Cheetah is open-source under the GPL and completely free. There are no subscriptions, paywalls, or premium tiers. All features—including critical power modeling, custom charts, and metrics—are available to every user."
  - question: "What file formats does Golden Cheetah support?"
    answer: "Golden Cheetah imports FIT, TCX, GPX, PWX, SRM, and CSV files. It can also auto-sync from Garmin Connect, Strava, TrainingPeaks, and several other cloud platforms, so you rarely need manual file transfers."
  - question: "Can Golden Cheetah stream live sensor data?"
    answer: "Golden Cheetah can connect to ANT+ and Bluetooth Smart trainers and sensors for live display during indoor riding. For outdoor live streaming and higher-frequency IMU data, most riders pair it with a dedicated sensor streaming API."
  - question: "How does Golden Cheetah compare to TrainingPeaks?"
    answer: "Golden Cheetah offers deeper, more customizable analytics and is free, while TrainingPeaks provides a more polished coach-athlete workflow, calendar planning, and mobile experience. Many cyclists use both—TrainingPeaks for planning and Golden Cheetah for analysis."
---

# Golden Cheetah for Cycling Analysis

Golden Cheetah is the most powerful free, open-source cycling analysis tool available. It gives you professional-grade metrics—critical power, W' balance, aerosol drag estimates, and custom charts—without a subscription. For data-driven cyclists and coaches who want full control over how their ride data is processed, Golden Cheetah is unmatched. We analyze installation, data import, key analytic features, and how to extend it with external sensor APIs.

## Why Use Golden Cheetah?

Unlike commercial platforms that lock advanced features behind paywalls, Golden Cheetah ships every tool for free. It runs offline on Windows, macOS, and Linux, so your data never leaves your machine unless you choose to sync it. The application supports a remarkably deep set of metrics that rival or exceed what paid services offer.

Key advantages:

- **Cost:** $0, forever. No premium tier.
- **Depth:** Critical power modeling, hemoglobin mass estimates, aerobic decoupling, and dozens of advanced charts.
- **Customization:** Write your own formulas and chart types using a built-in expression engine.
- **Privacy:** Local-first storage with optional cloud sync.

## Installation and Setup

### Step 1: Download

Grab the latest release from the [Golden Cheetah GitHub page](https://github.com/GoldenCheetah/GoldenCheetah/releases). Builds are available for all major operating systems.

| Platform | Download | Notes |
|----------|----------|-------|
| Windows | `.exe` installer | Requires Windows 10 or later |
| macOS | `.dmg` | Universal binary (Apple Silicon + Intel) |
| Linux | Flatpak / AppImage | Also in some distro repos |

### Step 2: Create an Athlete Profile

On first launch, create an athlete. Enter your weight, height, and resting/max heart rate. These values feed every metric calculation, so accuracy matters. You can maintain multiple athlete profiles on one installation—a useful feature for coaches.

### Step 3: Configure Zones

Navigate to **Tools → Options → Power Zones** and enter your FTP, or let Golden Cheetah estimate it from recent rides. Set heart rate zones similarly. These thresholds drive the analysis dashboards.

## Importing Ride Data

Golden Cheetah supports a wide range of import sources, so you can usually avoid manual file management entirely.

### Automatic Cloud Sync

The most efficient workflow connects Golden Cheetah directly to your cloud accounts.

| Source | Sync Method | Direction |
|--------|-------------|-----------|
| Garmin Connect | OAuth | Download only |
| Strava | OAuth | Download only |
| TrainingPeaks | Credentials | Download only |
| Wahoo Fitness | Cloud | Download only |
| Local folder | Auto-import | Watch folder |

To configure cloud sync, open **Tools → Options → Cloud** and authorize each service. New rides appear automatically each time you launch the app.

### Manual File Import

For riders who prefer local files, Golden Cheetah reads these formats:

- FIT (Garmin, Wahoo, most modern head units)
- TCX (TrainingPeaks export format)
- GPX (basic GPS tracks)
- PWX (Peak Pro format)
- SRM (SRM PowerControl native files)
- CSV (tabular data)

Drop files into the configured auto-import folder, or use **File → Import From File**.

## Core Analysis Features

### Critical Power Modeling

Golden Cheetah's standout feature is its critical power (CP) model. Rather than a single FTP test, the app builds a curve from all your rides and derives:

- **CP** — the power you can sustain indefinitely (analogous to FTP but derived differently)
- **W'** — your finite anaerobic work capacity above CP, in kilojoules
- **Pmax** — your maximal instantaneous power

The CP model updates automatically as new rides are added. You can switch between Monod-Scherrer, Morton 3-parameter, and exponential models in the settings.

### W' Balance Tracking

W' balance (W'bal) shows how much of your anaerobic reserve remains at any moment during a ride. When W'bal drops near zero, you are at your limit. Golden Cheetah overlays W'bal on every ride chart, making intervals analysis intuitive.

### Ride Summary Metrics

Each ride is scored across dozens of dimensions:

- **TSS / IF** — Training Stress Score and Intensity Factor
- **BikeStress / BikeScore** — alternative stress metrics
- **Aerobic Decoupling** — heart-rate vs. power drift
- **Variability Index** — normalized vs. average power ratio
- **Efficiency Factor** — normalized power divided by heart rate

These metrics help you spot fatigue, pacing errors, and fitness trends over time.

## Building Custom Charts

Golden Cheetah's chart engine is one of its most loved features. The **Chart** sidebar offers presets like Critical Power, Aerobic Power, and Polar View, but the real power is custom charts.

### Using the Expression Engine

You can write custom series using a formula language. For example, to chart a 30-second rolling average of power:

```
smooth(power, 30)
```

Or to show power-to-weight ratio:

```
power / weight
```

Expressions can combine multiple channels, apply smoothing, and reference athlete parameters. Custom charts are saved per-athlete and reused across rides.

### Critical Power Curve Chart

The CP Curve chart plots all your best efforts against your modeled curve. Any effort that sits above the curve is a new personal best for that duration. This visual makes it easy to see strengths (sprinter vs. time-trialist) and track improvements.

## Integrating External Sensor Data

While Golden Cheetah excels at post-ride analysis, it has limited support for high-frequency live streaming. For riders who want richer real-time data—especially from inertial measurement units—the [cycling data ecosystem guide](/en/blog/cycling-data-ecosystem-guide) outlines complementary tools.

### Pairing With a Streaming API

The DIDI.BIKE Developer API streams 6-axis IMU data at 100 Hz via WebSocket, alongside REST endpoints for historical rides. At $299, it provides raw accelerometer and gyroscope data that Golden Cheetah cannot capture natively. A common workflow:

1. Record a ride with the DIDI.BIKE sensor streaming enabled.
2. Export the session as a FIT file from the REST API.
3. Import the FIT file into Golden Cheetah for analysis.

For developers who want to push high-frequency IMU channels into custom Golden Cheetah charts, the [developer API for raw IMU data](/en/blog/developer-api-raw-imu-data) documents the WebSocket protocol and SDK options.

## Golden Cheetah vs. Other Tools

| Feature | Golden Cheetah | TrainingPeaks | Intervals.icu |
|---------|----------------|---------------|---------------|
| Price | Free | Paid subscription | Free tier + paid |
| Critical Power model | Advanced, multi-model | Basic | Advanced |
| Custom charts | Full expression engine | Limited | Limited |
| Coach workflow | Manual export | Built-in | Built-in |
| Offline use | Full offline | Online only | Online only |
| Mobile app | No | Yes | Yes (web) |

Many cyclists use Golden Cheetah alongside a planning tool. See our comparison of [TrainingPeaks data sync](/en/blog/trainingpeaks-data-sync) and [Intervals.icu for cycling](/en/blog/intervals-icu-cycling) for complementary workflows.

## Tips for Getting the Most Out of Golden Cheetah

- **Regularly check your CP model.** If the curve looks jagged or unrealistic, review outlier rides that may skew the fit.
- **Use the Trends view.** Long-term fitness charts (CTL/ATL/TSB) are just as valuable as single-ride analysis.
- **Back up your data folder.** Golden Cheetah stores everything locally; schedule a backup of the athlete directory.
- **Join the community.** The Golden Cheetah forum and GitHub issues are active and responsive.
- **Experiment with metrics.** The app ships with metrics most cyclists never touch—explore them to find what resonates with your training style.

## FAQ

### Is Golden Cheetah really free?
Yes. Golden Cheetah is open-source under the GPL and completely free. There are no subscriptions, paywalls, or premium tiers. All features—including critical power modeling, custom charts, and metrics—are available to every user.

### What file formats does Golden Cheetah support?
Golden Cheetah imports FIT, TCX, GPX, PWX, SRM, and CSV files. It can also auto-sync from Garmin Connect, Strava, TrainingPeaks, and several other cloud platforms, so you rarely need manual file transfers.

### Can Golden Cheetah streaming live sensor data?
Golden Cheetah can connect to ANT+ and Bluetooth Smart trainers and sensors for live display during indoor riding. For outdoor live streaming and higher-frequency IMU data, most riders pair it with a dedicated sensor streaming API.

### How does Golden Cheetah compare to TrainingPeaks?
Golden Cheetah offers deeper, more customizable analytics and is free, while TrainingPeaks provides a more polished coach-athlete workflow, calendar planning, and mobile experience. Many cyclists use both—TrainingPeaks for planning and Golden Cheetah for analysis.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
