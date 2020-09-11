const chalk = require('chalk');
const { execSync } = require('child_process');

const util = require('./util.js');
const regExp = require('./regexp.js');

const EMULATOR_IP = '0.0.0.0';
const TV_CONNECT_PORT = '26101';

module.exports = {
    getConnectedDeviceInfo: async deviceIpAddress => {
        module.exports.connectDevice(deviceIpAddress);
        let deviceName = await module.exports.getDeviceName(deviceIpAddress);
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
            const connectResult = execSync(CONNECT_TV_COMMAND).toString();

            if (connectResult.includes('connected')) {
                console.log(`Success to connect ${deviceIpAddress}`);
            } else {
                console.error(
                    chalk.red(`Failed to connect ${deviceIpAddress}`)
                );
                util.exit();
            }
        }
    },
    getDeviceName: async deviceIpAddress => {
        const SINGLE_DEVICE = 1;
        const NONE_DEVICE = 0;
        const deviceNameList = getConnectedDeviceList(deviceIpAddress);

        if (deviceNameList.length === NONE_DEVICE) {
            console.error(chalk.red(`No connected devices.`));
            util.exit();
        } else if (deviceNameList.length === SINGLE_DEVICE) {
            const deviceName = deviceNameList[0];
            return deviceName;
        } else {
            if (deviceIpAddress === '0.0.0.0') {
                deviceIpAddress = 'emulator';
            }
            let deviceName = '';
            deviceNameList.forEach(device => {
                if (device.includes(deviceIpAddress)) {
                    deviceName = device;
                }
            });
            return deviceName;
        }
    },
    getAppInstallPath: deviceName => {
        let appInstallPath = '';

        const capability = execSync(
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

function getConnectedDeviceList(deviceIpAddress) {
    const devices = execSync(`${util.TOOLS_SDB_PATH} devices`, {
        silent: true
    }).toString();
    let devicesInfo = [];
    let deviceNameList = [];
    if (!devices.includes('offline')) {
        devicesInfo = devices.trim().split('\n');
        devicesInfo.shift();
        deviceNameList = parsingDeviceName(devicesInfo);
    } else {
        console.error(chalk.red(`Failed to connect ${deviceIpAddress}`));
        util.exit();
    }
    return deviceNameList;
}

function parsingDeviceName(devices) {
    const deviceNameList = [];
    devices.forEach(device => {
        deviceNameList.push(device.split('\t')[0].trim());
    });

    return deviceNameList;
}
