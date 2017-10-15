
var schemas = require('../models/schemas.js')
var app = require('express')();
//var mongoose = require('mongoose');
//var dbURI = 'mongodb://localhost/test'; 

var Assignment = require('../models/schemas').Assignment;
var Test = require('../models/schemas').Test;


/* This function will get all tests related to a specific assignment. */
var getTestsFromAssignment = function (assignmentID, callback) {
    
    testsToReturn = []

    Assignment.findById(assignmentID)
    .populate({
        path: 'tests',
        model: 'Test'
    })
    .exec(function(err, assignmentObject) {
        //The tests needs to match the format used by Tester.
        for (i = 0; i < assignmentObject.tests.length; i++) { 
            testsToReturn.push( {stdin: assignmentObject.tests[i].stdin, 
                args: assignmentObject.tests[i].args, 
                stdout: assignmentObject.tests[i].stdout,
                id: assignmentObject.tests[i]._id
            } )
        }

        callback(testsToReturn)
    });

                       
}

exports.getTestsFromAssignment = getTestsFromAssignment;


/*function getAssignment(assignmentID) {
    
    //find the assignment matching our assignmentID from the database
    assignment = new Assignment;
    assignment = Assignment.findByID({assignmentID}); 
    return assignment;
} */



                                    
               
/*
Team.findOne({'teamMembers.username': 'Bioshox'}, {'teamMembers.$': 1},
    function (err, team) {
        if (team) {
            console.log(team.teamMembers[0].email);
        }
    }
);*/

