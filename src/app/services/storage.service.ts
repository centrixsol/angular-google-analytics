import { Injectable } from '@angular/core';
import { GeoPosition } from './location.service';

const PARKING_KEY = 'car-tracker:parking';

@Injectable({ providedIn: 'root' })
export class StorageService {
  save(position: GeoPosition): void {
    localStorage.setItem(PARKING_KEY, JSON.stringify(position));
  }

  load(): GeoPosition | null {
    try {
      const raw = localStorage.getItem(PARKING_KEY);
      return raw ? (JSON.parse(raw) as GeoPosition) : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(PARKING_KEY);
  }
}
