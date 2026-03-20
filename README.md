# Roborock Queue Card

Custom Home Assistant Lovelace card for sequential room-by-room vacuum/mop queue cleaning.

## Requirements

- [roborock-mcp](https://github.com/tocDK/roborock-mcp) custom component (v3.0+)
- Home Assistant 2026.3+
- Roborock integration configured with area mapping

## Installation

### HACS (Recommended)
1. Add this repository as a custom repository in HACS
2. Install "Roborock Queue Card"
3. Add the card to your dashboard

### Manual
1. Download `roborock-queue-card.js` from the latest release
2. Copy to `config/www/roborock-queue-card/`
3. Add as a Lovelace resource: `/local/roborock-queue-card/roborock-queue-card.js`

## Configuration

```yaml
type: custom:roborock-queue-card
entity: vacuum.max
queue_sensor: sensor.roborock_mcp_queue
rooms:
  Idas værelse:
    icon: mdi:human-female-girl
  Tokes værelse:
    icon: mdi:human-male-boy
show_maintenance: true
show_routines: true
show_status: true
```

## Features

- Room card grid with tap-to-select and queue badge
- Cleaning mode selector (Støvsug / Vask / Dyb) with per-room override
- Predefined routines + Roborock native routines in one view
- Live queue progress with step statuses
- Pause / Resume / Skip / Cancel controls
- Vacuum status bar (battery, charging, current room)
- Maintenance panel (brush/filter life, reset buttons)
