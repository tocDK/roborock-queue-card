import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, QueueStep, StepProgress, QueueProgress } from '../types';
import { getModeLabel, MODE_ICONS } from '../const';
import { t } from '../localize';

@customElement('rqc-queue-controls')
export class RqcQueueControls extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;
  @property({ type: Array }) public steps: QueueStep[] = [];
  @property({ type: Boolean }) public isPaused: boolean = false;

  private _getCurrentStepIndex(): number {
    return ( this.steps || []).findIndex((s) => s.status === 'in_progress');
  }

  private _getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'mdi:check-circle';
      case 'in_progress':
        return 'mdi:circle-slice-8';
      case 'skipped':
        return 'mdi:close-circle-outline';
      default:
        return 'mdi:circle-outline';
    }
  }

  private _getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'var(--label-badge-green, #43a047)';
      case 'in_progress':
        return 'var(--primary-color, #2196f3)';
      case 'skipped':
        return 'var(--secondary-text-color)';
      default:
        return 'var(--disabled-text-color, #bdbdbd)';
    }
  }

  private _getPauseReason(): string | null {
    if (!this.config?.queue_sensor || !this.hass) return null;
    const sensorState = this.hass.states[this.config.queue_sensor];
    return sensorState?.attributes?.pause_reason || null;
  }

  private async _handlePause(): Promise<void> {
    await this.hass.callService('roborock_mcp', 'queue_pause', {});
  }

  private async _handleResume(): Promise<void> {
    await this.hass.callService('roborock_mcp', 'queue_resume', {});
  }

  private async _handleSkip(): Promise<void> {
    await this.hass.callService('roborock_mcp', 'queue_skip', {});
  }

  private async _handleCancel(): Promise<void> {
    await this.hass.callService('roborock_mcp', 'queue_cancel', {});
  }

  private _getProgress(): StepProgress | null {
    if (!this.config?.queue_sensor || !this.hass) return null;
    const sensorState = this.hass.states[this.config.queue_sensor];
    return sensorState?.attributes?.progress || null;
  }

  private _getQueueProgress(): QueueProgress | null {
    if (!this.config?.queue_sensor || !this.hass) return null;
    const sensorState = this.hass.states[this.config.queue_sensor];
    return sensorState?.attributes?.queue_progress || null;
  }

  private _formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  private _formatMinutes(seconds: number): string {
    return `${Math.round(seconds / 60)}`;
  }

  private _getCleanCount(stepProgress: StepProgress): number {
    if (!this.config?.queue_sensor || !this.hass) return 0;
    const sensorState = this.hass.states[this.config.queue_sensor];
    const history = sensorState?.attributes?.room_history || {};
    const roomData = history[stepProgress.step_room];
    if (!roomData) return 0;
    for (const [key, entry] of Object.entries(roomData)) {
      if (key.startsWith(stepProgress.step_mode + ':') && (entry as any)?.clean_count) {
        return (entry as any).clean_count;
      }
    }
    return 0;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const currentIndex = this._getCurrentStepIndex();
    const totalSteps = (this.steps || []).length;
    const completedSteps = (this.steps || []).filter(
      (s) => s.status === 'completed'
    ).length;
    const currentStep = currentIndex >= 0 ? this.steps[currentIndex] : null;
    const stepProgress = this._getProgress();
    const queueProgress = this._getQueueProgress();

    // Progress: completed steps + time fraction of current step
    let progressPct: number;
    if (totalSteps > 0) {
      let stepFraction = 0;
      if (stepProgress?.step_estimated_s) {
        stepFraction = Math.min(stepProgress.step_elapsed_s / stepProgress.step_estimated_s, 1);
      }
      progressPct = Math.round(((completedSteps + stepFraction) / totalSteps) * 100);
    } else {
      progressPct = 0;
    }

    return html`
      <div class="controls-panel">
        <div class="panel-header">
          <h2>${t('controls.cleaning_in_progress')}</h2>
        </div>

        ${this.isPaused && this._getPauseReason() ? html`
          <div class="pause-banner">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            <span>${t(`pause_reason.${this._getPauseReason()}`)}</span>
          </div>
        ` : nothing}

        <!-- Queue Progress Summary -->
        ${queueProgress ? html`
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">
                ${t('controls.step')} ${(queueProgress.completed_steps || 0) + 1} ${t('controls.of')} ${queueProgress.total_steps}
                ${currentStep ? ` — ${currentStep.room}` : ''}
              </span>
              ${queueProgress.estimated_remaining_s != null ? html`
                <span class="progress-eta">${t('progress.eta').replace('{0}', this._formatMinutes(queueProgress.estimated_remaining_s))}</span>
              ` : nothing}
            </div>

            <!-- Overall progress bar (step-count based) -->
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPct}%"></div>
            </div>

            <!-- Battery summary -->
            <div class="battery-summary">
              <div class="battery-stat">
                <ha-icon icon="mdi:battery-minus" style="--mdc-icon-size: 16px;"></ha-icon>
                <span>${queueProgress.total_battery_used}% ${t('progress.battery_used')}</span>
              </div>
              ${queueProgress.estimated_total_battery != null ? html`
                <div class="battery-stat">
                  <ha-icon icon="mdi:battery-clock-outline" style="--mdc-icon-size: 16px;"></ha-icon>
                  <span>~${queueProgress.estimated_total_battery}% ${t('progress.battery_total')}
                    ${queueProgress.steps_without_estimate > 0
                      ? html`<span class="unknown-badge">${t('progress.unknown_steps').replace('{0}', String(queueProgress.steps_without_estimate))}</span>`
                      : nothing}
                  </span>
                </div>
              ` : nothing}
            </div>
          </div>
        ` : html`
          <!-- Fallback: basic progress when no queue_progress data -->
          <div class="progress-section">
            <div class="progress-info">
              <span>${currentStep ? `${t('controls.step')} ${currentIndex + 1} ${t('controls.of')} ${totalSteps} — ${currentStep.room}` : t('rooms.done')}</span>
              <span class="progress-pct">${progressPct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPct}%"></div>
            </div>
          </div>
        `}

        <!-- Current Step Detail -->
        ${stepProgress ? html`
          <div class="step-detail">
            <div class="step-detail-header">
              <ha-icon .icon=${MODE_ICONS[stepProgress.step_mode] || 'mdi:robot-vacuum'} style="--mdc-icon-size: 18px;"></ha-icon>
              <span class="step-detail-title">${stepProgress.step_room} · ${getModeLabel(stepProgress.step_mode)}</span>
            </div>

            ${stepProgress.step_estimated_s != null ? html`
              <div class="step-progress-bar">
                <div class="step-progress-fill" style="width: ${Math.min(100, Math.round((stepProgress.step_elapsed_s / stepProgress.step_estimated_s) * 100))}%"></div>
              </div>
              <div class="step-stats">
                <span>${t('progress.battery')}: ${stepProgress.battery_used}%${stepProgress.step_estimated_battery != null ? ` / ~${stepProgress.step_estimated_battery}%` : ''}</span>
                <span>${this._formatTime(stepProgress.step_elapsed_s)} / ~${this._formatTime(stepProgress.step_estimated_s)}</span>
              </div>
            ` : html`
              <div class="step-stats">
                <span>${t('progress.battery')}: ${stepProgress.battery_used}%</span>
                <span>${this._formatTime(stepProgress.step_elapsed_s)}</span>
              </div>
            `}
          </div>
        ` : nothing}

        <!-- Step list -->
        <div class="step-list">
          ${(this.steps || []).map(
            (step) => html`
              <div class="step-item ${step.status}">
                <ha-icon
                  .icon=${this._getStatusIcon(step.status)}
                  style="--mdc-icon-size: 18px; color: ${this._getStatusColor(step.status)};"
                ></ha-icon>
                <span class="step-name">${step.room}</span>
                <span class="step-mode">
                  <ha-icon .icon=${MODE_ICONS[step.mode]} style="--mdc-icon-size: 14px;"></ha-icon>
                  ${getModeLabel(step.mode)}
                </span>
              </div>
            `
          )}
        </div>

        <!-- Control buttons -->
        <div class="control-buttons">
          <div class="btn-row">
            ${this.isPaused
              ? html`
                  <button class="btn btn-secondary" @click=${this._handleResume}>
                    <ha-icon icon="mdi:play" style="--mdc-icon-size: 18px;"></ha-icon>
                    ${t('controls.resume')}
                  </button>
                `
              : html`
                  <button class="btn btn-secondary" @click=${this._handlePause}>
                    <ha-icon icon="mdi:pause" style="--mdc-icon-size: 18px;"></ha-icon>
                    ${t('controls.pause')}
                  </button>
                `}
            <button class="btn btn-secondary" @click=${this._handleSkip}>
              <ha-icon icon="mdi:skip-next" style="--mdc-icon-size: 18px;"></ha-icon>
              ${t('controls.skip')}
            </button>
          </div>
          <button class="btn btn-danger" @click=${this._handleCancel}>
            <ha-icon icon="mdi:stop" style="--mdc-icon-size: 18px;"></ha-icon>
            ${t('controls.cancel')}
          </button>
        </div>
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
      .controls-panel {
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
        margin: 0;
      }
      .pause-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: var(--error-color, #db4437);
        color: white;
        font-size: 13px;
        font-weight: 500;
      }
      .pause-banner ha-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
      }
      .progress-section {
        padding: 16px 20px;
        border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.08));
      }
      .progress-info {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .progress-info span:first-child {
        color: var(--secondary-text-color);
      }
      .progress-pct {
        font-weight: 600;
      }
      .progress-bar {
        height: 8px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color, #2196f3), var(--label-badge-green, #43a047));
        border-radius: 4px;
        transition: width 0.4s ease;
      }
      .step-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .step-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--secondary-background-color);
        min-height: 48px;
        transition: all 0.2s;
      }
      .step-item.in_progress {
        background: color-mix(in srgb, var(--label-badge-green, #43a047) 12%, var(--card-background-color, #fff));
        border: 1px solid color-mix(in srgb, var(--label-badge-green, #43a047) 30%, transparent);
      }
      .step-item.completed {
        opacity: 0.5;
      }
      .step-item.skipped {
        opacity: 0.4;
        text-decoration: line-through;
      }
      .step-name {
        font-size: 13px;
        font-weight: 500;
        flex: 1;
      }
      .step-mode {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .control-buttons {
        padding: 16px 20px;
        border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .btn-row {
        display: flex;
        gap: 8px;
      }
      .btn-row .btn {
        flex: 1;
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
        color: var(--primary-text-color);
      }
      .btn:active {
        transform: scale(0.97);
      }
      .btn-secondary {
        background: var(--secondary-background-color);
      }
      .btn-danger {
        background: color-mix(in srgb, var(--error-color, #ef5350) 12%, var(--card-background-color, #fff));
        color: var(--error-color, #ef5350);
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .progress-label {
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .progress-eta {
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-color, #2196f3);
      }
      .battery-summary {
        display: flex;
        gap: 16px;
        margin-top: 10px;
        flex-wrap: wrap;
      }
      .battery-stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .unknown-badge {
        font-size: 11px;
        opacity: 0.7;
        font-style: italic;
      }
      .step-detail {
        padding: 12px 20px;
        border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.08));
      }
      .step-detail-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .step-detail-title {
        font-size: 14px;
        font-weight: 600;
      }
      .step-progress-bar {
        height: 6px;
        background: var(--secondary-background-color);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .step-progress-fill {
        height: 100%;
        background: var(--primary-color, #2196f3);
        border-radius: 3px;
        transition: width 1s ease;
      }
      .step-stats {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .step-learning {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--secondary-text-color);
        font-style: italic;
        margin-bottom: 6px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-queue-controls': RqcQueueControls;
  }
}
