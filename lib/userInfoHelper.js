const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const util = require('./util.js');
const deviceConnectHelper = require('./deviceConnectHelper.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const DEFAULT_SOCKET_PORT = '8498';
const WITS_CONFIG_FILE_NAME = '.witsconfig.json';

module.exports = {
    getWitsSettingInfo: async () => {
        let profileInfo = getWitsconfigData().profileInfo;
        let userAnswer = await getUserAnswer();

        return {
            profileInfo: profileInfo,
            userAnswer: userAnswer
        };
    },
    getDeviceInfo: async deviceIpAddress => {
        return await deviceConnectHelper.getConnectedDeviceInfo(
            deviceIpAddress
        );
    }
};

async function getUserAnswer() {
    let result = {};
    let connectionInfo = getLatestWitsconfigInfo().connectionInfo;
    result.baseAppPath = getBaseAppPath(connectionInfo.recentlyBaseAppPath);
    result.hostWidth = connectionInfo.width;
    result.deviceIpAddress = connectionInfo.ip;
    result.socketPort = connectionInfo.port;
    result.isDebugMode = connectionInfo.isDebugMode;
    displayStoredInfo(result);

    if (!(await getConfirmAskData())) {
        let ask = await getUserAskData();
        let answer = await inquirer.prompt(ask);
        let baseAppPath = getBaseAppPath(answer.baseAppPath);
        answer.port = util.getSocketPort();
        setLatestConnectionInfo(answer);

        result.baseAppPath = baseAppPath;
        result.hostWidth = answer.width;
        result.deviceIpAddress = answer.ip;
        result.socketPort = answer.port;
        result.isDebugMode = answer.isDebugMode;
    }

    return result;
}

function displayStoredInfo(data) {
    console.log('');
    console.log('      > [ Stored Information ]');
    console.log('      > baseAppPath : ' + data.baseAppPath);
    console.log('      > width       : ' + data.hostWidth);
    console.log('      > ip          : ' + data.deviceIpAddress);
    console.log('      > port        : ' + data.socketPort);
    console.log('      > isDebugMode : ' + data.isDebugMode);
    console.log('');
}

function getBaseAppPath(baseAppPath) {
    return path.isAbsolute(baseAppPath)
        ? baseAppPath.replace(regExp.BACKSLASH, '/')
        : util.getAbsolutePath(baseAppPath);
}

function getWitsconfigData() {
    try {
        let witsconfigInfo = JSON.parse(
            fs.readFileSync(
                path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
                'utf8'
            )
        );
        return witsconfigInfo;
    } catch (e) {
        console.log('Failed to getWitsconfig');
        process.exit(0);
    }
}

async function getConfirmAskData() {
    let ask = [
        {
            type: 'confirm',
            name: 'isCorrectInfo',
            message:
                '.witsconfig.json is already exist. Do you want to use this data for running Wits?',
            default: true
        }
    ];
    let answer = await inquirer.prompt(ask);
    return answer.isCorrectInfo;
}

async function getUserAskData() {
    let connectionInfo = getLatestWitsconfigInfo().connectionInfo;
    let baseAppPathQuestion = getBaseAppPathQuestion(connectionInfo);

    let ask = [
        {
            type: 'input',
            name: 'width',
            message: 'Input your Application width (1920 or 1280) :',
            default: connectionInfo.width,
            validate: function(input) {
                return input === '1920' || input === '1280'
                    ? true
                    : 'Tizen web Application only support 1920 or 1280 width';
            }
        },
        {
            type: 'input',
            name: 'ip',
            message:
                'Input your TV Ip address(If using Emulator, input ' +
                EMULATOR_IP +
                ') :',
            default: connectionInfo.ip,
            validate: function(input) {
                return util.isIpAddress(input)
                    ? true
                    : 'Invalid format of Ip address which is entered.';
            }
        },
        // {
        //     type: 'input',
        //     name: 'port',
        //     message: 'Input your port number :',
        //     default: connectionInfo.port,
        //     validate: function (input) {
        //         return regExp.NUMBER_ONLY.test(input) ? true : 'Invalid type of port which is entered. Must input number type.';
        //     }
        // },
        {
            type: 'confirm',
            name: 'isDebugMode',
            message: 'Do you want to launch with chrome DevTools? : ',
            default: connectionInfo.isDebugMode
        }
    ];

    ask.unshift(baseAppPathQuestion);

    return ask;
}

function getBaseAppPathQuestion(connectionInfo) {
    let question = {};
    let recentlyBaseAppPathIndex = 0;
    if (connectionInfo.baseAppPaths.length === 1) {
        question = {
            type: 'input',
            name: 'baseAppPath',
            message: 'Input your Application Path :',
            default: connectionInfo.baseAppPaths[0]
        };
    } else {
        recentlyBaseAppPathIndex = connectionInfo.baseAppPaths.indexOf(
            connectionInfo.recentlyBaseAppPath
        );
        question = {
            type: 'list',
            name: 'baseAppPath',
            message: 'Select the app path to launch Wits :',
            choices: connectionInfo.baseAppPaths,
            default:
                recentlyBaseAppPathIndex >= 0 ? recentlyBaseAppPathIndex : 0
        };
    }

    return question;
}

function getLatestWitsconfigInfo() {
    let result = {};
    try {
        let wInfo = getWitsconfigData();

        let cInfo = wInfo.connectionInfo;
        let pInfo = wInfo.profileInfo;

        let connectionInfo = {};

        connectionInfo.recentlyBaseAppPath = cInfo.recentlyBaseAppPath;
        (connectionInfo.baseAppPaths = cInfo.baseAppPaths),
            (connectionInfo.width = cInfo.width ? cInfo.width : 1920),
            (connectionInfo.ip = cInfo.ip ? cInfo.ip : null),
            (connectionInfo.port = cInfo.port
                ? cInfo.port
                : DEFAULT_SOCKET_PORT),
            (connectionInfo.isDebugMode = cInfo.isDebugMode
                ? cInfo.isDebugMode
                : false);

        result.connectionInfo = connectionInfo;
        result.profileInfo = pInfo;

        return result;
    } catch (e) {
        console.log('[warning] Failed to getLatestWitsconfigInfo');
    }
}

async function setLatestConnectionInfo(latestInfo) {
    let savingInfo = {};
    let wInfo = getLatestWitsconfigInfo();
    let connectionInfo = wInfo.connectionInfo;

    let latestConnectionInfo = {
        recentlyBaseAppPath: latestInfo.baseAppPath,
        baseAppPaths: connectionInfo.baseAppPaths,
        width: latestInfo.width,
        ip: latestInfo.ip,
        port: latestInfo.port,
        isDebugMode: latestInfo.isDebugMode
    };

    savingInfo.connectionInfo = latestConnectionInfo;
    savingInfo.profileInfo = wInfo.profileInfo;

    try {
        fs.writeFileSync(
            path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
            JSON.stringify(savingInfo, null, 2),
            'utf8'
        );
    } catch (e) {
        console.log('[warning] Failed to set recently connection info');
    }
}

// function getRecentlyConnectionInfo() {
//     try {
//         let info = getWitsconfigData().connectionInfo;
//         return {
//             recentlyBaseAppPath: info.recentlyBaseAppPath,
//             baseAppPaths: info.baseAppPaths ? info.baseAppPaths : ['www'],
//             width: info.width ? info.width : 1920,
//             ip: info.ip ? info.ip : null,
//             port: info.port ? info.port : DEFAULT_SOCKET_PORT,
//             isDebugMode: info.isDebugMode ? info.isDebugMode : false
//         };
//     } catch (e) {
//         console.log('[warning] Failed to getRecentlyConnectionInfo');
//         return {
//             recentlyBaseAppPath: '',
//             baseAppPaths: ['www'],
//             width: 1920,
//             ip: null,
//             port: null,
//             isDebugMode: false
//         };
//     }
// }

// function setRecentlyConnectionInfo(recentlyInfo) {
//     let connectionInfo = getRecentlyConnectionInfo();

//     let recentlyConnectionInfo = {
//         recentlyBaseAppPath: recentlyInfo.baseAppPath,
//         baseAppPaths: connectionInfo.baseAppPaths,
//         width: recentlyInfo.width,
//         ip: recentlyInfo.ip,
//         port: recentlyInfo.port,
//         isDebugMode: recentlyInfo.isDebugMode
//     };
//     try {
//         fs.writeFileSync(
//             path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
//             JSON.stringify(recentlyConnectionInfo, null, 2),
//             'utf8'
//         );
//     } catch (e) {
//         console.log('[warning] Failed to set recently connection info');
//     }
// }
