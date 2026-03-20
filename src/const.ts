export const CARD_VERSION = '0.1.0';

export const MODE_LABELS: Record<string, string> = {
  vacuum: 'Støvsug',
  mop: 'Vask',
  deep: 'Dyb',
};

export const MODE_ICONS: Record<string, string> = {
  vacuum: 'mdi:vacuum',
  mop: 'mdi:water',
  deep: 'mdi:auto-fix',
};

export const STATUS_LABELS: Record<string, string> = {
  idle: 'Klar',
  running: 'Rengør',
  paused: 'Pauset',
  docked: 'Docket',
  cleaning: 'Rengør',
  returning: 'Returnerer',
  charging: 'Oplader',
  error: 'Fejl',
};
