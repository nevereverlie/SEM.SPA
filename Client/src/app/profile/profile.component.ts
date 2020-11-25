import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { AlertifyService } from '../_services/alertify.service';
import { ActivatedRoute, Router } from '@angular/router';
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

export interface Department {
  departmentId: number;
  departmentName: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  encapsulation: ViewEncapsulation.None
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
    departmentName: 'New Department'
  };
  departmentsForUpdate: Department[];


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
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.getUser();
    this.getDepartments();
    this.getEmployees();
    this.getDepartmentsForUpdate();
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

  private getDepartments(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.departmentService.getDepartments().subscribe(
        (deps) => {
          resolve(this.departments = deps);
        },
        (error) => {
          reject(this.alertify.error(error.error));
        }
      );
    });
  }
  private getDepartmentsForUpdate(){
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
    this.departmentService.createDepartment(departmentToCreate).subscribe(response => {
      this.getDepartments();
      this.getDepartmentsForUpdate();
      this.alertify.success('Відділ \"' + departmentToCreate.departmentName + '\" створено');
    }, error => {
      this.alertify.error(error.error);
    });
  }

  updateDepartments() {
    let isChanging = Boolean(false);
    const inputs = document.getElementsByClassName('departmentNameInput') as unknown as HTMLInputElement;
    const inputsLength = document.getElementsByClassName('departmentNameInput').length;
    console.log(this.departmentsForUpdate);
    for (let index = 0; index < inputsLength; index++) {
      if (inputs[index].value.toString() !== '') {
        isChanging = true;
        this.departmentsForUpdate[index].departmentName = inputs[index].value.toString();
      }
    }

    if (isChanging) {
      this.updating = true;
      for (let i = 0; i < this.departments.length; i++) {
        if (this.departments[i].departmentName !== this.departmentsForUpdate[i].departmentName) {
          const newDep = this.departmentsForUpdate[i];
          this.departmentService.updateDepartment(newDep).subscribe(() => {
            console.log("Success");
          }, error => {
            console.log(error);
          });
        }
      }
      setTimeout(() => {
        this.getDepartments().then(() => {
        this.alertify.success('Update successfull');
        this.updating = false;
        });
      }, 1000);
    }
  }

  deleteDepartmentConfirmation(departmentId: number) {
    this.alertify.confirm('Ви впевнені, що хочете назавжди видалити відділ?', () => this.deleteDepartment(departmentId));
  }

  private deleteDepartment(departmentId: number) {
    this.departmentService.deleteDepartment(departmentId).subscribe(response => {
      this.getDepartments();
      this.alertify.success('Відділ успішно видалено');
    }, error => {
      this.alertify.error(error);
    });
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
  changeUpdateMode() {
    this.updateMode = !this.updateMode;
  }

  open(content) {
    const modalRef = this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
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
    this.modalService.open(content, { centered: true , windowClass: 'dark-modal'});
  }

}
