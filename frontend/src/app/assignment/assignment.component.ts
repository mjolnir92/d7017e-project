import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import 'codemirror/mode/go/go';
import { BackendService, ObjectID } from '../services/backend.service';
import { AssignmentService } from '../services/assignment.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeadService } from '../services/head.service';
import { CourseService } from '../services/course.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-assignment',
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.css'],
  animations: [
    trigger('content', [
      state('inactive', style({marginLeft: '0%', width: '100%'})),
      state('active', style({marginLeft: '15%', width: '85%'})),
      transition('inactive => active', animate('300ms')),
      transition('active => inactive', animate('300ms'))
    ])
  ]
})
export class AssignmentComponent implements OnInit, OnDestroy {
  assignment: any;
  course: string;
  content: string;
  themes: string[];
  theme: string;
  languages: string[];
  language: string;
  status: boolean;
  sidebarState; // state of sidebar
  userid: string;
  feedback: string[];
  draftSubscription: Subscription;
  currentCourse: any;

  constructor(private backendService: BackendService,
              private assignmentService: AssignmentService,
              private headService: HeadService,
              private route: ActivatedRoute,
              private userService: UserService,
              private courseService: CourseService,
              private toastService: ToastService) {
    this.headService.stateChange.subscribe(sidebarState => {
        this.sidebarState = sidebarState;
    });
    this.route.params.subscribe( params => {
      this.assignment = this.assignmentService.GetAssignment(params['course'], params['group'], params['assignment']);
      this.currentCourse = this.courseService.GetCourse(params['course']);
      this.backendService.getDraft(new ObjectID(params['course']), new ObjectID(params['assignment']))
        .then(data => {
          this.resolveLanguage(data['lang']);
          this.content = data['code'];
        })
        .catch(err => console.error('Get draft failed', err));
    });
  }

  ngOnInit() {
    this.sidebarState = this.headService.getCurrentState();
    this.userid = this.userService.userInfo.id;
    this.languages = this.assignment['languages'];
    this.themes = ['eclipse', 'monokai'];
    this.theme = 'eclipse'; // default theme for now, could be saved on backend
    if (typeof this.language === 'undefined') {
      this.language = this.languages[0];
    }
    if (typeof this.content === 'undefined') {
      this.content = '';
    }

    this.status = false;
    this.updateStatus();

    // Periodically save a draft of the code
    this.draftSubscription = Observable.interval(30 * 1000).subscribe(x => {
      this.postDraft();
    });
  }

  ngOnDestroy() {
    // Stop posting drafts
    this.draftSubscription.unsubscribe();
  }

  // Submit code to backend for testing
  submitCode() {
    this.feedback = [];

    const user_id = new ObjectID(this.userid);
    const assignment_id = new ObjectID(this.assignment['id']);
    const course_id = new ObjectID(this.currentCourse.id);
    this.backendService.submitAssignment(user_id, course_id, assignment_id, this.language, this.content)
      .then(data => {
        this.HandleResponse(data);
      })
      .catch(err => console.error('Submit code failed', err));
    this.postDraft();
  }

  postDraft() {
    // Posts the current code to backend

    const assignment_id = new ObjectID(this.assignment['id']);
    const course_id = new ObjectID(this.currentCourse.id);
    this.backendService.postDraft(course_id, assignment_id, this.content, this.language)
      .catch(err => console.error('Post draft failed', err));
  }

  setTheme(th) {
    this.theme = th;
  }

  setMode(th) {
    this.language = th;
  }

  onChange(c) {
    this.content = c;
  }

  setFeedback(fb) {
    this.feedback = fb;
  }

  updateStatus() {
    // fetch the teacherview course and update status
    this.courseService.GetTeacherStudentViewHelper(this.currentCourse)
      .then(res => {
        this.currentCourse = res;
        this.updateStatusHelper();
      })
      .catch(err => {
        console.error('GetTeacherStudentViewHelper failed: ', err);
      });
  }

  updateStatusHelper() {
    // sets the status to true if we have passed the assignment already
    for (let prog of this.currentCourse.rewards.progress) {
      if (prog.assignment._id === this.assignment.id) {
        this.status = true;
        return;
      }
    }
    this.status = false;
  }

  // Handle the response from a code submission. Update the feedback div and update the course progress
  HandleResponse(value) {
    const feedback = [];
    const results = value['results'];

    let passTests = true;
    // Check the IO tests
    for (let i = 0; i < results['io'].length; i++) {
      const test = results['io'][i];
      const testindex = i + 1;
      if (!test['ok']) {
        const failure = (test['stderr'] === '') ? 'Wrong output: ' + test['stdout'] : test['stderr'];
        feedback.push('Test ' + testindex + ' failure: ' + failure);
        passTests = false;
      } else {
        feedback.push('Test ' + testindex + ' ok');
      }
    }
    if (passTests) {
      feedback.push('All I/O tests passed');
    }

    // Check lint test
    if (results['lint'] !== '') {
      feedback.push(results['lint']);
      passTests = false;
    }

    // Check prepare/compile step
    if (results['prepare'] !== '') {
      feedback.push(results['prepare']);
      passTests = false;
    }
    this.setFeedback(feedback);

    // Check for badges
    for (let badge of value.features.badges) {
      this.toastService.badge('', '');
    }

    if (value['passed']) {
      this.toastService.success('Assignment passed!');

      // Refresh the course
      this.courseService.UpdateCourse(this.currentCourse.id)
        .then(response => {
          // Once the course has been updated, get it
          this.currentCourse = this.courseService.GetCourse(this.currentCourse.id);
          this.updateStatusHelper();
        })
        .catch(err => console.error('Update course failed', err));
    }
  }

  setLanguage(language: string) {
    if (language.substr(0, 6) === 'python') {
      return 'python';
    } else if (language === 'C#') {
      return 'csharp';
    } else {
      return this.language;
    }
  }

  resolveLanguage(language: string) {
    // sets the current language setting for the editor to language if it is not empty
    if (language !== '') {
      this.language = language;
    } else {
      this.language = this.languages[0];
    }
  }
}
