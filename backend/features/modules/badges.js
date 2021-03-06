'use strict';

var queries = require('../../lib/queries/features');
var helper = require('../features_helper');
var logger = require('../../lib/logger');


function init(emitter, name) {
    emitter.on('handleFeatures', function(data) {
        return new Promise(function (resolve, reject){
            run(data).then(function(result) {
                let json = {};
                json[name] = result;
                resolve(json);
            }).catch(function(err) {
                logger.log("error",err);
            });
        });
    });
}

async function run(data) {

    let newBadges = [];

    let feature = await queries.getFeatureOfUserID(data.course_id, data.user_id);

    var completedBadges=[];
    for(var i=0;i<feature.badges.length;i++){
       completedBadges.push(feature.badges[i]._id);
    }

    // Merge result with existing data
    feature.progress = mergeResultWithProgress(data, feature.progress);

    let badges = await queries.getBadgeByCourseID(data.course_id);

    // Badges can need other badges in order to be completed
    let achievedNewBadge = true;
    while(achievedNewBadge) {
        // Only iterate loop if a new badge has been completed
        achievedNewBadge = false;
        for(let badge of badges) {
            if(badge.goals.assignments.length !== 0 || badge.goals.badges.length !== 0) {
                // Calculate a new badge
                badge = calcBadge(completedBadges, feature.progress, badge);

                if(badge !== undefined && !helper.arrayContainsArray(completedBadges, [badge])) {
                    let result = await queries.addBadgeToFeature(badge, feature._id);
                    newBadges.push(await queries.getBadge(badge));
                    completedBadges.push(badge);
                    achievedNewBadge = true;
                }
            }
        }
    }

    return newBadges;
}

function mergeResultWithProgress(result, progress) {

    let assignmentExists = false;

    progress.forEach(function (assignment, i) {
        if(assignment.assignment == result.assignment_id) {
            assignmentExists = true;

            progress.splice(i, 1);
            progress.push(helper.prepareProgressData(result));
        }
    });

    if(!assignmentExists) {
        progress.push(helper.prepareProgressData(result));
    }

    return progress;
}

function calcBadge(badges, progress, badge) {

    // Compare badges
    if(!helper.arrayContainsArray(badges, badge.goals.badges)) {
        logger.log("warn",'Badges failed badge');
        return;
    }

    for(let assignment of badge.goals.assignments) {

        // Find assignment in progress
        let assignment_progress;
        for(let p of progress) {
            if(p.assignment == assignment.assignment) {
                assignment_progress = p;
                break;
            }
        }
        if(assignment_progress === undefined) {
            logger.log("warn","Assignment required for Badge as not yet been done");
            return;
        }

        // Compare tests
        for(let test of assignment.tests) {
            let passed = false;
            for(let test_progress of assignment_progress.tests) {
                if(test == test_progress.test && test_progress.result === true) {
                    passed = true;
                }
            }
            if(passed === false) {
                logger.log("warn","Required test for badge was not completed");
                return;
            }
        }

        // Compare code size
        if("code_size" in assignment) {
            if(assignment.code_size < assignment_progress.code_size) {
                logger.log("warn","Code size was larger than required for Badge");
                return;
            }
        }
    }

    return badge._id;
}

exports.init = init;
