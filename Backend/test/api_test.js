'use strict';

const request = require('supertest');
const assert = require('assert');

let runner = require('../bin/www');

after(() => {
    console.log('afterafter');
    runner.server.close();
});

describe('api', () => {
    //let runner;
    let access_token;

    beforeEach(() => {
        //runner = require('../app');
        //runner.listen();
        //runner = require('../bin/www');
        access_token = undefined;
        return request(runner.server)
        .get('/auth/login/fake')
        .expect(200)
        .then(res => {
            access_token = res.body.access_token;
            console.log('authed');
        });
    });

    afterEach((done) => {
        //runner.server.close(() => {
        //    console.log('in the callback');
        //    done();
        //});
        done();
        console.log('after');
    });

    describe('GET /api/courses/me', () => {
        it('fails when not provided with an access token', () => {
            request(runner.server)
            .get('/api/courses/me')
            .then(403);
        });

        it('gets courses for the fake user', () => {
            request(runner.server)
            .get('/api/courses/me')
            .set('Authorization', 'Bearer ' + access_token)
            .expect(200);
        });
    });

    //describe('POST /api/assignment??', () => {
    //    it('stores the assignment in the database', (done) => {
    //        request(runner.server)
    //        .post('/api/assignment')
    //        .send({
    //            // TODO: real input
    //            course_id: '0000000',
    //            name: 'Assignment name',
    //            text: 'Assignment text'
    //        })
    //        .expect('Content-Type', 'application/json')
    //        .expect(200, {
    //            id: 1 // TODO: should be a mongo id
    //        }, done);
    //    });
    //});
});