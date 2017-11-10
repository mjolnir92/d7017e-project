'use strict';
var features_helper = require('../features/features_helper');
const request = require('supertest');
const assert = require('assert');

let runner = require('../bin/www');

after(() => {
    runner.server.close(() => {
        // for some reason the program doesn't terminate
        // even after all tests are done
        // TODO: solve the termination problem with a less dirty hack
        process.exit(0);
    });
});

function auth() {
    return request(runner.server)
        .get('/auth/login/fake')
        .query({admin: 'false'})
        .expect(200)
        .then(res => {
            return res.body.access_token;
        });
}


describe('Search routes', () => {

    let access_token;

    before(() => {
        return auth().then(at => access_token = at);
    });

    /*it('GET /api/courses/search', () => {

        let query = '59f6f88b1ac36c0762eb46a9';
        let route = '/api/courses/search';

        return request(runner.server)
            .get(route+query)
            .set('Authorization', 'Bearer ' + access_token)
            .expect(200)
            .then(res => {
                console.log(res.body);
            });
    });*/
});
