'use strict';

var testerCom = require('../../lib/tester_communication');
var errors = require('../../lib/errors');
var request = require('supertest');
var auth = require('../../lib/authentication.js');
var queries = require('../../lib/queries/queries');
var config = require('config');

module.exports = function(router) {

    // Search in database. It is possible to specify categories (users, courses, assignments)
    // Result:
    //  query on all users,
    //  query on courses the user is taking,
    //  query on assignments the user is taking
    router.get('/', function(req, res, next) {

        if (!('query' in req.query)) {
            return next(errors.BAD_QUERY_STRUCTURE);
        }

        if(req.query.query.length < config.get('Search.min_query_length')) {
            return next(errors.TOO_SHORT_QUERY);
        }

        return queries.searchDB(req.query.query, req.query.categories, req.user.id)
        .then(results => res.json(results))
        .catch(next);
    });
};
