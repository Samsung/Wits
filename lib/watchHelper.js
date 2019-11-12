
let fs = require('fs');
let path = require('path');
let shelljs = require('shelljs');
let watch = require('node-watch');
let recursiveReadDir = require('recursive-readdir');
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

const REG_EXP = require('./regexp.js');
const hostAppHelper = require('./hostAppHelper.js');

let watcher = {};
let mediator = {};
let witsIgnores = [];
let deviceName = '';

const WATCHER_EVENT_UPDATE = 'update';
const WATCHER_EVENT_REMOVE = 'remove';
const WITs_IGNORE_FILE = '.witsignore'

module.exports = {
    openSocketServer: (baseAppPath,deviceInfo,socketPort) => {
        let hostAppId = hostAppHelper.getHostAppId();
        let hostAppName = hostAppId.split('.')[1];
        deviceName = deviceInfo.deviceName;
        let hostAppPath = deviceInfo.appInstallPath + hostAppName;

        http.listen(socketPort, () => {
            console.log('listening on ',socketPort);
        });
    
        mediator = io.on('connection', (socket) => {
            console.log('a user connected');
            console.log('new client contected, id =  ',socket.id);
    
            socket.emit('response', {
                rsp: {
                    status: 'connected'
                }
            });
    
            socket.on('disconnect', () => {
                console.log(' disconnect, id =  ' + socket.id);
                socket.disconnect(true);
                watcher.close();
            });
    
            socket.once('connect_error', () => {
                console.log('socket once::::connect_error');
            });
    
            socket.on('push_request', () => {
                console.log('socket on::::push_request');
                startPushFiles(baseAppPath,hostAppPath);
            });
    
            socket.on('watch_request', (path) => {
                console.log('socket on::::watch_request');
                watchAppCode(path.basePath, path.destPath);
            });
        });
    },
    closeSocketServer: () => {
        watcher.close();
        io.close();
        http.close();
    }
}

function ignoreFunc(file, stats) {
    return witsIgnores.includes(path.basename(file));
}

function getWitsIgnore() {
    let file = path.resolve(path.join(baseAppPath, WITs_IGNORE_FILE));
    let ignore = [];

    try {
        ignore = fs.readFileSync(file,'utf8').replace(REG_EXP.FIND_ALL_CR,'').split('\n');
    }
    catch(e) {
        console.log('[warning] Failed to get Wits ignore');
    }

    return ignore;
}

async function getContentFiles(baseAppPath) {
    let data = [];
    try {
        data = await recursiveReadDir(baseAppPath, [ignoreFunc]);
    }
    catch(e) {
        console.log('Failed to get content files');
        process.exit(0);
    }

    return data;
}

function updatePushProgress(currentNumber,totalNumber) {
    if(currentNumber > totalNumber) {
        currentNumber = totalNumber;
    }

    mediator.emit('push_progress',{
        total: totalNumber,
        load: currentNumber,
        progressRate: Math.floor((currentNumber / totalNumber) * 100) + '%'
    });
}

function startPushFiles(baseAppPath,hostAppPath) {
    const START_PUSH_INDEX = 0;
    let totalFileNum = 0;

    witsIgnores = getWitsIgnore();

    getContentFiles(baseAppPath).then((files) => {
        totalFileNum = files.length;
        console.log('Total File Number : '+totalFileNum);
        let contentFilesInfo = {
            files: files,
            curIdx: START_PUSH_INDEX,
            totalFileNum: totalFileNum
        };
        pushFile(baseAppPath,hostAppPath,contentFilesInfo);
    });
}

function pushFile(baseAppPath,hostAppPath,filesInfo) {
    if(filesInfo.curIdx >= filesInfo.totalFileNum) {
        mediator.emit('push_completed');
    }
    else {
        let file = filesInfo.files[filesInfo.curIdx];
        let filePath = path.isAbsolute(file) ? file.replace(REG_EXP.BACKSLASH, '/') : getAbsolutePath(file);
        const CONTENT_FILE_PUSH_COMMAND = 'sdb -s ' + deviceName + ' push ' + '"' + filePath + '"'+ ' ' + '"' + hostAppPath + filePath.replace(baseAppPath,'')+ '"';
        let pushResult = shelljs.exec(CONTENT_FILE_PUSH_COMMAND, {async: true, silent: true});
        pushResult.stderr.on('data', (data) => {
            mediator.emit('push_failed');
        });
        pushResult.stdout.on('data', (data) => {
            if(REG_EXP.PUSHED_FILE_MESSAGE.test(data)) {
                ++filesInfo.curIdx;
                updatePushProgress(filesInfo.curIdx,filesInfo.totalFileNum);
                pushFile(baseAppPath,hostAppPath,filesInfo);
            }
        });
    }
}

function watchAppCode(basePath,destPath) {
    watcher = watch(basePath, {recursive: true}, (evt, name) => {
        console.log('%s %s.', name,evt);
        let filePath = name.replace(REG_EXP.BACKSLASH, '/').replace(basePath,'');
        console.log('watch file : ',filePath);
        if(!isIgnore(filePath)) {
            if(evt === WATCHER_EVENT_UPDATE) {
                pushUpdated(basePath, destPath, filePath);
            }
            else if(evt === WATCHER_EVENT_REMOVE) {
                emitRemoved(basePath, destPath, filePath);
            }
        }
    });
}

function isIgnore(path) {
    let isIgnore = false;
    witsIgnores.some((ignore) => {
        if(path.includes(ignore)) {
            console.log('This watch file is ignore.');
            isIgnore = true;
            return true;
        }
    });
    return isIgnore;
}

function pushUpdated(basePath, destPath, filePath) {
    console.log(filePath);
    const UPDATE_FILE_PUSH_COMMAND = 'sdb -s ' + deviceName + ' push '+ '"' + basePath+filePath + '"' + ' ' + '"' + destPath+filePath + '"';

    shelljs.exec(UPDATE_FILE_PUSH_COMMAND, (code, stdout, stderr) => {
        console.log('Program output : ' + stdout);
        if(stdout.includes('file(s) pushed')) {
            mediator.emit('changed');
        }
    });
}

function emitRemoved(basePath, destPath, filePath) {
    console.log(filePath);
    mediator.emit(WATCHER_EVENT_REMOVE, destPath + filePath);
}