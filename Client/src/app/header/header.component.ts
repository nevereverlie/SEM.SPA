import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { RegisterComponent } from '../register/register.component';
import { AlertifyService } from '../_services/alertify.service';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  model: any = {};
  registerMode = false;
  bsModalRef: BsModalRef;

  constructor(public authService: AuthService, private alertify: AlertifyService,
              private router: Router, private modalService: BsModalService) { }

  ngOnInit() {
    console.log(this.authService.decodedToken);
  }

  openModalWithComponent() {
    this.bsModalRef = this.modalService.show(RegisterComponent);
    this.bsModalRef.content.closeBtnName = 'Close';
  }

  login() {
    this.authService.login(this.model).subscribe(next => {
      this.alertify.success('Вхід успішний!');
      console.log(this.authService.decodedToken);
    }, e => {
      this.alertify.error(e.error);
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.alertify.message('Вихід з системи');
    this.router.navigate(['']);
  }

  registerToggle() {
    this.registerMode = true;
  }

  cancelRegistrationMode(registerMode: boolean) {
    this.registerMode = registerMode;
  }
}
