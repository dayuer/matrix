
import type { ClusterSlug } from '../types/blog';

export interface ClusterDef {
  slug: ClusterSlug;
  name: { en: string; id: string };
  description: { en: string; id: string };
}

export const CLUSTERS: ClusterDef[] = [
  {
    slug: 'aerodynamics-cda',
    name: { en: 'Aerodynamics & CdA', id: 'Aerodinamika & CdA' },
    description: {
      en: 'Real-time drag measurement, CdA, yaw, and aero position.',
      id: 'Pengukuran hambatan real-time, CdA, yaw, dan posisi aerodinamis.',
    },
  },
  {
    slug: 'bike-fitting',
    name: { en: 'Bike Fitting & Biomechanics', id: 'Bike Fitting & Biomekanika' },
    description: {
      en: 'Posture, pelvic stability, saddle and cleat data-driven fitting.',
      id: 'Postur, stabilitas panggul, fitting sadel dan cleat berbasis data.',
    },
  },
  {
    slug: 'power-pedaling',
    name: { en: 'Power & Pedaling Dynamics', id: 'Daya & Dinamika Pengayuhan' },
    description: {
      en: 'Power meters, pedaling efficiency, torque and balance.',
      id: 'Power meter, efisiensi pengayuhan, torsi dan keseimbangan.',
    },
  },
  {
    slug: 'sensor-telemetry',
    name: { en: 'Sensors & Telemetry', id: 'Sensor & Telemetri' },
    description: {
      en: 'IMU, sampling rate, ANT+/BLE, calibration and latency.',
      id: 'IMU, sampling rate, ANT+/BLE, kalibrasi dan latensi.',
    },
  },
  {
    slug: 'training-racing',
    name: { en: 'Training & Racing with Data', id: 'Pelatihan & Balapan dengan Data' },
    description: {
      en: 'Using aero and telemetry data to train smarter and race faster.',
      id: 'Menggunakan data aero dan telemetri untuk latihan dan balapan.',
    },
  },
  {
    slug: 'integrations',
    name: { en: 'Integrations & Ecosystem', id: 'Integrasi & Ekosistem' },
    description: {
      en: 'Garmin, Wahoo, Strava, TrainingPeaks, Zwift and the API.',
      id: 'Garmin, Wahoo, Strava, TrainingPeaks, Zwift dan API.',
    },
  },
  {
    slug: 'use-cases',
    name: { en: 'Use Cases & Personas', id: 'Kasus Penggunaan & Persona' },
    description: {
      en: 'Triathletes, time-trialists, fitters, coaches and labs.',
      id: 'Atlet triathlon, time-trial, fitter, pelatih dan laboratorium.',
    },
  },
  {
    slug: 'glossary',
    name: { en: 'Cycling Science Glossary', id: 'Glosarium Sains Bersepeda' },
    description: {
      en: 'Plain-language definitions of cycling science terms.',
      id: 'Definisi istilah sains bersepeda dalam bahasa sederhana.',
    },
  },
];

const CLUSTER_MAP = new Map<ClusterSlug, ClusterDef>(
  CLUSTERS.map((c) => [c.slug, c])
);

export function getCluster(slug: string | undefined | null): ClusterDef | undefined {
  if (!slug) return undefined;
  return CLUSTER_MAP.get(slug as ClusterSlug);
}
