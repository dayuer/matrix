import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');


const TAXONOMY = {
  'aerodynamics-cda': {
    nouns: [
      'Boundary Layer', 'Laminar Flow', 'Turbulent Flow', 'Reynolds Number', 'Form Drag', 
      'Skin Friction', 'Frontal Area', 'Yaw Angle', 'Crosswind Yaw Moment', 'Vortex Shedding', 
      'Rotational Drag', 'Translational Drag', 'Virtual Elevation Chung Method', 'Skinsuit Seam', 
      'Deep Section Wheel Stall', 'Disc Wheel Sail Effect', 'Drafting Wake Deficit', 
      'Peloton Fluid Simulation', 'Tire Tread Boundary Layer', 'Barometric Density', 
      'Pitot Tube Dynamic Pressure', 'Handlebar Width Frontal Area', 'Aerobar Spacing', 'CdA Hysteresis'
    ],
    attributes: [
      'Sensitivity Analysis', 'Calibration Protocol', 'Mathematical Derivation', 'Physiological Cost', 
      'Performance Optimization', 'CFD Simulation', 'Wind Tunnel Validation', 'Real-World Field Testing', 
      'Error Propagation', 'Temperature Compensation'
    ],
    formulas: [
      '$$ F_d = \\frac{1}{2} \\rho v^2 C_d A $$',
      '$$ Re = \\frac{\\rho v L}{\\mu} $$',
      '$$ \\rho = \\frac{p}{R \\cdot T} $$',
      '$$ \\tan \\beta = \\frac{v_{\\text{cross}}}{v_{\\text{rider}}} $$'
    ],
    faqQuestion: 'What is the significance of {noun} in cycling aerodynamics?',
    faqAnswer: '{noun} is a key variable in fluid dynamics. Through {attribute}, researchers can analyze and mitigate aerodynamic resistance, yielding significant power savings.',
    generateBody: (title, noun, attribute, formula) => `## 1. Aerodynamic Significance in Tour de France
In grand tours such as the Tour de France, aerodynamic drag accounts for over $90\\%$ of a rider's total resistance on flat terrain at speeds exceeding $40\\text{ km/h}$. For a professional rider, optimizing **${noun}** represents a permanent biomechanical advantage. When analyzed via **${attribute}**, we can isolate the flow separation points and pressure drag vectors. 

Under the strict dimensional constraints of the **UCI Article 1.3.013** and **1.3.022** (governing time trial bike dimensions and rider reach/elbow cup dimensions), optimizing the interaction between the rider's torso and incoming air vectors is critical. This is especially true during crosswind sections in flat stages where the yaw angles vary dynamically.

## 2. Mathematical Formulation & Governing Physics
To model the fluid boundary behavior of **${noun}**, we apply Navier-Stokes formulations simplified for external boundary layers. The governing physical relationship is expressed as:

${formula}

Where:
*   $F_d$ is the total drag force vector in Newtons, representing the net force opposing the rider's forward motion.
*   $Re$ represents the Reynolds Number, characterizing the transition from laminar to turbulent flow along the rider's limbs and skinsuit panels.
*   $\\rho$ is the local barometric air density, adjusted dynamically for altitude (e.g., during high-altitude Alpine passes or altitude training in St. Moritz, Switzerland).
*   $A$ is the planimetric frontal area, captured via 2D photogrammetry.

## 3. Real-World ${attribute} & Calibration
Applying **${attribute}** under controlled wind tunnel conditions or velodrome field protocols (using the virtual elevation method) yields deterministic drag profiles. For professional sports science laboratories in Switzerland and France:
1.  **Skinsuit Material Boundary Layer**: Adjusting seam placement can delay boundary layer separation, lowering the drag coefficient $C_d$ by up to $5\\%$.
2.  **Yaw Angle Probability**: Incorporating crosswind yaw moments into the wheel profile selection ensures handling stability under gusty alpine conditions.
3.  **Barometric Compensation**: In high-altitude passes ($>2000\\text{m}$), the decrease in air density $\\rho$ reduces overall drag force, shifting the optimal pacing strategy from purely aerodynamic to physiological limits.
`
  },
  'glossary': {
    nouns: [
      'Coefficient of Rolling Resistance Crr', 'Drag Area CdA', 'Inertial Measurement Unit IMU', 
      'Maximal Oxygen Uptake VO2max', 'Maximal Lactate Production Rate VLaMax', 'Anaerobic Work Capacity W-Prime', 
      'Maximal Aerobic Power MAP', 'Functional Reserve Capacity FRC', 'Chronic Training Load CTL', 
      'Acute Training Load ATL', 'Training Stress Balance TSB', 'Normalized Power NP', 
      'Intensity Factor IF', 'Variability Index VI', 'Efficiency Factor EF', 'Training Stress Score TSS', 
      'Velocita Ascensionale Media VAM', 'Respiratory Exchange Ratio RER', 'Respiratory Quotient RQ', 
      'Heart Rate Variability HRV', 'RMSSD Index', 'SDNN Index', 'Excess Post-Exercise Oxygen Consumption EPOC', 
      'Hematocrit Level', 'Hemoglobin Concentration', 'Erythropoietin EPO', 'Lactate Threshold LT2', 
      'Ventilatory Threshold VT2', 'Maximal Lactate Steady State MLSS', 'Glycogen Depletion', 
      'Gluconeogenesis Pathway', 'Pyruvate Accumulation', 'Lactate Shuttle Mechanism', 
      'Monocarboxylate Transporter MCT1', 'Monocarboxylate Transporter MCT4', 'Slow-Twitch Fibers', 
      'Fast-Twitch Fibers', 'Neuromuscular Fatigue', 'Central Governor Model', 'Cardiac Drift'
    ],
    attributes: [
      'Definition and Units', 'Physiological Meaning', 'Mathematical Calculation', 'Measurement Methodology', 
      'Training Relevance', 'Performance Impact', 'Optimal Ranges', 'Practical Application', 
      'Historical Background', 'Academic Reference'
    ],
    formulas: [
      '$$ \\text{TSS} = \\frac{t \\cdot P \\cdot \\text{IF}}{3600 \\cdot \\text{FTP}} \\cdot 100 $$',
      '$$ \\text{NP} = \\left( \\frac{1}{N} \\sum_{i=1}^N P_{30,i}^4 \\right)^{\\frac{1}{4}} $$',
      '$$ RER = \\frac{VCO_2}{VO_2} $$',
      '$$ W\'_{t} = (W\'_0 - W_{\\text{exp}}) \\cdot e^{-\\Delta t / \\tau} $$'
    ],
    faqQuestion: 'What does {noun} measure?',
    faqAnswer: '{noun} measures {attribute} in modern sports science. Understanding this metric allows coaches to tailor training stress and target specific energy systems.',
    generateBody: (title, noun, attribute, formula) => `## 1. Definition and Physiological Context
In professional exercise physiology and competitive cycling, **${noun}** serves as a core diagnostic metric. Coaches at the UCI WorldTour level rely on this parameter to define athlete metabolic profiles and calculate precise training loads. 

Evaluating **${noun}** provides insight into the metabolic and mechanical energy pathways of the athlete. For example, during high-altitude block training in St. Moritz or Val Martello, tracking how this metric shifts allows sports scientists to measure adaptation and prevent overtraining syndrome.

## 2. Mathematical Formulation
The mathematical representation of **${noun}** and its corresponding metabolic/physical relation is modeled as:

${formula}

Where:
*   $\\text{TSS}$ and $\\text{NP}$ reflect the exponential weighting of training stress, scaling with the 4th power of mechanical power output to match physiological load.
*   $RER$ represents the Respiratory Exchange Ratio, indicating substrate oxidation ratios (carbohydrate vs. fat combustion).
*   $W'_{t}$ represents the instantaneous anaerobic work capacity remaining, measured in Joules (J), which drains non-linearly above FTP and reconstitutes exponentially during recovery.

## 3. Practical Training Application
Understanding the mechanics of **${noun}** through **${attribute}** enables coaches to build precise preparation paths for grand tours:
1.  **Anaerobic Capacity Profiling**: Tracking $W'$ depletion and recovery kinetics allows coaches to simulate Tour de France summit finishes (e.g., Alpe d'Huez) and calculate exactly how many anaerobic matches a rider can burn before failure.
2.  **Substrate Optimization**: Utilizing $RER$ values helps sports nutritionists calculate the exact carbohydrate combustion rate in grams per minute, tailoring the feeding strategy to prevent glycogen depletion.
3.  **Fatigue Tracking**: Exponential moving averages of load ($CTL$ and $ATL$) assist coaches in predicting supercompensation peaks for target stages.
`
  },
  'bike-fitting': {
    nouns: [
      'Saddle Height', 'Saddle Fore-Aft', 'Saddle Tilt', 'Cleat Fore-Aft', 'Cleat Lateral Stance', 
      'Cleat Rotational Float', 'Handlebar Reach', 'Handlebar Stack', 'Stem Length', 'Stem Angle', 
      'Crank Length', 'Q-Factor Stance Width', 'Knee Flexion Angle', 'Hip Extension Angle', 
      'Ankle Dorsiflexion', 'Pelvic Tilt Angle', 'Spinal Column Alignment', 'Shoulder Flexion', 
      'Elbow Extension Angle', 'Footbed Arch Support'
    ],
    attributes: [
      'Biomechanical Assessment', 'Impact on Power Transfer', 'Injury Prevention Protocol', 'Comfort Optimization', 
      'Motion Capture Validation', 'Static vs Dynamic Analysis', 'Force Vector Alignment', 
      'Pressure Mapping Evaluation', 'Neuromuscular Recruitment', 'Kinetic Chain Analysis'
    ],
    formulas: [
      '$$ L_{\\text{saddle}} = 1.09 \\cdot \\text{Inseam} $$',
      '$$ \\theta_{\\text{knee}} = \\arccos\\left( \\frac{a^2 + b^2 - c^2}{2ab} \\right) $$',
      '$$ F_{\\text{joint}} = F_{\\text{pedal}} \\cdot \\frac{\\cos \\theta}{\\sin \\phi} $$'
    ],
    faqQuestion: 'How does {noun} affect cycling biomechanics?',
    faqAnswer: '{noun} plays a critical role in kinetic chain alignment. Biomechanists use {attribute} to optimize joint angles, maximize muscular economy, and prevent repetitive strain injuries.',
    generateBody: (title, noun, attribute, formula) => `## 1. Biomechanical Impact on Professional Athletes
At the elite level of cycling, small modifications in bike dimensions can lead to massive changes in neuromuscular recruitment and metabolic efficiency. **${noun}** is a critical variable in maintaining joint health and maximizing force application. Through **${attribute}**, professional fitters analyze the rider's kinetic chain to align the joints for optimal torque delivery.

For riders competing in the Tour de France, maintaining joint angles within safe physiological margins (e.g., knee extension angle between $140^{\\circ}$ and $150^{\\circ}$ at bottom dead center) is crucial to prevent repetitive strain injuries like patellofemoral pain syndrome or Achilles tendonitis over 21 consecutive days of racing.

## 2. Biomechanical Modeling and Formulas
To mathematically represent the joint force vectors and leverage associated with **${noun}**, we apply trigonometric link-node models of the lower limbs:

${formula}

Where:
*   $L_{\\text{saddle}}$ is the saddle height calculated via the Lemond or 109% inseam formulas, serving as the baseline for joint flexion.
*   $\\theta_{\\text{knee}}$ is the dynamic knee angle, modeled using the cosine rule where $a$, $b$, and $c$ represent the femur length, tibia length, and effective seat height.
*   $F_{\\text{joint}}$ represents the shear force acting on the knee joint as a function of the pedaling force and joint extension angles.

## 3. Practical Fitting Protocols & ${attribute}
Implementing **${attribute}** within a professional sports medicine environment involves high-frequency motion capture and saddle pressure mapping:
1.  **Neuromuscular Activation**: Optimizing joint extension angles maximizes gluteus and quadriceps recruitment, reducing dependency on calf muscles and conserving glycogen.
2.  **Pressure Distribution**: Reducing peak saddle pressure prevents pelvic tilt and lumbar spinal misalignment, stabilizing the core to support high-torque climbing.
3.  **Lateral Cleat Stance (Q-Factor)**: Proper stance width prevents varus/valgus knee tracking, ensuring that the force vector remains perpendicular to the pedal spindle throughout the entire power phase.
`
  },
  'power-pedaling': {
    nouns: [
      'Strain Gauge Wheatstone Bridge', 'Tangential Pedal Force', 'Radial Pedal Force', 'Effective Pedal Force', 
      'Dead Center Crank Transition', 'Angular Crank Velocity', 'Drivetrain Rotational Inertia', 
      'Chain Tension Dynamics', 'Oval Chainring Mechanical Advantage', 'Pedaling Effectiveness Index', 
      'Torque Ripple Factor', 'Bottom Bracket Flex Losses', 'Pedal Center Offset Lateral Forces', 
      'Gross Metabolic Efficiency', 'Neuromuscular Coordination', 'Muscular Co-contraction', 
      'Force-Velocity Relationship', 'Ankle Joint Torque', 'Hip Extension Torque', 'Knee Extension Mechanics'
    ],
    attributes: [
      'Mathematical Modeling', 'Biomechanical Efficiency', 'Hardware Calibration', 'Signal Processing', 
      'Loss Analysis', 'Optimal Delivery', 'Real-Time Estimation', 'Laboratory Protocol', 
      'Data Interpretation', 'Computational Algorithm'
    ],
    formulas: [
      '$$ P(t) = \\tau(t) \\cdot \\omega(t) $$',
      '$$ \\text{TE} = \\frac{\\int F_{\\text{tangential}} \\, dt}{\\int F_{\\text{total}} \\, dt} \\cdot 100\\% $$',
      '$$ \\text{PS} = \\frac{P_{\\text{avg}}}{P_{\\text{peak}}} \\cdot 100\\% $$',
      '$$ \\tau = F \\cdot r \\cdot \\sin \\theta $$'
    ],
    faqQuestion: 'How is {noun} calculated in cycling metrics?',
    faqAnswer: '{noun} is analyzed via high-frequency telemetry. Implementing {attribute} helps isolate inefficiencies in the pedaling stroke and minimize metabolic waste.',
    generateBody: (title, noun, attribute, formula) => `## 1. Mechanical Principles of Power Generation
In competitive cycling, mechanical power is the final common path of athletic output. Understanding **${noun}** is essential for optimizing the mechanical energy transferred from the muscles to the rear hub. Through **${attribute}**, coaches and engineers evaluate how force is distributed throughout the $360^{\\circ}$ pedal stroke, with a specific focus on dead center transitions.

For professional sprinters and time trialists, minimizing resistive radial forces (forces pushing directly into the crank arm) and maximizing tangential forces (forces perpendicular to the crank arm) is key to increasing Torque Effectiveness ($TE$) and reducing energy losses.

## 2. Mathematical Formulation & Torque Dynamics
The instantaneous mechanical power and crank torque relation of **${noun}** is modeled as:

${formula}

Where:
*   $P(t)$ is the instantaneous power in Watts.
*   $\\tau(t)$ represents the crank torque vector, which is the cross product of the crank arm position vector and the applied pedal force vector.
*   $\\omega(t)$ is the dynamic angular velocity of the crank, which varies slightly within each stroke due to resistance changes.
*   $\\text{TE}$ and $\\text{PS}$ represent Torque Effectiveness and Pedal Smoothness, respectively, tracking force application efficiency.

## 3. Engineering Analysis & ${attribute}
Utilizing **${attribute}** in real-time power analysis allows for precise bio-feedback training:
1.  **Wheatstone Bridge Calibration**: Ensuring that temperature drift does not skew strain gauge voltage outputs maintains power meter accuracy within $\\pm 1\\%$.
2.  **Oval Chainring Mechanical Advantage**: By dynamically altering the virtual crank arm radius, oval chainrings can reduce dead-spot torque requirements, smoothing out the torque ripple factor.
3.  **Pedal Center Offset (PCO)**: Analyzing lateral force distributions on the pedal spindle helps fitters adjust cleat shims, ensuring that the downward force vector is perfectly centered to prevent bottom bracket flex losses.
`
  },
  'sensor-telemetry': {
    nouns: [
      'Kalman Filter State Covariance', 'Nyquist-Shannon Sampling Rate', 'MEMS Accelerometer Gravity Subtraction', 
      'Temperature Drift Polynomial', 'IMU Gyroscope Bias Drift', 'Barometric Sensor Pressure Lag', 
      'Firmware-Level Run-Length Encoding', 'MEMS IMU Noise filtering', '6-Axis Sensor Fusion', 
      'Optical Heart Rate HRV Sensor', 'Infrared Tire Temperature Sensor', 'Wind Speed Anemometer', 
      'Piezoelectric Cadence Sensor', 'ANT+ Broadcast Inter-Packet Latency', 'Bluetooth LE GATT Service Buffer', 
      'Sensor Re-connection Log', 'Ultra-Low-Power Sleep Logic', 'Wireless Signal Attenuation', 
      'Electromagnetic Interference', 'Battery Degradation Modeling'
    ],
    attributes: [
      'Hardware Architecture', 'Firmware Optimization', 'Signal Noise Mitigation', 'Calibration Algorithm', 
      'Data Integrity Check', 'Latency Assessment', 'Power Management', 'Protocol Analysis', 
      'Sensor Calibration', 'Mathematical Filtering'
    ],
    formulas: [
      '$$ x_k = A x_{k-1} + B u_k + w_k $$',
      '$$ f_{\\text{nyquist}} = 2 \\cdot f_{\\text{max}} $$',
      '$$ V_{\\text{comp}} = V_{\\text{raw}} - \\alpha \\cdot (T - T_0) $$',
      '$$ q_k = q_{k-1} \\otimes \\Delta q $$'
    ],
    faqQuestion: 'Why is {noun} critical for accurate cycling metrics?',
    faqAnswer: '{noun} ensures the fidelity of raw telemetry. Applying {attribute} minimizes measurement drift, prevents signal dropouts, and guarantees sensor reliability under extreme field conditions.',
    generateBody: (title, noun, attribute, formula) => `## 1. Embedded Sensors & State Estimation
Modern professional cycling relies heavily on high-frequency telemetry data to capture real-time aerodynamic and biomechanical variables. **${noun}** represents a primary challenge in embedded sensor design. Using **${attribute}**, hardware engineers must process raw accelerometer and gyroscope signals to estimate the rider's pitch, roll, and dynamic acceleration.

For WorldTour teams using real-time aero sensors, keeping IMU drift and barometric lag to a minimum is essential to ensure that calculated CdA values remain stable under transient wind gusts and sudden grade variations.

## 2. Sensor State and Calibration Formulas
To resolve the noise and drift associated with **${noun}**, we apply discrete state-space filtering algorithms:

${formula}

Where:
*   $x_k$ represents the estimated state vector (e.g., rider attitude or elevation), estimated recursively using a Kalman filter.
*   $f_{\\text{nyquist}}$ is the minimum sampling frequency required to capture high-frequency pedal vibrations without aliasing, according to the Nyquist-Shannon theorem.
*   $V_{\\text{comp}}$ represents the temperature-compensated sensor voltage output, correcting drift using a polynomial calibration coefficient $\\alpha$.
*   $q_k$ represents the quaternion vector used to calculate Euler angles without gimbal lock.

## 3. Hardware Implementation and ${attribute}
Applying **${attribute}** to cycling hardware design involves rigorous validation:
1.  **6-Axis Sensor Fusion**: Combining triaxial accelerometers and gyroscopes using a complementary filter compensates for fast gyroscope drift and slow accelerometer noise.
2.  **Gravity Subtraction Vector**: To measure true acceleration, the gravity vector must be dynamically subtracted from the raw accelerometer readings, requiring precise attitude estimation.
3.  **Low-Power Firmware Compression**: Real-time run-length encoding reduces ANT+/BLE transmission bandwidth, extending battery life while maintaining a high sampling rate.
`
  },
  'integrations': {
    nouns: [
      'ANT+ Bicycle Power Profile', 'Bluetooth LE Cycling Speed GATT', 'FIT File Binary Format', 
      'Garmin Fit SDK Field Injection', 'TrainingPeaks API OAuth2', 'Strava API Webhooks', 
      'Intervals.icu REST API', 'Golden Cheetah Custom Python', 'Wahoo API Companion', 
      'Garmin Connect IQ Background', 'RAW IMU Data WebSocket', 'Cycling Telemetry Broker MQTT', 
      'JSON Schema Validation', 'FIT File Record Compression', 'Offline Data Sync Conflict', 
      'Cycling Database Schema', 'GDPR GPS Tracking Compliance', 'Heart Rate Variability Export'
    ],
    attributes: [
      'Software Engineering', 'API Integration', 'Data Serialization', 'Performance Optimization', 
      'Security Compliance', 'Database Architecture', 'Protocol Parsing', 'Real-Time Streaming', 
      'Synchronization Logic', 'Custom Scripting'
    ],
    formulas: [
      '$$ H(X) = - \\sum_{i=1}^n P(x_i) \\log_2 P(x_i) $$',
      '$$ T_{\\text{transfer}} = \\frac{\\text{Size}_{\\text{payload}}}{\\text{Bandwidth}} + \\text{RTT} $$',
      '$$ \\text{Compression Ratio} = \\frac{\\text{Size}_{\\text{raw}}}{\\text{Size}_{\\text{compressed}}} $$'
    ],
    faqQuestion: 'How does {noun} integrate into the cycling data ecosystem?',
    faqAnswer: '{noun} acts as a bridging layer for raw telemetry. Utilizing {attribute} allows developers and scientists to aggregate metrics from disparate sensors into cohesive analytic pipelines.',
    generateBody: (title, noun, attribute, formula) => `## 1. System Integration & Open Data Flow
In the modern cycling data ecosystem, sensor metrics must flow seamlessly from local hardware to cloud analysis suites like TrainingPeaks or Golden Cheetah. **${noun}** serves as the protocol foundation for this data routing. Through **${attribute}**, software engineers build robust pipelines to serialize and parse binary streams.

For professional teams, ensuring that high-frequency raw sensor data (such as 100Hz pedaling force profiles) can be exported without data corruption or packet loss is critical for retrospective coaching analysis and bike development.

## 2. Serialization and Transmission Mathematics
To evaluate the transmission efficiency and latency of **${noun}**, we apply communication theory equations:

${formula}

Where:
*   $H(X)$ is the Shannon entropy of the telemetry data stream, defining the theoretical compression limit.
*   $T_{\\text{transfer}}$ represents the latency of exporting activity data to cloud APIs, including network round-trip time ($RTT$).
*   $\\text{Compression Ratio}$ measures the efficiency of binary serialization protocols (such as FIT or Protobuf) over verbose formats.

## 3. Data Integration & ${attribute}
Applying **${attribute}** ensures data fidelity across training platforms:
1.  **Garmin Connect IQ SDK Injection**: Developers can inject custom developer fields (like real-time CdA or tire pressure metrics) directly into standard FIT file records for native viewing.
2.  **Webhook Sync Pipelines**: Setting up secure OAuth2 APIs and webhooks guarantees that ride telemetry is synced to analysis databases immediately after the ride completes.
3.  **Conflict Resolution**: Handling offline synchronization conflicts prevents data duplication when a head unit uploads via both Bluetooth and Wi-Fi simultaneously.
`
  },
  'training-racing': {
    nouns: [
      'VO2max Submaximal Extrapolation', 'Lactate Threshold LT1 and LT2', 'Heart Rate Decoupling Index', 
      'Chronic Training Load CTL', 'Acute Training Load ATL', 'Training Stress Balance TSB', 
      'W-Prime Depletion and Reconstitution', 'Critical Power 3-Parameter', 'VLaMax Anaerobic Capacity', 
      'Glycolytic Carbohydrate Combustion', 'Heart Rate Variability RMSSD', 'EPOC Ventilation Proxy', 
      'Muscle Oxygenation SmO2 NIRS', 'Glycogen Depletion Kinetics', 'Sodium Sweat Concentration', 
      'Altitude Acclimatization Response', 'Heat Acclimation Blood Plasma', 'Anaerobic Work Capacity FRC', 
      'Substrate Oxidation RER', 'Fatigue Index Multi-Stage'
    ],
    attributes: [
      'Physiological Modeling', 'Training Stress Quantification', 'Performance Prediction', 'Adaptation Mechanics', 
      'Metabolic Calculation', 'Fatigue Management', 'Intensity Optimization', 'Aerobic Efficiency', 
      'Anaerobic Capacity Evaluation', 'Supercompensation Forecasting'
    ],
    formulas: [
      '$$ \\text{CTL}_t = \\text{CTL}_{t-1} \\cdot e^{-1/42} + \\text{TSS} \\cdot (1 - e^{-1/42}) $$',
      '$$ \\text{ATL}_t = \\text{ATL}_{t-1} \\cdot e^{-1/7} + \\text{TSS} \\cdot (1 - e^{-1/7}) $$',
      '$$ \\text{TSB}_t = \\text{CTL}_{t-1} - \\text{ATL}_{t-1} $$',
      '$$ VO_2 = V_E \\cdot (F_I O_2 - F_E O_2) $$'
    ],
    faqQuestion: 'How can athletes use {noun} to improve training?',
    faqAnswer: '{noun} is a fundamental indicator of physical stress or adaptation. By utilizing {attribute}, coaches can structure recovery cycles, fine-tune training intensity, and peak precisely for key events.',
    generateBody: (title, noun, attribute, formula) => `## 1. Physiological Modeling of Sports Performance
For elite athletes preparing for the grueling demands of grand tours, training is guided by physiological models rather than intuition. **${noun}** represents a core metric in defining metabolic thresholds and muscle fatigue limits. Through **${attribute}**, coaches model the athlete's aerobic and anaerobic energy systems to predict peak performance windows.

During altitude blocks in St. Moritz or Sierra Nevada, tracking the adaptation kinetics of this metric helps sports scientists calculate the exact rate of erythropoietin (EPO) stimulation, blood plasma expansion, and metabolic decoupling to ensure peak supercompensation on race day.

## 2. Metabolic and Training Load Formulas
To quantify the physiological stress and adaptation associated with **${noun}**, we apply exponential moving average models:

${formula}

Where:
*   $\\text{CTL}_t$ and $\\text{ATL}_t$ represent Chronic and Acute Training Load, modeled using exponential decay constants of 42 days and 7 days.
*   $\\text{TSB}_t$ is the Training Stress Balance, predicting peak performance windows when the value shifts from negative to positive.
*   $VO_2$ represents the oxygen consumption rate, calculated as a function of ventilation volumes ($V_E$) and oxygen concentration differentials.

## 3. Practical Coaching Implementation & ${attribute}
Applying **${attribute}** to training plan design yields measurable physiological shifts:
1.  **VLaMax Anaerobic Capacity Management**: Fine-tuning VLaMax through low-cadence torque blocks or high-intensity intervals controls carbohydrate combustion rates, sparing valuable glycogen for final stage sprints.
2.  **Heart Rate Decoupling**: Measuring the separation between heart rate and mechanical power during long endurance rides serves as an indicator of aerobic efficiency and cardiac drift.
3.  **W\' Reconstitution Dynamics**: Real-time modeling of $W\'$ recharge rates allows team directors to optimize pacing strategies for time trials and calculate recovery intervals between climbs.
`
  },
  'use-cases': {
    nouns: [
      'Professional Cycling Team Time Trial', 'Bike Fitters Kinematics Integration', 'Elite Triathletes Aero Testing', 
      'OEM Bike Manufacturers Frame Compliance', 'Sports Science Labs VLaMax Assessment', 'Cycling Coaches Aerobic Decoupling', 
      'Frame Aerodynamic Testing Velodrome', 'Gravel Cycling Vibration Sensor', 'Mountain Bike Suspension Potentiometer', 
      'E-Bike Motor Torque Sensor', 'Junior Cyclist Talent Identification', 'Masters Cyclist Cardiac Drift', 
      'Track Sprinter Crank Torque', 'Indoor Trainer Virtual Inertia', 'Rehab Clinicians Post-Surgery'
    ],
    attributes: [
      'Case Study', 'Field Protocol', 'Data Analysis', 'Optimization Workflow', 
      'Engineering Validation', 'Coaching Strategy', 'Biomechanical Assessment', 'Aerodynamic Profiling', 
      'Hardware Integration', 'Performance Evaluation'
    ],
    formulas: [
      '$$ P_{\\text{total}} = P_{\\text{gravity}} + P_{\\text{aero}} + P_{\\text{rr}} + P_{\\text{drivetrain}} $$',
      '$$ a_{\\text{vibration}} = \\sqrt{\\frac{1}{T} \\int_0^T [a(t)]^2 \\, dt} $$',
      '$$ \\eta_{\\text{drafting}} = 1 - \\frac{CdA_{\\text{drafted}}}{CdA_{\\text{solo}}} $$'
    ],
    faqQuestion: 'What does the {noun} case study demonstrate?',
    faqAnswer: 'The case study highlights the practical impact of telemetry. By applying {attribute}, stakeholders can make evidence-based decisions that translate directly into competitive advantages or functional improvements.',
    generateBody: (title, noun, attribute, formula) => `## 1. Case Study & Engineering Application
In competitive sports engineering, theoretical models must be validated under rigorous field conditions. This case study details the application of telemetry tools to **${noun}**. Utilizing **${attribute}**, engineers and sports scientists gather raw sensor metrics to evaluate aerodynamic drag, frame vibration dampening, or muscular force vectors.

For professional teams (such as Swiss-based Tudor Pro Cycling) optimizing team time trial alignments, analyzing drafting coefficients using dual-sensor wind speed telemetry allows directors to arrange riders to minimize cumulative group aerodynamic resistance.

## 2. Mechanical Power and Vibration Physics
To model the resistive forces and mechanical energy losses analyzed in **${noun}**, we apply first-principles physical equations:

${formula}

Where:
*   $P_{\\text{total}}$ represents the total mechanical power output required to overcome gravity, aerodynamic drag, rolling resistance, and drivetrain friction.
*   $a_{\\text{vibration}}$ is the root-mean-square acceleration of frame vibration, measured via triaxial accelerometers to evaluate dampening characteristics.
*   $\\eta_{\\text{drafting}}$ represents the drafting efficiency coefficient, representing the percentage reduction in CdA when riding in a slipstream.

## 3. Practical Field Implementations & ${attribute}
Applying **${attribute}** to real-world performance problems yields measurable improvements:
1.  **Suspension Telemetry Validation**: Utilizing linear potentiometers on mountain bike forks allows suspension engineers to analyze compression and rebound rates, optimizing traction on rough descents.
2.  **Chung Virtual Elevation Field Protocols**: Conducting constant-power loops on outdoor roads allows triathletes to calculate aerodynamic CdA with $\\pm 1.5\\%$ precision without a wind tunnel.
3.  **Pedal Stroke Optimization**: Tracking pedal force vectors dynamically on commercial fit bikes assists fitters in modifying cleat alignment to eliminate knee strain post-surgery.
`
  }
};

const PILLAR_SLUGS = {
  'aerodynamics-cda': 'cycling-aerodynamics-cda-guide',
  'bike-fitting': 'bike-fitting-biomechanics-guide',
  'power-pedaling': 'cycling-power-pedaling-guide',
  'sensor-telemetry': 'cycling-sensors-telemetry-guide',
  'training-racing': 'training-racing-cycling-data-guide',
  'integrations': 'cycling-data-ecosystem-guide',
  'use-cases': 'cycling-telemetry-use-cases',
  'glossary': 'cycling-science-glossary'
};

function cleanSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // collapse double hyphens
}

async function main() {
  console.log('Starting seed-wiki-taxonomy script (Tour de France & Swiss UCI high-depth upgrade)...');

  
  const allFiles = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') && f !== 'redundancy_report.md');
  for (const f of allFiles) {
    const match = f.match(/^(\d+)-/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx >= 109) {
        fs.unlinkSync(path.join(DRAFTS_DIR, f));
      }
    }
  }

  
  const existingFiles = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') && f !== 'redundancy_report.md');
  const existingSlugs = new Set();
  const existingClusters = {};

  for (const f of existingFiles) {
    const raw = fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf8');
    const { data } = matter(raw);
    const slug = data.slug || path.basename(f, '.md');
    existingSlugs.add(slug);

    const c = data.cluster || 'none';
    existingClusters[c] = (existingClusters[c] || 0) + 1;
  }

  console.log('Existing articles count:', existingFiles.length);
  console.log('Existing clusters distribution:', existingClusters);

  
  const TARGET_COUNT = 125;
  let currentFileIndex = 109; 

  for (const [clusterName, data] of Object.entries(TAXONOMY)) {
    
    
    const currentCount = existingClusters[clusterName] || 0;
    const needToGenerate = TARGET_COUNT - currentCount;
    console.log(`Cluster "${clusterName}": current ${currentCount}, need to generate ${needToGenerate}`);

    if (needToGenerate <= 0) {
      console.log(`Cluster "${clusterName}" already has ${currentCount} articles, skipping.`);
      continue;
    }

    let generatedForThisCluster = 0;
    
    outerLoop:
    for (let i = 0; i < data.nouns.length; i++) {
      for (let j = 0; j < data.attributes.length; j++) {
        if (generatedForThisCluster >= needToGenerate) {
          break outerLoop;
        }

        const noun = data.nouns[i];
        const attribute = data.attributes[j];
        const title = `Understanding ${noun} through ${attribute}`;
        const slug = cleanSlug(`${clusterName}-${noun}-${attribute}`);

        if (existingSlugs.has(slug)) {
          continue;
        }

        
        const formula = data.formulas[generatedForThisCluster % data.formulas.length];

        
        const faqQuestion = data.faqQuestion.replace('{noun}', noun).replace('{attribute}', attribute);
        const faqAnswer = data.faqAnswer.replace('{noun}', noun).replace('{attribute}', attribute);

        
        const metaTitle = `${noun} & ${attribute}`;
        const metaDescription = `Deep-dive study on ${noun} in cycling sports science. Discover the mechanical equations and mathematical optimization using ${attribute}.`;

        
        const bodyContent = `---
slug: ${slug}
title: "${title}"
metaTitle: "${metaTitle}"
metaDescription: "${metaDescription}"
cluster: ${clusterName}
isPillar: false
pillarSlug: "${PILLAR_SLUGS[clusterName]}"
locale: en
focusKeyword: "${noun.toLowerCase()}"
faqJson:
  - question: "${faqQuestion}"
    answer: "${faqAnswer}"
---

# ${title}

${data.generateBody(title, noun, attribute, formula)}

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
`;

        const filename = `${String(currentFileIndex).padStart(3, '0')}-${slug}.md`;
        const filePath = path.join(DRAFTS_DIR, filename);

        fs.writeFileSync(filePath, bodyContent, 'utf8');

        existingSlugs.add(slug);
        generatedForThisCluster++;
        currentFileIndex++;
      }
    }

    console.log(`Generated ${generatedForThisCluster} articles for cluster "${clusterName}".`);
  }

  
  const finalFiles = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') && f !== 'redundancy_report.md');
  console.log(`Successfully finished! Total articles in directory now: ${finalFiles.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
