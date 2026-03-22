export interface RoborockQueueCardConfig {
  type: string;
  entity: string;
  queue_sensor: string;
  rooms?: Record<string, RoomConfig>;
  show_maintenance?: boolean;
  show_routines?: boolean;
  show_status?: boolean;
  show_diagnostics?: boolean;
  language?: string;
}

export interface RoomConfig {
  icon?: string;
  name?: string;
}

export interface QueueStep {
  index: number;
  room: string;
  mode: 'vacuum' | 'mop' | 'deep';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface AvailableRoom {
  id: number;
  name: string;
  icon?: string;
}

export interface PresetConfig {
  name: string;
  icon?: string;
  steps: Array<{ room: string; mode: string }>;
}

export interface RoomHistoryEntry {
  last_cleaned: string;
  last_duration_s: number;
  avg_duration_s: number;
  clean_count: number;
}

export interface RoomHistory {
  [room: string]: {
    [mode: string]: RoomHistoryEntry;
  };
}

export interface ActiveRoutine {
  name: string;
  type: 'preset' | 'native';
}

export interface LastRunStep {
  room: string;
  mode: string;
  status: string;
}

export type CleaningMode = 'vacuum' | 'mop' | 'deep';

export type FanSpeed = 'quiet' | 'balanced' | 'turbo' | 'max';
export type WaterLevel = 'low' | 'medium' | 'high';
export type Passes = 1 | 2 | 3;
