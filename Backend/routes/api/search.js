'use strict';

var testerCom = require('../../lib/tester_communication');
var errors = require('../../lib/errors');
var request = require('supertest');
var auth = require('../../lib/authentication.js');
var queries = require('../../lib/queries/queries');
var config = require('config');

module.exports = function(router) {

    router.get('/', function(req, res, next) {

        if (!('query' in req.query)) {
            return next(errors.BAD_QUERY_STRUCTURE);
        }

        if(req.query.query.length < config.get('Search.min_query_length')) {
            return next(errors.TOO_SHORT_QUERY);
        }

        queries.searchDB(req.query.query, req.query.categories, req.user.id).then(function (results) {
            return res.json(results);
        }).catch(next);
    });
};
