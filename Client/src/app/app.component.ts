import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './_services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  jwtHelper = new JwtHelperService();

  constructor(private authService: AuthService,
              private translateService: TranslateService) {

      if(localStorage.getItem('language')){
        this.translateService.setDefaultLang(localStorage.getItem('language'));
        this.translateService.use(localStorage.getItem('language'));
      } else {
        this.translateService.setDefaultLang('en-US');
        this.translateService.use('en-US');
        localStorage.setItem("language","en-US");
      }
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.decodedToken = this.jwtHelper.decodeToken(token);
    }
  }
}
