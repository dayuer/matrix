---
slug: what-is-torque-cycling
title: "What Is Torque in Cycling?"
metaTitle: "What Is Torque in Cycling? Rotational Force Explained"
metaDescription: "Torque in cycling is the rotational force applied to the crank, measured in N·m. Learn how torque relates to power, cadence, and climbing, and why it matters."
cluster: glossary
isPillar: false
locale: en
focusKeyword: "what is torque cycling"
pillarSlug: "cycling-science-glossary"
faqJson:
  - question: "What is torque in cycling?"
    answer: "Torque is the rotational force a cyclist applies to the crank arm. Measured in newton-meters (N·m), torque is the product of the perpendicular force on the pedal and the length of the crank. It is one of the two variables that determine power output."
  - question: "How is torque related to power in cycling?"
    answer: "Power equals torque multiplied by angular velocity (how fast the crank spins). At a fixed cadence, more torque means more power. At a fixed power, higher cadence means less torque per pedal stroke."
  - question: "What is a good torque value for cycling?"
    answer: "Torque varies with crank length, gear, and effort. A typical rider cruising might produce 10–20 N·m per pedal stroke, while pushing a big gear up a steep climb can demand 30–50 N·m. Sprint peaks can briefly exceed 70 N·m."
  - question: "Should I pedal with high torque or high cadence?"
    answer: "It depends on the goal. High torque at low cadence builds leg strength but fatigues muscles faster. High cadence at low torque spares muscles and shifts load to the cardiovascular system. Most efficient road riding blends a moderate cadence with moderate torque."
---

# What Is Torque in Cycling?

**Torque** in cycling is the rotational force a rider applies to the crank arm. Measured in **newton-meters (N·m)**, torque is the product of the perpendicular force exerted on the pedal and the length of the crank arm. When you stomp on the pedal, you generate torque about the bottom-bracket axle — and that torque, combined with how fast the crank spins, determines your power output. Understanding torque explains why grinding a big gear feels so different from spinning a small one, even when both produce the same watts.

## Why It Matters

Torque matters because it sits at the heart of the power equation and directly shapes how your muscles work. High-torque, low-cadence riding recruits more fast-twitch muscle fibers, builds strength, and stresses the connective tissue around the knee — useful for force development but fatiguing over long efforts. Low-torque, high-[cadence](/en/blog/what-is-cadence-cycling) riding shifts the burden to the cardiovascular system and spares the muscles, which is why experienced riders spin rather than mash. Knowing your torque profile helps you choose gears, protect your knees, and balance strength work with endurance. For the full picture of how torque converts into watts, see [What Is a Watt in Cycling?](/en/blog/what-is-a-watt-cycling)

## The Torque Formula

Torque is defined as:

\[ \tau = F \times r \]

where \( \tau \) is torque in newton-meters, \( F \) is the perpendicular force applied to the pedal (in newtons), and \( r \) is the crank length (in meters).

### Worked Example

A 70 kg rider standing on a 172.5 mm (0.1725 m) crank at the 3 o'clock position applies roughly:

\[ F = 70 \times 9.81 \approx 687\ \text{N} \]
\[ \tau = 687 \times 0.1725 \approx 118\ \text{N·m} \]

In practice, only a fraction of body weight transfers efficiently to the pedal, so measured torque during riding is much lower.

## Torque and Power

Power is the product of torque and angular velocity:

\[ P = \tau \times \omega \]

where \( \omega \) is angular velocity in radians per second, derived from [cadence](/en/blog/what-is-cadence-cycling):

\[ \omega = \frac{\text{cadence (rpm)} \times 2\pi}{60} \]

This relationship is why a power meter must measure both torque (via strain gauges) and rotational speed. The DIDI.Bike crank-integrated sensor captures torque on each downstroke and reports a smooth power figure along with left/right balance, revealing whether one leg generates more torque than the other.

## Typical Torque Values

| Riding Situation | Torque per Pedal Stroke (N·m) |
|---|---|
| Easy spin, flat road | 5–15 |
| Steady endurance pace | 15–25 |
| Climbing a big gear slowly | 30–50 |
| Sprint acceleration | 60–80+ |

These are rough ranges; actual torque depends on crank length, gear selection, gradient, and rider strength.

## Torque in Training

- **Strength-endurance intervals:** Low-cadence (50–60 rpm), high-torque efforts in a big gear build leg strength and muscular endurance.
- **Knee care:** Chronic high-torque grinding can strain the patellofemoral joint. Balancing big-gear work with higher-cadence spinning protects the knees.
- **Efficiency analysis:** Torque-effectiveness metrics (how much of each revolution produces positive torque versus dead spots) reveal pedal-stroke smoothness.

## Torque vs. Cadence: A Practical Trade-Off

| Approach | Torque | Cadence | Physiological Cost |
|---|---|---|---|
| Mash a big gear | High | Low | Muscle fatigue, knee stress |
| Spin a small gear | Low | High | Cardiovascular load |
| Balanced cruising | Moderate | 85–95 rpm | Sustainable mix |

## FAQ

**What is torque in cycling?**
Torque is the rotational force a cyclist applies to the crank arm. Measured in newton-meters (N·m), torque is the product of the perpendicular force on the pedal and the length of the crank. It is one of the two variables that determine power output.

**How is torque related to power in cycling?**
Power equals torque multiplied by angular velocity (how fast the crank spins). At a fixed cadence, more torque means more power. At a fixed power, higher cadence means less torque per pedal stroke.

**What is a good torque value for cycling?**
Torque varies with crank length, gear, and effort. A typical rider cruising might produce 10–20 N·m per pedal stroke, while pushing a big gear up a steep climb can demand 30–50 N·m. Sprint peaks can briefly exceed 70 N·m.

**Should I pedal with high torque or high cadence?**
It depends on the goal. High torque at low cadence builds leg strength but fatigues muscles faster. High cadence at low torque spares muscles and shifts load to the cardiovascular system. Most efficient road riding blends a moderate cadence with moderate torque.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
