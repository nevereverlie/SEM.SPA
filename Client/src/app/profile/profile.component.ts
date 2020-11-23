import { Component, OnInit } from '@angular/core';
import { AlertifyService } from '../_services/alertify.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../_services/auth.service';
import { UserService } from '../_services/user.service';
import { DepartmentService } from '../_services/department.service';
import { faEdit } from '@fortawesome/free-solid-svg-icons/faEdit';

export interface Department {
  departmentId: number;
  departmentName: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editMode: boolean = false;
  departments: Department[];

  faEdit = faEdit;

  constructor(private alertify: AlertifyService,
              public authService: AuthService,
              private usersService: UserService,
              private departmentService: DepartmentService) { }

  ngOnInit() {
    this.getUser();
    this.getDepartments();
  }

  private getDepartments() {
    this.departmentService.getDepartments().subscribe((deps) => {
      this.departments = deps;
      console.log(this.departments);
    }, error => {
      this.alertify.error(error.title);
    });
  }

  private getUser() {
    this.usersService.getUserById(+this.authService.decodedToken.nameid).subscribe((response) => {
      this.user = response;
      console.log(this.user);
    }, error => {
      this.alertify.error(error.title);
    });
  }

  updateProfile(user) {
    this.usersService.updateUser(user).subscribe((response) => {
      this.alertify.success('Profile successfully updated');
      this.changeEditMode(false);
    }, error => {
      this.alertify.error(error.title);
    });
  }

  changeEditMode(editMode) {
    this.editMode = editMode;
  }
}
