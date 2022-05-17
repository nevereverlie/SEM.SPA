import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { RegisterComponent } from '../register/register.component';
import { AlertifyService } from '../_services/alertify.service';
import { AuthService } from '../_services/auth.service';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  model: any = {};
  registerMode = false;
  bsModalRef: BsModalRef;
  user: any;

  constructor(
    public authService: AuthService,
    private alertify: AlertifyService,
    private router: Router,
    private modalService: BsModalService,
    private userService: UserService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.getUser();
  }

  openModalWithComponent() {
    this.bsModalRef = this.modalService.show(RegisterComponent);
    this.bsModalRef.content.closeBtnName = 'Close';
  }

  getUser() {
    this.userService.getUserById(+this.authService.decodedToken.nameid).subscribe(user => {
      this.user = user;
    }, error => {
      this.alertify.error(error);
    });
  }

  login() {
    this.authService.login(this.model).subscribe(
      (next) => {
        this.alertify.success(this.translateService.instant('ALERT_LOGIN_SUCCESS'));
        this.getUser();
      },
      (e) => {
        this.alertify.error(e.error);
      }
    );
  }

  selectLanguage(lang: string) {
    this.translateService.setDefaultLang(lang);
    this.translateService.use(lang);
    localStorage.setItem("language", lang);
  }

  logout() {
    localStorage.removeItem('token');
    this.alertify.message(this.translateService.instant('ALERT_LOGOUT'));
    this.router.navigate(['']);
  }

  registerToggle() {
    this.registerMode = true;
  }

  cancelRegistrationMode(registerMode: boolean) {
    this.registerMode = registerMode;
  }
}
