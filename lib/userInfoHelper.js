const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const util = require('./util.js');
const deviceConnectHelper = require('./deviceConnectHelper.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const WITS_CONFIG_FILE_NAME = '.witsconfig.json';

module.exports = {
    getRefinedData: () => {
        let result = {};

        let wInfo = module.exports.getLatestWitsconfigInfo();
        let cInfo = wInfo.connectionInfo;
        let pInfo = wInfo.profileInfo;

        const baseAppPath = module.exports.getBaseAppPath(cInfo.baseAppPath);

        util.setCurrentAppPath(baseAppPath);
        result.baseAppPath = baseAppPath;

        result.width = cInfo.width;
        result.deviceIp = cInfo.deviceIp;
        result.socketPort = cInfo.socketPort;
        result.hostIp = cInfo.hostIp;
        result.isDebugMode = cInfo.isDebugMode;
        result.profileName = pInfo.name;
        result.profilePath = pInfo.path;

        displayStoredInfo(result);

        return result;
    },
    askQuestion: async cInfo => {
        let result = {};
        let ask = await getUserAskData();
        let answer = await inquirer.prompt(ask);
        let baseAppPath = module.exports.getBaseAppPath(answer.baseAppPath);
        let hostIp = util.getValidHostIp(cInfo, answer);

        answer.socketPort = util.getSocketPort();
        answer.hostIp = hostIp;

        result.baseAppPath = baseAppPath;
        result.width = answer.width;
        result.deviceIp = answer.deviceIp;
        result.socketPort = answer.socketPort;
        result.hostIp = hostIp;
        result.isDebugMode = answer.isDebugMode;
        result.profileName = answer.profileName;
        result.profilePath = answer.profilePath;

        module.exports.updateLatestUserAnswer(answer);
        return result;
    },
    getDeviceInfo: async deviceIp => {
        return await deviceConnectHelper.getConnectedDeviceInfo(deviceIp);
    },
    getLatestWitsconfigInfo: () => {
        let result = initWitsconfigInfo();
        try {
            let wInfo = getWitsconfigData();

            let cInfo = wInfo.connectionInfo;
            let pInfo = wInfo.profileInfo;

            for (let key in cInfo) {
                result.connectionInfo[key] = cInfo[key];
            }

            for (let key in pInfo) {
                result.profileInfo[key] = pInfo[key];
            }

            if (util.isPropertyExist(wInfo, 'optionalInfo')) {
                result.optionalInfo = wInfo.optionalInfo;
            }

            return result;
        } catch (e) {
            console.warn(`[warning] Failed to getLatestWitsconfigInfo >> ${e}`);
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
    },
    updateLatestUserAnswer: async userAnswer => {
        let savingInfo = {};
        let wInfo = module.exports.getLatestWitsconfigInfo();
        let cInfo = wInfo.connectionInfo;
        let pInfo = wInfo.profileInfo;

        let latestConnectionInfo = {
            deviceIp: userAnswer.deviceIp
                ? userAnswer.deviceIp
                : cInfo.deviceIp,
            socketPort: userAnswer.socketPort
                ? userAnswer.socketPort
                : cInfo.socketPort,
            width: userAnswer.width ? userAnswer.width : cInfo.width,
            isDebugMode: userAnswer.isDebugMode
                ? userAnswer.isDebugMode
                : cInfo.isDebugMode
        };

        let latestProfileInfo = {
            path: userAnswer.profilePath ? userAnswer.profilePath : pInfo.path
        };

        if (userAnswer.baseAppPath) {
            latestConnectionInfo['baseAppPath'] = userAnswer.baseAppPath;
            util.CURRENT_PROJECT_PATH = userAnswer.baseAppPath;
        }

        if (cInfo.baseAppPaths) {
            latestConnectionInfo['baseAppPaths'] = cInfo.baseAppPaths;
        }

        if (userAnswer.hostIp) {
            latestConnectionInfo.hostIp = userAnswer.hostIp;
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
            console.warn('[warning] Failed to set recently connection info');
        }
    }
};

function initWitsconfigInfo() {
    const DEFAULT_PROFILE_PATH = 'C:/tizen-studio-data/profile/profiles.xml';
    return {
        connectionInfo: {
            deviceIp: null,
            socketPort: '8498',
            width: 1920,
            isDebugMode: false
        },
        profileInfo: {
            path: DEFAULT_PROFILE_PATH
        }
    };
}

function displayStoredInfo(data) {
    console.log(``);
    console.log(`      > [ Stored Information ]`);
    console.log(``);
    console.log(`      > baseAppPath  : ${data.baseAppPath}`);
    console.log(`      > width        : ${data.width}`);
    console.log(`      > deviceIp     : ${data.deviceIp}`);
    console.log(`      > socketPort   : ${data.socketPort}`);
    console.log(`      > isDebugMode  : ${data.isDebugMode}`);
    console.log(``);
    console.log(`      > profile path : ${data.profilePath}`);
    console.log(`      > hostIp       : ${data.hostIp}`);
    console.log(``);
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
        console.error('Failed to getWitsconfig');
        util.close();
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
    let wData = module.exports.getLatestWitsconfigInfo();
    let cInfo = wData.connectionInfo;
    let pInfo = wData.profileInfo;

    let baseAppPathQuestion = getBaseAppPathQuestion(cInfo);
    let hostIpQuestion = getHostIpQuestion(cInfo);

    let ask = [];
    ask.push(getDeviceIpQuestion(cInfo));
    if (hostIpQuestion !== null) {
        ask.push(hostIpQuestion);
    }
    ask.push(getWidthQuestion(cInfo));
    ask.push(getProfilePathQuestion(pInfo));
    ask.push(getIsDebugModeQuestion(cInfo));
    baseAppPathQuestion.type && ask.unshift(baseAppPathQuestion);

    return ask;
}

function getDeviceIpQuestion(cInfo) {
    return {
        type: 'input',
        name: 'deviceIp',
        message:
            'Input your Device Ip address(If using Emulator, input ' +
            EMULATOR_IP +
            ') :',
        default: cInfo.deviceIp,
        validate: function (input) {
            return util.isIpAddress(input)
                ? true
                : 'Invalid format of Ip address which is entered.';
        }
    };
}

function getWidthQuestion(cInfo) {
    return {
        type: 'input',
        name: 'width',
        message: 'Input your Application width (1920 or 1280) :',
        default: cInfo.width,
        validate: function (input) {
            return input === '1920' || input === '1280'
                ? true
                : 'Tizen web Application only support 1920 or 1280 width';
        }
    };
}

function getProfilePathQuestion(pInfo) {
    return {
        type: 'input',
        name: 'profilePath',
        message: 'Input the path of profile.xml :',
        default: pInfo.path
    };
}

function getIsDebugModeQuestion(cInfo) {
    return {
        type: 'confirm',
        name: 'isDebugMode',
        message: 'Do you want to launch with chrome DevTools? : ',
        default: cInfo.isDebugMode
    };
}

function getHostIpQuestion(cInfo) {
    let question = {};
    let recentlyIndex = 0;
    let addresses = util.getHostIpAddresses();
    if (addresses.length <= 1) {
        return null;
    }
    if (cInfo.hostIp) {
        recentlyIndex = addresses.indexOf(cInfo.hostIp);
    }
    question = {
        type: 'list',
        name: 'hostIp',
        message: 'Select your valid PC Ip address for connecting TV:',
        choices: addresses,
        default: recentlyIndex
    };
    return question;
}

function getBaseAppPathQuestion(connectionInfo) {
    let question = {};
    let baseAppPathIndex = 0;
    if (connectionInfo.baseAppPaths) {
        if (connectionInfo.baseAppPaths.length === 1) {
            question = {
                type: 'input',
                name: 'baseAppPath',
                message: 'Input your Application Path :',
                default: connectionInfo.baseAppPaths[0]
            };
        } else {
            baseAppPathIndex = connectionInfo.baseAppPaths.indexOf(
                connectionInfo.baseAppPath
            );
            question = {
                type: 'list',
                name: 'baseAppPath',
                message: 'Select the app path to launch Wits :',
                choices: connectionInfo.baseAppPaths,
                default: baseAppPathIndex >= 0 ? baseAppPathIndex : 0
            };
        }
    }
    return question;
}
