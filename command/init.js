const fs = require('fs');
const path = require('path');
const request = require('request');
const admzip = require('adm-zip');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

const CONTAINER_DIRECTORY_NAME = 'container';
const CONTAINER_ZIP_FILE_NAME = 'container.zip';
const CONTAINER_ZIP_URL =
    'https://github.com/Samsung/Wits/raw/npm-release/archive/container.zip';
const samsungProxy = 'http://168.219.61.252:8080';
const CONTAINER_ZIP_FILE_PATH = path.join(
    util.WITS_BASE_PATH,
    '../',
    CONTAINER_ZIP_FILE_NAME
);
const CONTAINER_DIRECTORY_PATH = path.join(
    util.WITS_BASE_PATH,
    '../',
    CONTAINER_DIRECTORY_NAME
);

module.exports = {
    run: async () => {
        console.log(`Start configuration for Wits............`);
        await downloadHttpsFile();
        await extractDirectory();
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

async function downloadHttpsFile() {
    if (util.isFileExist(CONTAINER_ZIP_FILE_PATH)) {
        return;
    }
    let zip = fs.createWriteStream(CONTAINER_ZIP_FILE_PATH);
    await new Promise((resolve, reject) => {
        let stream = request({
            uri: CONTAINER_ZIP_URL,
            strictSSL: false,
            proxy: samsungProxy
        })
            .pipe(zip)
            .on('finish', () => {
                resolve();
            })
            .on('error', error => {
                reject(error);
            });
    }).catch(error => {
        console.log(`${error}`);
    });
}

async function extractDirectory() {
    if (!util.isFileExist(CONTAINER_ZIP_FILE_PATH)) {
        await downloadHttpsFile();
    }
    let zip = new admzip(CONTAINER_ZIP_FILE_PATH);
    zip.extractAllTo(CONTAINER_DIRECTORY_PATH);
}
