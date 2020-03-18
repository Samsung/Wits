const path = require('path');
const shelljs = require('shelljs');
const chromeLauncher = require('chrome-launcher');
const regExp = require('./regexp.js');
const util = require('./util.js');

const PACKAGE_BASE_PATH = path.join(
    util.WITS_BASE_PATH,
    '../',
    'container',
    'build'
);
const WITS_PACKAGE = 'Wits.wgt';
const EMULATOR_IP = '0.0.0.0';

module.exports = {
    installPackage: (deviceInfo, hostAppName) => {
        let deviceName = deviceInfo.deviceName;
        let appInstallPath = deviceInfo.appInstallPath;
        const WGT_FILE_PUSH_COMMAND = `sdb -s ${deviceName} push  ${PACKAGE_BASE_PATH} ${WITS_PACKAGE} ${appInstallPath}`;
        const APP_INSTALL_COMMAND = `sdb -s ${deviceName} shell 0 vd_appinstall ${hostAppName} ${appInstallPath}${WITS_PACKAGE}`;

        shelljs.exec(WGT_FILE_PUSH_COMMAND, { silent: true });
        var result = shelljs.exec(APP_INSTALL_COMMAND, { silent: true }).stdout;

        if (result.includes('failed[')) {
            console.log(`\nFailed to install Wits`);
            process.exit(0);
        }
    },
    unInstallPackage: (deviceName, hostAppName) => {
        const APP_UNINSTALL_COMMAND = `sdb -s ${deviceName} shell 0 vd_appuninstall ${hostAppName}`;
        var result = shelljs.exec(APP_UNINSTALL_COMMAND, { silent: true })
            .stdout;

        if (result.includes('failed[')) {
            console.log(`\n[warning] Failed to uninstall Wits`);
        }
    },
    launchApp: (deviceName, hostAppId) => {
        const APP_LAUNCH_COMMAND = `sdb -s ${deviceName} shell 0 was_execute ${hostAppId}`;

        let result = shelljs.exec(APP_LAUNCH_COMMAND).stdout;
        if (result.includes('failed[')) {
            console.log('\nFailed to launch Wits');
            process.exit(0);
        }
    },
    launchDebugMode: (deviceName, hostAppId, deviceIpAddress) => {
        const APP_LAUNCH_DEBUG_MODE_COMMAND = `sdb -s ${deviceName} shell 0 debug ${hostAppId}`;
        const APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUT = `${APP_LAUNCH_DEBUG_MODE_COMMAND} 300`;

        let result =
            shelljs.exec(APP_LAUNCH_DEBUG_MODE_COMMAND).stdout ||
            shelljs.exec(APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUT).stdout;
        if (result.includes('failed')) {
            console.log(`\nFailed to launch Wits`);
            process.exit(0);
        }

        let debugPort = result
            .match(regExp.DEBUG_PORT)[0]
            .match(regExp.NUMBER_WORD)[0];
        let debugIP = '';
        if (deviceIpAddress == EMULATOR_IP) {
            const LOCAL_HOST = '127.0.0.1';
            setPortForward(debugPort);
            debugIP = LOCAL_HOST;
        } else {
            debugIP = deviceIpAddress;
        }
        launchChrome(debugIP + ':' + debugPort);
    },
    terminateApp: (deviceName, hostAppId) => {
        const APP_TERMINATE_COMMAND = `sdb -s ${deviceName} shell 0 was_kill ${hostAppId}`;
        shelljs.exec(APP_TERMINATE_COMMAND, { silent: true });
    }
};

function setPortForward(port) {
    const LOCAL_HOST = '127.0.0.1';
    shelljs.exec(`sdb -s ${deviceName} forward --remove tcp ${port}`);
    shelljs.exec(`sdb -s ${deviceName} forward tcp:${port} tcp:${port}`);
    launchChrome(LOCAL_HOST + ':' + port);
}

function launchChrome(url) {
    chromeLauncher
        .launch({
            startingUrl: url,
            chromeFlags: ['--disable-web-security']
        })
        .then(chrome => {
            console.log(`Chrome debugging port running on ${chrome.port}`);
        });
}
