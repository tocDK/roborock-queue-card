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

export interface StepProgress {
  step_index: number;
  step_room: string;
  step_mode: string;
  battery_start: number | null;
  battery_current: number | null;
  battery_used: number;
  step_elapsed_s: number;
  step_estimated_s: number | null;
  step_estimated_battery: number | null;
}

export interface QueueProgress {
  total_steps: number;
  completed_steps: number;
  battery_at_queue_start: number | null;
  battery_current: number | null;
  total_battery_used: number;
  total_elapsed_s: number;
  estimated_total_battery: number | null;
  estimated_total_s: number | null;
  estimated_remaining_s: number | null;
  steps_without_estimate: number;
}
