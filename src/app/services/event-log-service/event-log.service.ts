import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventLogService {
  private events: string[] = [];
  private eventsSubject = new BehaviorSubject<string[]>([]);
  events$ = this.eventsSubject.asObservable();

  log(message: string): void {
    this.events.unshift(message);
    if (this.events.length > 20) {
      this.events.length = 20;
    }
    this.eventsSubject.next([...this.events]);
  }

  clear(): void {
    this.events = [];
    this.eventsSubject.next([]);
  }
}
