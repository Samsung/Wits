const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const chromeLauncher = require('chrome-launcher');
const regExp = require('./regexp.js');
const util = require('./util.js');
const { logger } = require('./logger');

const PACKAGE_BASE_PATH = path.join(util.WITS_BASE_PATH, '../', 'container');
const WITS_PACKAGE = 'WITs.wgt';
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

        const pushResult = execSync(WGT_FILE_PUSH_COMMAND, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        util.displayOutput(pushResult);

        const installResult = execSync(APP_INSTALL_COMMAND, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        util.displayOutput(installResult);

        if (installResult.includes('failed[')) {
            logger.error(chalk.red(`\nFailed to install Wits`));
            util.exit();
        }
    },
    unInstallPackage: (deviceName, hostAppName) => {
        const APP_UNINSTALL_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 vd_appuninstall ${hostAppName}`;
        const result = execSync(APP_UNINSTALL_COMMAND, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        util.displayOutput(result);

        if (result.includes('failed[')) {
            logger.warn(`\n[warning] Failed to uninstall Wits`);
        }
    },
    launchApp: (deviceName, hostAppId) => {
        const APP_LAUNCH_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 was_execute ${hostAppId}`;

        const result = execSync(APP_LAUNCH_COMMAND, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        util.displayOutput(result);

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
            execSync(APP_LAUNCH_DEBUG_MODE_COMMAND, {
                encoding: 'utf-8',
                stdio: 'pipe'
            }) ||
            execSync(APP_LAUNCH_DEBUG_MODE_COMMAND_TIMEOUT, {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
        util.displayOutput(result);

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
            logger.log(
                `Please install a Chrome browser or input ${debugIP}:${debugPort} into the address bar of the chromium based browser. ${e}`
            );
        }
    },
    terminateApp: (deviceName, hostAppId) => {
        const APP_TERMINATE_COMMAND = `${util.TOOLS_SDB_PATH} -s ${deviceName} shell 0 was_kill ${hostAppId}`;
        const result = execSync(APP_TERMINATE_COMMAND, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        util.displayOutput(result);
    }
};

function setPortForward(deviceName, port) {
    const LOCAL_HOST = '127.0.0.1';
    const removeResult = execSync(
        `${util.TOOLS_SDB_PATH} -s ${deviceName} forward --remove tcp:${port}`,
        {
            encoding: 'utf-8',
            stdio: 'pipe'
        }
    );
    util.displayOutput(removeResult);

    const tcpResult = execSync(
        `${util.TOOLS_SDB_PATH} -s ${deviceName} forward tcp:${port} tcp:${port}`,
        {
            encoding: 'utf-8',
            stdio: 'pipe'
        }
    );
    util.displayOutput(tcpResult);
    try {
        launchChrome(LOCAL_HOST + ':' + port);
    } catch (e) {
        logger.log(
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
            logger.log(`Chrome debugging port running on ${chrome.port}`);
        })
        .catch(e => {
            logger.log(chalk.red(`Please install a Chrome browser. ${e}`));
        });
}
