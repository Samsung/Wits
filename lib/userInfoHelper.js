const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const util = require('./util.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const DEFAULT_SOCKET_PORT = '8498';

module.exports = {
    getUserAnswer: async function() {
        let ask = getUserAskData();
        let answer = await inquirer.prompt(ask);
        console.log(answer);

        setRecentlyConnectionInfo(answer);

        baseAppPath = path.isAbsolute(answer.baseAppPath)
            ? answer.baseAppPath.replace(regExp.BACKSLASH, '/')
            : util.getAbsolutePath(answer.baseAppPath);
        hostWidth = answer.width;
        deviceIpAddress = answer.ip;
        socketPort = makeSocketPort();
        isDebugMode = answer.isDebugMode;

        return {
            baseAppPath: baseAppPath,
            hostWidth: hostWidth,
            deviceIpAddress: deviceIpAddress,
            socketPort: socketPort,
            isDebugMode: isDebugMode
        };
    }
};

function getUserAskData() {
    let connectionInfo = getRecentlyConnectionInfo();
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

function getRecentlyConnectionInfo() {
    try {
        let info = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '../connectionInfo.json'),
                'utf8'
            )
        );
        return {
            recentlyBaseAppPath: info.recentlyBaseAppPath,
            baseAppPaths: info.baseAppPaths ? info.baseAppPaths : ['www'],
            width: info.width ? info.width : 1920,
            ip: info.ip ? info.ip : null,
            port: info.port ? info.port : DEFAULT_SOCKET_PORT,
            isDebugMode: info.isDebugMode ? info.isDebugMode : false
        };
    } catch (e) {
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
        fs.writeFileSync(
            path.join(__dirname, '../connectionInfo.json'),
            JSON.stringify(recentlyConnectionInfo, null, 2),
            'utf8'
        );
    } catch (e) {
        console.log('[warning] Failed to set recently connection info');
    }
}

function makeSocketPort() {
    const REMIND_SOCKET_PORT_LEN = 3;
    const MAX_DIGIT = 9;
    let port = Math.floor(Math.random() * MAX_DIGIT) + 1 + '';
    for (let i = 0; i < REMIND_SOCKET_PORT_LEN; i++) {
        port += Math.floor(Math.random() * MAX_DIGIT) + '';
    }
    return Number(port);
}
