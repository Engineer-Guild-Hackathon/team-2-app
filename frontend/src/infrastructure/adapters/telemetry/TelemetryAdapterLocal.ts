import Dexie, { Table } from 'dexie';
import { TelemetryPort, TelemetryEvent, SessionSignal, GeoPoint } from '../../../types/recommendation';

interface TelemetryRecord {
  id?: number;
  sessionId: string;
  event: TelemetryEvent;
  context: {
    weather?: string;
    hour: number;
    dow: number;
    holiday?: boolean;
    location?: GeoPoint;
  };
  timestamp: number;
}

class TelemetryDatabase extends Dexie {
  telemetry!: Table<TelemetryRecord>;

  constructor() {
    super('BehaviorTelemetryDB');
    this.version(1).stores({
      telemetry: '++id, sessionId, timestamp, event.name'
    });
  }
}

export class TelemetryAdapterLocal implements TelemetryPort {
  private db: TelemetryDatabase;
  private sessionId: string;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30分
  private readonly MAX_RECORDS_PER_SESSION = 1000;

  constructor() {
    this.db = new TelemetryDatabase();
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    // セッション用のランダムID（個人識別不可）
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    // セッション開始時にクリーンアップ
    this.cleanupOldSessions();
  }

  private async cleanupOldSessions(): Promise<void> {
    try {
      const cutoff = Date.now() - this.SESSION_TIMEOUT_MS;
      await this.db.telemetry.where('timestamp').below(cutoff).delete();
    } catch (error) {
      console.warn('Failed to cleanup old telemetry sessions:', error);
    }
  }

  private async limitSessionRecords(): Promise<void> {
    try {
      const count = await this.db.telemetry.where('sessionId').equals(this.sessionId).count();
      if (count > this.MAX_RECORDS_PER_SESSION) {
        // 古いレコードを削除
        const oldRecords = await this.db.telemetry
          .where('sessionId')
          .equals(this.sessionId)
          .toArray();

        // タイムスタンプでソートして古いものを選択
        oldRecords.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = oldRecords.slice(0, count - this.MAX_RECORDS_PER_SESSION + 50);

        const idsToDelete = toDelete.map((r: TelemetryRecord) => r.id!);
        await this.db.telemetry.bulkDelete(idsToDelete);
      }
    } catch (error) {
      console.warn('Failed to limit session records:', error);
    }
  }

  private getCurrentContext(): TelemetryRecord['context'] {
    const now = new Date();
    return {
      hour: now.getHours(),
      dow: now.getDay(),
      holiday: this.isHoliday(now),
      // weather と location は外部から取得する必要がある場合は別途設定
    };
  }

  private isHoliday(date: Date): boolean {
    // 簡易的な日本の祝日判定（土日）
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private roundLocation(location: GeoPoint): GeoPoint {
    // プライバシー保護のため位置情報を200-500mグリッドに丸める
    const precision = 0.005; // 約500m
    return {
      lat: Math.round(location.lat / precision) * precision,
      lng: Math.round(location.lng / precision) * precision
    };
  }

  capture(event: TelemetryEvent): void {
    try {
      const context = this.getCurrentContext();

      // 位置情報がある場合は丸める
      if (event.payload.location) {
        context.location = this.roundLocation(event.payload.location);
      }

      const record: TelemetryRecord = {
        sessionId: this.sessionId,
        event: {
          ...event,
          ts: event.ts || new Date().toISOString()
        },
        context,
        timestamp: Date.now()
      };

      // 非同期で保存（UIをブロックしない）
      this.saveRecord(record);
    } catch (error) {
      console.warn('Failed to capture telemetry event:', error);
    }
  }

  private async saveRecord(record: TelemetryRecord): Promise<void> {
    try {
      await this.db.telemetry.add(record);
      await this.limitSessionRecords();
    } catch (error) {
      console.warn('Failed to save telemetry record:', error);
    }
  }

  async getSessionSignals(): Promise<SessionSignal[]> {
    try {
      const records = await this.db.telemetry
        .where('sessionId')
        .equals(this.sessionId)
        .toArray();

      // タイムスタンプでソート
      records.sort((a, b) => a.timestamp - b.timestamp);

      return records.map((record: TelemetryRecord) => ({
        event: record.event,
        context: record.context
      }));
    } catch (error) {
      console.warn('Failed to get session signals:', error);
      return [];
    }
  }

  clearSession(): void {
    try {
      // 新しいセッションIDを生成
      this.sessionId = this.generateSessionId();

      // 古いセッションのクリーンアップ（非同期）
      this.cleanupOldSessions();
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  // デバッグ用：現在のセッション統計
  async getSessionStats(): Promise<{
    sessionId: string;
    eventCount: number;
    timeSpan: string;
    categories: Record<string, number>;
  }> {
    try {
      const signals = await this.getSessionSignals();
      const categories: Record<string, number> = {};

      signals.forEach(signal => {
        const eventName = signal.event.name;
        categories[eventName] = (categories[eventName] || 0) + 1;
      });

      const timestamps = signals.map(s => new Date(s.event.ts).getTime());
      const timeSpan = timestamps.length > 1
        ? `${Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000 / 60)}分`
        : '0分';

      return {
        sessionId: this.sessionId,
        eventCount: signals.length,
        timeSpan,
        categories
      };
    } catch (error) {
      console.warn('Failed to get session stats:', error);
      return {
        sessionId: this.sessionId,
        eventCount: 0,
        timeSpan: '0分',
        categories: {}
      };
    }
  }
}