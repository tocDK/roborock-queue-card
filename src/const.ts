import { t } from './localize';

export const CARD_VERSION = '0.4.2';

export function getModeLabel(mode: string): string {
  return t(`mode.${mode}`);
}

export function getStatusLabel(status: string): string {
  return t(`status.${status}`);
}

export const MODE_ICONS: Record<string, string> = {
  vacuum: 'mdi:vacuum',
  mop: 'mdi:water',
  deep: 'mdi:auto-fix',
};

export const ROOM_ICON_MAP: Record<string, string> = {
  'køkken': 'mdi:countertop',
  'stue': 'mdi:sofa',
  'alrum': 'mdi:sofa-outline',
  'soveværelse': 'mdi:bed',
  'badeværelse': 'mdi:shower',
  'bad': 'mdi:shower',
  'bryggers': 'mdi:washing-machine',
  'garage': 'mdi:garage',
  'kontor': 'mdi:desk',
  'entre': 'mdi:door-open',
  'gang': 'mdi:door-open',
  'depot': 'mdi:package-variant-closed',
  'have': 'mdi:flower',
  'walk-in': 'mdi:hanger',
  'walk in': 'mdi:hanger',
  'multirum': 'mdi:gamepad-variant',
  'spise stue': 'mdi:silverware-variant',
  'børnebad': 'mdi:bathtub',
  'voksenbad': 'mdi:shower-head',
  'værelse': 'mdi:bed-outline',
  'kitchen': 'mdi:countertop',
  'living room': 'mdi:sofa',
  'bedroom': 'mdi:bed',
  'bathroom': 'mdi:shower',
  'hallway': 'mdi:door-open',
  'office': 'mdi:desk',
  'laundry': 'mdi:washing-machine',
  'closet': 'mdi:hanger',
  'dining': 'mdi:silverware-fork-knife',
};

export function guessRoomIcon(roomName: string): string {
  const lower = roomName.toLowerCase();
  if (ROOM_ICON_MAP[lower]) return ROOM_ICON_MAP[lower];
  for (const [key, icon] of Object.entries(ROOM_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'mdi:floor-plan';
}
