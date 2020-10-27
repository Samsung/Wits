const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');
const watch = require('node-watch');
const recursiveReadDir = require('recursive-readdir');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const htmlParser = require('node-html-parser');

const regExp = require('./regexp.js');
const appLaunchHelper = require('./appLaunchHelper.js');
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
        const socketPort = data.socketPort;
        const hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
        const hostAppName = hostAppId.split('.')[1];
        deviceName = deviceInfo.deviceName; //global
        const hostAppPath = deviceInfo.appInstallPath + hostAppName;
        appLaunchHelper.terminateApp(deviceName, hostAppId);

        http.listen(socketPort, data.hostIp, () => {
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
        http.close();
        io.removeAllListeners('connection');
        io.close();
    }
};

function ignoreFunc(file, stats) {
    return witsIgnores.includes(path.basename(file));
}

function getWitsIgnore(baseAppPath) {
    const file = path.resolve(path.join(baseAppPath, WITs_IGNORE_FILE));
    let ignore = [];

    try {
        let ignoreData = fs.readFileSync(file, 'utf8').trim();
        if (ignoreData && ignoreData.length > 0) {
            ignore = ignoreData.replace(regExp.FIND_ALL_CR, '').split('\n');
        }
    } catch (e) {
        console.warn(`[warning] Failed to get Wits ignore ${e}`);
    }
    return ignore;
}

async function getContentFiles(baseAppPath) {
    let data = [];
    try {
        data = await recursiveReadDir(baseAppPath, [ignoreFunc]);
    } catch (e) {
        console.error(chalk.red(`Failed to get content files`));
        util.exit();
        return;
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
        const contentFilesInfo = {
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
        const file = filesInfo.files[filesInfo.curIdx];
        let filePath = path.isAbsolute(file)
            ? file.replace(regExp.BACKSLASH, '/')
            : util.getAbsolutePath(file);
        const fileName = filePath.replace(baseAppPath, '');
        const contentSrc = getContentSrc(baseAppPath);
        if (
            !util.isRemoteUrl(contentSrc) &&
            contentSrc === fileName.replace(regExp.FIRST_BACKSLASH, '')
        ) {
            try {
                pushFsWrapperFile(hostAppPath);
                filePath = getWrappedContentFiles(filePath, fileName);
            } catch (e) {
                console.log(
                    '[Warning]: Failed to wrapped FileSystem to contents file.'
                );
            }
        }
        const CONTENT_FILE_PUSH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} push "${filePath}" "${hostAppPath}${fileName}"`;
        const pushResult = exec(CONTENT_FILE_PUSH_COMMAND, {
            async: true,
            silent: true
        });
        pushResult.stderr.on('data', data => {
            const COMPATIBILITY_ERROR = 'version compatibility problems';
            if (!data.includes(COMPATIBILITY_ERROR)) {
                mediator.emit('push_failed');
            }
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
        const filePath = name
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
    const contentSrc = getContentSrc(basePath);
    let fileName = filePath.replace(regExp.FIRST_BACKSLASH, '');
    let fileFullPath = basePath + filePath;
    if (!util.isRemoteUrl(contentSrc) && contentSrc === fileName) {
        try {
            fileFullPath = getWrappedContentFiles(fileFullPath, fileName);
        } catch (e) {
            console.log(
                '[Warning]: Failed to wrapped FileSystem to contents file.'
            );
        }
    }
    const UPDATE_FILE_PUSH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} push "${fileFullPath}" "${destPath}${filePath}"`;
    exec(UPDATE_FILE_PUSH_COMMAND, (code, stdout, stderr) => {
        if (stderr) {
            const COMPATIBILITY_ERROR = 'version compatibility problems';
            if (!stderr.includes(COMPATIBILITY_ERROR)) {
                console.log(`Failed ${stderr}`);
                util.exit();
            }
        }
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

function getContentSrc(baseAppPath) {
    let contentSrc = 'index.html';

    try {
        const file = path.resolve(path.join(baseAppPath, 'config.xml'));
        let data = fs.readFileSync(file, 'utf8');
        data = util.clearComment(data);
        contentSrc = data
            .match(regExp.CONTENT_SRC)[0]
            .replace(regExp.CONTENT_SRC_ATTRIBUTE, '');
    } catch (e) {
        console.warn(
            `[warning] Failed to read config.xml. Set Content src to default.`
        );
    }
    return contentSrc.replace(regExp.FIRST_BACKSLASH, '');
}

function pushFsWrapperFile(hostAppPath) {
    const WRAPPER_FILE = 'wrapper/filesystemWrapper.js';
    const WRAPPER_FILE_PATH = path
        .join(util.WITS_BASE_PATH, WRAPPER_FILE)
        .replace(regExp.BACKSLASH, '/');
    const WRAPPER_FILE_PUSH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} push "${WRAPPER_FILE_PATH}" "${hostAppPath}/${WRAPPER_FILE}"`;
    exec(WRAPPER_FILE_PUSH_COMMAND, {
        async: true,
        silent: true
    });
}

function getWrappedContentFiles(filePath, fileName) {
    let fileData = fs.readFileSync(filePath, 'utf8');
    let newFileData = appendFsWrapperScript(fileData);
    let newFilePath = path.join(util.WITS_BASE_PATH, 'wrapper', fileName);
    fs.writeFileSync(newFilePath, newFileData, 'utf8');
    return newFilePath;
}

function appendFsWrapperScript(fileData) {
    const root = htmlParser.parse(fileData);
    root.querySelector('head').appendChild(
        '<script type="text/javascript" src="wrapper/filesystemWrapper.js"></script>\n'
    );
    return root.toString();
}
