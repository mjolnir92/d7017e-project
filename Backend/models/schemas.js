'use strict';
//Mongoose schemas.

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Old schema, don't use for new stuff.
var testSchema = new Schema({
    stdin: {type: String, required: false},
    args: [{type: String, required: false}],
    stdout: {type: String, required: true} 
});

var assignmentSchema = new Schema({
    name: {type: String, required: true},
    description: String,
    hidden: { type: Boolean, required: true },
    tests: {
        io: [{
            stdout: {type: String, required: true},
            stdin: String,
            args: [String]
        }],
        lint: Boolean
    },
    optional_tests: {
        io: [{
            stdout: {type: String, required: true},
            stdin: String,
            args: [String]
        }],
        lint: Boolean
    },
    languages: [String]
});

var courseSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: false},
    teachers: [{ type: Schema.Types.ObjectId, ref: 'User', required: false }],
    students: [{ type: Schema.Types.ObjectId, ref: 'User', required: false }],
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment', required: false }]
});

var userSchema = new Schema({
	username: {type: String, required: true},
    email: {type: String, required: true},
    admin: {type: Boolean, required: true},
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course', required: false }],
    providers: [{type: String, required: true}]
});

var Test = mongoose.model('Test', testSchema);
var Assignment = mongoose.model('Assignment', assignmentSchema);
var Course = mongoose.model('Course', courseSchema);
var User = mongoose.model('User', userSchema);
var models = {Assignment: Assignment, Test: Test, User: User, Course: Course};

module.exports = models;