import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService implements OnDestroy {
  readonly position$ = new BehaviorSubject<GeoPosition | null>(null);
  readonly error$ = new BehaviorSubject<string | null>(null);

  private watchId: number | null = null;

  constructor(private zone: NgZone) {}

  get isWatching(): boolean {
    return this.watchId !== null;
  }

  startTracking(): void {
    if (!navigator.geolocation) {
      this.error$.next('Geolocation is not supported by this browser.');
      return;
    }
    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) =>
        this.zone.run(() => {
          this.position$.next({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
          this.error$.next(null);
        }),
      (err) => this.zone.run(() => this.error$.next(this.parseError(err))),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private parseError(err: GeolocationPositionError): string {
    switch (err.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        return 'Location access denied. Enable it in Settings → Privacy → Location.';
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        return 'Location unavailable. Check your GPS signal.';
      case GeolocationPositionError.TIMEOUT:
        return 'Location request timed out. Try again.';
      default:
        return 'Unknown location error.';
    }
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }
}
