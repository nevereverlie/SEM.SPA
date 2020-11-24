import { Component, OnInit } from '@angular/core';
import { AlertifyService } from '../_services/alertify.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../_services/auth.service';
import { UserService } from '../_services/user.service';
import { DepartmentService } from '../_services/department.service';
import { faEdit } from '@fortawesome/free-solid-svg-icons/faEdit';
import * as CanvasJS from '../canvasjs.min.js';

export interface Department {
  departmentId: number;
  departmentName: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editMode: boolean = false;
  departments: Department[];

  employeesList: any;
  selectedEmployee: any;

  faEdit = faEdit;

  constructor(
    private alertify: AlertifyService,
    public authService: AuthService,
    private usersService: UserService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit() {
    this.getUser();
    this.getDepartments();
    this.getEmployees();
  }

  selectEmployee(employee: any) {
    this.selectedEmployee = employee;
    this.selectedEmployee.workTime = this.calculateWorkTime();
  }

  private calculateWorkTime(): number {
    let workTime = 0;
    this.selectedEmployee.schedules.forEach(day => {
      const beginHour = day.timeFrom.substr(0, 2);
      const endHour = day.timeTo.substr(0, 2);
      workTime += endHour - beginHour;
    });
    return workTime;
  }

  public drawChart(employee: any) {
    const chart = new CanvasJS.Chart('chartContainer', {
      theme: 'light2',
      animationEnabled: true,
      exportEnabled: true,
      title: {
        text: 'Продуктивність',
      },
      data: [
        {
          type: 'pie',
          showInLegend: true,
          toolTipContent: '<b>{name}</b>: {y} <i>(год)</i>',
          indexLabel: '{name} - #percent%',
          dataPoints: [
            { y: employee.workedHours, name: 'Відпрацьовано' },
            { y: employee.wastedHours, name: 'Змарновано' },
            { y: employee.workTime, name: 'Залишилося (тиждень)' }
          ],
        },
      ],
    });
    chart.render();
  }

  private getDepartments() {
    this.departmentService.getDepartments().subscribe(
      (deps) => {
        this.departments = deps;
      },
      (error) => {
        this.alertify.error(error.title);
      }
    );
  }

  private getUser() {
    this.usersService
      .getUserById(+this.authService.decodedToken.nameid)
      .subscribe(
        (response) => {
          this.user = response;
        },
        (error) => {
          this.alertify.error(error.title);
        }
      );
  }

  private getEmployees() {
    this.usersService.getUsers().subscribe(
      (emps) => {
        this.employeesList = emps;
      },
      (error) => {
        this.alertify.error(error);
      }
    );
  }

  updateProfile(user) {
    this.usersService.updateUser(user).subscribe(
      (response) => {
        this.alertify.success('Profile successfully updated');
        this.changeEditMode(false);
      },
      (error) => {
        this.alertify.error(error.title);
      }
    );
  }

  changeEditMode(editMode) {
    this.editMode = editMode;
  }
}
