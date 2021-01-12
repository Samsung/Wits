const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const xml2js = require('xml2js');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');
const { logger } = require('../lib/logger');

let WITSCONFIG_PATH = '';
let WITSIGNORE_PATH = '';

module.exports = {
    run: async () => {
        logger.log(
            chalk.cyanBright(`Start configuration for Wits............\n`)
        );

        try {
            await module.exports.prepareConfigure();

            const wInfo = userInfoHelper.getRefinedData();
            await userInfoHelper.askQuestion(wInfo.connectionInfo);
        } catch (e) {
            logger.error(chalk.red(`Failed to run: ${e}`));
        }
    },
    prepareConfigure: async () => {
        try {
            WITSCONFIG_PATH = path.join(
                util.CURRENT_PROJECT_PATH,
                '.witsconfig.json'
            );
            WITSIGNORE_PATH = path.join(
                util.CURRENT_PROJECT_PATH,
                '.witsignore'
            );

            makeWitsconfigFile();
            util.chmodAll(WITSCONFIG_PATH);

            makeWitsignoreFile();
            util.chmodAll(WITSIGNORE_PATH);

            await util.initTools();
            return;
        } catch (error) {
            throw error;
        }
    },
    isVaildProfile: async profilePath => {
        if (!util.isFileExist(profilePath)) {
            return false;
        }

        const profileFile = fs.readFileSync(profilePath, 'utf8');
        const xmlParser = new xml2js.Parser();
        const parsedProfiles = await xmlParser.parseStringPromise(profileFile);
        const activeProfile = parsedProfiles.profiles.$.active;

        if (typeof activeProfile === 'string' && activeProfile.length > 0) {
            return true;
        }
        return false;
    }
};

function makeWitsignoreFile() {
    try {
        if (util.isFileExist(WITSIGNORE_PATH)) {
            logger.log('.witsignore is already exist.');
            return;
        }

        util.createEmptyFile(WITSIGNORE_PATH, 'node_modules');
        logger.log('witsignore is prepared.');
    } catch (error) {
        logger.log(`[Warning] Failed to makeWitsignoreFile ${error}`);
    }
}

function makeWitsconfigFile() {
    try {
        if (util.isFileExist(WITSCONFIG_PATH) && isExistCustomFile()) {
            logger.log('.witsconfig.json is already exist.');
            return;
        }
        util.createEmptyFile(WITSCONFIG_PATH, '{}');
        logger.log('.witsconfig.json is prepared.');
    } catch (error) {
        logger.log(`[Warning] Failed to makeWitsconfigFile ${error}`);
    }
}

function isExistCustomFile() {
    const customData = fs.readFileSync(WITSCONFIG_PATH, 'utf8');
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
