'use strict';
var badInput = require('./badInputError.js');
var errors = require('./errors.js');
var constants = require('./constants.js');
var typecheck = require('./typecheck.js');


// GREAT LINKS:
// https://booker.codes/input-validation-in-express-with-express-validator/
// https://github.com/chriso/validator.js#validators

// WHY IS IT DONE?!
// Sending next as parameter does not work. Code will continue to execute in route.
// Therefore calls to input validator will have to be wrapped in try catch block in route.
// Promise creates difficult situations with reaching input in chains sometimes.
// This is not an asynchronus call so therefore promise is not a must.
// If anyone have any idea of solving these problems. Feel free to change.



// Input Validating for POST /api/courses/
function postCourseValidation(req) {
    // required
    var name, enabled_features;

    // optional
    var description, course_code, hidden, autojoin;

    // Required Fields
    req.checkBody("name", "Must contain only letters and numbers").isAscii();
    name = req.body.name;

    // TODO: This is an object. How to check this properly?
    //req.checkBody("enabled_features", "Not a bool").isEmpty();
    enabled_features = req.body.enabled_features;


    // Optional fields
    if (req.body.description) {
        req.checkBody("description", "Must contain only ascii characters").isAscii();
        description = req.body.description;
    } else {
        description = "";
    }

    if (req.body.description) {
        req.checkBody("course_code", "Must contain only ascii characters").isAlphanumeric();
        course_code = req.body.course_code;
    } else {
        course_code = "";
    }

    if (req.body.hidden) {
        req.checkBody("hidden", "Must contain true or false").isBoolean();
        hidden = req.body.hidden;
    } else {
        hidden = false;
    }

    if (req.body.autojoin) {
        req.checkBody("autojoin", "Must contain true or false").isBoolean();
        autojoin = req.body.autojoin;
    } else {
        autojoin = false;
    }

    // This is the "check". If any errors is found above they will be added to req and found by validationErrors.
    // Must be included.
    var inputError = req.validationErrors();
    if (inputError) {
        // next here seems to not work. Code will continue execute in routes anyways. Even with return.
        throw badInput.BAD_INPUT(inputError);
    }

    // TODO: REMOVE TEACHER IN OBJECT. WHEN TEST FIXED
    var input = {name: name, owner: req.user.id, teachers: [req.user.id], enabled_features: enabled_features, description: description,
                        course_code: course_code, hidden: hidden, autojoin: autojoin};
    return input;
}

// Input Validation for POST /api/courses/:course_id/members/invite
function postMemberInviteValidation(req) {
    // required
    var course_id;

    // optional
    var user_id;

    //req
    req.checkParams("course_id", "Not a valid course id").isMongoId();
    course_id = req.params.course_id;

    //optional
    if (!req.body.user_id) {
        user_id = req.user.id;
    } else {
        req.checkBody("user_id", "Not a valid user id").isMongoId();
        user_id = req.body.user_id;
    }

    var inputError = req.validationErrors();
    if (inputError) {
        throw badInput.BAD_INPUT(inputError);
    }

    var input = {course_id: course_id, user_id: user_id};
    return input;
}

// Input Validation for PUT /api/courses/:course_id/members/invite
function putMembersInviteValidation (req) {
    // required
    var course_id;

    // optional
    var user_id;

    //req
    req.checkParams("course_id", "Not a valid course id").isMongoId();
    course_id = req.params.course_id;

    //optional
    if (!req.body.user_id) {
        user_id = req.user.id;
    } else {
        req.checkBody("user_id", "Not a valid user id").isMongoId();
        user_id = req.body.user_id;
    }

    var inputError = req.validationErrors();
    if (inputError) {
        throw badInput.BAD_INPUT(inputError);
    }

    var input = {course_id: course_id, user_id: user_id};
    return input;
}

function assignmentgroupValidation(req) {

    let input = {};

    // required
    var name;

    // optional
    var assignments = [];
    var adventuremap = {};

    //req
    req.checkBody("name", "Must contain only ascii characters").isAscii();
    name = req.body.name;

    //optional
    if(req.body.assignments) {
        req.checkBody('assignments')
             .custom((item)=>Array.isArray(item))
             .withMessage( "Must be array");
        assignments = req.body.assignments;
    }
    if(req.body.adventuremap) {
        // TODO Check object
        //req.checkBody("adventuremap", "Not a valid assignments field").isJSON();
        adventuremap = req.body.adventuremap;
    }

    var inputError = req.validationErrors();
    if (inputError) {
        throw badInput.BAD_INPUT(inputError);
    }

    input.name = name;
    input.assignments = assignments;
    input.adventuremap = adventuremap;

    return input;
}

function badgeValidation(req) {

    let input = {};

    // required
    var course_id;
    var icon;
    var title;
    var description;

    // optional
    var goals = {};
    
    //req
    req.checkParams("course_id", "Not a valid course id").isMongoId();
    course_id = req.params.course_id;
    req.checkBody("icon", "Must contain only ascii characters").isAscii();
    icon = req.body.icon;
    req.checkBody("title", "Must contain only ascii characters").isAscii();
    title = req.body.title;
    req.checkBody("description", "Must contain only ascii characters").isAscii();
    description = req.body.description;

    //optional
    if(req.body.goals) {
        // TODO Check object
        /*req.checkBody('assignments')
             .custom((item)=>Array.isArray(item))
             .withMessage( "Must be array");*/
        goals = req.body.goals;
    }

    var inputError = req.validationErrors();
    if (inputError) {
        throw badInput.BAD_INPUT(inputError);
    }

    input.course_id = course_id;
    input.icon = icon;
    input.title = title;
    input.description = description;
    input.goals = goals;

    return input;
}

exports.postCourseValidation = postCourseValidation;
exports.putMembersInviteValidation = putMembersInviteValidation;
exports.postMemberInviteValidation = postMemberInviteValidation;
exports.assignmentgroupValidation = assignmentgroupValidation;
exports.badgeValidation = badgeValidation;
