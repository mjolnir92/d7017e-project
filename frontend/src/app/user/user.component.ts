import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeadService } from '../services/head.service';
import { BackendService, ObjectID } from '../services/backend.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';
import {FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';

import {UserService} from '../services/user.service';
import {CourseService} from '../services/course.service';
import {HttpClient} from '@angular/common/http';
import { environment } from '../../environments/environment';
import {AuthService} from '../services/Auth/Auth.service';
import {AssignmentService} from '../services/assignment.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  animations: [
    trigger('content', [
      state('inactive', style({marginLeft: '0%', width: '100%'})),
      state('active', style({marginLeft: '15%', width: '85%'})),
      transition('inactive => active', animate('300ms')),
      transition('active => inactive', animate('300ms'))
    ])
  ]
})

export class UserComponent implements OnInit {
  user: any;
  statistics: boolean;
  sidebarState: any; // get current state
  courses: any;
  modalRef: BsModalRef;
  form: FormGroup;
  defaultForm = {
    search: ''
    /*name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    course_info: ['', [Validators.required]],
    progress: [false, []],
    score: [false, []],
    badges: [false, []],
    leaderboard: [false, []],*/
  };
  possibleCourses: any[];

  constructor(private http: HttpClient, private route: ActivatedRoute, private headService: HeadService, private userService: UserService,
              private modalService: BsModalService, private backendService: BackendService, private courseService: CourseService,
              private fb: FormBuilder, public auth: AuthService, private assignmentService: AssignmentService) {
    this.headService.stateChange.subscribe(sidebarState => { this.sidebarState = sidebarState; }); // subscribe to the state value head provides
  }

  ngOnInit() {
    this.courses = this.courseService.courses;
    this.sidebarState = this.headService.getCurrentState();
    this.user = this.userService.userInfo;
    this.statistics = false;
    this.form = this.fb.group(this.defaultForm);
    this.possibleCourses = [];
    this.backendService.getMyInvites()
      .then(response => console.log(response));
    // this.possibleCourses = [{name: 'course 1', id: '0'}, {name: 'course 2', id: '1'}];
  }
  toggleStatistics() {
    this.statistics = !this.statistics;
  }
  openModal(modal) {
    this.form = this.fb.group(this.defaultForm);
    this.possibleCourses = [];
    this.modalRef = this.modalService.show(modal);
    this.backendService.getCourses()
      .then(response => {
        const courses = response['courses'];
        for (let i = 0; i < courses.length; i++) {
          console.log(courses[i]);
          let name = '';
          if (courses[i]['course_code'] !== undefined) {
            name = courses[i]['course_code'];
          } else {
            name = courses[i]['name'];
          }
          this.possibleCourses[i] = {name: name, id: courses[i]['_id']};
        }
      });
  }
  createCourse() {
    const course = this.courseService.CreateCourse('10000', this.form.value.name, this.form.value.code,
      this.form.value.info, this.form.value.progress, this.form.value.score, this.form.value.badges, this.form.value.leaderboard);
    this.courseService.AddCourse(course);
  }
  searchCourse() {
    console.log(this.form.value);
    this.possibleCourses = [];
    this.backendService.getSearch(this.form.value.search)
      .then(response => {
        console.log('response', response);
        const courses = response['courses'];
        for (let i = 0; i < courses.length; i++) {
          console.log(courses[i]);
          let name = '';
          if (courses[i]['course_code'] !== undefined) {
            name = courses[i]['course_code'];
          } else {
            name = courses[i]['name'];
          }
          this.possibleCourses[i] = {name: name, id: courses[i]['_id']};
        }
      });
  }
  join(course_id) {
    console.log(course_id);
    this.backendService.requestJoinCourse(course_id, new ObjectID(this.userService.userInfo.id))
      .then(response => console.log(response));
  }

  getMe() {
    // console.log(this.backendService.getUser(new ObjectID('59f84c545747361ba848b238')));
    return this.backendService.getMe().then(resp => {
      console.log(resp);
    }).catch(err => {
      console.log(err);
    });
    /*
    this.http.get(environment.backend_ip + '/api/courses/me').subscribe(
      data => {
        console.log(data);
      },
      err => {
        console.log(err);
        console.log('something went shit in getMe');
      }
    );*/
  }

  postBadge() {
    this.backendService.postNewBadge('bronze_medal_badge', 'A test task from API', 'Totally new, whoa.');
  }
  getProgress(courseId) {
    return this.courseService.GetProgress(courseId);
  }
}
