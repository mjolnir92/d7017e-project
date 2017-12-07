import { Injectable } from '@angular/core';
import { BackendService } from './backend.service';
import { Assignmentsgroup } from '../../assignmentsgroup';
import { Assignment } from '../../assignment';
import { Assignments } from '../../assignments';

@Injectable()
export class AssignmentService {
  courseAssignments = {};

  constructor(private backendService: BackendService) {

  }

  getAssignmentsForCourse(course_id): Promise<any> {
    // Set assignments to a course

    return new Promise((resolve, reject) => {
      this.backendService.getCourseAssignments(course_id)
        .then(assignmentsResponse => {
          console.log('AssignmentsResp:', assignmentsResponse);
          //this.AddCourseAssignments(course_id, assignmentsResponse['assignments']);
          this.setAssignmentsForCourse(course_id, assignmentsResponse['assignments']);
          resolve();
        })
        .catch(reject);
    });
  }

  getAssignmentGroups(course_id, backendService) {
    console.log('getting groups');
    return new Promise((resolve, reject) => {
      backendService.getAssignmentGroupsCourse(course_id)
        .then(response => {
          const groups = response['assignmentgroups'];
          this.setGroupsForCourse(course_id, groups);
          resolve();
        })
        .catch(reject);
    });
  }

  setGroupsForCourse(course_id: string, groups: any[]) {
    const groupList = getGroupList(groups);
    console.log('GroupList:', groupList);
    if (this.courseAssignments[course_id]) {
      this.courseAssignments[course_id]['groups'] = groupList;
    } else { // Not defined yet
      this.courseAssignments[course_id] = newAssignments(groupList, '');
    }
    console.log('courseAssignments:', this.courseAssignments);
  }

  setAssignmentsForCourse(course_id: string, assignments: any[]) {
    const assignList = getAssignmentList(assignments);
    if (this.courseAssignments[course_id]) {
      this.courseAssignments[course_id]['assignments'] = assignList;
    } else {
      this.courseAssignments[course_id] = newAssignments('', assignList);
    }
  }

  AddCourseAssignments(course_id: string, assignments: any[]) {
    const a = [];
    for (let i = 0; i < assignments.length; i++) {
      a[i] = {'assignment': assignments[i]};
    }
    if (this.courseAssignments[course_id] === undefined) {
      this.courseAssignments[course_id] = [];
    }
    if (this.courseAssignments[course_id]['assignments'] === undefined) {
      this.courseAssignments[course_id]['assignments'] = [];
    }
    this.courseAssignments[course_id]['assignments'] = a;
  }

  AddCourseAssignmentGroup(course_id: string, group: any) {
    if (this.courseAssignments[course_id] === undefined) {
      this.courseAssignments[course_id] = [];
    }
    if (this.courseAssignments[course_id]['groups'] === undefined) {
      this.courseAssignments[course_id]['groups'] = [];
    }
    this.courseAssignments[course_id]['groups'].push(group);
    console.log('course groups', this.courseAssignments[course_id]['groups']);
  }

  GetAssignment(course_id: string, group_id: string, assignment_id: string): Assignment { // when you click on an assignment
    const groups = this.courseAssignments[course_id].groups;
    const group = groups.find((current) => current.id === group_id);
    const assignments = group.assignments;
    return assignments.find((current) => current.id === assignment_id);
  }
}

function getGroupList(groups: any): Assignmentsgroup[] {
  const groupList: Assignmentsgroup[] = [];
  for (const group of groups) {
    const assignList = getAssignmentList(group.assignments);
    groupList.push(newAssignmentsgroup(group._id, group.name, assignList));
  }
  return groupList;
}

function getAssignmentList(assignments: any): Assignment[] {
  const assignmentsList: Assignment[] = [];
  for (const assign of assignments) {
    let assignment = assign;
    if (assign.assignment) {
      assignment = assign.assignment;
    }
    assignmentsList.push(newAssignment(assignment._id, assignment.name, assignment.languages, assignment.description));
  }
  return assignmentsList;
}

function newAssignments(groups, assignments): Assignments {
  return {
    groups: groups,
    assignments: assignments, // should only be visible to teacher
  };
}

function newAssignmentsgroup(id: string, name: string, assignments: Assignment[]): Assignmentsgroup {
  return {
    id: id,
    name: name,
    assignments: assignments,
  };
}

function newAssignment(id: string, name: string, languages: any[], desc: string) {
  return {
    id: id,
    name: name,
    languages: languages,
    description: desc,
  };
}

