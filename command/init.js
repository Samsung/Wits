const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const WITSCONFIG_PATH = path.join(
    util.CURRENT_PROJECT_PATH,
    '.witsconfig.json'
);
const WITSIGNORE_PATH = path.join(util.CURRENT_PROJECT_PATH, '.witsignore');

module.exports = {
    run: async () => {
        console.log(
            chalk.cyanBright(`Start configuration for Wits............\n`)
        );

        try {
            await module.exports.prepareConfigure();

            const wInfo = userInfoHelper.getRefinedData();
            await userInfoHelper.askQuestion(wInfo.connectionInfo);
        } catch (e) {
            console.error(chalk.red(`Failed to run: ${e}`));
        }
    },
    prepareConfigure: async () => {
        try {
            makeWitsconfigFile();
            util.chmodAll(WITSCONFIG_PATH);

            makeWitsignoreFile();
            util.chmodAll(WITSIGNORE_PATH);

            await util.initTools();
            return;
        } catch (error) {
            throw error;
        }
    }
};

function makeWitsignoreFile() {
    try {
        if (util.isFileExist(WITSIGNORE_PATH)) {
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
    try {
        if (util.isFileExist(WITSCONFIG_PATH) && isExistCustomFile()) {
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
