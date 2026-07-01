---
slug: use-cases-elite-triathletes-aero-testing-hardware-integration
title: "Hardware Integration in Elite Triathlon Aero Testing"
metaTitle: "Triathlon Aero Testing Hardware & Data Pipeline"
metaDescription: "An engineering breakdown of telemetry sensors, UART buffer serialization protocols, and CdA calculations."
cluster: use-cases
isPillar: false
pillarSlug: "cycling-telemetry-use-cases"
locale: en
focusKeyword: "elite triathletes aero testing"
faqJson:
  - question: "How does the telemetry sensor serialize accelerometer data?"
    answer: "The onboard microcontroller reads 16-bit signed registers via I2C, wrapping them in structured serial packets with checksum verification."
  - question: "What is the typical sampling rate for drag area calculation?"
    answer: "The hardware logs inertial data at 100 Hz to onboard SPI NOR flash while streaming status updates at 25 Hz."
---

# Telemetry Hardware Stack: Sensors, Data Pipelines, and Register Mapping

The hardware architecture for real-world drag coefficient estimation requires real-time data fusion. This document describes the sensor telemetry specs, register mappings, and the math governing our calculations. Verify parameters.

## Data Pipeline Architecture and Telemetry Routing

The system routes high-frequency data streams to an onboard memory card, while sending 1 Hz telemetry packets via ANT+ and BLE:

```
┌─────────────────────┐     ANT+ / BLE     ┌──────────────────┐
│  DIDI.BIKE Sensor   │ ◄────────────────► │   GPS Head Unit  │
│  (IMU + Baro)       │                     │   (Garmin/Wahoo) │
└────────┬────────────┘                     └────────┬─────────┘
         │ 100 Hz raw                                │ 1 Hz .FIT
         │ data stream                               │
         ▼                                           ▼
┌─────────────────────┐                     ┌──────────────────┐
│  Onboard Flash      │                     │  Head Unit .FIT  │
│  (16 MB, ~8 hrs)    │                     │  file export     │
└────────┬────────────┘                     └────────┬─────────┘
         │ USB / BLE export                          │
         ▼                                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Analysis Software                          │
│  Merge: 100 Hz IMU/baro + 1 Hz power/speed/GPS              │
│  Output: CdA per lap, air density, vibration metrics         │
└──────────────────────────────────────────────────────────────┘
```

## Sensor Specifications and Register Maps

Our sensor integrates a 6-axis inertial measurement unit (IMU) and a digital pressure sensor connected via a shared bus. Confirm the setup.

### Telemetry Register Definition and Sensor Specifications

| I2C Register Address | Register Name | Data Type & Range | UART Buffer Frame Offset |
|---|---|---|---|
| `0x10` | `ACCEL_X_OUT` | 16-bit signed integer (±16 g) | Byte 2-3 |
| `0x12` | `ACCEL_Y_OUT` | 16-bit signed integer (±16 g) | Byte 4-5 |
| `0x14` | `ACCEL_Z_OUT` | 16-bit signed integer (±16 g) | Byte 6-7 |
| `0x20` | `GYRO_X_OUT` | 16-bit signed (±2000 °/s) | Byte 8-9 |
| `0x30` | `BARO_P_OUT` | 24-bit unsigned (BMP390 hPa) | Byte 14-16 |
| `0x40` | `TEMP_OUT` | 16-bit signed thermistor (°C) | Byte 17-18 |

Firmware processes these registers to manage thread safety. It uses DMA to unload the UART buffer without causing interrupt latency issues.

## UART Buffer and Data Serialization Protocol

Microcontroller interrupts serialize acceleration and rotation data into packets. The packet payload includes timestamp, acceleration, rotation, and pressure fields. Timestamp synchronization handles the alignment between the 100 Hz sensor log and the 1 Hz GPS .FIT files. Checksum verification checks packet integrity:

```
timestamp_ms,  acc_x,  acc_y,  acc_z,  gyro_x,  gyro_y,  gyro_z,  pressure_hPa,  temp_C
0,             0.12,   -9.78,  0.34,   0.02,    -0.01,   0.03,    1013.25,       22.4
10,            0.15,   -9.81,  0.31,   0.01,    -0.02,   0.02,    1013.24,       22.4
20,            0.11,   -9.79,  0.35,   0.03,    -0.01,   0.04,    1013.25,       22.4
```

GPS head units write UTC-stamped fields:

```
timestamp,  latitude,  longitude,  altitude_m,  speed_mps,  power_w,  cadence_rpm,  hr_bpm
2026-03-15T07:00:00Z,  38.7223,  -9.1393,  12.4,  11.2,  248,  88,  142
```

We synchronize files during analysis using the first peak acceleration event logged by both systems.

## Computational Pipeline and Mathematical Formulas

### 1. Air Density Estimation
The processor calculates air density using barometric pressure and temperature data:

$$ \rho = \frac{P_{\text{dry}}}{R_{\text{dry}} \cdot T} + \frac{P_{\text{vapor}}}{R_{\text{vapor}} \cdot T} $$

### 2. Virtual Elevation Reconstruction
We compute drag coefficient using a virtual elevation method to solve for CdA:

$$ h_{\text{virtual}}(i) = h_{\text{virtual}}(i-1) + \frac{P(i) - \frac{1}{2}\rho \cdot CdA \cdot v(i)^3 - C_{rr} \cdot m \cdot g \cdot v(i)}{m \cdot g \cdot v(i)} \cdot \Delta d(i) $$

We filter raw telemetry arrays to optimize computational performance. The algorithm discards samples that exceed power bounds or fall below speed limits.

## System Integration Checklist

Review these parameters to ensure proper product integration:
- [ ] Upgrade firmware to version 2.4.
- [ ] Confirm power meter zero-offset calibration.
- [ ] Set GPS log rate to 1 Hz.
- [ ] Confirm I2C communication and ANT+ connectivity.
- [ ] Empty internal memory storage before testing.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
