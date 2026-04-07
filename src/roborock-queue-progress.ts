/**
 * Compact kiosk progress card for Roborock queue cleaning.
 * Shows only when queue is running. Hidden when idle.
 * Registered as custom:roborock-queue-progress
 */
import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, QueueStep, StepProgress, QueueProgress } from './types';
import { CARD_VERSION, getModeLabel, MODE_ICONS } from './const';
import { setLanguage, t } from './localize';

interface ProgressCardConfig {
  type: string;
  entity: string;
  queue_sensor: string;
  language?: string;
}

@customElement('roborock-queue-progress')
export class RoborockQueueProgress extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: ProgressCardConfig;

  public setConfig(config: ProgressCardConfig): void {
    if (!config.queue_sensor) {
      throw new Error('Please define a queue_sensor');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 3;
  }

  private _getQueueState(): string {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    return queueState?.state ?? 'idle';
  }

  private _getSteps(): QueueStep[] {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    return (queueState?.attributes?.steps as QueueStep[]) || [];
  }

  private _getProgress(): StepProgress | null {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    return queueState?.attributes?.progress || null;
  }

  private _getQueueProgress(): QueueProgress | null {
    const queueState = this.hass?.states[this._config?.queue_sensor];
    return queueState?.attributes?.queue_progress || null;
  }

  private _isPaused(): boolean {
    return this._getQueueState() === 'paused';
  }

  private _formatMinutes(seconds: number): string {
    return `${Math.round(seconds / 60)}`;
  }

  private async _handlePauseResume(): Promise<void> {
    if (this._isPaused()) {
      await this.hass.callService('roborock_mcp', 'queue_resume', {});
    } else {
      await this.hass.callService('roborock_mcp', 'queue_pause', {});
    }
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;

    const lang = this._config.language ?? this.hass?.language ?? 'da';
    setLanguage(lang);

    const state = this._getQueueState();
    if (state === 'idle') return nothing;

    const steps = this._getSteps();
    const progress = this._getProgress();
    const queueProgress = this._getQueueProgress();
    const paused = this._isPaused();

    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.status === 'completed').length;

    // Progress = elapsed / (elapsed + remaining)
    let progressPct: number;
    const elapsed = queueProgress?.total_elapsed_s || 0;
    const remaining = queueProgress?.estimated_remaining_s;
    if (remaining != null && (elapsed + remaining) > 0) {
      progressPct = Math.round((elapsed / (elapsed + remaining)) * 100);
    } else if (totalSteps > 0) {
      progressPct = Math.round((completedSteps / totalSteps) * 100);
    } else {
      progressPct = 0;
    }
    const clampedPct = Math.min(progressPct, 99);

    return html`
      <ha-card>
        <div class="header">${t('progress.header') || 'STØVSUGER'}</div>

        <!-- Current step + progress -->
        ${(() => {
          const activeStep = progress
            ? { room: progress.step_room, mode: progress.step_mode }
            : steps.find(s => s.status === 'in_progress');
          return activeStep ? html`
            <div class="current-step">
              <div class="step-info">
                <ha-icon .icon=${MODE_ICONS[activeStep.mode] || 'mdi:robot-vacuum'} style="--mdc-icon-size: 20px;"></ha-icon>
                <span class="step-label">${activeStep.room} · ${getModeLabel(activeStep.mode)}</span>
              </div>
              <span class="step-pct">${clampedPct}%</span>
            </div>
          ` : html`
            <div class="current-step">
              <div class="step-info">
                <ha-icon icon="mdi:robot-vacuum" style="--mdc-icon-size: 20px;"></ha-icon>
                <span class="step-label">${paused ? t('status.paused') : t('status.cleaning')}</span>
              </div>
              <span class="step-pct">${clampedPct}%</span>
            </div>
          `;
        })()}

        <div class="progress-bar">
          <div class="progress-fill ${paused ? 'paused' : ''}" style="width: ${clampedPct}%"></div>
        </div>

        <!-- Stats rows -->
        <div class="stats">
          ${queueProgress?.total_battery_used != null ? html`
            <div class="stat-row">
              <ha-icon icon="mdi:battery-minus" style="--mdc-icon-size: 18px;"></ha-icon>
              <span class="stat-label">${t('progress.battery')} ${t('progress.battery_used')}</span>
              <span class="stat-value">${queueProgress.total_battery_used}%</span>
            </div>
          ` : nothing}

          ${queueProgress?.estimated_remaining_s != null ? html`
            <div class="stat-row">
              <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size: 18px;"></ha-icon>
              <span class="stat-label">${t('progress.time_remaining') || 'Resterende'}</span>
              <span class="stat-value">~${this._formatMinutes(queueProgress.estimated_remaining_s)} min</span>
            </div>
          ` : nothing}

          <div class="stat-row">
            <ha-icon icon="mdi:format-list-checks" style="--mdc-icon-size: 18px;"></ha-icon>
            <span class="stat-label">${t('controls.step')}</span>
            <span class="stat-value">${completedSteps + 1} ${t('controls.of')} ${totalSteps}</span>
          </div>
        </div>

        <!-- Room chips with mode -->
        <div class="room-chips">
          ${steps.map(step => html`
            <span class="chip ${step.status}">
              ${step.status === 'completed' ? '✓' : step.status === 'in_progress' ? '▶' : '○'}
              ${step.room}
              <ha-icon .icon=${MODE_ICONS[step.mode] || 'mdi:robot-vacuum'} style="--mdc-icon-size: 12px;"></ha-icon>
            </span>
          `)}
        </div>

        <!-- Pause/Resume button -->
        <button class="pause-btn ${paused ? 'paused' : ''}" @click=${this._handlePauseResume}>
          <ha-icon .icon=${paused ? 'mdi:play' : 'mdi:pause'} style="--mdc-icon-size: 18px;"></ha-icon>
          ${paused ? t('controls.resume') : t('controls.pause')}
        </button>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      ha-card {
        padding: 16px 20px;
      }
      .header {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
      }
      .current-step {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .step-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .step-label {
        font-size: 15px;
        font-weight: 600;
      }
      .step-pct {
        font-size: 15px;
        font-weight: 700;
        color: var(--primary-color, #2196f3);
      }
      .progress-bar {
        height: 8px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color, #2196f3), var(--label-badge-green, #43a047));
        border-radius: 4px;
        transition: width 1s ease;
      }
      .progress-fill.paused {
        background: var(--label-badge-yellow, #fbc02d);
      }
      .stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 14px;
      }
      .stat-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
      }
      .stat-row ha-icon {
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }
      .stat-label {
        color: var(--secondary-text-color);
        flex: 1;
      }
      .stat-value {
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .room-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 14px;
      }
      .chip {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }
      .chip.completed {
        background: color-mix(in srgb, var(--label-badge-green, #43a047) 15%, var(--card-background-color, #fff));
        color: var(--label-badge-green, #43a047);
      }
      .chip.in_progress {
        background: color-mix(in srgb, var(--primary-color, #2196f3) 15%, var(--card-background-color, #fff));
        color: var(--primary-color, #2196f3);
        font-weight: 600;
      }
      .pause-btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        transition: all 0.15s ease;
      }
      .pause-btn:active {
        transform: scale(0.97);
      }
      .pause-btn.paused {
        background: color-mix(in srgb, var(--label-badge-green, #43a047) 15%, var(--card-background-color, #fff));
        color: var(--label-badge-green, #43a047);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'roborock-queue-progress': RoborockQueueProgress;
  }
}
