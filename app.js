let fs = require('fs');
let path = require('path');
let inquirer = require('inquirer');
let shelljs = require('shelljs');
let watch = require('node-watch');
let mkdirp = require('mkdirp');
let ip = require('ip');
let recursiveReadDir = require('recursive-readdir');
let chromeLauncher = require('chrome-launcher');
let xml2js = require('xml2js');
let inspect = require('util').inspect;

let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

let watcher = {};
let mediator = {};
let hostWidth = '';

let baseAppPath = '';
let witsAppPath = '';

let userAppId = '';
let userAppName = '';

let profileInfo = getProfileInfo();
let socketPort = '8498';

let isDebugMode = false;
let deviceName = '';
let deviceIpAddress = '';
let witsIgnores = [];

const REG_REMOTE_URI = new RegExp(/(http|ftp|https):\/\/([\w+?\.\w+])+([a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\,]*)?/);
const REG_COMMENT = new RegExp(/<!--\s*.*?\s*-->/g);
const REG_HOST_DATA = new RegExp(/({{CONTENT_PATH}})|({{HOST_IP}})|({{HOST_PORT}})|({{CONTENT_SRC}})|({{HOST_BASE_CONTENT_PATH}})/g);
const REG_HOST_WIDTH = new RegExp(/({{HOST_WIDTH}})/g);
const REG_CONTENT_SRC = new RegExp(/(content*.*src=("|')*.*("|'))/gi);
const REG_CONTENT_SRC_ATTRIBUTE = new RegExp(/((content*.*src=)|"|')/gi);
const REG_APPICATION_ID = new RegExp(/(tizen:application*.*id=("|')\w+.\w+)("|')/gi);
const REG_APPICATION_ID_ATTRIBUTE = new RegExp(/((tizen:application*.*id=)|"|')/gi);
const REG_PRIVILEGE = new RegExp(/tizen:privilege/);
const REG_DEBUG_PORT = new RegExp(/(port(.*):\s+\d+)/g);
const REG_BACKSLASH = new RegExp(/\\/gi);
const REG_NUMBER_ONLY = new RegExp(/^\d+(?!\w+)/g);
const REG_IP_ADDRESS = new RegExp(/\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/);
const REG_NUMBER_WORD = new RegExp(/\d+/);
const REG_FISRT_BACKSLASH = new RegExp(/^(\/)/);
const REG_FIND_CR = new RegExp(/\r/);
const REG_FIND_ALL_CR = new RegExp(/\r/g);

const REG_PUSHED_FILE_MESSAGE = new RegExp(/(pushed)*.*(100%)/);

const TV_CONNECT_PORT = '26101';
const EMULATOR_IP = '0.0.0.0';
const PACKAGE_BASE_PATH = 'tizen/build/';
const WITS_PACKAGE = 'Wits.wgt';
const PROFILE_NAME = profileInfo.name;
const PROFILE_PATH = profileInfo.path;
const WATCHER_EVENT_UPDATE = 'update';
const WATCHER_EVENT_REMOVE = 'remove';
const CONFIG_FILE = 'config.xml';

process.on('SIGINT', () => {
    console.log('Exit Wits............');
    watcher.close();
    io.close();
    http.close();
    process.exit(0);
});

(function startWits() {
    console.log('Start Wits............');
    let ask = getUserAskData();
    let connectedDevices = [];
    let appInstallPath = '';
    getUserAnswer(ask).then(() => {
        if(isIpAddress(deviceIpAddress) && deviceIpAddress !== EMULATOR_IP) {
            connectTV(deviceIpAddress);
        }
        makeWitsConfigFile(baseAppPath);
        connectedDevices = getConnectedDeviceList();

        selectDevice(connectedDevices).then(() => {
            appInstallPath = getAppInstallPath();

            userAppId = getUserAppId();
            userAppName = userAppId.split('.')[1];
            witsAppPath = appInstallPath + userAppName;

            setHostInfo();
            buildPackage();
            unInstallPackage();
            installPackage(appInstallPath);
            openSocketServer();
            isDebugMode ? launchAppDebugMode() : launchApp();
            // watchAppCode();
        });
    });
})();

function getUserAskData() {
    let connectionInfo = getRecentlyConnectionInfo();
    let baseAppPathQuestion = getBaseAppPathQuestion(connectionInfo);

    let ask = [{
        type: 'input',
        name: 'width',
        message: 'Input your Application width (1920 or 1280) :',
        default: connectionInfo.width,
        validate: function (input) {
            return (input === '1920' || input === '1280') ? true : 'Tizen web Application only support 1920 or 1280 width';
        }
    },{
        type: 'input',
        name: 'ip',
        message: 'Input your TV Ip address(If using Emulator, input ' + EMULATOR_IP + ') :',
        default: connectionInfo.ip,
        validate: function (input) {
            return isIpAddress(input) ? true : 'Invalid format of Ip address which is entered.';
        }
    },{
        type: 'input',
        name: 'port',
        message: 'Input your port number :',
        default: connectionInfo.port,
        validate: function (input) {
            return REG_NUMBER_ONLY.test(input) ? true : 'Invalid type of port which is entered. Must input number type.';
        }
    },{
        type: 'confirm',
        name: 'isDebugMode',
        message: 'Do you want to launch with chrome DevTools? : ',
        default: connectionInfo.isDebugMode
    }];

    ask.unshift(baseAppPathQuestion);

    return ask;
}

function getBaseAppPathQuestion(connectionInfo) {
    let question = {};
    let recentlyBaseAppPathIndex = 0;
    if(connectionInfo.baseAppPaths.length === 1) {
        question = {
            type: 'input',
            name: 'baseAppPath',
            message: 'Input your Application Path :',
            default: connectionInfo.baseAppPaths[0]
        };
    }
    else {
        recentlyBaseAppPathIndex = connectionInfo.baseAppPaths.indexOf(connectionInfo.recentlyBaseAppPath);
        question = {
            type: 'list',
            name: 'baseAppPath',
            message: 'Select the app path to launch Wits :',
            choices: connectionInfo.baseAppPaths,
            default: recentlyBaseAppPathIndex >= 0 ? recentlyBaseAppPathIndex : 0
        };
    }

    return question;
}

async function getUserAnswer(ask) {
    let answer = await inquirer.prompt(ask);

    setRecentlyConnectionInfo(answer);

    baseAppPath = path.isAbsolute(answer.baseAppPath) ? answer.baseAppPath.replace(REG_BACKSLASH, '/') : getAbsolutePath(answer.baseAppPath);
    hostWidth = answer.width;
    deviceIpAddress = answer.ip;
    socketPort = answer.port;
    isDebugMode = answer.isDebugMode;

    return answer;
}

async function makeWitsConfigFile(configFilepath) {
    let userConfigData = '';
    try {
        userConfigData = fs.readFileSync(configFilepath + '/' + CONFIG_FILE, 'utf8');
    }
    catch(e) {
        console.log('Failed to read user config.xml.',e);
        process.exit(0);
    }

    let xmlParser = new xml2js.Parser({attrkey : 'attributes'});

    let parsedXmlData = await new Promise ((resolve,reject) => xmlParser.parseString(userConfigData, function(err, result){
        resolve(result);
    }));

    if(parsedXmlData && parsedXmlData.widget) {
        setWitsConfigData(parsedXmlData.widget);
    }
    else {
        console.log('User config.xml is not supported format.')
        process.exit(0);
    }

    let xmlBuilder = new xml2js.Builder({attrkey : 'attributes', xmldec: {'version': '1.0', 'encoding': 'UTF-8'}});

    let witsConfigData = xmlBuilder.buildObject(parsedXmlData);

    try {
        fs.writeFileSync(path.join('tizen',CONFIG_FILE), witsConfigData, 'utf8');
    }
    catch (e) {
        console.log('Failed to write Wits config.xml.',e);
        process.exit(0);
    }
}

function setWitsConfigData(configData) {
    const WITS_CONFIG_ACCESS_TAG = 'access';
    const WITS_CONFIG_CONTENT_TAG = 'content';
    const WITS_CONFIG_ICON_TAG = 'icon';
    const WITS_CONFIG_PRIVILEGE_TAG = 'tizen:privilege';
    const FILESYSTEM_PRIVILEGE = 'http://tizen.org/privilege/filesystem.read';


    configData[WITS_CONFIG_ACCESS_TAG] = [{
        attributes : {
            origin: '*', 
            subdomains: 'true'
        }
    }]

    configData[WITS_CONFIG_CONTENT_TAG] = [{
        attributes : {
            src: 'index.html'
        }
    }]

    configData[WITS_CONFIG_ICON_TAG] = [{
        attributes : {
            src: 'icon.png'
        }
    }]

    if(configData.hasOwnProperty(WITS_CONFIG_PRIVILEGE_TAG)) {
        configData[WITS_CONFIG_PRIVILEGE_TAG].push({ 
            attributes: {
                name: FILESYSTEM_PRIVILEGE
            }
        })
    }
    else {
        configData[WITS_CONFIG_PRIVILEGE_TAG] = [{
            attributes: {
                name: FILESYSTEM_PRIVILEGE
            }
        }]
    }
}

function getRecentlyConnectionInfo() {
    try {
        let info = JSON.parse(fs.readFileSync('connectionInfo.json','utf8'));
        return {
            recentlyBaseAppPath: info.recentlyBaseAppPath,
            baseAppPaths: info.baseAppPaths ? info.baseAppPaths : ['www'],
            width: info.width ? info.width : 1920,
            ip: info.ip ? info.ip : null,
            port: info.port ? info.port : null,
            isDebugMode: info.isDebugMode ? info.isDebugMode : false
        };
    }
    catch(e) {
        console.log('[warning] Failed to getRecentlyConnectionInfo');
        return {
            recentlyBaseAppPath: '',
            baseAppPaths: ['www'],
            width: 1920,
            ip: null,
            port: null,
            isDebugMode: false
        };
    }
}

function setRecentlyConnectionInfo(recentlyInfo) {
    let connectionInfo = getRecentlyConnectionInfo();

    let recentlyConnectionInfo = {
        recentlyBaseAppPath: recentlyInfo.baseAppPath,
        baseAppPaths: connectionInfo.baseAppPaths,
        width: recentlyInfo.width,
        ip: recentlyInfo.ip,
        port: recentlyInfo.port,
        isDebugMode: recentlyInfo.isDebugMode
    };
    try {
        fs.writeFileSync('connectionInfo.json', JSON.stringify(recentlyConnectionInfo,null, 2), 'utf8');
    }
    catch (e) {
        console.log('[warning] Failed to set recently connection info');
    }
}

function openSocketServer() {
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
            startPushFiles();
        });

        socket.on('watch_request', (path) => {
            console.log('socket on::::watch_request',path);
            watchAppCode(path.basePath, path.destPath);
        });
    });
}

function getAbsolutePath(inputPath) {
    return path.join(__dirname, inputPath).replace(REG_BACKSLASH, '/');
}

function connectTV() {
    console.log('connect to....' + deviceIpAddress);
    const CONNECT_TV_COMMAND = 'sdb connect ' + deviceIpAddress + ':' + TV_CONNECT_PORT;
    let connectResult = shelljs.exec(CONNECT_TV_COMMAND).stdout;

    if(connectResult.includes('connected') ) {
        console.log('Success to connect ' + deviceIpAddress);
    }
    else {
        console.log('Failed to connect ' + deviceIpAddress);
        process.exit(0);
    }
}

function getConnectedDeviceList() {
    let devices = shelljs.exec('sdb devices',{silent: true}).stdout;
    let devicesInfo = [];
    let deviceNameList = [];
    if(devices) {
        devicesInfo = devices.trim().split('\n');
        devicesInfo.shift();
        deviceNameList = pasingDeviceName(devicesInfo);
    }
    else {
        console.log('Failed to get connected device list ' + deviceIpAddress);
        process.exit(0);
    }
    return deviceNameList;
}

function ignoreFunc(file, stats) {
    return witsIgnores.includes(path.basename(file));
}

function getWitsIgnore() {
    let file = path.resolve(path.join(baseAppPath,'.witsignore'));
    let ignore = [];

    try {
        ignore = fs.readFileSync(file,'utf8').replace(REG_FIND_ALL_CR,'').split('\n');
    }
    catch(e) {
        console.log('[warning] Failed to get Wits ignore');
    }

    return ignore;
}

async function getContentFiles() {
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

    var rate = Math.floor((currentNumber / totalNumber) * 100);

    console.log('Push progress rate : ' + rate + '%');

    if(rate >= 100) {
        console.log('Push complete!!');
    }

    mediator.emit('push_progress',{
        total: totalNumber,
        load: currentNumber,
        progressRate: rate + '%'
    });
}

function startPushFiles() {
    const START_PUSH_INDEX = 0;
    let totalFileNum = 0;

    witsIgnores = getWitsIgnore();

    getContentFiles().then((files) => {
        totalFileNum = files.length;
        console.log('Total File Number : '+totalFileNum);
        let contentFilesInfo = {
            files: files,
            curIdx: START_PUSH_INDEX,
            totalFileNum: totalFileNum
        };
        pushFile(contentFilesInfo);
    });
}

function pushFile(filesInfo) {
    if(filesInfo.curIdx >= filesInfo.totalFileNum) {
        mediator.emit('push_completed');
    }
    else {
        let file = filesInfo.files[filesInfo.curIdx];
        let filePath = path.isAbsolute(file) ? file.replace(REG_BACKSLASH, '/') : getAbsolutePath(file);
        const CONTENT_FILE_PUSH_COMMAND = 'sdb -s ' + deviceName + ' push ' + '"' + filePath + '"'+ ' ' + '"' + witsAppPath + filePath.replace(baseAppPath,'')+ '"';
        let pushResult = shelljs.exec(CONTENT_FILE_PUSH_COMMAND, {async: true, silent: true});
        pushResult.stderr.on('data', (data) => {
            mediator.emit('push_failed');
        });
        pushResult.stdout.on('data', (data) => {
            if(REG_PUSHED_FILE_MESSAGE.test(data)) {
                ++filesInfo.curIdx;
                updatePushProgress(filesInfo.curIdx,filesInfo.totalFileNum);
                pushFile(filesInfo);
            }
        });
    }
}

async function selectDevice(deviceNameList) {
    let SINGLE_DEVICE = 1;
    let NONE_DEVICE = 0;

    if(deviceNameList.length === NONE_DEVICE) {
        console.log('No connected devices.');
        process.exit(0);
    }
    else if(deviceNameList.length === SINGLE_DEVICE) {
        deviceName = deviceNameList[0];
        return deviceName;
    }
    else {
        let ask = [{
            type: 'list',
            name: 'deviceName',
            message: 'Select the device to launch Wits :',
            choices: deviceNameList,
            default: deviceNameList.indexOf(deviceIpAddress+':'+TV_CONNECT_PORT) >= 0 ? deviceNameList.indexOf(deviceIpAddress+':'+TV_CONNECT_PORT) : 0
        }];
        let answer = await inquirer.prompt(ask);
        deviceName = answer.deviceName;
        return deviceName;
    }
}

function buildPackage() {
    console.log('\nStart packaging Samsung Tizen TV Platform......');
    try {
        let www = path.resolve(path.join('tizen'));
        let dest = path.resolve(path.join('tizen', 'build'));
        let TEMPORARY_BUILD_DIR = '.buildResult';
        let result = null;

        result = shelljs.exec('tizen version');

        if(result.err) {
            console.log(result.stderr);
            console.log('The command \"tizen\" failed. Make sure you have the latest Tizen SDK installed, and the \"tizen\" command (inside the tools/ide/bin folder) is added to your path.');
            process.exit(0);
        }

        result = shelljs.exec('tizen cli-config "default.profiles.path=' + PROFILE_PATH + '"');
        if(result.code) {
            console.log('Failed to Bulid'+result.output);
            process.exit(0);
        }
        result = shelljs.exec('tizen build-web -out ' + TEMPORARY_BUILD_DIR + ' -- "' + www + '"');
        if(result.code) {
            console.log('Failed to Bulid'+result.output);
            process.exit(0);
        }
        result = shelljs.exec('tizen package --type wgt --sign ' + PROFILE_NAME + ' -- ' + path.resolve(path.join(www, TEMPORARY_BUILD_DIR)));

        if(result.code) {
            console.log('Failed to Bulid'+result.output);
            process.exit(0);
        }
        else {
            let packagePath = result.stdout.match(/Package File Location\:\s*(.*)/);
            if(packagePath && packagePath[1]) {
                mkdirp.sync(dest);
                console.log('packagePath[1]',packagePath[1]);
                console.log('dest',dest);
                shelljs.mv('-f', packagePath[1], path.resolve(dest+ '/' + WITS_PACKAGE));
                shelljs.rm('-rf', path.resolve(path.join(www, TEMPORARY_BUILD_DIR)));
                console.log('Package created at ' + path.join(dest, path.basename(packagePath[1])));
            }
            else {
                console.log('Fail to retrieve Package File Location.');
                process.exit(0);
            }
        }
    }
    catch(e) {
        console.log('Fail to buildPackage',e);
        process.exit(0);
    }
}

function installPackage(appInstallPath) {
    const WGT_FILE_PUSH_COMMAND = 'sdb -s ' + deviceName + ' push ' + PACKAGE_BASE_PATH + WITS_PACKAGE + ' ' + appInstallPath;
    const APP_INSTALL_COMMAND = 'sdb -s ' + deviceName + ' shell 0 vd_appinstall ' + userAppName + ' ' + appInstallPath + WITS_PACKAGE;

    shelljs.exec(WGT_FILE_PUSH_COMMAND,{silent: true});
    var result = shelljs.exec(APP_INSTALL_COMMAND,{silent: true}).stdout;

    if(result.includes('failed[')) {
        console.log('\nFailed to install Wits');
        process.exit(0);
    }
}

function unInstallPackage() {
    const APP_UNINSTALL_COMMAND = 'sdb -s ' + deviceName + ' shell 0 vd_appuninstall ' + userAppName;
    var result = shelljs.exec(APP_UNINSTALL_COMMAND,{silent: true}).stdout;

    if(result.includes('failed[')) {
        console.log('\n[Warning] Failed to uninstall Wits');
    }

}

function launchApp() {
    const APP_LAUNCH_COMMAND = 'sdb -s ' + deviceName + ' shell 0 was_execute '+userAppId;

    let result = shelljs.exec(APP_LAUNCH_COMMAND).stdout;
    if(result.includes('failed[')) {
        console.log('\nFailed to launch Wits');
        process.exit(0);
    }
}

function launchAppDebugMode() {
    const APP_LAUNCH_DEBUG_MODE_COMMAND = 'sdb -s ' + deviceName + ' shell 0 debug '+userAppId;

    let result = shelljs.exec(APP_LAUNCH_DEBUG_MODE_COMMAND).stdout || shelljs.exec(APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUTED).stdout;
    if(result.includes('failed')) {
        console.log('\nFailed to launch Wits');
        process.exit(0);
    }

    let debugPort = result.match(REG_DEBUG_PORT)[0].match(REG_NUMBER_WORD)[0];
    if(debugPort) {
        setPortForward(debugPort);
    }
    else {
        console.log('[warning] Failed to get debug port.');
    }
}

function setPortForward(port) {
    const LOCAL_HOST = '127.0.0.1';
    shelljs.exec('sdb -s ' + deviceName + ' forward --remove tcp:'+port);
    shelljs.exec('sdb -s ' + deviceName + ' forward tcp:'+port+ ' tcp:'+port);
    launchChrome(LOCAL_HOST + ':' + port);
}

function launchChrome(url) {
    chromeLauncher.launch({
        startingUrl: url,
        chromeFlags: ['--disable-web-security']
    }).then((chrome) => {
        console.log('Chrome debugging port running on ' + chrome.port);
    });
}

function watchAppCode(basePath,destPath) {
    watcher = watch(basePath, {recursive: true}, (evt, name) => {
        console.log('%s %s.', name,evt);
        let filePath = name.replace(REG_BACKSLASH, '/').replace(basePath,'');
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

function setHostInfo() {
    setBaseJSData();
    setBaseHtmlData();
}

function setBaseJSData() {
    try {
        let file = path.resolve(path.join('tizen','js','base.js'));
        let data = fs.readFileSync(file,'utf8');
        let contentSrc = getContentSrc();
        let contentFullSrc = isRemoteUrl(contentSrc)? contentSrc : (witsAppPath + '/' + contentSrc.replace(REG_FISRT_BACKSLASH,''));
        let convertData = {
            '{{CONTENT_PATH}}': witsAppPath,
            '{{CONTENT_SRC}}': contentFullSrc,
            '{{HOST_IP}}': 'http://'+ip.address(),
            '{{HOST_PORT}}': socketPort,
            '{{HOST_BASE_CONTENT_PATH}}': baseAppPath
        };

        let str = data.replace(REG_HOST_DATA, (key) => {
            return convertData[key];
        });

        fs.writeFileSync(path.join('tizen','js','main.js'), str, 'utf8');
    }
    catch(e) {
        console.log('Failed to set Wits baseJS data to file');
        process.exit(0);
    }
}

function setBaseHtmlData() {
    try {
        let file = path.resolve(path.join('tizen','base.html'));
        let data = fs.readFileSync(file,'utf8');

        let str = data.replace(REG_HOST_WIDTH,hostWidth);

        fs.writeFileSync(path.join('tizen','index.html'), str, 'utf8');
    }
    catch(e) {
        console.log('Failed to set Wits baseHtml data to file');
        process.exit(0);
    }
}

function getContentSrc() {
    let contentSrc = 'index.html';

    try {
        let file = path.resolve(path.join(baseAppPath,'config.xml'));
        let data = fs.readFileSync(file,'utf8');
        data = clearComment(data);
        contentSrc = data.match(REG_CONTENT_SRC)[0].replace(REG_CONTENT_SRC_ATTRIBUTE,'');
    }
    catch(e) {
        console.log('[warning] Failed to read config.xml. Set Content src to default.');
    }

    console.log('content src is : ' + contentSrc);

    return contentSrc;
}

function getUserAppId() {
    try {
        let file = path.resolve(path.join('tizen','config.xml'));
        let data = fs.readFileSync(file,'utf8');
        data = clearComment(data);
        let id = data.match(REG_APPICATION_ID)[0].replace(REG_APPICATION_ID_ATTRIBUTE,'');
        return id;
    }
    catch(e) {
        console.log('Failed to read Wits config.xml.');
        process.exit(0);
    }
}

function clearComment(data) {
    return data.replace(REG_COMMENT,'');
}

function getAppInstallPath() {
    let appInstallPath = '';

    let capability = shelljs.exec('sdb -s ' + deviceName + ' capability',{silent: true}).split('\n');
    capability.forEach((value) => {
        if(value.indexOf('sdk_toolpath') !== -1) {
            appInstallPath = value.replace(REG_FIND_CR,'').split(':')[1] + '/';
        }
        else if(value.indexOf('platform_version') !== -1) {
            console.log('platform_version : ', value.replace(REG_FIND_CR,'').split(':')[1])
        }
    });

    return appInstallPath;
}

function getProfileInfo() {
    try {
        let info = JSON.parse(fs.readFileSync('profileInfo.json','utf8'));
        return {
            name: info.name,
            path: info.path
        };
    }
    catch(e) {
        console.log('Failed to getProfileInfo');
        process.exit(0);
    }
}

function pasingDeviceName(devices) {
    let deviceNameList = [];
    devices.forEach((device) => {
        if(!devices.includes('offline')) {
            deviceNameList.push(device.split('\t')[0].trim());
        }
    });

    return deviceNameList;
}

function isRemoteUrl(url) {
    return REG_REMOTE_URI.test(url);
}

function isIpAddress(ip) {
    return REG_IP_ADDRESS.test(ip);
}
