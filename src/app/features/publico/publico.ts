import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class Publico {
  private http = inject(HttpClient);
  saludo(): Observable<string> {
    return this.http.get(ENDPOINTS.saludo, { responseType: 'text' });
  }
}
