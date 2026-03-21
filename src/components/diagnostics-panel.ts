import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, AvailableRoom } from '../types';
import { t } from '../localize';

interface EntityCheck {
  label: string;
  entityId: string;
  state: string | undefined;
  exists: boolean;
}

@customElement('rqc-diagnostics-panel')
export class RqcDiagnosticsPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;
  @state() private _expanded = false;

  private _getDeviceName(): string {
    return this.config.entity.replace('vacuum.', '');
  }

  private _getExpectedEntities(): EntityCheck[] {
    const name = this._getDeviceName();
    const entities: Array<{ label: string; id: string }> = [
      { label: 'vacuum', id: this.config.entity },
      { label: 'battery', id: `sensor.${name}_battery` },
      { label: 'current_room', id: `sensor.${name}_current_room` },
      { label: 'status', id: `sensor.${name}_status` },
      { label: 'vacuum_error', id: `sensor.${name}_vacuum_error` },
      { label: 'dock_error', id: `sensor.${name}_dock_dock_error` },
      { label: 'mop_attached', id: `binary_sensor.${name}_mop_attached` },
      { label: 'water_shortage', id: `binary_sensor.${name}_water_shortage` },
      { label: 'queue_sensor', id: this.config.queue_sensor },
    ];

    return entities.map((e) => {
      const stateObj = this.hass.states[e.id];
      return {
        label: e.label,
        entityId: e.id,
        state: stateObj?.state,
        exists: !!stateObj,
      };
    });
  }

  private _getAvailableRooms(): AvailableRoom[] {
    const sensorState = this.hass.states[this.config.queue_sensor];
    return (sensorState?.attributes?.available_rooms as AvailableRoom[]) ?? [];
  }

  private _getQueueStatus(): string {
    return this.hass.states[this.config.queue_sensor]?.state ?? 'N/A';
  }

  private _getCurrentStepIndex(): string {
    const attrs = this.hass.states[this.config.queue_sensor]?.attributes;
    return attrs?.current_step_index?.toString() ?? 'N/A';
  }

  private _getPauseReason(): string {
    const attrs = this.hass.states[this.config.queue_sensor]?.attributes;
    return attrs?.pause_reason ?? 'N/A';
  }

  private _toggleExpanded(): void {
    this._expanded = !this._expanded;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const entities = this._getExpectedEntities();
    const rooms = this._getAvailableRooms();

    return html`
      <div class="diagnostics">
        <div class="header" @click=${this._toggleExpanded}>
          <ha-icon icon="mdi:bug" style="--mdc-icon-size: 18px;"></ha-icon>
          <span class="title">${t('diagnostics.title')}</span>
          <ha-icon
            icon=${this._expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
            style="--mdc-icon-size: 18px; margin-left: auto;"
          ></ha-icon>
        </div>

        ${this._expanded ? html`
          <div class="content">
            <!-- Entity check -->
            <div class="section">
              <div class="section-title">${t('diagnostics.entity_check')}</div>
              ${entities.map((e) => html`
                <div class="entity-row">
                  <ha-icon
                    icon=${e.exists ? 'mdi:check-circle' : 'mdi:alert-circle'}
                    style="--mdc-icon-size: 16px; color: ${e.exists ? 'var(--label-badge-green, #43a047)' : 'var(--label-badge-red, #ef5350)'};"
                  ></ha-icon>
                  <span class="entity-label">${e.label}</span>
                  <span class="entity-id">${e.entityId}</span>
                  <span class="entity-state">${e.exists ? e.state : t('diagnostics.missing')}</span>
                </div>
              `)}
            </div>

            <!-- Loaded rooms -->
            <div class="section">
              <div class="section-title">${t('diagnostics.loaded_rooms')} (${rooms.length})</div>
              ${rooms.length > 0 ? rooms.map((room) => html`
                <div class="room-row">
                  <span class="room-name">${room.name}</span>
                  <span class="room-id">${t('diagnostics.segment_id')}: ${room.id}</span>
                </div>
              `) : html`<div class="empty">${t('diagnostics.missing')}</div>`}
            </div>

            <!-- Queue sensor state -->
            <div class="section">
              <div class="section-title">${t('diagnostics.sensor_state')}</div>
              <div class="state-row">
                <span class="state-label">${t('diagnostics.queue_status')}:</span>
                <span class="state-value">${this._getQueueStatus()}</span>
              </div>
              <div class="state-row">
                <span class="state-label">${t('diagnostics.current_step')}:</span>
                <span class="state-value">${this._getCurrentStepIndex()}</span>
              </div>
              <div class="state-row">
                <span class="state-label">${t('diagnostics.pause_reason')}:</span>
                <span class="state-value">${this._getPauseReason()}</span>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .diagnostics {
        border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
      }
      .header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 600;
      }
      .header:hover {
        background: var(--secondary-background-color, rgba(0,0,0,0.03));
      }
      .title {
        flex: 1;
      }
      .content {
        padding: 0 16px 16px;
      }
      .section {
        margin-bottom: 16px;
      }
      .section:last-child {
        margin-bottom: 0;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }
      .entity-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 12px;
      }
      .entity-label {
        font-weight: 600;
        min-width: 100px;
      }
      .entity-id {
        color: var(--secondary-text-color);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .entity-state {
        font-family: monospace;
        font-size: 11px;
        background: var(--secondary-background-color, rgba(0,0,0,0.05));
        padding: 2px 6px;
        border-radius: 4px;
      }
      .room-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 12px;
      }
      .room-name {
        font-weight: 500;
      }
      .room-id {
        color: var(--secondary-text-color);
        font-family: monospace;
        font-size: 11px;
      }
      .state-row {
        display: flex;
        gap: 8px;
        padding: 4px 0;
        font-size: 12px;
      }
      .state-label {
        color: var(--secondary-text-color);
        min-width: 120px;
      }
      .state-value {
        font-weight: 500;
        font-family: monospace;
        font-size: 11px;
      }
      .empty {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-style: italic;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-diagnostics-panel': RqcDiagnosticsPanel;
  }
}
