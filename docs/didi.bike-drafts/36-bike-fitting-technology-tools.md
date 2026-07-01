---
slug: bike-fitting-technology-tools
title: "Bike Fitting Technology: Tools and Sensors"
metaTitle: "Bike Fitting Technology: Tools and Sensors"
metaDescription: "From goniometers to motion capture and IMU sensors, bike fitting technology spans a wide range. Compare tools, accuracy, and cost for every budget."
cluster: bike-fitting
isPillar: false
locale: en
focusKeyword: "bike fitting technology"
pillarSlug: bike-fitting-biomechanics-guide
faqJson:
  - question: "What technology is used in a bike fit?"
    answer: "Bike fitting technology ranges from simple goniometers and plumb lines to 3D motion-capture systems, pressure mapping mats, inertial measurement units (IMUs), and force-measuring pedals. Studios combine several of these; home setups can use a phone camera plus a sensor."
  - question: "What is motion capture in bike fitting?"
    answer: "Motion capture in bike fitting uses optical or inertial sensors to track joint positions at 100+ Hz while you pedal. Systems like Retül and Vicon record knee angle, pelvic motion, and asymmetry in real time, giving a dynamic picture a static measurement cannot."
  - question: "Are bike fit sensors accurate?"
    answer: "Quality IMU-based sensors achieve angular resolution of about 0.1 degrees at sampling rates of 100 Hz. They are less accurate than optical motion capture for absolute joint-center position but excellent for tracking relative motion and asymmetry under load."
  - question: "Do I need pressure mapping for a bike fit?"
    answer: "Pressure mapping helps if you have saddle discomfort, numbness, or suspect uneven weight distribution. It is not essential for a basic fit but adds valuable data for saddle selection and fore-aft positioning."
  - question: "Can a phone camera replace bike fit tools?"
    answer: "A 60 fps phone camera can measure knee and hip angles to within 2-3 degrees when set up carefully. It cannot replace motion capture or pressure mapping, but it is sufficient for most saddle height and reach checks."
---

# Bike Fitting Technology: Tools and Sensors

Bike fitting technology has evolved from a plumb line and a goniometer to a layered stack of motion capture, pressure mapping, inertial sensors, and force-measuring pedals. The goal of all of it is the same: measure what your body does on the bike, so you can change the bike instead of your body. We analyze the full spectrum of tools, what each measures, how accurate it is, and where it fits in a fit process. For the biomechanical framework these tools serve, see the [bike fitting biomechanics guide](/en/blog/bike-fitting-biomechanics-guide).

## The Measurement Stack

Every fit, from DIY to studio, answers the same questions: Where are your joints? What angles do they make? How do they move under load? How is force distributed? Different tools answer these with different precision.

| Layer | What It Measures | Example Tools | Typical Accuracy |
|---|---|---|---|
| Static dimensions | Joint angles at rest | Goniometer, plumb line | ±2-3° |
| Video kinematics | Joint angles from video | Phone, Kinovea, Coach's Eye | ±2-3° |
| Optical motion capture | 3D joint trajectories | Vicon, Retül, STT | <1°, sub-mm |
| Inertial sensors (IMU) | Orientation, angular velocity | DIDI.BIKE sensor, Xsens | ±0.1° |
| Pressure mapping | Force distribution | GebioMized, Velocio | ±5% pressure |
| Force measurement | Pedal force, power | Favero Assioma, Garmin Rally | ±1% power |

## Static Tools: Goniometers and Plumb Lines

The foundation is still the goniometer—a two-armed protractor that measures joint angles—and the plumb line, which establishes vertical reference lines for fore-aft position. These tools are cheap, fast, and surprisingly effective in trained hands.

**Use them for:** knee angle at bottom dead center, hip angle at top dead center, KOPS alignment, and shoulder angle.

**Limits:** They measure only static positions. As soon as you pedal, the pelvis shifts, the ankle plantarflexes, and the real angles change by several degrees. For more on this gap, see [dynamic vs static bike fit](/en/blog/dynamic-vs-static-bike-fit).

## Video Kinematics: The Accessible Middle

A smartphone at 60 fps plus a free app (Kinovea on desktop, Coach's Eye or Hudl Technique on mobile) turns any trainer session into a kinematic measurement. You mark joint centers on the screen and the app computes angles frame by frame.

**Best practices:**

- Camera perpendicular to the rider, at hip height, 3-4 m away to minimize parallax
- Mark anatomical landmarks (greater trochanter, lateral knee joint line, lateral malleolus) with tape
- Measure at 3-4 points in the pedal stroke, not just one

**Accuracy:** With careful setup, video-derived knee angles land within 2-3° of motion-capture values. That is good enough for most saddle-height and reach decisions, which is why video underpins the [bike fit without motion capture](/en/blog/bike-fit-without-motion-capture) approach.

## Optical Motion Capture: The Gold Standard

Studio systems like Vicon, Retül, and STT use multiple synchronized cameras to track reflective markers on the rider at 100-400 Hz. Software reconstructs 3D joint trajectories and reports angles throughout the pedal stroke.

**Strengths:**

- Sub-degree angular accuracy, sub-millimeter positional accuracy
- Captures left-right asymmetry
- Tracks motion across the full stroke, not just discrete points

**Limits:**

- High equipment cost ($50,000-$250,000 for a full setup)
- Studio-bound; cannot measure riding outdoors
- Marker placement requires expertise; marker slip degrades data

The instantaneous knee flexion angle drives the moment arm of the pedal force:

\[ \tau_{\text{knee}} = F_{\text{pedal}} \cdot r_{\text{moment}}(\theta_{\text{knee}}) \]

where \( r_{\text{moment}} \) is a nonlinear function of the knee angle. Motion capture resolves \( \theta_{\text{knee}}(t) \) with the precision needed to optimize this.

## Inertial Sensors: IMUs Come of Age

Inertial measurement units (IMUs) combine accelerometers, gyroscopes, and sometimes magnetometers to measure orientation and angular velocity without external cameras. They are the fastest-growing category in bike fitting technology because they are cheap, wireless, and work anywhere—indoors or on the road.

The DIDI.BIKE sensor is a representative example: a 14-gram, IP67-rated unit that mounts on the seat post and runs a 6-axis IMU at 100 Hz with ±0.1° angular resolution. A built-in barometer logs altitude and gradient, and the 120-hour battery covers weeks of training. Dual ANT+ and BLE 5.0 output streams data to common training apps.

**What IMUs add to a fit:**

- **Pelvic motion.** Roll, pitch, and yaw of the pelvis—the single best indicator of a saddle too high or reach too long. Elevated pelvic roll amplitude correlates with lower-back load.
- **Outdoor validity.** Studio motion capture measures you on a trainer; IMUs measure you on the road, where gradient, wind, and fatigue change your motion.
- **Trend tracking.** Logged over weeks, IMU data shows fit drift before you feel it as pain.

**Limits:** IMUs drift in absolute position over time and cannot track joint centers as precisely as optical systems. They are best for relative motion and trends, not absolute dimensions.

## Pressure Mapping: The Saddle and Foot

Pressure mapping uses arrays of thin force sensors to visualize how load distributes across a surface—usually the saddle or the footbed.

**Saddle pressure mapping** (GebioMized, Velocio) reveals whether you sit centered, shifted left/right, or too far forward/back. It is invaluable for saddle selection and for diagnosing numbness or perineal pain. See [saddle pressure mapping](/en/blog/saddle-pressure-mapping) for the full workflow.

**In-shoe pressure mapping** shows hotspots and uneven forefoot loading, informing cleat wedging and insole choices.

## Force and Power Measurement

Power meters (Favero Assioma, Garmin Rally, SRM) measure torque and cadence at the pedal, which lets a fitter quantify left-right balance and pedaling smoothness. Force-vector analysis—breaking the pedal force into tangential and radial components—reveals whether a rider is pushing efficiently or wasting energy in dead spots.

| Tool Category | Entry Cost | Best For |
|---|---|---|
| Goniometer + plumb line | $20-$50 | Baseline static fit |
| Phone + free app | $0 (phone assumed) | DIY video kinematics |
| IMU sensor (e.g., DIDI.BIKE) | $299 | Dynamic pelvic/motion tracking at home |
| Power pedals | $500-$1,000 | Force balance, pedaling efficiency |
| Saddle pressure mat | Used in-studio ($/fit) | Saddle selection, numbness diagnosis |
| Optical motion capture | Studio session ($200-$500) | Full dynamic fit, asymmetry |

## Choosing the Right Tool Stack

The right bike fitting technology depends on your needs:

| Situation | Recommended Stack |
|---|---|
| First fit, pain-free | Goniometer or phone video |
| Knee, back, or neck pain | Video + IMU sensor, or studio motion capture |
| Saddle discomfort or numbness | Saddle pressure mapping |
| Performance and racing | Motion capture + power pedals |
| Tracking fit over time | IMU sensor for ongoing data |

For riders who want a middle path between a one-off studio visit and pure self-fit, pairing a phone video with a seat-post IMU sensor like the DIDI.BIKE unit ($299) gives you both the static dimensions and the dynamic motion data to make and track adjustments over time.

For the broader question of whether to seek professional help, see [professional vs DIY bike fit](/en/blog/professional-vs-diy-bike-fit), and for how often to re-check, see [how often should you get a bike fit](/en/blog/bike-fit-frequency-how-often).

## FAQ

**What technology is used in a bike fit?**
Bike fitting technology ranges from simple goniometers and plumb lines to 3D motion-capture systems, pressure mapping mats, inertial measurement units (IMUs), and force-measuring pedals. Studios combine several of these; home setups can use a phone camera plus a sensor.

**What is motion capture in bike fitting?**
Motion capture in bike fitting uses optical or inertial sensors to track joint positions at 100+ Hz while you pedal. Systems like Retül and Vicon record knee angle, pelvic motion, and asymmetry in real time, giving a dynamic picture a static measurement cannot.

**Are bike fit sensors accurate?**
Quality IMU-based sensors achieve angular resolution of about 0.1 degrees at sampling rates of 100 Hz. They are less accurate than optical motion capture for absolute joint-center position but excellent for tracking relative motion and asymmetry under load.

**Do I need pressure mapping for a bike fit?**
Pressure mapping helps if you have saddle discomfort, numbness, or suspect uneven weight distribution. It is not essential for a basic fit but adds valuable data for saddle selection and fore-aft positioning.

**Can a phone camera replace bike fit tools?**
A 60 fps phone camera can measure knee and hip angles to within 2-3 degrees when set up carefully. It cannot replace motion capture or pressure mapping, but it is sufficient for most saddle height and reach checks.

---

*Related:* [Bike Fitting Biomechanics Guide](/en/blog/bike-fitting-biomechanics-guide) · [Dynamic vs Static Bike Fit](/en/blog/dynamic-vs-static-bike-fit) · [Professional vs DIY Bike Fit](/en/blog/professional-vs-diy-bike-fit) · [Saddle Pressure Mapping](/en/blog/saddle-pressure-mapping)

## References
1. *Clinical Biomechanics*: Knee kinematics and muscle activation patterns in cycling fit protocols.
2. *Journal of Applied Biomechanics*: Saddle fore-aft positions and lower extremity joint mechanics.
3. *DIDI.BIKE Technical Reprints*: Precision sensor calibration for posture and skeletal angle mapping.
