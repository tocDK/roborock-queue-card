import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig } from '../types';
import { t } from '../localize';

interface ConsumableItem {
  labelKey: string;
  sensorSuffix: string;
  resetSuffix: string | null;
  maxHours: number;
}

const CONSUMABLES: ConsumableItem[] = [
  { labelKey: 'maintenance.main_brush', sensorSuffix: 'main_brush_time_left', resetSuffix: 'reset_main_brush_consumable', maxHours: 300 },
  { labelKey: 'maintenance.side_brush', sensorSuffix: 'side_brush_time_left', resetSuffix: 'reset_side_brush_consumable', maxHours: 300 },
  { labelKey: 'maintenance.filter', sensorSuffix: 'filter_time_left', resetSuffix: 'reset_air_filter_consumable', maxHours: 300 },
  { labelKey: 'maintenance.sensors', sensorSuffix: 'sensor_time_left', resetSuffix: 'reset_sensor_consumable', maxHours: 300 },
  { labelKey: 'maintenance.dock_strainer', sensorSuffix: 'dock_strainer_time_left', resetSuffix: null, maxHours: 300 },
];

interface StatusIndicator {
  labelKey: string;
  entitySuffix: string;
  domain: string;
  warnWhenOn?: boolean;
}

const STATUS_INDICATORS: StatusIndicator[] = [
  { labelKey: 'maintenance.mop_attached', entitySuffix: 'mop_attached', domain: 'binary_sensor' },
  { labelKey: 'maintenance.water_shortage', entitySuffix: 'water_shortage', domain: 'binary_sensor', warnWhenOn: true },
  { labelKey: 'maintenance.dirty_water', entitySuffix: 'dock_dirty_water_box', domain: 'binary_sensor', warnWhenOn: true },
  { labelKey: 'maintenance.clean_water', entitySuffix: 'dock_clean_water_box', domain: 'binary_sensor' },
];

@customElement('rqc-maintenance-panel')
export class RqcMaintenancePanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;
  @state() private _expanded: boolean = false;

  private _getDeviceName(): string {
    return this.config.entity.replace('vacuum.', '');
  }

  private _getEntityState(entityId: string): string | undefined {
    return this.hass.states[entityId]?.state;
  }

  private _toggleExpanded(): void {
    this._expanded = !this._expanded;
  }

  private _getConsumableHoursLeft(sensorSuffix: string): number | null {
    const name = this._getDeviceName();
    const val = this._getEntityState(`sensor.${name}_${sensorSuffix}`);
    if (val === undefined || val === 'unavailable' || val === 'unknown') return null;
    return parseFloat(val);
  }

  private _getBarColor(pct: number): string {
    if (pct > 50) return 'green';
    if (pct > 20) return 'yellow';
    return 'red';
  }

  private async _handleReset(resetSuffix: string): Promise<void> {
    const name = this._getDeviceName();
    await this.hass.callService('button', 'press', {
      entity_id: `button.${name}_${resetSuffix}`,
    });
  }

  private _getIndicatorState(indicator: StatusIndicator): boolean {
    const name = this._getDeviceName();
    return this._getEntityState(`${indicator.domain}.${name}_${indicator.entitySuffix}`) === 'on';
  }

  private _getStatValue(sensorSuffix: string): string {
    const name = this._getDeviceName();
    const val = this._getEntityState(`sensor.${name}_${sensorSuffix}`);
    return val ?? '-';
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    return html`
      <div class="maintenance-section">
        <div class="maintenance-header" @click=${this._toggleExpanded}>
          <h3>
            <ha-icon icon="mdi:wrench" style="--mdc-icon-size: 18px;"></ha-icon>
            ${t('maintenance.title')}
          </h3>
          <ha-icon
            .icon=${this._expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
            style="--mdc-icon-size: 18px; color: var(--secondary-text-color);"
          ></ha-icon>
        </div>

        ${this._expanded
          ? html`
              <div class="maintenance-body">
                <!-- Consumables -->
                ${(CONSUMABLES || []).map((c) => this._renderConsumable(c))}

                <div class="divider"></div>

                <!-- Status indicators -->
                <div class="indicators">
                  ${(STATUS_INDICATORS || []).map((ind) => this._renderIndicator(ind))}
                </div>

                <div class="divider"></div>

                <!-- Stats -->
                <div class="stats-grid">
                  <div class="stat">
                    <div class="stat-value">${this._getStatValue('total_cleaning_count')}</div>
                    <div class="stat-label">${t('maintenance.total_cleanings')}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${this._formatArea(this._getStatValue('total_cleaning_area'))}</div>
                    <div class="stat-label">${t('maintenance.total_area')}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${this._formatTime(this._getStatValue('total_cleaning_time'))}</div>
                    <div class="stat-label">${t('maintenance.total_time')}</div>
                  </div>
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _formatArea(val: string): string {
    if (val === '-') return val;
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    return `${num.toLocaleString('da-DK')} m\u00B2`;
  }

  private _formatTime(val: string): string {
    if (val === '-') return val;
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    return `${num} t`;
  }

  private _renderConsumable(consumable: ConsumableItem) {
    const hoursLeft = this._getConsumableHoursLeft(consumable.sensorSuffix);
    if (hoursLeft === null) return nothing;

    const pct = Math.max(0, Math.min(100, (hoursLeft / consumable.maxHours) * 100));
    const isOverdue = hoursLeft < 0;
    const barColor = isOverdue ? 'red' : this._getBarColor(pct);
    const barWidth = isOverdue ? 100 : pct;

    return html`
      <div class="consumable-item">
        <div class="consumable-row">
          <div class="consumable-content">
            <div class="consumable-label">
              <span>${t(consumable.labelKey)}</span>
              <span class=${isOverdue ? 'overdue-text' : ''}>
                ${isOverdue
                  ? `${Math.abs(Math.round(hoursLeft))}h — OVERSKREDET`
                  : `${Math.round(hoursLeft)}h af ${consumable.maxHours}h`}
              </span>
            </div>
            <div class="consumable-bar">
              <div class="consumable-fill ${barColor}" style="width: ${barWidth}%"></div>
            </div>
            ${isOverdue
              ? html`<div class="overdue-warning">${t('maintenance.overdue')}</div>`
              : nothing}
          </div>
          ${consumable.resetSuffix
            ? html`
                <button
                  class="reset-btn"
                  @click=${() => this._handleReset(consumable.resetSuffix!)}
                >
                  ${t('maintenance.reset')}
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderIndicator(indicator: StatusIndicator) {
    const isOn = this._getIndicatorState(indicator);
    const isWarning = indicator.warnWhenOn && isOn;

    return html`
      <div class="indicator">
        <div class="indicator-label">
          <div class="indicator-dot ${isWarning ? 'warn' : isOn ? 'on' : 'off'}"></div>
          <span>${t(indicator.labelKey)}</span>
        </div>
        <span class="indicator-value">${isOn ? t('common.on') : t('common.off')}</span>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .maintenance-section {
        border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
      }
      .maintenance-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        cursor: pointer;
        min-height: 48px;
        transition: background 0.15s;
      }
      .maintenance-header:hover {
        background: var(--secondary-background-color);
      }
      .maintenance-header h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .maintenance-body {
        padding: 0 20px 16px;
      }
      .consumable-item {
        margin-bottom: 12px;
      }
      .consumable-item:last-of-type {
        margin-bottom: 0;
      }
      .consumable-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .consumable-content {
        flex: 1;
      }
      .consumable-label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 4px;
      }
      .consumable-label span:first-child {
        font-weight: 500;
      }
      .consumable-label span:last-child {
        color: var(--secondary-text-color);
      }
      .overdue-text {
        color: var(--error-color, #ef5350) !important;
      }
      .consumable-bar {
        height: 6px;
        background: var(--secondary-background-color);
        border-radius: 3px;
        overflow: hidden;
      }
      .consumable-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
      }
      .consumable-fill.green {
        background: var(--label-badge-green, #43a047);
      }
      .consumable-fill.yellow {
        background: var(--label-badge-yellow, #fbc02d);
      }
      .consumable-fill.red {
        background: var(--error-color, #ef5350);
      }
      .overdue-warning {
        font-size: 12px;
        font-weight: 600;
        color: var(--error-color, #ef5350);
        padding: 4px 0;
      }
      .reset-btn {
        background: transparent;
        border: 1px solid var(--primary-color, #2196f3);
        color: var(--primary-color, #2196f3);
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        min-height: 28px;
      }
      .reset-btn:hover {
        background: var(--primary-color-light, #e3f2fd);
      }
      .reset-btn:active {
        transform: scale(0.95);
      }
      .divider {
        height: 1px;
        background: var(--divider-color, rgba(0,0,0,0.08));
        margin: 14px 0;
      }
      .indicators {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .indicator {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 500;
      }
      .indicator-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .indicator-dot.on {
        background: var(--label-badge-green, #43a047);
      }
      .indicator-dot.off {
        background: var(--secondary-text-color);
        opacity: 0.3;
      }
      .indicator-dot.warn {
        background: var(--error-color, #ef5350);
      }
      .indicator-value {
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }
      .stat {
        text-align: center;
        padding: 8px 4px;
        background: var(--secondary-background-color);
        border-radius: 8px;
      }
      .stat-value {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .stat-label {
        font-size: 10px;
        color: var(--secondary-text-color);
        font-weight: 500;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-maintenance-panel': RqcMaintenancePanel;
  }
}
