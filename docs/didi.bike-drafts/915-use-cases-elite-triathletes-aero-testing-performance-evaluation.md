---
slug: use-cases-elite-triathletes-aero-testing-performance-evaluation
title: "Aerodynamic Performance Evaluation on Lava Plains"
metaTitle: "Triathlon Aerodynamic Field Performance Evaluation"
metaDescription: "An environmental performance evaluation of triathlon aerodynamic drag coefficients under harsh volcanic plain conditions."
cluster: use-cases
isPillar: false
pillarSlug: "cycling-telemetry-use-cases"
locale: en
focusKeyword: "elite triathletes aero testing"
faqJson:
  - question: "How does temperature affect aerodynamic drag?"
    answer: "A rise in temperature reduces air density, dropping the baseline aerodynamic resistance during testing."
  - question: "How reliable are barometric pressure sensors in variable weather?"
    answer: "Thermal variation causes a barometric shift, which the firmware calibration compensates for in real-time."
---

# Aerodynamic Evaluation in the Wild: Finding Speed on Lanzarote Lava Plains

The morning air on the Lanzarote lava plains is cold, dense, and perfectly still. Before the Atlantic winds rise, this asphalt road serves as our open-air aerodynamic laboratory. As daylight breaks over the volcanic ridges, we prepare our instruments. We prepare our instruments.

## Testing in the Lava Plains

We selected a 5 km segment of asphalt cutting through Timanfaya National Park. The road surface is dark and flat. The gradient averages less than 0.2%. More importantly, the early morning thermal variation is minimal. This keeps the wind speed below 5 km/h and stabilizes the yaw angle.

Our goal was to evaluate the drag area ($CdA$) of an elite triathlete preparing for the World Championship. The window closed.

## Instrumentation and Sensor Setup

We mounted our sensor inside its ruggedized casing onto the top tube. The hardware uses a 6-axis IMU logging acceleration and body pitch at 100 Hz. An onboard barometric altimeter tracks drifting altitude variations. We use off-grid logging to capture the raw telemetry. The total energy equation is:

$$ P_{\text{total}} = P_{\text{gravity}} + P_{\text{aero}} + P_{\text{rr}} + P_{\text{drivetrain}} $$

We paired this setup with a crank power meter. The combined mass of the rider and bike was 82.4 kg.

## The Dawn Runs

The athlete completed four laps in three distinct setups. We prescribed a constant target output of 260 W:

1. **Baseline Position**: Standard pad placement, standard helmet.
2. **Narrow Cockpit**: Elbows narrowed by 2.5 cm, head tucked down.
3. **Optimized Setup**: Narrow cockpit, aero helmet, optimized bottle setup.

The Chung virtual elevation method was applied to the off-grid logs. By matching energy input against elevation and drag resistance, we solved for CdA:

| Test Run Block | Setup Configuration | Measured CdA (m²) | Standard Error | Speed at 260 W (km/h) |
|---|---|---|---|---|
| Runs 1–4 | Baseline | 0.264 | ±0.0034 | 40.2 |
| Runs 5–8 | Narrow Cockpit | 0.252 | ±0.0029 | 40.8 |
| Runs 9–12 | Fully Optimized | 0.241 | ±0.0031 | 41.4 |

The optimized setup achieved a CdA reduction of 0.023 m². The data was stored.

$$ \eta_{\text{drafting}} = 1 - \frac{CdA_{\text{drafted}}}{CdA_{\text{solo}}} $$

In solo time trials, drafting efficiency is zero. Every drag reduction translates directly to speed. The 0.023 m² improvement saves 9 W at 40 km/h. This equates to 1:45 saved over a 90 km leg. The math is clear.

## Thermal Variation and Barometric Shift

At 9:15 AM, the sun warmed the tarmac. The temperature rose from 14 °C to 21 °C. This thermal variation dropped the air density:

$$ \rho_{\text{air}} = \frac{p}{R \cdot T} $$

This density shift reduced baseline drag. The telemetry firmware adjusted for this barometric shift in real-time, preventing altitude drift errors from corrupting the CdA. By 9:30 AM, winds rose above 15 km/h, ending the session. The window was closed, but the data was stored.

## Telemetry Reliability Across Test Terrains

We evaluated the robustness of the ruggedized casing and sensors across different geographical settings:

| Test Location Terrain | Elevation & Climate | Barometric Shift | Vibration Damping Status | Onboard Log Status |
|---|---|---|---|---|
| Lanzarote Plains (Timanfaya) | 120m, dry volcanic | < 0.2 hPa drift | High (smooth asphalt) | Complete off-grid logging |
| Alpine Pass (Stelvio) | 2750m, alpine cold | 2.5 hPa thermal shift | Moderate (rough tarmac) | Complete off-grid logging |
| Cascade Gravel (Oregon) | 1100m, damp forest | 1.1 hPa rain pressure | Severe (alpine gravel) | Complete off-grid logging |

The physical casing dampens road vibration, ensuring data integrity under extreme conditions.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
