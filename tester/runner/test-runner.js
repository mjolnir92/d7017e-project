/* jshint node: true */
'use strict';

var tmp = require('tmp');
var fs = require('fs');
var requireDir = require('require-dir');
var languages = requireDir('./languages');

const timeout = 5000; // ms

function result(id, ok, stderr) {
    // Build a result struct
    return {id:id, ok:ok, stderr:stderr};
}

async function runTests(request) {
    // Run some tests on the tester

    const codeFile = tmp.fileSync();
    fs.writeFileSync(codeFile.fd, request.code);

    let res = {results: []};
    let langModule = resolveLanguage(request.lang);
    let executable = langModule.prepare(codeFile.name);

    for (const test of request.tests) {
        try {
            let output = await validateAndRun(executable, test, langModule);
            if (output.stdout !== test.stdout) {
                // TODO: tell them what broke our expectations
                res.results.push(new result(test.id, false, output.stderr));
            } else {
                res.results.push(new result(test.id, true, output.stderr));
            }
        } catch (e) {
            // SIGTERM is sent to the child process on timeout
            if (e.signal == 'SIGTERM') {
                // TODO: tell them that the failure was from a timeout
                console.log('Execution timed out on test:', test.id);
                res.results.push(new result(test.id, false, ''));
            } else {
                throw e;
            }
        }
    }

    codeFile.removeCallback();
    return res;
}

function validateAndRun(file, test, langModule) {
    // Make sure that required fields are present before running

    if (!test.hasOwnProperty('args')) {
        test.args = [];
    }
    if (!test.hasOwnProperty('stdin')) {
        test.stdin = '';
    }
    return langModule.run(file, test, timeout);
}

function resolveLanguage(lang) {
    // Lookup language module from lang-string

    const langModule = languages[lang];
    if (!langModule) {
        throw new Error('lang `' + lang + '`is not supported');
    }
    if (!langModule.hasOwnProperty('prepare')) {
        langModule.prepare = (file) => {return file;};
    }
    return langModule;
}

exports.runTests = runTests;
