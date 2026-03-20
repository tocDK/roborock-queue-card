/**
 * Simple translation system for the Roborock Queue Card.
 * Default language: Danish (da). Falls back to Danish for missing keys.
 */

const translations: Record<string, Record<string, string>> = {
  da: {
    // Status bar
    'status.battery': 'Batteri',
    'status.docked': 'Docket',
    'status.cleaning': 'Rengør',
    'status.returning': 'Returnerer',
    'status.charging': 'Oplader',
    'status.paused': 'Pauset',
    'status.error': 'Fejl',
    'status.idle': 'Klar',
    'status.room': 'Rum',
    'status.mop_attached': 'Moppe monteret',
    'status.mop_not_attached': 'Moppe ikke monteret',
    'status.running': 'Rengør',

    // Common
    'common.on': 'Til',
    'common.off': 'Fra',

    // Routines
    'routines.title': 'Rutiner',

    // Room grid
    'rooms.empty': 'Ingen rum tilgængelige',
    'rooms.cleaning': 'Rengør...',
    'rooms.done': 'Færdig',

    // Queue panel
    'queue.title': 'Rengøringskø',
    'queue.default_mode': 'Standardtilstand for nye rum',
    'queue.empty': 'Tryk på rum for at tilføje til køen',
    'queue.start': 'Start rengøring',
    'queue.clear': 'Ryd valg',
    'queue.estimate_no_data': 'Ingen data endnu',
    'queue.estimate': 'Estimeret',

    // Modes
    'mode.vacuum': 'Støvsug',
    'mode.mop': 'Vask',
    'mode.deep': 'Dyb',

    // Queue controls (running)
    'controls.progress': 'Fremgang',
    'controls.pause': 'Pause',
    'controls.resume': 'Genoptag',
    'controls.skip': 'Spring over',
    'controls.cancel': 'Annuller',
    'controls.step': 'Trin',
    'controls.of': 'af',
    'controls.completed': 'Fuldført',
    'controls.in_progress': 'I gang',
    'controls.pending': 'Venter',
    'controls.skipped': 'Sprunget over',
    'controls.cleaning_in_progress': 'Rengøring i gang',

    // Maintenance
    'maintenance.title': 'Vedligeholdelse',
    'maintenance.reset': 'Nulstil',
    'maintenance.main_brush': 'Hovedbørste',
    'maintenance.side_brush': 'Sidebørste',
    'maintenance.filter': 'Filter',
    'maintenance.sensors': 'Sensorer',
    'maintenance.dock_strainer': 'Dock si',
    'maintenance.overdue': 'Udskiftning påkrævet!',
    'maintenance.hours_left': 'timer tilbage',
    'maintenance.mop_attached': 'Moppe monteret',
    'maintenance.water_shortage': 'Vandmangel',
    'maintenance.dirty_water': 'Beskidt vandbeholder',
    'maintenance.clean_water': 'Ren vandbeholder',
    'maintenance.child_lock': 'Børnesikring',
    'maintenance.dock_error': 'Dock fejl',
    'maintenance.mop_drying': 'Moppe tørring',
    'maintenance.total_cleanings': 'Rengøringer',
    'maintenance.total_area': 'Areal',
    'maintenance.total_time': 'Tid',

    // Dock diagnostics
    'dock.title': 'Dock',
    'dock.clean_water': 'Ren vandbeholder',
    'dock.dirty_water': 'Beskidt vandbeholder',
    'dock.error': 'Dock fejl',
    'dock.mop_drying': 'Moppe tørring',
    'dock.mop_drying_time': 'Tørretid',
    'dock.strainer': 'Dock si',
    'dock.ok': 'OK',
    'dock.problem': 'Problem',
    'dock.running': 'Kører',
    'dock.idle': 'Inaktiv',

    // Settings
    'settings.fan_speed': 'Sugestyrke',
    'settings.water_level': 'Vandmængde',
    'settings.quiet': 'Stille',
    'settings.balanced': 'Balanceret',
    'settings.turbo': 'Turbo',
    'settings.max': 'Max',
    'settings.low': 'Lav',
    'settings.medium': 'Medium',
    'settings.high': 'Høj',

    // Pause reasons
    'pause_reason.user_paused': 'Sat på pause af bruger',
    'pause_reason.vacuum_error': 'Robotstøvsuger fejl',
    'pause_reason.retry_exhausted': 'Alle forsøg fejlede',
    'pause_reason.timeout': 'Timeout — robot svarede ikke',
    'pause_reason.unexpected_dock': 'Robot vendte uventet tilbage til dock',
  },
  en: {
    'status.battery': 'Battery',
    'status.docked': 'Docked',
    'status.cleaning': 'Cleaning',
    'status.returning': 'Returning',
    'status.charging': 'Charging',
    'status.paused': 'Paused',
    'status.error': 'Error',
    'status.idle': 'Ready',
    'status.room': 'Room',
    'status.mop_attached': 'Mop attached',
    'status.mop_not_attached': 'Mop not attached',
    'status.running': 'Cleaning',

    'common.on': 'On',
    'common.off': 'Off',

    'routines.title': 'Routines',

    'rooms.empty': 'No rooms available',
    'rooms.cleaning': 'Cleaning...',
    'rooms.done': 'Done',

    'queue.title': 'Cleaning Queue',
    'queue.default_mode': 'Default mode for new rooms',
    'queue.empty': 'Tap a room to add to queue',
    'queue.start': 'Start cleaning',
    'queue.clear': 'Clear selection',
    'queue.estimate_no_data': 'No data yet',
    'queue.estimate': 'Estimated',

    'mode.vacuum': 'Vacuum',
    'mode.mop': 'Mop',
    'mode.deep': 'Deep',

    'controls.progress': 'Progress',
    'controls.pause': 'Pause',
    'controls.resume': 'Resume',
    'controls.skip': 'Skip',
    'controls.cancel': 'Cancel',
    'controls.step': 'Step',
    'controls.of': 'of',
    'controls.completed': 'Completed',
    'controls.in_progress': 'In progress',
    'controls.pending': 'Pending',
    'controls.skipped': 'Skipped',
    'controls.cleaning_in_progress': 'Cleaning in progress',

    'maintenance.title': 'Maintenance',
    'maintenance.reset': 'Reset',
    'maintenance.main_brush': 'Main brush',
    'maintenance.side_brush': 'Side brush',
    'maintenance.filter': 'Filter',
    'maintenance.sensors': 'Sensors',
    'maintenance.dock_strainer': 'Dock strainer',
    'maintenance.overdue': 'Replacement needed!',
    'maintenance.hours_left': 'hours left',
    'maintenance.mop_attached': 'Mop attached',
    'maintenance.water_shortage': 'Water shortage',
    'maintenance.dirty_water': 'Dirty water box',
    'maintenance.clean_water': 'Clean water box',
    'maintenance.child_lock': 'Child lock',
    'maintenance.dock_error': 'Dock error',
    'maintenance.mop_drying': 'Mop drying',
    'maintenance.total_cleanings': 'Cleanings',
    'maintenance.total_area': 'Area',
    'maintenance.total_time': 'Time',

    'dock.title': 'Dock',
    'dock.clean_water': 'Clean water box',
    'dock.dirty_water': 'Dirty water box',
    'dock.error': 'Dock error',
    'dock.mop_drying': 'Mop drying',
    'dock.mop_drying_time': 'Drying time',
    'dock.strainer': 'Dock strainer',
    'dock.ok': 'OK',
    'dock.problem': 'Problem',
    'dock.running': 'Running',
    'dock.idle': 'Idle',

    // Settings
    'settings.fan_speed': 'Fan speed',
    'settings.water_level': 'Water level',
    'settings.quiet': 'Quiet',
    'settings.balanced': 'Balanced',
    'settings.turbo': 'Turbo',
    'settings.max': 'Max',
    'settings.low': 'Low',
    'settings.medium': 'Medium',
    'settings.high': 'High',

    // Pause reasons
    'pause_reason.user_paused': 'Paused by user',
    'pause_reason.vacuum_error': 'Vacuum error',
    'pause_reason.retry_exhausted': 'All retry attempts failed',
    'pause_reason.timeout': 'Timeout — robot not responding',
    'pause_reason.unexpected_dock': 'Robot unexpectedly returned to dock',
  },
};

let _currentLang = 'da';

export function setLanguage(lang: string): void {
  _currentLang = translations[lang] ? lang : 'da';
}

export function t(key: string): string {
  return translations[_currentLang]?.[key]
    ?? translations['da']?.[key]
    ?? key;
}
