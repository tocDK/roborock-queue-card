import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, CleaningMode, QueueStep, FanSpeed, WaterLevel, Passes } from './types';
import { CARD_VERSION } from './const';
import { setLanguage } from './localize';

// Import all sub-components
import './components/status-bar';
import './components/routine-pills';
import './components/room-grid';
import './components/queue-panel';
import './components/queue-controls';
import './components/maintenance-panel';
import './components/diagnostics-panel';
import './roborock-queue-progress';

console.info(
  `%c ROBOROCK-QUEUE-CARD %c v${CARD_VERSION} `,
  'color: white; background: #3b82f6; font-weight: bold;',
  'color: #3b82f6; background: white; font-weight: bold;',
);

interface QueueItem {
  room: string;
  mode: CleaningMode;
  fanSpeed?: FanSpeed;
  waterLevel?: WaterLevel;
}

@customElement('roborock-queue-card')
export class RoborockQueueCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: RoborockQueueCardConfig;
  @state() private _selectedRooms: string[] = [];
  @state() private _queueItems: QueueItem[] = [];
  @state() private _defaultMode: CleaningMode = 'vacuum';
  @state() private _defaultFanSpeed: FanSpeed = 'balanced';
  @state() private _defaultWaterLevel: WaterLevel = 'medium';
  @state() private _defaultPasses: Passes = 2;

  public setConfig(config: RoborockQueueCardConfig): void {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    if (!config.queue_sensor) {
      throw new Error('Please define a queue_sensor');
    }
    this._config = {
      show_maintenance: true,
      show_routines: true,
      show_status: true,
      ...config,
    };
  }

  public getCardSize(): number {
    return 6;
  }

  private _getQueueState(): string {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    return queueState?.state ?? 'idle';
  }

  private _isQueueRunning(): boolean {
    const state = this._getQueueState();
    return state === 'running' || state === 'paused';
  }

  private _isQueuePaused(): boolean {
    return this._getQueueState() === 'paused';
  }

  private _getRoomFloorTypes(): Record<string, string> {
    if (!this._config?.queue_sensor || !this.hass) return {};
    const sensorState = this.hass.states[this._config.queue_sensor];
    return sensorState?.attributes?.room_floor_types || {};
  }

  private _getQueueSteps(): QueueStep[] {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    if (!queueState?.attributes?.steps) return [];
    return queueState.attributes.steps as QueueStep[];
  }

  private _handleRoomSelected(e: CustomEvent): void {
    const roomName: string = e.detail.room;
    const index = this._selectedRooms.indexOf(roomName);

    if (index >= 0) {
      // Deselect: remove from both lists
      this._selectedRooms = this._selectedRooms.filter((r) => r !== roomName);
      this._queueItems = this._queueItems.filter((i) => i.room !== roomName);
    } else {
      // Select: add to both lists
      this._selectedRooms = [...this._selectedRooms, roomName];
      this._queueItems = [
        ...this._queueItems,
        { room: roomName, mode: this._defaultMode },
      ];
    }
  }

  private _handleModeChanged(e: CustomEvent): void {
    this._defaultMode = e.detail.mode as CleaningMode;
  }

  private _handleItemModeChanged(e: CustomEvent): void {
    const { index, mode } = e.detail;
    const items = [...this._queueItems];
    if (items[index]) {
      items[index] = { ...items[index], mode };
      this._queueItems = items;
    }
  }

  private _handleDefaultFanSpeedChanged(e: CustomEvent): void {
    this._defaultFanSpeed = e.detail.fanSpeed as FanSpeed;
  }

  private _handleDefaultWaterLevelChanged(e: CustomEvent): void {
    this._defaultWaterLevel = e.detail.waterLevel as WaterLevel;
  }

  private _handleDefaultPassesChanged(e: CustomEvent): void {
    this._defaultPasses = e.detail.passes as Passes;
  }

  private _handleItemSettingChanged(e: CustomEvent): void {
    const { index, setting, value } = e.detail;
    const items = [...this._queueItems];
    if (items[index]) {
      items[index] = { ...items[index], [setting]: value };
      this._queueItems = items;
    }
  }

  private _handleRoomRemoved(e: CustomEvent): void {
    const { index } = e.detail;
    const removed = this._queueItems[index];
    if (removed) {
      this._selectedRooms = this._selectedRooms.filter(
        (r) => r !== removed.room
      );
      this._queueItems = this._queueItems.filter((_, i) => i !== index);
    }
  }

  private _handleQueueCleared(): void {
    this._selectedRooms = [];
    this._queueItems = [];
  }

  private _handlePresetSelected(e: CustomEvent): void {
    const { steps } = e.detail;
    // Clear current queue and populate with preset steps
    const rooms: string[] = [];
    const items: QueueItem[] = [];
    for (const step of steps) {
      rooms.push(step.room);
      items.push({
        room: step.room,
        mode: step.mode as CleaningMode,
      });
    }
    this._selectedRooms = rooms;
    this._queueItems = items;
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    // Set language from config override or HA language, default to Danish
    const lang = this._config.language ?? this.hass?.language ?? 'da';
    setLanguage(lang);

    const isRunning = this._isQueueRunning();
    const isPaused = this._isQueuePaused();
    const queueSteps = this._getQueueSteps();

    return html`
      <ha-card>
        <!-- Status bar (full width) -->
        ${this._config.show_status !== false
          ? html`
              <rqc-status-bar
                .hass=${this.hass}
                .config=${this._config}
              ></rqc-status-bar>
            `
          : nothing}

        <!-- Routine pills (full width) -->
        ${this._config.show_routines !== false
          ? html`
              <div class="routines-wrapper">
                <rqc-routine-pills
                  .hass=${this.hass}
                  .config=${this._config}
                  @preset-selected=${this._handlePresetSelected}
                ></rqc-routine-pills>
              </div>
            `
          : nothing}

        <!-- Main layout: room grid + sidebar -->
        <div class="layout">
          <!-- Left: Room grid -->
          <div class="main-area">
            <rqc-room-grid
              .hass=${this.hass}
              .config=${this._config}
              .selectedRooms=${this._selectedRooms}
              .queueSteps=${queueSteps}
              .defaultMode=${this._defaultMode}
              .defaultFanSpeed=${this._defaultFanSpeed}
              .defaultWaterLevel=${this._defaultWaterLevel}
              .defaultPasses=${this._defaultPasses}
              @room-selected=${this._handleRoomSelected}
            ></rqc-room-grid>
          </div>

          <!-- Right: Queue panel or running controls -->
          <div class="sidebar">
            ${isRunning
              ? html`
                  <rqc-queue-controls
                    .hass=${this.hass}
                    .config=${this._config}
                    .steps=${queueSteps}
                    .isPaused=${isPaused}
                  ></rqc-queue-controls>
                `
              : html`
                  <rqc-queue-panel
                    .hass=${this.hass}
                    .config=${this._config}
                    .selectedRooms=${this._selectedRooms}
                    .defaultMode=${this._defaultMode}
                    .defaultFanSpeed=${this._defaultFanSpeed}
                    .defaultWaterLevel=${this._defaultWaterLevel}
                    .defaultPasses=${this._defaultPasses}
                    .queueItems=${this._queueItems}
                    .roomFloorTypes=${this._getRoomFloorTypes()}
                    @mode-changed=${this._handleModeChanged}
                    @default-fan-speed-changed=${this._handleDefaultFanSpeedChanged}
                    @default-water-level-changed=${this._handleDefaultWaterLevelChanged}
                    @default-passes-changed=${this._handleDefaultPassesChanged}
                    @item-mode-changed=${this._handleItemModeChanged}
                    @item-setting-changed=${this._handleItemSettingChanged}
                    @room-removed=${this._handleRoomRemoved}
                    @queue-cleared=${this._handleQueueCleared}
                  ></rqc-queue-panel>
                `}

            <!-- Maintenance panel (always at bottom of sidebar) -->
            ${this._config.show_maintenance !== false
              ? html`
                  <rqc-maintenance-panel
                    .hass=${this.hass}
                    .config=${this._config}
                  ></rqc-maintenance-panel>
                `
              : nothing}

            <!-- Diagnostics panel (opt-in) -->
            ${this._config.show_diagnostics === true
              ? html`
                  <rqc-diagnostics-panel
                    .hass=${this.hass}
                    .config=${this._config}
                  ></rqc-diagnostics-panel>
                `
              : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        container-type: inline-size;
      }
      ha-card {
        padding: 16px;
        overflow: hidden;
        box-sizing: border-box;
      }
      rqc-status-bar {
        margin-bottom: 16px;
      }
      .routines-wrapper {
        margin-bottom: 16px;
      }

      /* Default: single column (mobile) */
      .layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Medium screens: side-by-side */
      @container (min-width: 500px) {
        ha-card {
          padding: 16px 24px;
        }
        .layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 24px;
          min-height: 400px;
        }
      }

      /* Wide screens: more room */
      @container (min-width: 900px) {
        .layout {
          grid-template-columns: 1fr 400px;
          gap: 32px;
        }
      }

      .main-area {
        overflow-y: auto;
        min-width: 0;
      }
      .sidebar {
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color, rgba(0,0,0,0.08));
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 200px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'roborock-queue-card': RoborockQueueCard;
  }
}
