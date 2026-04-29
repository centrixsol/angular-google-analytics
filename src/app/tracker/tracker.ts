import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { GeoPosition, LocationService } from '../services/location.service';
import { StorageService } from '../services/storage.service';

function haversineMeters(a: GeoPosition, b: GeoPosition): number {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getBearing(from: GeoPosition, to: GeoPosition): number {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

@Component({
  selector: 'app-tracker',
  standalone: true,
  templateUrl: './tracker.html',
  styleUrl: './tracker.scss',
})
export class TrackerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private locationSvc = inject(LocationService);
  private storageSvc = inject(StorageService);

  isTracking = signal(false);
  followUser = signal(true);
  currentPos = signal<GeoPosition | null>(null);
  parkingSpot = signal<GeoPosition | null>(null);
  locationError = signal<string | null>(null);
  justParked = signal(false);

  distanceM = computed(() => {
    const c = this.currentPos();
    const p = this.parkingSpot();
    return c && p ? haversineMeters(c, p) : null;
  });

  bearingDeg = computed(() => {
    const c = this.currentPos();
    const p = this.parkingSpot();
    return c && p ? getBearing(c, p) : null;
  });

  formattedDistance = computed(() => {
    const d = this.distanceM();
    if (d === null) return null;
    return d >= 1000
      ? `${(d / 1000).toFixed(2)} km`
      : `${Math.round(d)} m`;
  });

  private map!: L.Map;
  private posMarker?: L.CircleMarker;
  private accuracyRing?: L.Circle;
  private parkMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private sub = new Subscription();

  ngAfterViewInit(): void {
    this.initMap();
    const saved = this.storageSvc.load();
    if (saved) {
      this.parkingSpot.set(saved);
      this.drawParkingMarker(saved);
    }
    this.startTracking();
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [0, 0],
      zoom: 2,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('dragstart', () => this.followUser.set(false));
  }

  startTracking(): void {
    if (this.isTracking()) return;
    this.isTracking.set(true);
    this.locationSvc.startTracking();

    this.sub.add(
      this.locationSvc.position$.subscribe((pos) => {
        if (!pos) return;
        this.currentPos.set(pos);
        this.drawCurrentPosition(pos);
        if (this.followUser()) {
          this.map.setView([pos.lat, pos.lng], Math.max(this.map.getZoom(), 17));
        }
        this.drawRoute();
      })
    );

    this.sub.add(
      this.locationSvc.error$.subscribe((err) => {
        if (err) {
          this.locationError.set(err);
          this.isTracking.set(false);
        }
      })
    );
  }

  stopTracking(): void {
    this.locationSvc.stopTracking();
    this.isTracking.set(false);
    this.sub.unsubscribe();
    this.sub = new Subscription();
  }

  toggleTracking(): void {
    this.isTracking() ? this.stopTracking() : this.startTracking();
  }

  parkHere(): void {
    const pos = this.currentPos();
    if (!pos) return;
    this.parkingSpot.set(pos);
    this.storageSvc.save(pos);
    this.drawParkingMarker(pos);
    this.drawRoute();
    this.justParked.set(true);
    setTimeout(() => this.justParked.set(false), 2500);
  }

  clearParking(): void {
    this.parkingSpot.set(null);
    this.storageSvc.clear();
    this.parkMarker?.remove();
    this.parkMarker = undefined;
    this.routeLine?.remove();
    this.routeLine = undefined;
  }

  centerOnMe(): void {
    const pos = this.currentPos();
    if (pos) {
      this.map.setView([pos.lat, pos.lng], 17);
      this.followUser.set(true);
    }
  }

  centerOnParking(): void {
    const pos = this.parkingSpot();
    if (pos) {
      this.map.setView([pos.lat, pos.lng], 17);
      this.followUser.set(false);
    }
  }

  showBoth(): void {
    const curr = this.currentPos();
    const park = this.parkingSpot();
    if (curr && park) {
      const bounds = L.latLngBounds(
        [curr.lat, curr.lng],
        [park.lat, park.lng]
      );
      this.map.fitBounds(bounds, { padding: [80, 80] });
      this.followUser.set(false);
    }
  }

  dismissError(): void {
    this.locationError.set(null);
  }

  private drawCurrentPosition(pos: GeoPosition): void {
    const ll: L.LatLngExpression = [pos.lat, pos.lng];
    if (!this.posMarker) {
      this.posMarker = L.circleMarker(ll, {
        radius: 10,
        color: '#fff',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 3,
      }).addTo(this.map);

      this.accuracyRing = L.circle(ll, {
        radius: pos.accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(this.map);
    } else {
      this.posMarker.setLatLng(ll);
      this.accuracyRing?.setLatLng(ll).setRadius(pos.accuracy);
    }
  }

  private drawParkingMarker(pos: GeoPosition): void {
    this.parkMarker?.remove();
    const icon = L.divIcon({
      html: `<div class="park-pin">
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg" width="44" height="56">
          <path d="M22 0C9.85 0 0 9.85 0 22c0 16.5 22 34 22 34s22-17.5 22-34C44 9.85 34.15 0 22 0z"
            fill="#ef4444" stroke="white" stroke-width="2"/>
          <circle cx="22" cy="22" r="14" fill="white"/>
          <text x="22" y="28" text-anchor="middle" fill="#ef4444"
            font-size="18" font-weight="900" font-family="system-ui,sans-serif">P</text>
        </svg>
      </div>`,
      className: '',
      iconSize: [44, 56],
      iconAnchor: [22, 56],
      popupAnchor: [0, -60],
    });

    const time = new Date(pos.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.parkMarker = L.marker([pos.lat, pos.lng], { icon })
      .addTo(this.map)
      .bindPopup(`<strong>Car parked here</strong><br>at ${time}`);
  }

  private drawRoute(): void {
    const curr = this.currentPos();
    const park = this.parkingSpot();
    if (!curr || !park) return;

    const pts: L.LatLngExpression[] = [
      [curr.lat, curr.lng],
      [park.lat, park.lng],
    ];

    if (!this.routeLine) {
      this.routeLine = L.polyline(pts, {
        color: '#ef4444',
        weight: 3,
        dashArray: '10 8',
        opacity: 0.7,
      }).addTo(this.map);
    } else {
      this.routeLine.setLatLngs(pts);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.locationSvc.stopTracking();
    this.map?.remove();
  }
}
