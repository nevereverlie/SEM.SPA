import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  baseUrl = environment.apiUrl + 'departments/';
  constructor(public http: HttpClient) { }

  getDepartments(): any {
    return this.http.get(this.baseUrl);
  }

  getDepartmentById(depId: number): any {
    return this.http.get(this.baseUrl + depId);
  }

  getDepartmentByName(depName: string): any {
    return this.http.get(this.baseUrl + 'byName/' + depName);
  }
}
