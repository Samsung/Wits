const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const chromeLauncher = require('chrome-launcher');
const regExp = require('./regexp.js');
const util = require('./util.js');

const PACKAGE_BASE_PATH = path.join(util.WITS_BASE_PATH, '../', 'container');
const WITS_PACKAGE = 'Wits.wgt';
const EMULATOR_IP = '0.0.0.0';

module.exports = {
    installPackage: (deviceInfo, hostAppName) => {
        const deviceName = deviceInfo.deviceName;
        const appInstallPath = deviceInfo.appInstallPath;
        const WGT_FILE_PUSH_COMMAND = `${
            util.TOOLS_SDB_PATH
        } -s ${deviceName} push "${path.join(
            PACKAGE_BASE_PATH,
            WITS_PACKAGE
        )}" "${appInstallPath}"`;
        const APP_INSTALL_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 vd_appinstall ${hostAppName} ${appInstallPath}${WITS_PACKAGE}`;

        execSync(WGT_FILE_PUSH_COMMAND, { silent: true });
        const result = execSync(APP_INSTALL_COMMAND).toString();

        if (result.includes('failed[')) {
            console.error(chalk.red(`\nFailed to install Wits`));
            util.exit();
        }
    },
    unInstallPackage: (deviceName, hostAppName) => {
        const APP_UNINSTALL_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 vd_appuninstall ${hostAppName}`;
        const result = execSync(APP_UNINSTALL_COMMAND, {
            silent: true
        }).toString();

        if (result.includes('failed[')) {
            console.warn(`\n[warning] Failed to uninstall Wits`);
        }
    },
    launchApp: (deviceName, hostAppId) => {
        const APP_LAUNCH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 was_execute ${hostAppId}`;

        const result = execSync(APP_LAUNCH_COMMAND).toString();
        if (result === null || result.includes('failed[')) {
            throw new Error(
                'Failed to launchApp. Please check the application is already installed on the Target.'
            );
        }
    },
    launchDebugMode: (deviceName, hostAppId, deviceIpAddress) => {
        const APP_LAUNCH_DEBUG_MODE_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 debug ${hostAppId}`;
        const APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUT = `${APP_LAUNCH_DEBUG_MODE_COMMAND} 300`;

        const result =
            execSync(APP_LAUNCH_DEBUG_MODE_COMMAND).toString() ||
            execSync(APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUT).toString();
        if (result === null || result.includes('failed')) {
            throw new Error(
                'Failed to launchDebugMode. Please check the application is already installed on the Target.'
            );
        }

        const debugPort = result
            .match(regExp.DEBUG_PORT)[0]
            .match(regExp.NUMBER_WORD)[0];
        let debugIP = '';
        if (deviceIpAddress === EMULATOR_IP) {
            const LOCAL_HOST = '127.0.0.1';
            setPortForward(deviceName, debugPort);
            debugIP = LOCAL_HOST;
        } else {
            debugIP = deviceIpAddress;
        }

        try {
            launchChrome(debugIP + ':' + debugPort);
        } catch (e) {
            console.log(
                `Please install a Chrome browser or input ${debugIP}:${debugPort} into the address bar of the chromium based browser. ${e}`
            );
        }
    },
    terminateApp: (deviceName, hostAppId) => {
        const APP_TERMINATE_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 was_kill ${hostAppId}`;
        execSync(APP_TERMINATE_COMMAND, { silent: true });
    }
};

function setPortForward(deviceName, port) {
    const LOCAL_HOST = '127.0.0.1';
    execSync(
        `${util.TOOLS_SDB_PATH} -s ${deviceName} forward --remove tcp:${port}`
    );
    execSync(
        `${util.TOOLS_SDB_PATH} -s ${deviceName} forward tcp:${port} tcp:${port}`
    );
    try {
        launchChrome(LOCAL_HOST + ':' + port);
    } catch (e) {
        console.log(
            `Please install a Chrome browser or input ${LOCAL_HOST}:${port} into the address bar of the chromium based browser. ${e}`
        );
    }
}

function launchChrome(url) {
    chromeLauncher
        .launch({
            startingUrl: url,
            chromeFlags: [
                '--disable-web-security',
                '--enable-blink-features=ShadowDOMV0,CustomElementsV0,HTMLImports'
            ]
        })
        .then(chrome => {
            console.log(`Chrome debugging port running on ${chrome.port}`);
        })
        .catch(e => {
            console.log(chalk.red(`Please install a Chrome browser. ${e}`));
        });
}
