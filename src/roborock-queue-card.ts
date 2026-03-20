import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig } from './types';
import { CARD_VERSION } from './const';

console.info(
  `%c ROBOROCK-QUEUE-CARD %c v${CARD_VERSION} `,
  'color: white; background: #3b82f6; font-weight: bold;',
  'color: #3b82f6; background: white; font-weight: bold;',
);

@customElement('roborock-queue-card')
export class RoborockQueueCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: RoborockQueueCardConfig;

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

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const vacuumState = this.hass.states[this._config.entity];
    const queueState = this.hass.states[this._config.queue_sensor];

    return html`
      <ha-card>
        <div class="card-content">
          <h2>🤖 Roborock Queue</h2>
          <p>Vacuum: ${vacuumState?.state ?? 'unavailable'}</p>
          <p>Queue: ${queueState?.state ?? 'unavailable'}</p>
          <p>Card loaded successfully! v${CARD_VERSION}</p>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        padding: 16px;
      }
      .card-content {
        padding: 8px;
      }
      h2 {
        margin: 0 0 8px 0;
        font-size: 1.2em;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'roborock-queue-card': RoborockQueueCard;
  }
}
