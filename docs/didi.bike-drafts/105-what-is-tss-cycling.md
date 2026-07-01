---
slug: what-is-tss-cycling
title: "What Is TSS (Training Stress Score)?"
metaTitle: "What Is TSS in Cycling? Training Stress Score Explained"
metaDescription: "Training Stress Score (TSS) quantifies the training load of a ride based on intensity and duration. Learn how TSS guides fatigue, fitness, and recovery."
cluster: glossary
isPillar: false
locale: en
focusKeyword: "what is tss cycling"
pillarSlug: cycling-science-glossary
faqJson:
  - question: "What is TSS in cycling?"
    answer: "Training Stress Score (TSS) is a single number that expresses the training load of a workout, combining how intense and how long the ride was relative to your FTP."
  - question: "What is a high TSS ride?"
    answer: "A TSS above 150 is a hard workout, 200–300 is a very demanding day, and races can exceed 300. Recovery rides typically score under 50 TSS."
  - question: "How is TSS calculated?"
    answer: "TSS = (duration in seconds x NP x IF) / (FTP x 3600) x 100, where NP is Normalized Power and IF is Intensity Factor (NP divided by FTP)."
  - question: "What is the difference between TSS and CTL?"
    answer: "TSS is the load of a single workout. CTL (Chronic Training Load) is the rolling average of daily TSS over ~42 days and represents long-term fitness."
---

# What Is TSS (Training Stress Score)?

**Training Stress Score (TSS)** is a single number that quantifies the training load of a ride by combining its duration and intensity relative to your Functional Threshold Power (FTP). A one-hour time trial at exactly FTP scores 100 TSS. Easier rides score lower, and harder or longer rides score higher, giving you a consistent way to track how much stress each workout imposes on your body.

## Why It Matters

TSS turns two raw variables — how long and how hard you rode — into one comparable score. That makes it possible to:

- Track daily and weekly training load over time.
- Estimate fatigue so you can plan recovery.
- Build a training plan with progressive overload.
- Compare very different sessions (a 4-hour endurance ride vs. a 45-minute interval set) on the same scale.

Because TSS is anchored to your [FTP](/en/blog/what-is-ftp-cycling), it stays meaningful even as your fitness changes — provided you re-test and update your FTP.

## How TSS Is Calculated

TSS is derived from Normalized Power (NP), which weights hard efforts more than raw average power, and Intensity Factor (IF), the ratio of NP to FTP:

\[ \text{IF} = \frac{\text{NP}}{\text{FTP}} \]

\[ \text{TSS} = \frac{t \, (\text{s}) \times \text{NP} \times \text{IF}}{\text{FTP} \times 3600} \times 100 \]

where \(t\) is ride duration in seconds. The denominator (FTP × 3600) represents the energy of one hour at threshold, so the formula essentially compares your actual output to that reference hour.

### Worked Example

A 90-minute ride with NP of 220 W at an FTP of 250 W:

- IF = 220 / 250 = 0.88
- TSS = (5400 × 220 × 0.88) / (250 × 3600) × 100 ≈ **116 TSS**

## Typical TSS Values

| Ride type | Approx. TSS | What it implies |
|-----------|------------:|-----------------|
| Recovery ride | 20–50 | Minimal stress, easy spin |
| Endurance ride (2–3 h) | 100–180 | Moderate fatigue, repeatable |
| Hard interval session | 80–130 | High intensity, shorter duration |
| Long endurance ride (4–5 h) | 200–300 | Significant fatigue, needs recovery |
| Race / hard group ride | 150–350+ | Very demanding, multi-day recovery |

Note that TSS alone does not say whether the load came from intensity or volume — a 130-TSS interval workout and a 130-TSS endurance ride stress the body differently, even at the same score.

## TSS, CTL, ATL, and TSB

Individual TSS values feed into the **Performance Management Chart**, which smooths daily load into trends:

| Metric | Full name | Window | Meaning |
|--------|-----------|-------:|---------|
| CTL | Chronic Training Load | ~42 days (rolling avg) | Long-term fitness |
| ATL | Acute Training Load | ~7 days (rolling avg) | Short-term fatigue |
| TSB | Training Stress Balance | CTL − ATL | Form / freshness |

A common strategy is to build CTL over weeks with a controlled surplus of TSS, then shed ATL before a target event so TSB goes positive — you arrive fit but fresh.

## How DIDI.BIKE Handles TSS

The DIDI.BIKE sensor records power, cadence, and speed continuously, and the app computes Normalized Power and TSS for every ride automatically once your FTP is set. You can review per-ride TSS, track weekly load, and watch your CTL/TSB trend update in real time — so you know whether today should be a hard interval day or a recovery spin. Pairing TSS with [cadence](/en/blog/what-is-cadence-cycling) and [torque](/en/blog/what-is-torque-cycling) data lets you see not just how much load you accumulated, but how you produced it.

## Related Terms

- [Cycling Science Glossary](/en/blog/cycling-science-glossary) — the pillar index of all cycling metrics.
- [What Is FTP in Cycling?](/en/blog/what-is-ftp-cycling) — the threshold value TSS is anchored to.
- [What Is a Watt in Cycling?](/en/blog/what-is-a-watt-cycling) — the unit underlying power, NP, and FTP.
- [What Is Cadence in Cycling?](/en/blog/what-is-cadence-cycling) — how leg speed interacts with the intensity TSS captures.

## FAQ

**What is TSS in cycling?**
Training Stress Score (TSS) is a single number that expresses the training load of a workout, combining how intense and how long the ride was relative to your FTP.

**What is a high TSS ride?**
A TSS above 150 is a hard workout, 200–300 is a very demanding day, and races can exceed 300. Recovery rides typically score under 50 TSS.

**How is TSS calculated?**
TSS = (duration in seconds × NP × IF) / (FTP × 3600) × 100, where NP is Normalized Power and IF is Intensity Factor (NP divided by FTP).

**What is the difference between TSS and CTL?**
TSS is the load of a single workout. CTL (Chronic Training Load) is the rolling average of daily TSS over ~42 days and represents long-term fitness.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
