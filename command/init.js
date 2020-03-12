const fs = require('fs');
const path = require('path');
const util = require('../lib/util.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

module.exports = {
    run: () => {
        makeWitsignoreFile();
        makeWitsconfigFile();
    }
};

function makeWitsignoreFile() {
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_IGNORE_FILE_NAME);
}

function makeWitsconfigFile() {
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME);
    copyWitsconfigFile();
}

function copyWitsconfigFile() {
    try {
        // if (isExistCustomFile()) {
        //     return;
        // }

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
        console.log(`Failed to getWitsconfig ${e}`);
        process.exit(0);
    }
}

function isExistCustomFile() {
    let customData = JSON.parse(
        fs.readFileSync(
            path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
            'utf8'
        )
    );
    if (isValidWitsconfigFile(customData)) {
        return true;
    }
    return false;
}

function isValidWitsconfigFile(data) {
    if (
        data.hasOwnProperty('profileInfo') &&
        data.hasOwnProperty('connectionInfo')
    ) {
        return true;
    }
    return false;
}
