---
slug: glossary-coefficient-of-rolling-resistance-crr-mathematical-calculation
title: "Mathematical Calculation of Rolling Resistance Crr"
metaTitle: "Rolling Resistance Crr Mathematical Calculation"
metaDescription: "Calculate the coefficient of rolling resistance crr mathematically to refine target wattage and optimize glycogen sparing."
cluster: glossary
isPillar: false
pillarSlug: "cycling-science-glossary"
locale: en
focusKeyword: "coefficient of rolling resistance crr"
faqJson:
  - question: "How does an elevated rolling resistance coefficient impact glycogen sparing?"
    answer: "High Crr demands higher mechanical power, forcing the body to rely more on anaerobic carbohydrate combustion rather than aerobic fat oxidation."
  - question: "Why is the Respiratory Exchange Ratio RER useful in training calculation?"
    answer: "RER quantifies the ratio of carbon dioxide produced to oxygen consumed, allowing coaches to measure substrate oxidation at target wattages."
---

# Mathematical Calculation of Coefficient of Rolling Resistance Crr

## Calculating the Energy Cost of Friction

To build a world-class aerobic engine, you must understand the physical constraints acting on your body. In professional exercise physiology and competitive cycling, the **Coefficient of Rolling Resistance Crr** serves as a core diagnostic metric. Coaches at the UCI WorldTour level rely on this parameter to define athlete metabolic profiles and calculate precise training loads. Every watt you spend overcoming tire drag is a watt you cannot use to drop your rivals. When you transition from smooth tarmac to rough gravel, tire friction increases. This shift forces you to adjust your target wattage to maintain speed. Tracking how this metric shifts allows sports scientists to measure adaptation and prevent overtraining syndrome.

To plan a precise pacing strategy for a grand tour, you need to calculate the exact power penalty of the road surface. High rolling resistance accelerates fatigue accumulation. When you ride at a higher power output to overcome tire drag, your muscle glycogen stores deplete rapidly. You can evaluate this substrate oxidation rate in the lab using gas exchange analysis. The mathematical representation of **Coefficient of Rolling Resistance Crr** and its corresponding metabolic/physical relation is modeled as:

$$ RER = \frac{VCO_2}{VO_2} $$

Where:
*   $\text{TSS}$ and $\text{NP}$ reflect the exponential weighting of training stress, scaling with the 4th power of mechanical power output to match physiological load.
*   $RER$ represents the Respiratory Exchange Ratio, indicating substrate oxidation ratios (carbohydrate vs. fat combustion).
*   $W'_{t}$ represents the instantaneous anaerobic work capacity remaining, measured in Joules (J), which drains non-linearly above FTP and reconstitutes exponentially during recovery.
*   $VCO_2$ is the volume of carbon dioxide produced in liters per minute.
*   $VO_2$ is the volume of oxygen consumed in liters per minute.

## Prescribing the Interval Block on Variable Surfaces

When you plan a workout on rough terrain, a simple flat-road target wattage is insufficient. You must calculate the additional mechanical drag. The table below outlines a structured interval block designed to expand your lactate clearance capacity while accounting for surface resistance.

| Workout Phase | Duration (min) | Target Wattage (% FTP) | Target Cadence (rpm) | Terrain Surface Type | Expected Crr |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Warm-Up | 15 | 55-65% | 90-95 | Smooth Asphalt | 0.0033 |
| Sweet Spot Tempo | 20 | 88-92% | 85-90 | Coarse Chipseal | 0.0048 |
| Active Recovery | 5 | 50% | 95-100 | Smooth Asphalt | 0.0033 |
| VO2 Max Intervals | 5 (x4) | 115-120% | 100-105 | Hardpack Dirt | 0.0055 |
| Cool-Down | 10 | 50-60% | 90 | Smooth Asphalt | 0.0033 |

During the high-intensity intervals, your anaerobic capacity drains rapidly. You must monitor your anaerobic work capacity remaining, represented by $W'_t$, to prevent complete failure before the block ends. The mathematical formula governing this energy reserve is defined as:

$$ W'_t = W'_0 - \int_{0}^t (P(t) - \text{CP}) dt $$

In this calculation:
*   $W'_t$ is the remaining anaerobic work capacity in Joules at time $t$.
*   $W'_0$ is the rider’s baseline anaerobic capacity at rest.
*   $P(t)$ is the instantaneous power output in Watts at time $t$.
*   $\text{CP}$ represents the Critical Power in Watts, which is closely related to FTP.

By tracking this depletion, you can design intervals that push your riders to their absolute metabolic limit without causing premature failure. This approach optimizes the training adaptations of the muscular system.

## Fueling the Aerobic Engine on Rough Terrain

An elevated rolling resistance coefficient shifts your energy systems toward carbohydrate combustion. If you ride at ninety percent of FTP on smooth asphalt, your RER might stay at zero point eight eight, indicating that fat provides a significant portion of the energy. However, if you hit a sandy gravel sector, the rolling resistance spikes. To maintain your speed, you must increase your power output. This extra effort shifts your RER toward one point zero, meaning your body burns carbohydrates almost exclusively.

This substrate shift accelerates glycogen depletion. You must adjust your fueling strategy to compensate for this high-burn rate. We prescribe a high carbohydrate intake of up to ninety grams per hour for long, rough stages. This dietary intervention supports glycogen sparing and delays fatigue. In high-altitude block training in St. Moritz or Val Martello, this calculation becomes even more critical due to the hypoxic stress. Always match your fuel intake to the calculated energy cost of the road. Accurate math on the drawing board translates directly to victory on the road.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
