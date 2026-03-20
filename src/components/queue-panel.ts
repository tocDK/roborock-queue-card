import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, CleaningMode, FanSpeed, WaterLevel } from '../types';
import { getModeLabel, MODE_ICONS, guessRoomIcon } from '../const';
import { t } from '../localize';

export interface QueueItem {
  room: string;
  mode: CleaningMode;
  fanSpeed?: FanSpeed;
  waterLevel?: WaterLevel;
}

const MODES: CleaningMode[] = ['vacuum', 'mop', 'deep'];
const FAN_SPEEDS: FanSpeed[] = ['quiet', 'balanced', 'turbo', 'max'];
const WATER_LEVELS: WaterLevel[] = ['low', 'medium', 'high'];

const FAN_SPEED_LABELS: Record<FanSpeed, string> = {
  quiet: 'settings.quiet',
  balanced: 'settings.balanced',
  turbo: 'settings.turbo',
  max: 'settings.max',
};

const WATER_LEVEL_LABELS: Record<WaterLevel, string> = {
  low: 'settings.low',
  medium: 'settings.medium',
  high: 'settings.high',
};

const MINUTES_PER_STEP: Record<CleaningMode, number> = {
  vacuum: 5,
  mop: 5,
  deep: 10,
};

@customElement('rqc-queue-panel')
export class RqcQueuePanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;
  @property({ type: Array }) public selectedRooms: string[] = [];
  @property({ type: String }) public defaultMode: CleaningMode = 'vacuum';
  @property({ type: Array }) public queueItems: QueueItem[] = [];
  @property({ type: String }) public defaultFanSpeed: FanSpeed = 'balanced';
  @property({ type: String }) public defaultWaterLevel: WaterLevel = 'medium';

  @state() private _expandedSettingsIndex: number | null = null;

  private _handleModeChange(mode: CleaningMode): void {
    this.dispatchEvent(
      new CustomEvent('mode-changed', {
        detail: { mode },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleDefaultFanSpeedChange(fanSpeed: FanSpeed): void {
    this.dispatchEvent(
      new CustomEvent('default-fan-speed-changed', {
        detail: { fanSpeed },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleDefaultWaterLevelChange(waterLevel: WaterLevel): void {
    this.dispatchEvent(
      new CustomEvent('default-water-level-changed', {
        detail: { waterLevel },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleItemModeToggle(index: number): void {
    const currentMode = this.queueItems[index]?.mode ?? this.defaultMode;
    const nextIndex = (MODES.indexOf(currentMode) + 1) % MODES.length;
    this.dispatchEvent(
      new CustomEvent('item-mode-changed', {
        detail: { index, mode: MODES[nextIndex] },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleRemoveItem(index: number): void {
    this.dispatchEvent(
      new CustomEvent('room-removed', {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleItemSettingChanged(index: number, setting: 'fanSpeed' | 'waterLevel', value: string): void {
    this.dispatchEvent(
      new CustomEvent('item-setting-changed', {
        detail: { index, setting, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _toggleItemSettings(index: number): void {
    this._expandedSettingsIndex = this._expandedSettingsIndex === index ? null : index;
  }

  private async _handleStart(): Promise<void> {
    const steps = (this.queueItems || []).map((item) => {
      const step: Record<string, string> = {
        room: item.room,
        mode: item.mode,
      };
      // Include fan speed if it differs from default
      const effectiveFanSpeed = item.fanSpeed ?? this.defaultFanSpeed;
      const effectiveWaterLevel = item.waterLevel ?? this.defaultWaterLevel;

      if (item.mode === 'vacuum' || item.mode === 'deep') {
        step.fan_speed = effectiveFanSpeed;
      }
      if (item.mode === 'mop' || item.mode === 'deep') {
        step.water_level = effectiveWaterLevel;
      }
      return step;
    });
    await this.hass.callService('roborock_mcp', 'queue_start', { steps });
  }

  private _handleClear(): void {
    this._expandedSettingsIndex = null;
    this.dispatchEvent(
      new CustomEvent('queue-cleared', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _getEstimatedTime(): number {
    let total = 0;
    for (const item of this.queueItems) {
      total += MINUTES_PER_STEP[item.mode];
    }
    return total;
  }

  private _getRoomIcon(roomName: string): string {
    if (this.config.rooms?.[roomName]?.icon) {
      return this.config.rooms[roomName].icon!;
    }
    return guessRoomIcon(roomName);
  }

  private _showFanSpeed(mode: CleaningMode): boolean {
    return mode === 'vacuum' || mode === 'deep';
  }

  private _showWaterLevel(mode: CleaningMode): boolean {
    return mode === 'mop' || mode === 'deep';
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const estimatedTime = this._getEstimatedTime();

    return html`
      <div class="queue-panel">
        <div class="panel-header">
          <h2>${t('queue.title')}</h2>
          <div class="mode-label">${t('queue.default_mode')}</div>
          <div class="mode-pills">
            ${MODES.map(
              (mode) => html`
                <button
                  class="mode-pill ${this.defaultMode === mode ? 'active' : ''}"
                  @click=${() => this._handleModeChange(mode)}
                >
                  <ha-icon .icon=${MODE_ICONS[mode]} style="--mdc-icon-size: 16px;"></ha-icon>
                  ${getModeLabel(mode)}
                </button>
              `
            )}
          </div>

          <!-- Default settings based on selected mode -->
          ${this._renderDefaultSettings()}
        </div>

        <div class="queue-section">
          ${this.queueItems.length === 0
            ? html`
                <div class="queue-empty">
                  <ha-icon icon="mdi:clipboard-text-outline" style="--mdc-icon-size: 40px; opacity: 0.4;"></ha-icon>
                  <p>${t('queue.empty')}</p>
                </div>
              `
            : html`
                <div class="queue-list">
                  ${(this.queueItems || []).map(
                    (item, index) => html`
                      <div class="q-item-wrapper">
                        <div class="q-item">
                          <div class="q-item-num">${index + 1}</div>
                          <ha-icon
                            .icon=${this._getRoomIcon(item.room)}
                            style="--mdc-icon-size: 18px;"
                          ></ha-icon>
                          <span class="q-item-name">${item.room}</span>
                          <button
                            class="q-item-mode"
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              this._handleItemModeToggle(index);
                            }}
                            title="Skift tilstand"
                          >
                            <ha-icon .icon=${MODE_ICONS[item.mode]} style="--mdc-icon-size: 16px;"></ha-icon>
                          </button>
                          <button
                            class="q-item-settings ${this._expandedSettingsIndex === index ? 'active' : ''}"
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              this._toggleItemSettings(index);
                            }}
                            title="Indstillinger"
                          >
                            <ha-icon icon="mdi:tune-vertical" style="--mdc-icon-size: 16px;"></ha-icon>
                          </button>
                          <button
                            class="q-item-remove"
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              this._handleRemoveItem(index);
                            }}
                            title="Fjern"
                          >
                            <ha-icon icon="mdi:close" style="--mdc-icon-size: 16px;"></ha-icon>
                          </button>
                        </div>
                        ${item.mode === 'deep'
                          ? html`
                              <div class="deep-substeps">
                                <div class="substep">
                                  <ha-icon icon="mdi:vacuum" style="--mdc-icon-size: 14px;"></ha-icon>
                                  <span>${t('mode.vacuum')}</span>
                                </div>
                                <div class="substep">
                                  <ha-icon icon="mdi:water" style="--mdc-icon-size: 14px;"></ha-icon>
                                  <span>${t('mode.mop')}</span>
                                </div>
                              </div>
                            `
                          : nothing}
                        ${this._expandedSettingsIndex === index
                          ? this._renderItemSettings(item, index)
                          : nothing}
                      </div>
                    `
                  )}
                </div>
              `}
        </div>

        <div class="panel-controls">
          ${this.queueItems.length > 0
            ? html`
                <div class="estimated-time">
                  <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size: 14px;"></ha-icon>
                  ${t('queue.estimate')}: ${t('queue.estimate_no_data')}
                </div>
              `
            : nothing}
          <button
            class="btn btn-primary"
            @click=${this._handleStart}
            ?disabled=${this.queueItems.length === 0}
          >
            <ha-icon icon="mdi:play" style="--mdc-icon-size: 18px;"></ha-icon>
            ${t('queue.start')}
          </button>
          <button
            class="btn btn-clear"
            @click=${this._handleClear}
            ?disabled=${this.queueItems.length === 0}
          >
            ${t('queue.clear')}
          </button>
        </div>
      </div>
    `;
  }

  private _renderDefaultSettings() {
    const showFan = this._showFanSpeed(this.defaultMode);
    const showWater = this._showWaterLevel(this.defaultMode);

    if (!showFan && !showWater) return nothing;

    return html`
      <div class="default-settings">
        ${showFan
          ? html`
              <div class="setting-row">
                <div class="setting-label">${t('settings.fan_speed')}</div>
                <div class="setting-pills small">
                  ${FAN_SPEEDS.map(
                    (speed) => html`
                      <button
                        class="setting-pill ${this.defaultFanSpeed === speed ? 'active' : ''}"
                        @click=${() => this._handleDefaultFanSpeedChange(speed)}
                      >
                        ${t(FAN_SPEED_LABELS[speed])}
                      </button>
                    `
                  )}
                </div>
              </div>
            `
          : nothing}
        ${showWater
          ? html`
              <div class="setting-row">
                <div class="setting-label">${t('settings.water_level')}</div>
                <div class="setting-pills small">
                  ${WATER_LEVELS.map(
                    (level) => html`
                      <button
                        class="setting-pill ${this.defaultWaterLevel === level ? 'active' : ''}"
                        @click=${() => this._handleDefaultWaterLevelChange(level)}
                      >
                        ${t(WATER_LEVEL_LABELS[level])}
                      </button>
                    `
                  )}
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _renderItemSettings(item: QueueItem, index: number) {
    const showFan = this._showFanSpeed(item.mode);
    const showWater = this._showWaterLevel(item.mode);

    if (!showFan && !showWater) return nothing;

    const currentFanSpeed = item.fanSpeed ?? this.defaultFanSpeed;
    const currentWaterLevel = item.waterLevel ?? this.defaultWaterLevel;

    return html`
      <div class="item-settings">
        ${showFan
          ? html`
              <div class="setting-row compact">
                <div class="setting-label">${t('settings.fan_speed')}</div>
                <div class="setting-pills tiny">
                  ${FAN_SPEEDS.map(
                    (speed) => html`
                      <button
                        class="setting-pill ${currentFanSpeed === speed ? 'active' : ''} ${item.fanSpeed === speed ? 'overridden' : ''}"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this._handleItemSettingChanged(index, 'fanSpeed', speed);
                        }}
                      >
                        ${t(FAN_SPEED_LABELS[speed])}
                      </button>
                    `
                  )}
                </div>
              </div>
            `
          : nothing}
        ${showWater
          ? html`
              <div class="setting-row compact">
                <div class="setting-label">${t('settings.water_level')}</div>
                <div class="setting-pills tiny">
                  ${WATER_LEVELS.map(
                    (level) => html`
                      <button
                        class="setting-pill ${currentWaterLevel === level ? 'active' : ''} ${item.waterLevel === level ? 'overridden' : ''}"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this._handleItemSettingChanged(index, 'waterLevel', level);
                        }}
                      >
                        ${t(WATER_LEVEL_LABELS[level])}
                      </button>
                    `
                  )}
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .queue-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .panel-header {
        padding: 20px;
        border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.08));
      }
      .panel-header h2 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 16px 0;
      }
      .mode-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .mode-pills {
        display: flex;
        gap: 6px;
        background: var(--secondary-background-color);
        padding: 4px;
        border-radius: 10px;
      }
      .mode-pill {
        flex: 1;
        padding: 10px 8px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 48px;
      }
      .mode-pill.active {
        background: var(--card-background-color, #fff);
        color: var(--primary-color, #2196f3);
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        font-weight: 600;
      }
      .mode-pill:active {
        transform: scale(0.95);
      }

      /* Default settings */
      .default-settings {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .setting-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .setting-row.compact {
        gap: 3px;
      }
      .setting-label {
        font-size: 10px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 600;
      }
      .setting-pills {
        display: flex;
        gap: 4px;
        background: var(--secondary-background-color);
        padding: 3px;
        border-radius: 8px;
      }
      .setting-pills.small {
        /* default size for default settings area */
      }
      .setting-pills.tiny {
        padding: 2px;
        border-radius: 6px;
      }
      .setting-pill {
        flex: 1;
        padding: 6px 4px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
        white-space: nowrap;
      }
      .setting-pill.active {
        background: var(--card-background-color, #fff);
        color: var(--primary-color, #2196f3);
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        font-weight: 600;
      }
      .setting-pill.overridden {
        /* Visual hint that this is a per-room override */
      }
      .setting-pill:active {
        transform: scale(0.95);
      }
      .setting-pills.tiny .setting-pill {
        padding: 4px 3px;
        font-size: 10px;
        border-radius: 5px;
      }

      .queue-section {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }
      .queue-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
      .queue-empty p {
        margin-top: 12px;
      }
      .queue-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .q-item-wrapper {
        display: flex;
        flex-direction: column;
      }
      .q-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--secondary-background-color);
        transition: all 0.2s;
        min-height: 52px;
      }
      .q-item-num {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--primary-color, #2196f3);
        color: white;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .q-item-name {
        font-size: 14px;
        font-weight: 500;
        flex: 1;
        min-width: 0;
        overflow-wrap: break-word;
      }
      .q-item-mode {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: background 0.15s;
        flex-shrink: 0;
        color: var(--primary-text-color);
      }
      .q-item-mode:hover {
        background: rgba(0,0,0,0.06);
      }
      .q-item-mode:active {
        transform: scale(0.9);
      }
      .q-item-settings {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.15s;
        flex-shrink: 0;
        color: var(--secondary-text-color);
        opacity: 0.5;
      }
      .q-item-settings:hover {
        opacity: 1;
        background: rgba(0,0,0,0.06);
      }
      .q-item-settings.active {
        opacity: 1;
        color: var(--primary-color, #2196f3);
        background: rgba(33, 150, 243, 0.1);
      }
      .q-item-remove {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        opacity: 0.5;
        transition: all 0.15s;
      }
      .q-item-remove:hover {
        opacity: 1;
        background: rgba(239,83,80,0.1);
        color: var(--error-color, #ef5350);
      }
      .deep-substeps {
        display: flex;
        gap: 12px;
        padding: 4px 0 4px 48px;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .substep {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      /* Per-room item settings */
      .item-settings {
        padding: 8px 14px 10px 48px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--secondary-background-color);
        border-radius: 0 0 10px 10px;
        margin-top: -2px;
        border-top: 1px solid var(--divider-color, rgba(0,0,0,0.06));
      }

      .estimated-time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
        justify-content: center;
      }
      .panel-controls {
        padding: 16px 20px;
        border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .btn {
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.15s ease;
        min-height: 52px;
      }
      .btn:active {
        transform: scale(0.97);
      }
      .btn:disabled {
        opacity: 0.35;
        cursor: default;
        transform: none !important;
      }
      .btn-primary {
        background: var(--primary-color, #2196f3);
        color: white;
      }
      .btn-primary:hover:not(:disabled) {
        filter: brightness(0.9);
      }
      .btn-clear {
        background: transparent;
        color: var(--secondary-text-color);
        font-weight: 500;
        font-size: 13px;
        min-height: 40px;
        padding: 8px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-queue-panel': RqcQueuePanel;
  }
}
