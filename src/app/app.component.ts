import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
declare var gtag

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'analytics';
  constructor(router: Router) {
    const navEndEvent$ = router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    );
    navEndEvent$.subscribe((e: NavigationEnd) => {
      // gtag('config', 'MY_ID', { 'page_path': e.urlAfterRedirects });
      gtag('config', 'G-NWXREENEN9',
        { 'page_path': e.urlAfterRedirects }
      );
    });

  }
}
