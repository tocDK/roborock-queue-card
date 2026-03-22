import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { RoborockQueueCardConfig, AvailableRoom, QueueStep } from '../types';
import { guessRoomIcon } from '../const';
import { t } from '../localize';

@customElement('rqc-room-grid')
export class RqcRoomGrid extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: RoborockQueueCardConfig;
  @property({ type: Array }) public selectedRooms: string[] = [];
  @property({ type: Array }) public queueSteps: QueueStep[] = [];

  private _getAvailableRooms(): AvailableRoom[] {
    const queueState = this.hass.states[this.config.queue_sensor];
    if (!queueState?.attributes?.available_rooms) return [];
    return queueState.attributes.available_rooms as AvailableRoom[];
  }

  private _getRoomIcon(room: AvailableRoom): string {
    // Check config override first
    if (this.config.rooms?.[room.name]?.icon) {
      return this.config.rooms[room.name].icon!;
    }
    // Check sensor attribute icon
    if (room.icon) return room.icon;
    // Guess from room name
    return guessRoomIcon(room.name);
  }

  private _getRoomDisplayName(room: AvailableRoom): string {
    if (this.config.rooms?.[room.name]?.name) {
      return this.config.rooms[room.name].name!;
    }
    return room.name;
  }

  private _getQueuePosition(roomName: string): number {
    return this.selectedRooms.indexOf(roomName) + 1;
  }

  private _isSelected(roomName: string): boolean {
    return this.selectedRooms.includes(roomName);
  }

  private _getActiveStep(): QueueStep | undefined {
    return this.queueSteps.find((s) => s.status === 'in_progress');
  }

  private _isRoomCleaning(roomName: string): boolean {
    const active = this._getActiveStep();
    return active?.room === roomName;
  }

  private _isRoomDone(roomName: string): boolean {
    const queueState = this.hass.states[this.config.queue_sensor];
    const state = queueState?.state ?? 'idle';
    if (state === 'idle') return false;
    return this.queueSteps.some(
      (s) => s.room === roomName && s.status === 'completed'
    );
  }

  private _handleRoomTap(roomName: string): void {
    this.dispatchEvent(
      new CustomEvent('room-selected', {
        detail: { room: roomName },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _getRoomHistory(): Record<string, Record<string, any>> {
    const queueState = this.hass.states[this.config.queue_sensor];
    return queueState?.attributes?.room_history || {};
  }

  private _getLastCleaned(roomName: string): string | null {
    const history = this._getRoomHistory();
    const roomData = history[roomName];
    if (!roomData) return null;

    let latest: string | null = null;
    for (const modeData of Object.values(roomData) as any[]) {
      if (modeData?.last_cleaned) {
        if (!latest || modeData.last_cleaned > latest) {
          latest = modeData.last_cleaned;
        }
      }
    }
    if (!latest) return null;

    return this._formatRelativeTime(latest);
  }

  private _formatRelativeTime(isoString: string): string {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('rooms.today');
    if (diffMin < 60) return t('rooms.ago_minutes').replace('{0}', String(diffMin));
    if (diffHours < 24) return t('rooms.ago_hours').replace('{0}', String(diffHours));
    if (diffDays === 1) return t('rooms.yesterday');
    return t('rooms.ago_days').replace('{0}', String(diffDays));
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const rooms = this._getAvailableRooms();
    if (rooms.length === 0) {
      return html`
        <div class="empty">
          <ha-icon icon="mdi:robot-vacuum" style="--mdc-icon-size: 40px; opacity: 0.3;"></ha-icon>
          <p>${t('rooms.empty')}</p>
        </div>
      `;
    }

    return html`
      <div class="cards-grid">
        ${(rooms || []).map((room) => {
          const selected = this._isSelected(room.name);
          const cleaning = this._isRoomCleaning(room.name);
          const done = this._isRoomDone(room.name);
          const position = this._getQueuePosition(room.name);
          const lastCleaned = this._getLastCleaned(room.name);

          return html`
            <div
              class="room-card ${selected ? 'selected' : ''} ${cleaning ? 'cleaning' : ''} ${done ? 'done' : ''}"
              @click=${() => this._handleRoomTap(room.name)}
            >
              <div class="card-top">
                <div class="card-icon">
                  <ha-icon
                    .icon=${this._getRoomIcon(room)}
                    style="--mdc-icon-size: 36px;"
                  ></ha-icon>
                </div>
                <div class="card-badge ${selected || cleaning || done ? 'visible' : ''}">
                  ${cleaning
                    ? html`<ha-icon icon="mdi:play" style="--mdc-icon-size: 14px; color: white;"></ha-icon>`
                    : done
                    ? html`<ha-icon icon="mdi:check" style="--mdc-icon-size: 14px; color: white;"></ha-icon>`
                    : position}
                </div>
              </div>
              <div class="card-name">${this._getRoomDisplayName(room)}</div>
              <div class="card-meta">
                ${lastCleaned
                  ? html`<ha-icon icon="mdi:clock-outline" style="--mdc-icon-size: 12px;"></ha-icon>
                    <span>${lastCleaned}</span>`
                  : nothing}
              </div>
              ${cleaning
                ? html`<div class="card-status cleaning-status">${t('rooms.cleaning')}</div>`
                : done
                ? html`<div class="card-status done-status">${t('rooms.done')}</div>`
                : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--secondary-text-color);
      }
      .empty p {
        margin-top: 12px;
        font-size: 14px;
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
      }
      .room-card {
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 16px;
        padding: 20px 16px;
        cursor: pointer;
        box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0,0,0,0.08));
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
        min-height: 80px;
        min-width: 0;
        touch-action: manipulation;
      }
      .room-card:active {
        transform: scale(0.97);
      }
      .room-card:hover {
        background: var(--secondary-background-color);
      }
      .room-card.selected {
        border: 2px solid var(--primary-color, #2196f3);
        background: color-mix(in srgb, var(--primary-color, #2196f3) 12%, var(--card-background-color, #fff));
      }
      .room-card.selected::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: var(--primary-color, #2196f3);
      }
      .room-card.cleaning {
        border-color: var(--label-badge-green, #43a047);
        background: color-mix(in srgb, var(--label-badge-green, #43a047) 12%, var(--card-background-color, #fff));
      }
      .room-card.cleaning::after {
        content: '';
        position: absolute;
        top: 0; left: 0;
        height: 3px;
        background: var(--label-badge-green, #43a047);
        animation: sweep 2s ease-in-out infinite;
      }
      @keyframes sweep {
        0% { width: 0; left: 0; }
        50% { width: 100%; left: 0; }
        100% { width: 0; left: 100%; }
      }
      .room-card.done {
        opacity: 0.5;
        border-color: var(--label-badge-green, #43a047);
      }
      .card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: var(--secondary-background-color);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .room-card.selected .card-icon {
        background: color-mix(in srgb, var(--primary-color, #2196f3) 15%, var(--secondary-background-color));
      }
      .card-badge {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--warning-color, #ff9800);
        color: white;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0);
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .card-badge.visible {
        opacity: 1;
        transform: scale(1);
      }
      .room-card.cleaning .card-badge {
        background: var(--label-badge-green, #43a047);
      }
      .room-card.done .card-badge {
        background: var(--label-badge-green, #43a047);
      }
      .card-name {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        line-height: 1.3;
      }
      .card-meta {
        font-size: 12px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .card-status {
        font-size: 12px;
        font-weight: 600;
        margin-top: 6px;
      }
      .cleaning-status {
        color: var(--label-badge-green, #43a047);
      }
      .done-status {
        color: var(--label-badge-green, #43a047);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rqc-room-grid': RqcRoomGrid;
  }
}
