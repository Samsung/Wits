const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const watch = require('node-watch');
const recursiveReadDir = require('recursive-readdir');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const regExp = require('./regexp.js');
const hostAppHelper = require('./hostAppHelper.js');
const util = require('./util.js');

const WATCHER_EVENT_UPDATE = 'update';
const WATCHER_EVENT_REMOVE = 'remove';
const WITs_IGNORE_FILE = '.witsignore';
let watcher = {};
let mediator = {};
let witsIgnores = [];
let deviceName = '';

module.exports = {
    openSocketServer: async (data, deviceInfo) => {
        let socketPort = data.socketPort;
        let hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
        let hostAppName = hostAppId.split('.')[1];
        deviceName = deviceInfo.deviceName;
        let hostAppPath = deviceInfo.appInstallPath + hostAppName;

        http.listen(socketPort, data.pcIp, () => {
            console.log(`listening on ${socketPort}`);
        });

        mediator = io.on('connection', socket => {
            console.log(`a user connected`);
            console.log(`new client connected, id = ${socket.id} `);

            socket.emit('response', {
                rsp: {
                    status: 'connected'
                }
            });

            socket.on('disconnect', () => {
                console.log(`disconnect, id = ${socket.id}`);
                socket.disconnect(true);
                watcher.close();
            });

            socket.once('connect_error', () => {
                console.log(`socket once::::connect_error`);
            });

            socket.on('push_request', () => {
                console.log(`socket on::::push_request`);
                startPushFiles(data.baseAppPath, hostAppPath);
            });

            socket.on('watch_request', path => {
                console.log(`socket on::::watch_request`);
                watchAppCode(path.basePath, path.destPath);
            });
        });
    },
    closeSocketServer: () => {
        watcher.close && watcher.close();
        io.close();
        http.close();
    }
};

function ignoreFunc(file, stats) {
    return witsIgnores.includes(path.basename(file));
}

function getWitsIgnore(baseAppPath) {
    let file = path.resolve(path.join(baseAppPath, WITs_IGNORE_FILE));
    let ignore = [];

    try {
        let ignoreData = fs.readFileSync(file, 'utf8').trim();
        if (ignoreData && ignoreData.length > 0) {
            ignore = ignoreData.replace(regExp.FIND_ALL_CR, '').split('\n');
        }
    } catch (e) {
        console.log(`[warning] Failed to get Wits ignore ${e}`);
    }
    return ignore;
}

async function getContentFiles(baseAppPath) {
    let data = [];
    try {
        data = await recursiveReadDir(baseAppPath, [ignoreFunc]);
    } catch (e) {
        console.log(`Failed to get content files`);
        process.exit(0);
    }

    return data;
}

function updatePushProgress(currentNumber, totalNumber) {
    if (currentNumber > totalNumber) {
        currentNumber = totalNumber;
    }

    mediator.emit('push_progress', {
        total: totalNumber,
        load: currentNumber,
        progressRate: Math.floor((currentNumber / totalNumber) * 100) + '%'
    });
}

function startPushFiles(baseAppPath, hostAppPath) {
    const START_PUSH_INDEX = 0;
    let totalFileNum = 0;

    witsIgnores = getWitsIgnore(baseAppPath);

    getContentFiles(baseAppPath).then(files => {
        totalFileNum = files.length;
        console.log(`Total File Number : ${totalFileNum}`);
        let contentFilesInfo = {
            files: files,
            curIdx: START_PUSH_INDEX,
            totalFileNum: totalFileNum
        };
        pushFile(baseAppPath, hostAppPath, contentFilesInfo);
    });
}

function pushFile(baseAppPath, hostAppPath, filesInfo) {
    if (filesInfo.curIdx >= filesInfo.totalFileNum) {
        mediator.emit('push_completed');
    } else {
        let file = filesInfo.files[filesInfo.curIdx];
        let filePath = path.isAbsolute(file)
            ? file.replace(regExp.BACKSLASH, '/')
            : util.getAbsolutePath(file);
        let RemovedBaseAppPath = filePath.replace(baseAppPath, '');
        const CONTENT_FILE_PUSH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} push "${filePath}" "${hostAppPath}${RemovedBaseAppPath}"`;
        let pushResult = shelljs.exec(CONTENT_FILE_PUSH_COMMAND, {
            async: true,
            silent: true
        });
        pushResult.stderr.on('data', data => {
            mediator.emit('push_failed');
        });
        pushResult.stdout.on('data', data => {
            if (regExp.PUSHED_FILE_MESSAGE.test(data)) {
                ++filesInfo.curIdx;
                updatePushProgress(filesInfo.curIdx, filesInfo.totalFileNum);
                pushFile(baseAppPath, hostAppPath, filesInfo);
            }
        });
    }
}

function watchAppCode(basePath, destPath) {
    watcher = watch(basePath, { recursive: true }, (evt, name) => {
        console.log(`${name} ${evt}`);
        let filePath = name
            .replace(regExp.BACKSLASH, '/')
            .replace(basePath, '');
        console.log(`watch file : ${filePath}`);
        if (!isIgnore(filePath)) {
            if (evt === WATCHER_EVENT_UPDATE) {
                pushUpdated(basePath, destPath, filePath);
            } else if (evt === WATCHER_EVENT_REMOVE) {
                emitRemoved(basePath, destPath, filePath);
            }
        }
    });
}

function isIgnore(path) {
    let isIgnore = false;
    witsIgnores.some(ignore => {
        if (path.includes(ignore)) {
            console.log(`This watch file is ignore.`);
            isIgnore = true;
            return true;
        }
    });
    return isIgnore;
}

function pushUpdated(basePath, destPath, filePath) {
    console.log(filePath);
    const UPDATE_FILE_PUSH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} push "${basePath}${filePath}" "${destPath}${filePath}"`;
    shelljs.exec(UPDATE_FILE_PUSH_COMMAND, (code, stdout, stderr) => {
        console.log(`Program output : ${stdout}`);
        if (stdout.includes('file(s) pushed')) {
            mediator.emit('changed');
        }
    });
}

function emitRemoved(basePath, destPath, filePath) {
    console.log(filePath);
    mediator.emit(WATCHER_EVENT_REMOVE, destPath + filePath);
}
