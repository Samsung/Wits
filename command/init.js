const fs = require('fs');
const path = require('path');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

module.exports = {
    run: async () => {
        console.log(`Start configuration for Wits............`);
        makeWitsignoreFile();
        makeWitsconfigFile();

        await userInfoHelper.getWitsSettingInfo();
    }
};

function makeWitsignoreFile() {
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_IGNORE_FILE_NAME);
    console.log('.witsignore is prepared.');
}

function makeWitsconfigFile() {
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME);
    copyWitsconfigFile();
    console.log('.witsconfig.json is prepared.');
}

function copyWitsconfigFile() {
    try {
        if (isExistCustomFile()) {
            return;
        }

        let witsConfigData = JSON.parse(
            fs.readFileSync(
                path.join(util.WITS_BASE_PATH, '../', WITS_CONFIG_FILE_NAME),
                'utf8'
            )
        );

        if (isValidWitsconfigFile(witsConfigData)) {
            fs.writeFileSync(
                path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
                JSON.stringify(witsConfigData, null, 2),
                'utf8'
            );
        }
    } catch (e) {
        console.log(`Failed to copyWitsconfigFile ${e}`);
        process.exit(0);
    }
}

function isExistCustomFile() {
    let customData = fs.readFileSync(
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
        witsConfigData.hasOwnProperty('profileInfo') &&
        witsConfigData.hasOwnProperty('connectionInfo')
    ) {
        return true;
    }
    return false;
}
