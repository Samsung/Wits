const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

module.exports = {
    run: async () => {
        console.log(
            chalk.cyanBright(`Start configuration for Wits............\n`)
        );

        try {
            await module.exports.prepareRun();

            const wInfo = userInfoHelper.getRefinedData();
            await userInfoHelper.askQuestion(wInfo.connectionInfo);
        } catch (e) {
            console.error(chalk.red(`Failed to run: ${e}`));
        }
    },
    prepareRun: async () => {
        try {
            makeWitsignoreFile();
            makeWitsconfigFile();
            await util.initTools();
            return;
        } catch (error) {
            throw error;
        }
    }
};

function makeWitsignoreFile() {
    const WITSIGNORE_PATH = path.join(
        util.CURRENT_PROJECT_PATH,
        WITS_IGNORE_FILE_NAME
    );

    try {
        if (util.isFileExist(WITSIGNORE_PATH)) {
            fs.chmodSync(WITSIGNORE_PATH, '0775');
            console.log('.witsignore is already exist.');
            return;
        }

        util.createEmptyFile(WITSIGNORE_PATH, 'node_modules');
        console.log('witsignore is prepared.');
    } catch (error) {
        console.error(chalk.red(`Failed to makeWitsignoreFile ${error}`));
    }
}

function makeWitsconfigFile() {
    const WITSCONFIG_PATH = path.join(
        util.CURRENT_PROJECT_PATH,
        WITS_CONFIG_FILE_NAME
    );

    try {
        if (util.isFileExist(WITSCONFIG_PATH) && isExistCustomFile()) {
            chmodAll(WITSCONFIG_PATH);
            console.log('.witsconfig.json is already exist.');
            return;
        }
        util.createEmptyFile(WITSCONFIG_PATH, '{}');
        console.log('.witsconfig.json is prepared.');
    } catch (error) {
        console.error(chalk.red(`Failed to makeWitsconfigFile ${error}`));
    }
}

function isExistCustomFile() {
    const customData = fs.readFileSync(
        path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
        'utf8'
    );
    if (isValidWitsconfigFile(customData)) {
        return true;
    }
    return false;
}

function isValidWitsconfigFile(data) {
    let witsConfigData = data;
    if (witsConfigData !== '' && typeof witsConfigData === 'string') {
        witsConfigData = JSON.parse(data);
    }

    if (
        (witsConfigData.hasOwnProperty('profileInfo') &&
            witsConfigData.hasOwnProperty('connectionInfo')) ||
        witsConfigData.hasOwnProperty('optionalInfo')
    ) {
        return true;
    }
    return false;
}

function chmodAll(toolPath) {
    switch (util.PLATFORM) {
        case 'linux':
            fs.chmodSync(toolPath, fs.constants.S_IXUSR);
            break;
        default:
            fs.chmodSync(toolPath, '0777');
            break;
    }
}
