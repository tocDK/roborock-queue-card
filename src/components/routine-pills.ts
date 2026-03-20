import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, PresetConfig } from '../types';
import { t } from '../localize';

interface NativeRoutine {
  entityId: string;
  name: string;
}

@customElement('rqc-routine-pills')
export class RqcRoutinePills extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;

  private _getDeviceName(): string {
    return this.config.entity.replace('vacuum.', '');
  }

  private _getPresets(): PresetConfig[] {
    const queueState = this.hass.states[this.config.queue_sensor];
    const presets = queueState?.attributes?.presets;
    if (!presets || typeof presets !== 'object') return [];
    // presets is a dict like {name: {name, steps, icon?}} — convert to array
    if (Array.isArray(presets)) return presets;
    return Object.entries(presets).map(([key, val]: [string, any]) => ({
      name: val.name ?? key,
      icon: val.icon,
      steps: val.steps ?? [],
    }));
  }

  private _getNativeRoutines(): NativeRoutine[] {
    const name = this._getDeviceName();
    const prefix = `button.${name}_`;
    const routines: NativeRoutine[] = [];

    for (const entityId of Object.keys(this.hass.states)) {
      if (entityId.startsWith(prefix) && !entityId.includes('reset_')) {
        const friendlyName =
          this.hass.states[entityId].attributes.friendly_name ??
          entityId.replace(prefix, '').replace(/_/g, ' ');
        routines.push({ entityId, name: friendlyName });
      }
    }
    return routines;
  }

  private async _handlePresetTap(presetName: string): Promise<void> {
    await this.hass.callService('roborock_mcp', 'queue_preset', {
      preset: presetName,
    });
  }

  private async _handleNativeRoutineTap(entityId: string): Promise<void> {
    await this.hass.callService('button', 'press', {
      entity_id: entityId,
    });
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const presets = this._getPresets();
    const nativeRoutines = this._getNativeRoutines();

    if (presets.length === 0 && nativeRoutines.length === 0) return nothing;

    return html`
      <div class="routines-section">
        <h3>${t('routines.title')}</h3>
        <div class="routines-scroll">
          ${(presets || []).map(
            (preset) => html`
              <button
                class="routine-pill"
                @click=${() => this._handlePresetTap(preset.name)}
              >
                <ha-icon
                  .icon=${preset.icon ?? 'mdi:play-circle-outline'}
                  style="--mdc-icon-size: 16px;"
                ></ha-icon>
                <span>${preset.name}</span>
              </button>
            `
          )}
          ${(nativeRoutines || []).map(
            (routine) => html`
              <button
                class="routine-pill native"
                @click=${() => this._handleNativeRoutineTap(routine.entityId)}
              >
                <ha-icon
                  icon="mdi:robot-vacuum"
                  style="--mdc-icon-size: 16px;"
                ></ha-icon>
                <span>${routine.name}</span>
                <span class="native-badge">R</span>
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .routines-section {
        margin-bottom: 16px;
      }
      h3 {
        font-size: 14px;
        font-weight: 600;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .routines-scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        -webkit-overflow-scrolling: touch;
      }
      .routines-scroll::-webkit-scrollbar {
        height: 4px;
      }
      .routines-scroll::-webkit-scrollbar-thumb {
        background: var(--divider-color, rgba(0,0,0,0.08));
        border-radius: 2px;
      }
      .routine-pill {
        flex-shrink: 0;
        padding: 10px 16px;
        border: 2px solid var(--divider-color, rgba(0,0,0,0.08));
        border-radius: 24px;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 48px;
        white-space: nowrap;
        position: relative;
      }
      .routine-pill:hover {
        border-color: var(--primary-color, #2196f3);
        background: var(--primary-color-light, #e3f2fd);
      }
      .routine-pill:active {
        transform: scale(0.95);
      }
      .native-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color, #2196f3);
        color: white;
        font-size: 10px;
        font-weight: 700;
        margin-left: 2px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-routine-pills': RqcRoutinePills;
  }
}
