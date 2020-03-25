const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const util = require('./util.js');
const deviceConnectHelper = require('./deviceConnectHelper.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const DEFAULT_SOCKET_PORT = '8498';
const DEFAULT_PROFILE_PATH = 'C:/tizen-studio-data/profile/profiles.xml';
const WITS_CONFIG_FILE_NAME = '.witsconfig.json';

module.exports = {
    getWitsSettingInfo: async () => {
        let userAnswer = await getUserAnswer();

        return {
            userAnswer: userAnswer
        };
    },
    getDeviceInfo: async deviceIpAddress => {
        return await deviceConnectHelper.getConnectedDeviceInfo(
            deviceIpAddress
        );
    },
    getLatestWitsconfigInfo: () => {
        let result = {};
        try {
            let wInfo = getWitsconfigData();

            let cInfo = wInfo.connectionInfo;
            let pInfo = wInfo.profileInfo;

            let connectionInfo = {
                ip: cInfo.ip ? cInfo.ip : null,
                port: cInfo.port ? cInfo.port : DEFAULT_SOCKET_PORT,
                width: cInfo.width ? cInfo.width : 1920,
                isDebugMode: cInfo.isDebugMode ? cInfo.isDebugMode : false
            };

            let profileInfo = {
                name: pInfo.name ? pInfo.name : 'test',
                path: pInfo.path ? pInfo.path : DEFAULT_PROFILE_PATH
            };

            if (cInfo.recentlyBaseAppPath) {
                connectionInfo['recentlyBaseAppPath'] =
                    cInfo.recentlyBaseAppPath;
            }

            if (cInfo.baseAppPaths && cInfo.baseAppPaths instanceof Array) {
                connectionInfo['baseAppPaths'] = cInfo.baseAppPaths;
            }

            result.connectionInfo = connectionInfo;
            result.profileInfo = profileInfo;

            if (util.isPropertyExist(wInfo, 'optionalInfo')) {
                result.optionalInfo = wInfo.optionalInfo;
            }

            return result;
        } catch (e) {
            console.log(`[warning] Failed to getLatestWitsconfigInfo >> ${e}`);
        }
    },
    getBaseAppPath: baseAppPath => {
        let appPath = baseAppPath ? baseAppPath : '.';
        return path.isAbsolute(appPath)
            ? appPath.replace(regExp.BACKSLASH, '/')
            : util.getAbsolutePath(appPath);
    },
    getOptionalInfo: async () => {
        let witsConfigData = JSON.parse(
            fs.readFileSync(
                path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
                'utf8'
            )
        );
        if (witsConfigData !== '' && typeof witsConfigData === 'string') {
            witsConfigData = JSON.parse(data);
        }

        if (witsConfigData.hasOwnProperty('optionalInfo')) {
            return witsConfigData.optionalInfo;
        }
        return null;
    }
};

async function getUserAnswer() {
    let result = {};

    let savedData = module.exports.getLatestWitsconfigInfo();
    let connectionInfo = savedData.connectionInfo;
    let profileInfo = savedData.profileInfo;

    result.baseAppPath = module.exports.getBaseAppPath(
        connectionInfo.recentlyBaseAppPath
    );
    result.hostWidth = connectionInfo.width;
    result.deviceIpAddress = connectionInfo.ip;
    result.socketPort = connectionInfo.port;
    result.profileName = profileInfo.name;
    result.profilePath = profileInfo.path;
    result.isDebugMode = connectionInfo.isDebugMode;
    displayStoredInfo(result);

    if (!(await getConfirmAskData())) {
        let ask = await getUserAskData();
        let answer = await inquirer.prompt(ask);
        let baseAppPath = module.exports.getBaseAppPath(answer.baseAppPath);
        answer.port = util.getSocketPort();
        saveLatestWitsconfigInfo(answer);

        result.baseAppPath = baseAppPath;
        result.hostWidth = answer.width;
        result.deviceIpAddress = answer.ip;
        result.socketPort = answer.port;
        result.profileName = answer.profileName;
        result.profilePath = answer.profilePath;
        result.isDebugMode = answer.isDebugMode;
    }

    return result;
}

function displayStoredInfo(data) {
    console.log('');
    console.log(`      > [ Stored Information ]`);
    console.log(`      > baseAppPath  : ${data.baseAppPath}`);
    console.log(`      > ip           : ${data.deviceIpAddress}`);
    console.log(`      > width        : ${data.hostWidth}`);
    console.log(`      > port         : ${data.socketPort}`);
    console.log(`      > profile name : ${data.profileName}`);
    console.log(`      > profile path : ${data.profilePath}`);
    console.log(`      > isDebugMode  : ${data.isDebugMode}`);
    console.log('');
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
    let savedData = module.exports.getLatestWitsconfigInfo();
    let connectionInfo = savedData.connectionInfo;
    let profileInfo = savedData.profileInfo;
    let baseAppPathQuestion = getBaseAppPathQuestion(connectionInfo);

    let ask = [
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
            name: 'profileName',
            message: 'Input your actived profile name :',
            default: profileInfo.name
        },
        {
            type: 'input',
            name: 'profilePath',
            message: 'Input the path of profile.xml :',
            default: profileInfo.path
        },
        {
            type: 'confirm',
            name: 'isDebugMode',
            message: 'Do you want to launch with chrome DevTools? : ',
            default: connectionInfo.isDebugMode
        }
    ];

    baseAppPathQuestion.type && ask.unshift(baseAppPathQuestion);

    return ask;
}

function getBaseAppPathQuestion(connectionInfo) {
    let question = {};
    let recentlyBaseAppPathIndex = 0;
    if (connectionInfo.baseAppPaths) {
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
    }
    return question;
}

async function saveLatestWitsconfigInfo(latestInfo) {
    let savingInfo = {};
    let wInfo = module.exports.getLatestWitsconfigInfo();
    let connectionInfo = wInfo.connectionInfo;

    let latestConnectionInfo = {
        ip: latestInfo.ip,
        port: latestInfo.port,
        width: latestInfo.width,
        isDebugMode: latestInfo.isDebugMode
    };

    let latestProfileInfo = {
        name: latestInfo.profileName,
        path: latestInfo.profilePath
    };

    if (latestInfo.baseAppPath) {
        latestConnectionInfo['recentlyBaseAppPath'] = latestInfo.baseAppPath;
    }

    if (connectionInfo.baseAppPaths) {
        latestConnectionInfo['baseAppPaths'] = connectionInfo.baseAppPaths;
    }

    savingInfo.connectionInfo = latestConnectionInfo;
    savingInfo.profileInfo = latestProfileInfo;

    if (util.isPropertyExist(wInfo, 'optionalInfo')) {
        savingInfo.optionalInfo = wInfo.optionalInfo;
    }

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
