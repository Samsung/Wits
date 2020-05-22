const inquirer = require('inquirer');
const { execSync } = require('child_process');

const util = require('./util.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const TV_CONNECT_PORT = '26101';

module.exports = {
    getConnectedDeviceInfo: async deviceIpAddress => {
        module.exports.connectDevice(deviceIpAddress);
        let deviceName = await module.exports.getDeviceName();
        return {
            deviceName: deviceName,
            appInstallPath: module.exports.getAppInstallPath(deviceName)
        };
    },
    connectDevice: deviceIpAddress => {
        if (
            util.isIpAddress(deviceIpAddress) &&
            deviceIpAddress !== EMULATOR_IP
        ) {
            console.log(`connect to....${deviceIpAddress}`);
            const CONNECT_TV_COMMAND = `${util.TOOLS_SDB_PATH} connect ${deviceIpAddress}:${TV_CONNECT_PORT}`;
            let connectResult = execSync(CONNECT_TV_COMMAND).toString();

            if (connectResult.includes('connected')) {
                console.log(`Success to connect ${deviceIpAddress}`);
            } else {
                console.error(`Failed to connect ${deviceIpAddress}`);
                util.close();
            }
        }
    },
    getDeviceName: async () => {
        let SINGLE_DEVICE = 1;
        let NONE_DEVICE = 0;
        let deviceNameList = getConnectedDeviceList();

        if (deviceNameList.length === NONE_DEVICE) {
            console.log(`No connected devices.`);
            util.close();
        } else if (deviceNameList.length === SINGLE_DEVICE) {
            deviceName = deviceNameList[0];
            return deviceName;
        } else {
            let deviceIndex = deviceNameList.indexOf(
                deviceIpAddress + ':' + TV_CONNECT_PORT
            );
            let ask = [
                {
                    type: 'list',
                    name: 'deviceName',
                    message: 'Select the device to launch Wits :',
                    choices: deviceNameList,
                    default: deviceIndex >= 0 ? deviceIndex : 0
                }
            ];
            let answer = await inquirer.prompt(ask);
            deviceName = answer.deviceName;
            return deviceName;
        }
    },
    getAppInstallPath: deviceName => {
        let appInstallPath = '';

        let capability = execSync(
            `${util.TOOLS_SDB_PATH} -s ${deviceName} capability`,
            { silent: true }
        )
            .toString()
            .split('\n');
        capability.forEach(value => {
            if (value.indexOf('sdk_toolpath') !== -1) {
                appInstallPath =
                    value.replace(regExp.FIND_CR, '').split(':')[1] + '/';
            }
        });
        return appInstallPath;
    }
};

function getConnectedDeviceList() {
    let devices = execSync(`${util.TOOLS_SDB_PATH} devices`, {
        silent: true
    }).toString();
    let devicesInfo = [];
    let deviceNameList = [];
    if (!devices.includes('offline')) {
        devicesInfo = devices.trim().split('\n');
        devicesInfo.shift();
        deviceNameList = parsingDeviceName(devicesInfo);
    } else {
        console.error(`Failed to connect ${deviceIpAddress}`);
        util.close();
    }
    return deviceNameList;
}

function parsingDeviceName(devices) {
    let deviceNameList = [];
    devices.forEach(device => {
        deviceNameList.push(device.split('\t')[0].trim());
    });

    return deviceNameList;
}
