import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';

import { CourseService } from '../services/course.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeadService } from '../services/head.service';
import { AssignmentService } from '../services/assignment.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { BackendService } from '../services/backend.service';
import { ToastService } from '../services/toast.service';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-teacher-courses',
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.css'],
  animations: [
  trigger('content', [
    state('inactive', style({marginLeft: '0%', width: '100%'})),
    state('active', style({marginLeft: '15%', width: '85%'})),
    transition('inactive => active', animate('300ms')),
    transition('active => inactive', animate('300ms'))
  ])
]
})
export class TeacherCoursesComponent implements OnInit {
  assignmentGroups: AssignmentGroup[];
  teachCourses: any;
  sidebarState; // state of sidebar
  progress: any;
  currentCourse: any;
  currentCourseSaved: any;
  possibleStudents: any[];
  form: FormGroup;
  modalRef: BsModalRef;
  pendingReqs: any;
  defaultForm = {
    search: ''
  };
  groupName: string;
  teacherViewBool = false;
  selectedBadge: string;
  badges: Array<Object> = [
    {key: 'bronze_medal_badge', name: 'Bronze medal'},
    {key: 'silver_medal_badge', name: 'Silver medal'},
    {key: 'gold_medal_badge', name: 'Gold medal'},
    {key: 'cake_badge', name: 'Cake'},
    {key: 'computer_badge', name: 'Computer'},
    {key: 'bronze_trophy_badge', name: 'Bronze trophy'},
    {key: 'silver_trophy_badge', name: 'Silver trophy'},
    {key: 'gold_trophy_badge', name: 'Gold trophy'},
    {key: 'badge1', name: 'Smiley'},
    {key: 'badge2', name: 'Silver trophy 2'},
    {key: 'badge3', name: 'Lightning'},
  ];
  selectedAssignments: any[];
  tests: any;
  badgeName: string;
  badgeDescription: string;

  constructor(private courseService: CourseService, private route: ActivatedRoute, private headService: HeadService,
              private fb: FormBuilder, private assignmentService: AssignmentService, private modalService: BsModalService,
              private backendService: BackendService, private toastService: ToastService, private userService: UserService,
              private router: Router) {

    // Subscribe to the sidebar state
    this.headService.stateChange.subscribe(sidebarState => {
      this.sidebarState = sidebarState; });

    this.courseService.teachCourses.subscribe( teachCourses => {
      this.teachCourses = teachCourses;
    });

    this.route.params.subscribe( (params: any) => {
      // Grab the current course
      this.currentCourse = this.courseService.GetCourse(params.course);
      this.currentCourseSaved = this.currentCourse;
      console.log('course', this.currentCourse);
      // Assign groups for assignments
      if (this.assignmentService.courseAssignments[this.currentCourse.id] !== undefined) {
        this.assignmentGroups = this.assignmentService.courseAssignments[this.currentCourse.id];
        console.log('assignments', this.assignmentGroups);
      } else {
        this.assignmentGroups = this.assignmentService.courseAssignments['default'];
        console.log('assignments', this.assignmentGroups);
      }
      this.selectedAssignments = [{'assignment': this.flattenAssignments()[0], 'possible': this.flattenAssignments()}];

      this.backendService.getPendingUsers(this.currentCourse.id)
        .then(response => {
          console.log('pending', response);
          this.pendingReqs = response;
        })
        .catch(err => console.error('Get pending users failed', err));
    });
  }

  ngOnInit() {
    this.teachCourses = this.courseService.teaching;
    this.sidebarState = this.headService.getCurrentState();
    this.possibleStudents = [];
    this.selectedBadge = 'bronze_medal_badge';
    this.form = this.fb.group(this.defaultForm);
    this.selectedAssignments = [{'assignment': this.flattenAssignments()[0], 'possible': this.flattenAssignments()}];
    this.tests = {};
  }

  openModal(modal, type) {
    // Open a modal dialog box
    if (type === 'createBadge') {
      for (const a of this.flattenAssignments()) {
        this.backendService.getAssignment(a.course_id, a.id)
          .then(response => {
            const tests = response['tests']['io'].concat(response['optional_tests']['io']);
            for (let i = 0; i < tests.length; i++) {
              tests[i]['checked'] = false;
            }
            this.tests[a.id] = tests;
          });
      }
    } else if (type === 'createGroup') {
      this.groupName = '';
    }
    this.modalRef = this.modalService.show(modal);
  }

  createAssignmentGroup() {
    this.backendService.postAssignmentGroup(this.currentCourse.id, this.groupName);
  }

  acceptAllReqs() { // iterate through pending list
    for (const req of this.pendingReqs) {
      this.acceptReq(req.user['_id']);
    }
  }

  acceptReq(student_id) {
    this.backendService.acceptPending(student_id, this.currentCourse.id)
      .then( response => {
        this.toastService.success('Request accepted!');
        // console.log('Accepted req:', response); // Object error stuff, need to check, but works
      })
      .catch(err => console.error('Accept failed', err));
  }

  declineReq(user_id) { // need to rewrite delete in backend.service
    console.log(user_id);
  }

  invite(student_id) {
    // Invite a student to this course

    this.backendService.postInvitationToCourse(this.currentCourse.id, student_id)
      .then(response => this.toastService.success('Student invited!'))
      .catch(err => console.error('Invitation failed', err));
  }

  search() {
    // Perform a search for students through the backend

    this.possibleStudents = [];
    this.backendService.getSearch(this.form.value.search)
      .then((response: any) => {

        // Populate matches
        for (const user of response.users as any[]) {
          this.possibleStudents.push({name: user.username, id: user._id});
        }
      })
      .catch(err => console.error('Search failed', err));
  }

  flattenAssignments() {
    const assignments = [];
    for (const group of this.assignmentGroups) {
      for (const a of group.assignments) {
        assignments.push(a);
      }
    }
    return assignments;
  }

  removeGoal(index) {
    this.selectedAssignments.splice(index, 1);
  }

  addGoal() {
    this.selectedAssignments.push({'assignment': this.flattenAssignments()[0], 'possible': this.flattenAssignments()});
  }

  submitBadge() {
    const assignments = [];

    for (const a of this.selectedAssignments) {
      const assignmentTests = [];
      for (const t in this.tests[a['assignment'].id]) {
        const test = this.tests[a['assignment'].id][t];
        if (test['checked'] === true) {
          assignmentTests.push(test._id);
        }
      }
      assignments.push({'assignment': a['assignment'].id, 'tests': assignmentTests, 'code_size': 100});
    }
    console.log('submit', assignments);
    this.backendService.postNewBadge(this.selectedBadge, this.badgeName, this.badgeDescription, this.currentCourse.id,
      [], assignments)
      .then(response => console.log('badge created: ', response));
  }

}

interface AssignmentGroup {
  name: string;
  collapse: boolean;
  assignments: Assignment[];
  groups: AssignmentGroup[];
}

interface Assignment {
  id: number;
  name: string;
  available: boolean;
}