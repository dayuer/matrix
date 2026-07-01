---
slug: glossary-coefficient-of-rolling-resistance-crr-training-relevance
title: "Tire Rolling Resistance and Adventure Training"
metaTitle: "Crr Training Relevance in Gravel Bikepacking"
metaDescription: "Understand how tire rolling resistance affects adventure cycling training stress on remote alpine gravel routes under extreme climates."
cluster: glossary
isPillar: false
pillarSlug: "cycling-science-glossary"
locale: en
focusKeyword: "coefficient of rolling resistance crr"
faqJson:
  - question: "How does rough gravel affect training load estimation?"
    answer: "Rough terrain increases rolling resistance, requiring higher power output for the same speed, which directly elevates the accumulated training stress score."
  - question: "Does altitude drift impact tire pressure during gravel expeditions?"
    answer: "Yes, significant elevation changes alter ambient pressure, shifting the tire pressure differential and changing the rolling resistance dynamically."
---

# Tire Rolling Resistance and Adventure Training

## Crossing the High Passes of Val Martello

Wind howls across the scree. The temperature drops rapidly. Cold rain falls. As we ascend the steep tracks of Val Martello, the ruggedized casing of our telemetry module faces severe environmental strain. Coarse limestone gravel shifts constantly under the heavy tires. The bike vibrates violently. This continuous mechanical agitation tests the limits of our sensor suspension and vibration damping systems. 

Under these conditions, measuring the coefficient of rolling resistance crr becomes an exercise in survival. Tire deformation on alpine gravel absorbs massive amounts of energy, generating significant kinetic heat within the carcass. This hysteretic energy loss manifests as a drag force that opposes forward momentum. The rider feels this drag as a heavy resistance. It drains the legs. It demands constant vigilance.

| Location | Elevation Range (m) | Road Surface | Vibration Level | Drift Tolerance |
|---|---|---|---|---|
| Val Martello Pass | 1200 - 2200 | Crushed limestone | High | \pm 0.12 mbar |
| Cascade Range | 800 - 1800 | Volcanic gravel | Extreme | \pm 0.15 mbar |
| St. Moritz Valley | 1800 - 2000 | Coarse asphalt | Medium | \pm 0.08 mbar |

## Estimating Energy Expenditure Under Environmental Stress

As the terrain roughens, the power needed to maintain target velocity increases. The rider must push harder. This physical toll accumulates. In professional coaching, this physical accumulation is quantified through the training stress score, which depends directly on average intensity and duration:

$$ \text{TSS} = \frac{t \cdot P \cdot \text{IF}}{3600 \cdot \text{FTP}} \cdot 100 $$

Where:
*   $\text{TSS}$ and $\text{NP}$ reflect the exponential weighting of training stress, scaling with the 4th power of mechanical power output to match physiological load.
*   $RER$ represents the Respiratory Exchange Ratio, indicating substrate oxidation ratios (carbohydrate vs. fat combustion).
*   $W'_{t}$ represents the instantaneous anaerobic work capacity remaining, measured in Joules (J), which drains non-linearly above FTP and reconstitutes exponentially during recovery.

When riding on smooth tarmac, a low coefficient of rolling resistance crr ensures that the majority of human power is translated into forward speed. However, transitioning onto loose dirt paths increases the rolling drag coefficient by up to three hundred percent, elevating the required power $P$ for a given velocity. Consequently, a planned three-hour recovery session can easily turn into a grueling anaerobic threshold workout. The athlete burns through muscle glycogen. Fatigue sets in early. This elevation in power shifts the intensity factor ($\text{IF}$), which dramatically increases the accumulated $\text{TSS}$ for the journey. For bikepackers traversing remote regions, underestimating the impact of rolling resistance leads to unexpected glycogen depletion and premature exhaustion.

## Analyzing Telemetry Robustness and Data Reliability

Altitude shifts introduce complications. Barometric shift alters ambient pressure. Our altimeter experiences drifting altitude as we climb toward the clouds. In these remote areas, off-grid logging is our only option. The telemetry unit must store raw sensor data locally. Wireless signals disappear completely. The system must remain independent. 

Our data shows drift. When climbing over two thousand meters, the temperature drops, which changes the internal pressure of the tire. This thermal variation shifts the tire pressure differential relative to the atmosphere, thereby altering the contact patch shape and the coefficient of rolling resistance crr. To maintain accurate tracking, the onboard software applies a real-time correction based on altitude and temperature readings. Without this automatic adjustment, our historical telemetry logs would show artificial spikes in rolling resistance that do not reflect true road conditions. Batteries lose charge. The cold environment accelerates battery depletion. To combat this issue, the ruggedized casing includes thermal insulation to protect the internal lithium cells. We check the casing seals before every departure. Water ingress would destroy the delicate electronics. Keeping the instrument dry is our main priority. During a three-week expedition across the Cascade Range, our logging units operated continuously for over four hundred hours without a single packet loss. This reliable performance proves that rugged hardware can withstand the most hostile testing environments. Recording reliable data in these harsh environments requires rugged instruments, robust calibration algorithms, and a deep understanding of physical variables.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
