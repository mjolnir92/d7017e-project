import {Component, forwardRef, OnInit, Inject, HostListener, ViewChild} from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeadService } from '../services/head.service';
import {AppComponent} from '../app.component';
import {UserService} from '../services/user.service';
import {AuthService} from '../services/Auth/Auth.service';
import {BackendService} from '../services/backend.service';

@Component({
  selector: 'app-head',
  templateUrl: './head.component.html',
  styleUrls: ['./head.component.css'],
  animations: [
    trigger('userOption', [ // animation for the user dropdown
      state('false', style({display: 'none', border: 'none', overflow: 'hidden', opacity: '0'})),
      state('true', style({display: 'block', opacity: '1'})),
      transition('0 => 1', animate('80ms 200ms ease-in')),
      transition('1 => 0', animate('150ms ease-out'))
    ]),
    trigger('userDropBox', [
      state('false', style({display: 'none', height: '0'})),
      state('true', style({display: 'block', height: 'auto'})),
      transition('0 => 1', animate('200ms ease-in')),
      transition('1 => 0', animate('200ms ease-out'))
    ])
  ]
})

export class HeadComponent implements OnInit {
  sidebarState: any; // state of the sidebar
  user: any;
  stateDropDown: boolean;
  userID: string;
  res: any; // used to username from data retrieved from database, in ngOnInit()

  constructor(@Inject(forwardRef(() => AppComponent)) private appComponent: AppComponent, private headService: HeadService,
              private userService: UserService, private auth: AuthService, private backendService: BackendService) {
  }

  toggleState($event) { // send to the sidebar in app component that it should toggle state
    $event.preventDefault();
    $event.stopPropagation();
    this.sidebarState = this.sidebarState === 'active' ? 'inactive' : 'active';
    this.headService.setState(this.sidebarState); // send to the service that the state is updated
  }

  @HostListener('document:click', ['$event'])
  outsideDropDownClick($event) { // have click in web outside the user dropdown, should then hide
    this.stateDropDown = false;
  }

  toggleUserDropDown($event) { // toggle function for the userdropbox
    $event.preventDefault(); // so it isn't affected by the outsideDropDownClick
    $event.stopPropagation();
    this.stateDropDown = !this.stateDropDown;
  }

  isDropDown() {
    return this.stateDropDown;
  }

  logout() { // this is used when log out so the sidebar doesn't stay active & to log out
    this.headService.setState('inactive');
    this.auth.logout();
  }

  getUsername(res) { // retrieve username from the database with the getMe() function from backendService
    const that = this;
    this.backendService.getMe().then(function(data) {
      res = data; // can't use data.username directly, so assign it to another variable first
      return that.userID = res.username;
    });
  }

  ngOnInit() {
    this.getUsername(this.res); // have to use res to get username, data.username doesn't work
    this.stateDropDown = false;
    this.user = this.userService.userInfo;
    this.sidebarState = this.appComponent.sidebarState;
    this.headService.setState(this.sidebarState);
   }
}
