import { Injectable, MessageEvent } from '@nestjs/common';
import { AuditEvent } from '@prisma/client';
import { Observable, Subject, interval, map, merge, startWith } from 'rxjs';

@Injectable()
export class AuditStreamService {
  private readonly events = new Subject<AuditEvent>();

  emit(event: AuditEvent): void {
    this.events.next(event);
  }

  stream(): Observable<MessageEvent> {
    const live = this.events.pipe(map((event) => ({
      id: event.eventId,
      type: 'audit',
      data: event,
    })));
    const heartbeat = interval(15000).pipe(map(() => ({
      type: 'heartbeat',
      data: { timestamp: new Date().toISOString() },
    })));
    return merge(live, heartbeat).pipe(startWith({
      type: 'connected',
      data: { timestamp: new Date().toISOString() },
    }));
  }
}
