import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { AlertifyService } from '../_services/alertify.service';
import { AuthService } from '../_services/auth.service';
import { UserService } from '../_services/user.service';
import { DepartmentService } from '../_services/department.service';
import { faEdit } from '@fortawesome/free-solid-svg-icons/faEdit';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faUnlock } from '@fortawesome/free-solid-svg-icons/faUnlock';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons/faUserCircle';
import * as CanvasJS from '../canvasjs.min.js';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import appsListJson from '../../assets/data/GeneralApps.json';

export interface Department {
  departmentId: number;
  departmentName: string;
}

export interface App {
  appId: number;
  appName: string;
}

export interface User {
  userId: number;
  firstname: string;
  lastname: string;
  userEmail: string;
  department: Department;
  workedHours: number;
  wastedHours: number;
  workedMinutes: number;
  wastedMinutes: number;
  allowedApps: string[]
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editMode: boolean = false;
  departments: Department[];

  employeesList: any;
  selectedEmployee: any;

  closeResult: any;
  updateMode: boolean = false;
  updating: boolean = false;

  @Input() departmentForCreation: Department = {
    departmentId: 0,
    departmentName: ''
  };
  departmentsForUpdate: Department[];

  users: User[];
  usersForUpdate: User[];

  appsList: string[] = [];
  dropdownSettings = {};

  faEdit = faEdit;
  faLock = faLock;
  faUnlock = faUnlock;
  faTimes = faTimes;
  faUser = faUserCircle;

  constructor(
    private alertify: AlertifyService,
    public authService: AuthService,
    private usersService: UserService,
    private departmentService: DepartmentService,
    private modalService: NgbModal,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.getUser();
    this.getEmployees();
    this.getDepartments();
    this.getDepartmentsForUpdate();
    this.getUsers();
    this.getUsersForUpdate();

    appsListJson.forEach(app => this.appsList.push(app.appName));
    this.translateService.get(['PROFILE_ADMINISTRATION_USERS_ALLOWED_APPS_SELECT_ALL', 'PROFILE_ADMINISTRATION_USERS_ALLOWED_APPS_UNSELECT_ALL']).subscribe(translations => {
      this.dropdownSettings = {
        singleSelection: false,
        idField: 'appId',
        textField: 'appName',
        selectAllText: translations['PROFILE_ADMINISTRATION_USERS_ALLOWED_APPS_SELECT_ALL'],
        unSelectAllText: translations['PROFILE_ADMINISTRATION_USERS_ALLOWED_APPS_UNSELECT_ALL'],
        itemsShowLimit: 10,
        allowSearchFilter: true
      }
    });
  }

  onItemSelect(item: any) {
    console.log(this.users);
    console.log(this.usersForUpdate);
  }

  selectEmployee(employee: any) {
    this.selectedEmployee = employee;
    this.selectedEmployee.workTime = this.calculateWorkTime();
  }

  private calculateWorkTime(): number {
    let workTime = 0;
    this.selectedEmployee.schedules.forEach((day) => {
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
        text: this.translateService.instant('PROFILE_EMPLOYEE_CHART_TITLE'),
      },
      subtitles: [
        {
          text: employee.firstname + ' ' + employee.lastname,
        },
      ],
      data: [
        {
          type: 'pie',
          showInLegend: true,
          toolTipContent:
            '<b>{name}</b>: {y} <i>' +
            this.translateService.instant('PROFILE_EMPLOYEE_CHART_HRS_TOOLTIP') + '</i>',
          indexLabel: '{name} - #percent%',
          dataPoints: [
            { y: employee.workedHours, name: this.translateService.instant('PROFILE_EMPLOYEE_CHART_WORKED_HOURS') },
            { y: employee.wastedHours, name: this.translateService.instant('PROFILE_EMPLOYEE_CHART_WASTED_HOURS') },
            { y: employee.workTime, name: this.translateService.instant('PROFILE_EMPLOYEE_CHART_WORKTIME_LEFT') },
          ],
        },
      ],
    });
    chart.render();
  }

  private getDepartments(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.departmentService.getDepartments().subscribe(
        (deps) => {
          resolve((this.departments = deps));
        },
        (error) => {
          reject(this.alertify.error(error.error));
        }
      );
    });
  }
  private getDepartmentsForUpdate() {
    this.departmentService.getDepartments().subscribe(
      (deps) => {
        this.departmentsForUpdate = deps;
      },
      (error) => {
        this.alertify.error(error.error);
      }
    );
  }

  createDepartment(departmentToCreate: Department) {
    if (departmentToCreate.departmentName === '') {
      this.alertify.error(this.translateService.instant('PROFILE_ADMINISTRATION_DEPARTMENTS_CREATION_NAME_EMPTY_ERROR'))
      return;
    }

    this.departmentService.createDepartment(departmentToCreate).subscribe(
      () => {
        this.getDepartments();
        this.getDepartmentsForUpdate();
        this.alertify.success(
          this.translateService.instant('PROFILE_ADMINISTRATION_DEPARTMENTS_CREATION_CREATED') + departmentToCreate.departmentName
        );
      },
      (error) => {
        this.alertify.error(error.error);
      }
    );
  }

  updateDepartments() {
    let isChanging = Boolean(false);
    try {
      const { inputsLength, inputs } = this.getDepartmentsInputs();

      isChanging = this.anyDepartmentsChanges(inputsLength, inputs, isChanging);

      if (isChanging) {
        this.updating = true;
        for (let i = 0; i < this.departments.length; i++) {
          if (
            this.departments[i].departmentName !==
            this.departmentsForUpdate[i].departmentName
          ) {
            const newDep = this.departmentsForUpdate[i];
            this.departmentService.updateDepartment(newDep).subscribe(
              () => {},
              (error) => {
                console.log(error);
              }
            );
          }
        }
        setTimeout(() => {
          this.getDepartments().then(() => {
            this.alertify.success(this.translateService.instant('PROFILE_ADMINISTRATION_DEPARTMENTS_UPDATED'));
            this.updating = false;
          });
        }, 2000);
      }
    } catch (e) {
      console.log(e);
    }
  }

  private anyDepartmentsChanges(
    inputsLength: number,
    inputs: HTMLInputElement,
    isChanging: boolean
  ) {
    for (let index = 0; index < inputsLength; index++) {
      if (inputs[index].value.toString() !== '') {
        isChanging = true;
        this.departmentsForUpdate[index].departmentName =
          inputs[index].value.toString();
      }
    }
    return isChanging;
  }

  private getDepartmentsInputs() {
    const inputs = document.getElementsByClassName(
      'departmentNameInput'
    ) as unknown as HTMLInputElement;
    const inputsLength = document.getElementsByClassName(
      'departmentNameInput'
    ).length;
    return { inputsLength, inputs };
  }

  deleteDepartmentConfirmation(departmentId: number) {
    this.alertify.confirm(
      this.translateService.instant('PROFILE_ADMINISTRATION_DEPARTMENTS_DELETE_CONFIRMATION'),
      () => this.deleteDepartment(departmentId)
    );
  }

  private deleteDepartment(departmentId: number) {
    this.departmentService.deleteDepartment(departmentId).subscribe(
      () => {
        this.getDepartments();
        this.alertify.warning(this.translateService.instant('PROFILE_ADMINISTRATION_DEPARTMENTS_DELETE_SUCCESS'));
      },
      (error) => {
        this.alertify.error(error);
      }
    );
  }

  private getUser(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.usersService
        .getUserById(+this.authService.decodedToken.nameid)
        .subscribe(
          (response) => {
            resolve((this.user = response));
          },
          (error) => {
            reject(this.alertify.error(error.error));
          }
        );
    });
  }

  private getUsers(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.usersService.getUsers().subscribe(
        (users) => {
          resolve((this.users = users.filter((u) => u.userEmail !== 'Admin')));
          this.users.forEach(u => u.allowedApps.sort())
        },
        (error) => {
          reject(console.log(error));
        }
      );
    });
  }
  private getUsersForUpdate() {
    this.usersService.getUsers().subscribe(
      (users) => {
        this.usersForUpdate = users.filter((u) => u.userEmail !== 'Admin');
        this.usersForUpdate.forEach(u => u.allowedApps.sort())
      },
      (error) => {
        console.log(error);
      }
    );
  }

  updateUsers() {
    let isChanging = false;
    try {
      const {
        inputsLength,
        firstnameInputs,
        lastnameInputs,
        emailInputs,
        departmentInputs,
        workedHoursInputs,
        wastedHoursInputs,
        workedMinutesInputs,
        wastedMinutesInputs,
      } = this.getUserInputs();

      isChanging = this.anyUserChanges(
        inputsLength,
        firstnameInputs,
        isChanging,
        lastnameInputs,
        emailInputs,
        departmentInputs,
        workedHoursInputs,
        wastedHoursInputs,
        workedMinutesInputs,
        wastedMinutesInputs
      );

      if (isChanging) {
        let isErrorResponse = false;
        this.updating = true;
        for (let i = 0; i < this.users.length; i++) {
          if (this.isMismatch(i)) {
            console.log(this.users);
            console.log(this.usersForUpdate);
            this.usersForUpdate[i].allowedApps = this.users[i].allowedApps;
            const updatedUser = this.usersForUpdate[i];
            const form = new FormData();
            this.makeUserFormData(form, updatedUser);
            this.usersService.updateUser(form).subscribe(
              () => {},
              (error) => {
                console.log(error);
                isErrorResponse = true;
              }
            );
          }
        }
        if (!isErrorResponse) {
          setTimeout(() => {
            this.getUsers().then(() => {
              this.alertify.success(this.translateService.instant('PROFILE_ADMINISTRATION_USERS_UPDATED'));
              this.updating = false;
              this.getEmployees();
            });
          }, 2000);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  private makeUserFormData(form: FormData, updatedUser: User) {
    form.append('UserId', updatedUser.userId.toString());
    form.append('Firstname', updatedUser.firstname);
    form.append('Lastname', updatedUser.lastname);
    form.append('UserEmail', updatedUser.userEmail);
    form.append('Department', updatedUser.department.departmentName);
    form.append('WorkedHours', updatedUser.workedHours.toString());
    form.append('WastedHours', updatedUser.wastedHours.toString());
    form.append('WorkedMinutes', updatedUser.workedMinutes.toString());
    form.append('WastedMinutes', updatedUser.wastedMinutes.toString());
    form.append('AllowedApps', JSON.stringify(updatedUser.allowedApps));
  }

  private isMismatch(i: number) {
    return (
      this.users[i].firstname !== this.usersForUpdate[i].firstname ||
      this.users[i].lastname !== this.usersForUpdate[i].lastname ||
      this.users[i].userEmail !== this.usersForUpdate[i].userEmail ||
      this.users[i]?.department?.departmentName !==
        this.usersForUpdate[i]?.department?.departmentName ||
      this.users[i].workedHours !== this.usersForUpdate[i].workedHours ||
      this.users[i].wastedHours !== this.usersForUpdate[i].wastedHours ||
      this.users[i].workedMinutes !== this.usersForUpdate[i].workedMinutes ||
      this.users[i].wastedMinutes !== this.usersForUpdate[i].wastedMinutes ||
      this.users[i].allowedApps.sort().join(',') !== this.usersForUpdate[i].allowedApps.sort().join(',')
    );
  }

  private anyUserChanges(
    inputsLength: number,
    firstnameInputs: HTMLInputElement,
    isChanging: boolean,
    lastnameInputs: HTMLInputElement,
    emailInputs: HTMLInputElement,
    departmentInputs: HTMLInputElement,
    workedHoursInputs: HTMLInputElement,
    wastedHoursInputs: HTMLInputElement,
    workedMinutesInputs: HTMLInputElement,
    wastedMinutesInputs: HTMLInputElement
  ) {
    for (let index = 0; index < inputsLength; index++) {
      if (firstnameInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].firstname =
          firstnameInputs[index].value.toString();
      }
      if (lastnameInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].lastname =
          lastnameInputs[index].value.toString();
      }
      if (emailInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].userEmail =
          emailInputs[index].value.toString();
      }
      if (departmentInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].department.departmentName =
          departmentInputs[index].value.toString();
      }
      if (workedHoursInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].workedHours =
          +workedHoursInputs[index].value;
      }
      if (wastedHoursInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].wastedHours =
          +wastedHoursInputs[index].value;
      }
      if (workedMinutesInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].workedMinutes =
          +workedMinutesInputs[index].value;
      }
      if (wastedMinutesInputs[index].value.toString() !== '') {
        isChanging = true;
        this.usersForUpdate[index].wastedMinutes =
          +wastedMinutesInputs[index].value;
      }
      if (this.users[index].allowedApps.sort().join(',') !== this.usersForUpdate[index].allowedApps.sort().join(',')) {
        isChanging = true;
      }
    }
    return isChanging;
  }

  private getUserInputs() {
    const inputsLength =
      document.getElementsByClassName('lastnameInput').length;
    const firstnameInputs = document.getElementsByClassName(
      'firstnameInput'
    ) as unknown as HTMLInputElement;
    const lastnameInputs = document.getElementsByClassName(
      'lastnameInput'
    ) as unknown as HTMLInputElement;
    const emailInputs = document.getElementsByClassName(
      'emailInput'
    ) as unknown as HTMLInputElement;
    const departmentInputs = document.getElementsByClassName(
      'departmentInput'
    ) as unknown as HTMLInputElement;
    const workedHoursInputs = document.getElementsByClassName(
      'workedHoursInput'
    ) as unknown as HTMLInputElement;
    const wastedHoursInputs = document.getElementsByClassName(
      'wastedHoursInput'
    ) as unknown as HTMLInputElement;
    const workedMinutesInputs = document.getElementsByClassName(
      'workedMinutesInput'
    ) as unknown as HTMLInputElement;
    const wastedMinutesInputs = document.getElementsByClassName(
      'wastedMinutesInput'
    ) as unknown as HTMLInputElement;
    return {
      inputsLength,
      firstnameInputs,
      lastnameInputs,
      emailInputs,
      departmentInputs,
      workedHoursInputs,
      wastedHoursInputs,
      workedMinutesInputs,
      wastedMinutesInputs,
    };
  }

  deleteUserConfirmation(userId: number) {
    this.alertify.confirm(
      this.translateService.instant('PROFILE_ADMINISTRATION_USERS_DELETE_CONFIRMATION'),
      () => this.deleteUser(userId)
    );
  }

  private deleteUser(userId: number) {
    this.usersService.deleteUser(userId).subscribe(
      () => {
        this.getUsers().then(() => {
          this.alertify.warning(this.translateService.instant('PROFILE_ADMINISTRATION_USERS_DELETE_SUCCESS'));
        });
      },
      (error) => {
        this.alertify.error(error.error.error.message);
        console.log(error);
      }
    );
  }

  private getEmployees() {
    this.usersService.getUsers().subscribe(
      (emps) => {
        this.employeesList = emps.filter((e) => e.userEmail !== 'Admin');
      },
      (error) => {
        this.alertify.error(error);
      }
    );
  }

  updateProfile(user) {
    this.usersService.updateProfile(user).subscribe(
      () => {
        this.alertify.success(this.translateService.instant('PROFILE_UPDATED'));
        this.changeEditMode(false);
      },
      (error) => {
        this.alertify.error(error.error.error.message);
      }
    );
  }

  changeEditMode(editMode) {
    this.editMode = editMode;
  }
  changeUpdateMode() {
    this.updateMode = !this.updateMode;
  }

  open(content) {
    const modalRef = this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, {
      centered: true,
      windowClass: 'dark-modal',
    });
  }
}
