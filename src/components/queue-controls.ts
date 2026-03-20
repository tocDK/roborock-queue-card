import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, QueueStep } from '../types';
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

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const currentIndex = this._getCurrentStepIndex();
    const totalSteps = (this.steps || []).length;
    const completedSteps = (this.steps || []).filter(
      (s) => s.status === 'completed'
    ).length;
    const progressPct =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const currentStep = currentIndex >= 0 ? this.steps[currentIndex] : null;

    return html`
      <div class="controls-panel">
        <div class="panel-header">
          <h2>${t('controls.cleaning_in_progress')}</h2>
        </div>

        <!-- Progress -->
        <div class="progress-section">
          <div class="progress-info">
            <span>
              ${currentStep
                ? `${t('controls.step')} ${currentIndex + 1} ${t('controls.of')} ${totalSteps} — ${currentStep.room}`
                : t('rooms.done')}
            </span>
            <span class="progress-pct">${progressPct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>

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
        background: var(--success-color-light, #e8f5e9);
        border: 1px solid rgba(67, 160, 71, 0.3);
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
        background: rgba(239,83,80,0.1);
        color: var(--error-color, #ef5350);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-queue-controls': RqcQueueControls;
  }
}
