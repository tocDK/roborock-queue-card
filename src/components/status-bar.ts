import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig } from '../types';
import { getStatusLabel } from '../const';
import { t } from '../localize';

@customElement('rqc-status-bar')
export class RqcStatusBar extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;

  private _getDeviceName(): string {
    // vacuum.max → max
    return this.config.entity.replace('vacuum.', '');
  }

  private _getEntityState(entityId: string): string | undefined {
    return this.hass.states[entityId]?.state;
  }

  private _getBatteryLevel(): number {
    const name = this._getDeviceName();
    const val = this._getEntityState(`sensor.${name}_battery`);
    return val ? parseInt(val, 10) : 0;
  }

  private _getBatteryColor(level: number): string {
    if (level > 50) return 'var(--label-badge-green, #43a047)';
    if (level > 20) return 'var(--label-badge-yellow, #fbc02d)';
    return 'var(--label-badge-red, #ef5350)';
  }

  private _getBatteryIcon(level: number): string {
    if (level > 80) return 'mdi:battery';
    if (level > 60) return 'mdi:battery-80';
    if (level > 40) return 'mdi:battery-60';
    if (level > 20) return 'mdi:battery-40';
    if (level > 10) return 'mdi:battery-20';
    return 'mdi:battery-alert';
  }

  private _getStatusText(): string {
    const vacuumState = this.hass.states[this.config.entity];
    if (!vacuumState) return t('status.error');
    const state = vacuumState.state;
    return getStatusLabel(state) ?? state;
  }

  private _getCurrentRoom(): string | null {
    const name = this._getDeviceName();
    const room = this._getEntityState(`sensor.${name}_current_room`);
    if (!room || room === 'unknown' || room === 'unavailable') return null;
    return room;
  }

  private _isMopAttached(): boolean {
    const name = this._getDeviceName();
    return this._getEntityState(`binary_sensor.${name}_mop_attached`) === 'on';
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const battery = this._getBatteryLevel();
    const batteryColor = this._getBatteryColor(battery);
    const batteryIcon = this._getBatteryIcon(battery);
    const status = this._getStatusText();
    const currentRoom = this._getCurrentRoom();
    const mopAttached = this._isMopAttached();

    return html`
      <div class="status-bar">
        <div class="status-item">
          <ha-icon
            .icon=${batteryIcon}
            style="color: ${batteryColor}; --mdc-icon-size: 18px;"
          ></ha-icon>
          <span class="status-value">${battery}%</span>
        </div>

        <div class="divider"></div>

        <div class="status-item">
          <ha-icon icon="mdi:robot-vacuum" style="--mdc-icon-size: 18px;"></ha-icon>
          <span class="status-value">${status}</span>
        </div>

        ${currentRoom ? html`
          <div class="divider"></div>
          <div class="status-item">
            <ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 18px;"></ha-icon>
            <span class="status-label">${t('status.room')}:</span>
            <span class="status-value">${currentRoom}</span>
          </div>
        ` : nothing}

        <div class="divider"></div>

        <div class="status-item">
          <ha-icon
            .icon=${mopAttached ? 'mdi:hydro-power' : 'mdi:close-circle-outline'}
            style="--mdc-icon-size: 18px; color: ${mopAttached ? 'var(--label-badge-green, #43a047)' : 'var(--secondary-text-color)'};"
          ></ha-icon>
          <span class="status-value">${mopAttached ? t('status.mop_attached') : t('status.mop_not_attached')}</span>
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .status-bar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: var(--card-background-color, #fff);
        border-radius: 10px;
        box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0,0,0,0.08));
        flex-wrap: wrap;
      }
      .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
      }
      .status-label {
        color: var(--secondary-text-color);
      }
      .status-value {
        font-weight: 600;
      }
      .divider {
        width: 1px;
        height: 24px;
        background: var(--divider-color, rgba(0,0,0,0.08));
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-status-bar': RqcStatusBar;
  }
}
