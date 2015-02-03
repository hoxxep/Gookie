/**
 * Gookie
 * Lightweight & configurable GitHub Webhook Server
 * Created by Liam Gray (@hoxxep)
 * Released under the MIT License.
 */

var exec = require('child_process').exec,
    path = require('path'),
    winston = require('winston'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    express = require('express'),
    app = express(),
    logger;

var repos;

function main() {
    /**
     * Load config and start serving
     * TODO: add support for multiple events
     * TODO: add special thing for ping event
     */

    var config = loadConfig();

    process.argv.forEach(function (val, index, array) {
        if (val === '-q' || val === '--quiet') {
            logger.transports.console.level = 'warn';
        } else if (val === '-v' || val === '--verbose') {
            logger.transports.console.level = 'verbose';
            logger.transports.file.level = 'verbose';
        }
    });

    if (config.repositories) server(config.port);
}

function loadConfig() {
    /**
     * Load users settings and add defaults
     * @type {{port: number, repositories: Array}}
     * @return config merged with defaults
     */

    var defaults = {
        "port": 8001,
        "log": {
            "directory": ""
        },
        "repositories": [
            {
                "url": "https://github.com/user/repo",
                "path": "/home/user/local/git/repo",
                "deploy": "git pull",
                "secret": ""
            }
        ]
    };

    var config = require('./config.json');
    config = merge(defaults, config);

    repos = {};
    for (var repo in config['repositories']) {
        var r = config['repositories'][repo];
        r.url = formatUrl(r.url);
        repos[r.url] = merge(defaults.repositories[0], r);
    }

    logger = newLogger(config.log.directory, 'gookie.log');

    return defaults;
}

function newLogger(folder, logfile) {
    /**
     * Create Winston logger for specified filename and console
     * @param filename: name of log to write to (excluding .log)
     * @return a winston logger
     */
    var filename = folder ? path.join(folder, logfile) : logfile;

    return new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                name: 'console',
                json: false,
                colorize: true,
                level: 'info'
            }),
            new (winston.transports.File)({
                name: 'file',
                //datePattern: '.yyyy-MM-dd',
                filename: filename,
                timestamp: false,
                json: false,
                level: 'info'
            })
        ]
    })
}

function merge(object1, object2) {
    /**
     * Merge attributes of two objects
     * @param object1: default object
     * @param object2: customised object
     * @type {{}}
     * @return object1 overwritten by object2
     */
    var attr,
        object3 = {};
    for (attr in object1) {object3[attr] = object1[attr]}
    for (attr in object2) {
        if (attr in object1 && object2[attr] instanceof Array) {
            object3[attr] = arrayMerge(object1[attr], object2[attr]);
        } else if (attr in object1 && object2[attr] instanceof Object) {
            object3[attr] = merge(object1[attr], object2[attr]);
        } else {
            object3[attr] = object2[attr];
        }
    }
    return object3;
}

function arrayMerge(array1, array2) {
    /**
     * For merging repository array
     * @param array1: default array
     * @param array1: customised array
     * @type {Array}
     * @return array2 after its sub-Arrays/Objects overwritten by array1[0]
     */
    var array3 = [];
    for (elem in array2) {
        if (elem instanceof Array) {
            array3.concat(arrayMerge(array1[0], elem));
        } else if (elem instanceof Object) {
            array3.concat(merge(array1[0], elem));
        } else {
            array3.concat(elem);
        }
    }
    return array3;
}

function server(port) {
    /**
     * Start listening for hook
     * @param port: port to start Gookie server on
     */
    app.use(bodyParser.json({extended: false}));
    app.use(methodOverride());

    // error function
    app.use(function(err, req, res, next) {
        logger.error(timePrefix() + 'Error occured: ' + err);
        res.status(500).send('Bad request').end();
    });

    app.route('/')
        .get(function(req, res) {
            logger.info(timePrefix() + 'GET request sent from ' + req.connection.remoteAddress);
            res.status(200).send('<html><head><title>Gookie</title></head><body><h1>Your Gookie server is running.</h1></body></html>').end();
        })
        .post(function(req, res) {
            try {
                req.body.repository.url = formatUrl(req.body.repository.url);
                validateRequest(req.body);

                logger.verbose(timePrefix() + 'user ' + req.body.pusher.name + ' pushed to ' + req.body.repository.url);

                res.status(204).end();
            } catch (e) {
                logger.error(timePrefix() + e);
                res.status(400).send('Bad request.').end();
                return;
            }

            matchRepo(req.body);
        });

    app.listen(port);
    logger.info(timePrefix() + 'Server started on port ' + port);
}

function validateRequest(json) {
    /**
     * Validate GitHub JSON by checking repo matches etc.
     * TODO: support for secret
     * @param json: decoded JSON request body
     * @throws error when invalid JSON
     */

    if (!json.hasOwnProperty('repository') || !json.repository.hasOwnProperty('url')) {
        throw 'ERROR: invalid JSON!';
    }
    if (!repos.hasOwnProperty(json.repository.url)) {
        throw 'ERROR: ' + json.repository.url + ' just sent a webhook but is not configured?';
    }
}

function matchRepo(json) {
    /**
     * Match repo in JSON to deploy command
     * @param json: decoded JSON request body
     */
    var repo = repos[json.repository.url];
    deploy(repo.path, repo.deploy);
}

function deploy(directory, command) {
    /**
     * Run deploy command in git repo
     * Execs: cd "directory" && command
     * @param directory: directory of git repo
     * @param command: deploy command to run
     */
    command = 'cd "' + directory + '" && ' + command;
    logger.verbose(timePrefix() + command);
    exec(command, function(error, stdout, stderr) {
        if (stdout) logger.info(timePrefix() + 'Deploying in ' + directory + '\n' + stdout);
        if (stderr) logger.error(timePrefix() + 'Deploy error in ' + directory + '\n' + stderr);
        if (error) logger.error(timePrefix() + 'Deploy error in ' + directory + '\n' + error);
        logger.verbose(timePrefix() + 'end of deploy output');
    });
}

function timePrefix() {
    /**
     * Time prefix for console.log
     * @return prefix in the form of ' [hh:mm:ss] '
     */
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    return ' [' + hour + ':' + min + ':' + sec + '] ';
}

function formatUrl(url) {
    /**
     * Get user and repo name from url
     * @param url: url in string format
     * @type String
     * @return formatted github url like: https://github.com/user/repo
     */
    var match = url.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-]+)\/?/);
    if (match.length < 3) throw 'Invalid repo URL ' + url;
    return 'https://github.com/' + match[1].toLowerCase() + '/' + match[2].toLowerCase();
}

main();