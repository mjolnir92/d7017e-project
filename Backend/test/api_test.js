'use strict';

// force test mode BEFORE starting the server
process.env.NODE_ENV = 'test';

const request = require('supertest');
const assert = require('assert');
const ObjectId = require('mongoose').Types.ObjectId;

let runner = require('../bin/www');

// https://github.com/visionmedia/supertest/issues/370#issuecomment-249410533
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

after(() => {
    runner.server.close(() => {
        // for some reason the program doesn't terminate
        // even after all tests are done
        // TODO: solve the termination problem with a less dirty hack
        process.exit(0);
    });
});

function it_rejects_unauthorized_get(route) {
    it('fails when not provided with an access token', () => {
        return request(runner.server)
            .get(route)
            .expect(401);
    });
}

function it_rejects_unauthorized_post(route) {
    it('fails when not provided with an access token', () => {
        return request(runner.server)
            .post(route)
            .expect(401);
    });
}

describe('/api', () => {
    let access_tokens;
    let fake_admin_id = '5a041440bf85f83d5446f3bc';
    // intro programmering
    let course_id = '59f6f88b1ac36c0762eb46a9';
    let assignment_id;
    let test_id;

    before(() => {
        access_tokens = {};

        let user_promise = request(runner.server)
            .get('/auth/login/fake')
            .expect(200)
            .then(res => {
                access_tokens.user = res.body.access_token;
            });
        let admin_promise = request(runner.server)
            .get('/auth/login/fake')
            .query({admin: 'true'})
            .expect(200)
            .then(res => {
                access_tokens.admin = res.body.access_token;
            });
        return Promise.all([user_promise, admin_promise]);
    });

    function it_rejects_non_admin_post(route) {
        it('rejects non-admin users', () => {
            return request(runner.server)
                .post(route)
                .set('Authorization', 'Bearer ' + access_tokens.user)
                .expect(401);
        });
    }

    describe('/courses', () => {
        describe('GET /api/courses', () => {
            let route = '/api/courses';
            it_rejects_unauthorized_get(route);

            it('should get some courses', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        let courses = res.body.courses;
                        assert(Array.isArray(courses), 'not an array');
                        assert(courses.length > 0, 'array is empty');
                    });
            });
        });

        describe('POST /api/courses', () => {
            let route = '/api/courses';
            it_rejects_unauthorized_post(route);

            it('returns the new id', () => {
                return request(runner.server)
                    .post(route)
                    .send({
                        name: 'Introduction to Automated Testing in JavaScript',
                        description: 'In this course you will use Mocha and supertest to create automated tests for NodeJS applications.',
                        hidden: false,
                        course_code: 'D00testingE',
                        enabled_features: {badges: true}
                    })
                    .set('Authorization', 'Bearer ' + access_tokens.admin)
                    .expect(200)
                    .then(res => {
                        assert(ObjectId.isValid(res.body._id), 'response is not a valid ObjectId');
                    });
            });
        });

        describe('GET /api/courses/me', () => {
            let route = '/api/courses/me';
            it_rejects_unauthorized_get(route);

            it('gets a list of courses for the fake user', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(Array.isArray(res.body.courses), 'not an array');
                        assert(res.body.courses.length > 0, 'array is empty');
                    });
            });
        });

        describe('GET /api/courses/:course_id', () => {
            let route = '/api/courses/' + course_id;
            it_rejects_unauthorized_get(route);

            it('finds the course', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert.equal(res.body.name, "Introduktion till programmering");
                    });
            });
        });

        describe('GET /api/courses/:course_id/students', () => {
            let route = '/api/courses/' + course_id + '/students';
            it_rejects_unauthorized_get(route);

            it('returns a non-empty list of students', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(Array.isArray(res.body.students), 'not an array');
                        assert(res.body.students.length > 0, 'array is empty');
                    });
            });
        });

        describe('PUT /api/courses/:course_id/students', () => {
            let route = '/api/courses/' + course_id + '/students';

            it('succeeds if you are a teacher with valid input', () => {
                return request(runner.server)
                    .put(route)
                    .send({
                        student_id: '59fc236a2b731410888bf8f2'
                    }).set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200);
            });
        });

        describe('GET /api/courses/:course_id/teachers', () => {
            let route = '/api/courses/' + course_id + '/teachers';
            it_rejects_unauthorized_get(route);

            it('returns a non-empty list of teachers', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(Array.isArray(res.body.teachers), 'not an array');
                        assert(res.body.teachers.length > 0, 'array is empty');
                    });
            });
        });

        describe('POST /api/courses/:course_id/assignments', () => {
            let route = '/api/courses/' + course_id + '/assignments';

            it('returns an assignment id', () => {
                return request(runner.server)
                    .post(route)
                    .send({
                        name: 'Introduktion till tester',
                        description: 'Skriv tester med mocha',
                        hidden: false,
                        languages: 'javascript'
                    })
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(ObjectId.isValid(res.body._id), 'response is not a valid ObjectId');
                        assignment_id = res.body._id;
                    });
            });
        });

        describe('GET /api/courses/:course_id/assignments', () => {
            let route = '/api/courses/' + course_id + '/assignments';
            it_rejects_unauthorized_get(route);

            it('returns a non-empty list of assignments', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(Array.isArray(res.body.assignments), 'not an array');
                        assert(res.body.assignments.length > 0, 'array is empty');
                    });
            });
        });

        describe('POST /api/courses/:course_id/assignments/:assignment_id/tests', () => {

            it('returns a test id', () => {
                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/tests';
                return request(runner.server)
                    .post(route)
                    .send({
                        stdout: 'Output',
                        stdin: 'Input',
                        args: [],
                        lint: true
                    })
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(ObjectId.isValid(res.body._id), 'response is not a valid ObjectId');
                        test_id = res.body._id;
                    });
            });
        });

        describe('GET /api/courses/:course_id/assignments/:assignment_id/tests/:test_id', () => {

            it('returns a test object', () => {
                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/tests/' + test_id;
                it_rejects_unauthorized_get(route);
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert(ObjectId.isValid(res.body._id), 'response is not a valid ObjectId');
                        assert(test_id == res.body._id, 'response is not the requested test');
                    });
            });
        });

        describe('POST /api/courses/:course_id/assignments/:assignment_id/submit', () => {

            it('run assignments tests', () => {
                let assignment_id_test = '59f8a2a81ac36c0762eb46ae';

                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id_test + '/submit';
                it_rejects_unauthorized_post(route);
                return request(runner.server)
                    .post(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .send({
                        'lang': 'python3',
                        'code': 'print(\"hello world\")\n'
                    })
                    .expect(200)
                    .then(res => {
                        assert(assignment_id_test == res.body.assignment_id, 'response is not contain the correct assignment_id');
                    });
            });
        });

        describe('POST /:course_id/assignments/:assignment_id/save', () => {
            it('saves an empty draft to the database', () => {
                let assignment_id = '59f8a2a81ac36c0762eb46ae';

                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/save';

                it_rejects_unauthorized_post(route);
                return request(runner.server)
                    .post(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .send()
                    .expect(200)
                    .then(res => {
                        assert(assignment_id == res.body.assignment, 'response does not contain the correct assignment_id');
                        assert(res.body.lang == "", 'response param lang is not empty');
                        assert(res.body.code == "", 'response param code is not empty');
                    });
            });
            it('saves a draft to the database', () => {
                let assignment_id = '59f8a2a81ac36c0762eb46ae';

                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/save';

                let lang = 'python3';
                let code = 'print(\"hello world\")\n';
                it_rejects_unauthorized_post(route);
                return request(runner.server)
                    .post(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .send({
                        'lang': lang,
                        'code': code
                    })
                    .expect(200)
                    .then(res => {
                        assert(assignment_id == res.body.assignment, 'response does not contain the correct assignment_id');
                        assert(lang == res.body.lang, 'response does not contain the correct lang');
                        assert(code == res.body.code, 'response does not contain the correct code');
                    });
            });
        });

        describe('GET /:course_id/assignments/:assignment_id/draft', () => {
            it('retrieves a draft from the database', () => {
                let assignment_id = '59f8a2a81ac36c0762eb46ae';

                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/draft';

                let lang = 'python3';
                let code = 'print(\"hello world\")\n';
                it_rejects_unauthorized_get(route);
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .send()
                    .expect(200)
                    .then(res => {
                        assert(assignment_id == res.body.assignment, 'response does not contain the correct assignment_id');
                        assert(res.body.lang == lang, 'response does not contain the correct lang');
                        assert(res.body.code == code, 'response does not contain the correct code');
                    });
            });
            it('retrieves a non-existing draft from the database', () => {
                let assignment_id = '59f8a2a81ac36c0762eb32be';

                let route = '/api/courses/' + course_id + '/assignments/' + assignment_id + '/draft';

                it_rejects_unauthorized_get(route);
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .send()
                    .expect(200)
                    .then(res => {
                        assert(assignment_id == res.body.assignment, 'response does not contain the correct assignment_id');
                        assert(res.body.lang == "", 'response param lang is not empty');
                        assert(res.body.code == "", 'response param code is not empty');
                    });
            });
        });

        describe('GET /api/courses/:course_id/enabled_features', () => {
            let route = '/api/courses/' + course_id + '/enabled_features';
            it_rejects_unauthorized_get(route);

            it('returns a non-empty list of enabled_features', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {

                        console.log(res.body);
                        //assert(Array.isArray(res.body.teachers), 'not an array');
                        //assert(res.body.teachers.length > 0, 'array is empty');
                    });
            });
        });
    });

    describe('/users', () => {
        describe('GET /api/users/me', () => {
            let route = '/api/users/me';
            it_rejects_unauthorized_get(route);

            it('gets some user information', () => {
                return request(runner.server)
                    .get(route)
                    .set('Authorization', 'Bearer ' + access_tokens.user)
                    .expect(200)
                    .then(res => {
                        assert.equal(res.body.username, 'fake-student-00');
                        assert(!res.body.admin, 'should not be admin');
                    });
            });
        });

        describe('GET /api/users/:user_id', () => {
            // fake-admin-00
            let route = '/api/users/' + fake_admin_id;
            it_rejects_unauthorized_get(route);

            it('gets some user information', () => {
                return request(runner.server)
                .get(route)
                .set('Authorization', 'Bearer ' + access_tokens.user)
                .expect(200)
                .then(res => {
                    assert.equal(res.body.username, 'fake-admin-00');
                });
            });
        });

        describe.skip('GET /api/users/register', () => {
            it('TODO', () => {
            });
        });

        describe.skip('GET /api/users/:user_id/submissions', () => {
            it('TODO', () => {
            });
        });

        describe('GET /api/users/:user_id/courses', () => {
            let route = '/api/users/' + fake_admin_id + '/courses';
            it_rejects_unauthorized_get(route);

            it('returns a non-empty array', () => {
                return request(runner.server)
                .get(route)
                .set('Authorization', 'Bearer ' + access_tokens.user)
                .then(res => {
                    assert(Array.isArray(res.body.courses), 'not an array');
                    assert(res.body.courses.length > 0, 'array is empty');
                });
            });
        });

        describe.skip('GET /api/users/:user_id/courses/:course_id/submissions', () => {
            it('TODO', () => {
            });
        });
    });

    describe.skip('/features', () => {
    });

});
