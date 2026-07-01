---
slug: use-cases-mountain-bike-suspension-potentiometer-field-protocol
title: "Calibration Protocol: MTB Suspension Potentiometer"
metaTitle: "Calibration Protocol: MTB Suspension Potentiometer"
metaDescription: "Pit lane calibration protocol for mountain bike suspension potentiometers. Align linear displacement sensors and eliminate signal drift."
cluster: use-cases
isPillar: false
pillarSlug: "cycling-telemetry-use-cases"
locale: en
focusKeyword: "mountain bike suspension potentiometer"
faqJson:
  - question: "How do mechanics verify linear voltage mapping during stand setup?"
    answer: "We execute a full-travel compression sweep to ensure output voltage maps linearly to travel depth without any signal dropouts."
  - question: "How do you align the linear displacement sensors on the fork stanchions?"
    answer: "We physically align the sensors parallel to the stanchion axis with strict tolerances to prevent binding under high mechanical vibration."
---

# Field Protocol: Deploying and Calibrating a Mountain Bike Suspension Potentiometer

In the race pits, precision is measured in millivolts and millimeters. Theoretical sports science is only as good as the calibration of the sensors on the bike. When configuring a mountain bike suspension potentiometer, a technician's priority is establishing a repeatable calibration routine to secure clean, unclipped data under brutal track conditions. 

## Bench Setup: Aligning the Sensors
Before the bike leaves the stand, the hardware must be zeroed. Telemetry crews, such as those working with the Tudor Pro Cycling team, know that sensor drift can corrupt entire data runs. During setup, linear displacement sensors must be physically aligned parallel to the stanchion axis to prevent binding. We execute a full-travel compression sweep to verify that output voltage maps linearly to travel depth without signal dropouts.

## Calculating Total System Drag in the Field
Once the hardware is calibrated, we monitor the total resistive load acting on the athlete and bike. Our field calculations rely on summing the various resistive components:

$$ P_{\text{total}} = P_{\text{gravity}} + P_{\text{aero}} + P_{\text{rr}} + P_{\text{drivetrain}} $$

Where:
*   $P_{\text{total}}$ represents the total mechanical power output required to overcome gravity, aerodynamic drag, rolling resistance, and drivetrain friction.
*   $a_{\text{vibration}}$ is the root-mean-square acceleration of frame vibration, measured via triaxial accelerometers to evaluate dampening characteristics.
*   $\eta_{\text{drafting}}$ represents the drafting efficiency coefficient, representing the percentage reduction in CdA when riding in a slipstream.

By isolating these variables, we can pinpoint whether a speed deficit stems from dampening losses in the suspension or aerodynamic inefficiency in the rider's posture.

## Practical Diagnostics & Maintenance Routines
Implementing this protocol on-site allows us to solve three common performance bottlenecks:
1.  **Suspension Telemetry Validation**: Linear potentiometers mounted on the fork legs capture high-frequency shaft velocities. We analyze these files to adjust high-speed compression and rebound damping, maximizing tire contact over rocky terrain.
2.  **Chung Virtual Elevation Field Protocols**: Having the rider perform steady-state laps on a closed circuit lets us calculate aerodynamic CdA to a $\pm 1.5\%$ tolerance, providing wind-tunnel-level data directly in the field.
3.  **Pedal Stroke Adjustment**: Real-time tracking of force vectors on the pedals helps us isolate alignment issues, allowing precise cleat adjustments to relieve knee pressure.


## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
