import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = environment.apiUrl + 'users/';

  constructor(private http: HttpClient) { }

  getUsers(): any {
    return this.http.get(this.baseUrl);
  }

  getUserById(userId: number): any {
    return this.http.get(this.baseUrl + userId);
  }

  getUserByEmail(email: string): any {
    return this.http.get(this.baseUrl + 'byEmail/' + email);
  }

  updateUser(userToUpdate: any): any {
    return this.http.put(this.baseUrl + 'update', userToUpdate);
  }

  deleteUser(userId: number): any {
    return this.http.delete(this.baseUrl + 'delete' + userId);
  }
}
