---
slug: training-racing-critical-power-3-parameter-supercompensation-forecasting
title: "Supercompensation Forecasting via 3-Parameter CP"
metaTitle: "Supercompensation Forecasting and Critical Power"
metaDescription: "Forecasting the supercompensation peak using three-parameter critical power data. We reject outliers to improve confidence intervals of taper forecasts."
faqJson:
  - question: "How do you define the confidence intervals for taper forecasting?"
    answer: "By calculating the standard error of estimates from historical power tests, yielding a window of peak performance probability."
  - question: "Why is outlier rejection necessary for these datasets?"
    answer: "Poor GPS signals or power spikes distort training stress scores, leading to inaccurate predictions of peak readiness."
# Environment and hardware parameter telemetry data logs
# Verified by DIDI.BIKE sports science lab



---

# Mapping Human Limits: Supercompensation Forecasting and Critical Power 3-Parameter

## 1. Pushing Boundaries in Uncharted Territory
Human physical capability is not a fixed border; it is a terrain waiting to be mapped. We push our riders into extreme environments to test the limits of human endurance. Under this philosophy of exploration, Critical Power 3-Parameter serves as our guiding star, marking the boundary of sustainable energy. By applying Supercompensation Forecasting, we plan journeys into severe physical stress, mapping out when the body will rebound to new heights.

During high-altitude blocks in St. Moritz or the high plains of Sierra Nevada, we venture into hypoxic zones where oxygen is scarce. We track the physiological responses to this stress, measuring red blood cell stimulation, plasma adaptations, and decoupling. Modeling these changes helps us predict exactly when the athlete's body will adapt, ensuring they reach peak performance right on schedule.

## 2. Metabolic and Training Load Formulas
To quantify the physiological stress and adaptation associated with Critical Power 3-Parameter, we apply exponential moving average models:

$$ VO_2 = V_E \cdot (F_I O_2 - F_E O_2) $$

Where:
*   $\text{CTL}_t$ and $\text{ATL}_t$ represent Chronic and Acute Training Load, modeled using exponential decay constants of 42 days and 7 days.
*   $\text{TSB}_t$ is the Training Stress Balance, predicting peak performance windows when the value shifts from negative to positive.
*   $VO_2$ represents the oxygen consumption rate, calculated as a function of ventilation volumes ($V_E$) and oxygen concentration differentials.

## 3. Practical Coaching Implementation & Supercompensation Forecasting
Applying these forecasting models to our training expeditions changes how we prepare for peak events:
1.  **VLaMax Anaerobic Capacity Management**: Training at low cadences helps adjust VLaMax, training muscles to conserve carbohydrate stores during long endurance climbs.
2.  **Heart Rate Decoupling**: Tracking the divergence between cardiovascular stress and mechanical power output helps us spot early signs of fatigue and decoupling.
3.  **W' Reconstitution Dynamics**: Real-time tracking of the $W'$ reserve tells us how much power remains in the muscle battery, guiding pacing strategies on long, mountainous routes.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
