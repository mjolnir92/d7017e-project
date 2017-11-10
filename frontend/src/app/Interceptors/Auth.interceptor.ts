import {Injectable} from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {AuthService} from '../services/Auth/Auth.service';
import {Router} from '@angular/router';
import 'rxjs/add/operator/do';
import { environment } from '../../environments/environment';
import {Http, RequestOptions, Headers} from '@angular/http';


@Injectable()
export class NoopInterceptor implements HttpInterceptor {
  access_token: string;
  authHeader: string;
  newRequest: HttpRequest<any>;

  constructor(private auth: AuthService, private router: Router, private http: Http) {}

  /*
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      console.log('interceptor running');
      const authHeader = this.auth.getToken();
      console.log('this is authHeader: ' + authHeader);
      // kräver en fking localstorage för att fungera.......
      const authReq = req.clone({headers: req.headers.set('Authorization', authHeader)});
      return next.handle(authReq);
    }
  */


  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.auth.isAuthenticated()) {
      this.authHeader = this.auth.getToken();
      this.newRequest = request.clone({headers: request.headers.set('Authorization', this.authHeader)});
    } else {
      // Not logged on, no need to change the auth header.
      this.newRequest = request;
    }
    return next.handle(this.newRequest).do((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        // do stuff with response if you want
      }
    }, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          // caching 401 request
          this.auth.collectFailedRequest(this.newRequest);
          // requesting new token from backend
          this.auth.requestNewToken().subscribe( resp => {
            if (!resp) {
              console.log('no response');
            } else {
              // retry failed requests
              // this.auth.retryFailedRequests();
              // return next.handle(authReq);
            }
          });

        }
      }
    });
  }


}
