const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const overwrite = require('terminal-overwrite');
const admzip = require('adm-zip');

const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

const CONTAINER_NAME = 'container';
const CONTAINER_ZIP_URL = 'https://github.com/Samsung/Wits/raw/master/archive/container.zip';

const TOOLS_NAME = 'tools';
const TOOLS_ZIP_URL = 'https://github.com/Samsung/Wits/raw/wits-vscode/archive/tools.zip';

module.exports = {
    run: async () => {
        console.log(`Start configuration for Wits............`);

        await module.exports.prepareRun();

        const wInfo = userInfoHelper.getLatestWitsconfigInfo();
        await userInfoHelper.askQuestion(wInfo.connectionInfo);
    },
    prepareRun: async () => {
        makeWitsignoreFile();
        makeWitsconfigFile();

        console.log(``);

        await Promise.all([
            prepareTool(CONTAINER_NAME, CONTAINER_ZIP_URL),
            prepareTool(TOOLS_NAME, TOOLS_ZIP_URL)
        ]);
        return;
    }
};

function makeWitsignoreFile() {
    const WITSIGNORE_PATH = path.join(
        util.CURRENT_PROJECT_PATH,
        WITS_IGNORE_FILE_NAME
    );

    try {
        if (util.isFileExist(WITSIGNORE_PATH)) {
            console.log('.witsignore is already exist.');
            return;
        }

        util.createEmptyFile(WITSIGNORE_PATH);
        console.log('.witsignore is prepared.');
    } catch (error) {
        console.error(`Failed to makeWitsignoreFile ${error}`);
    }
}

function makeWitsconfigFile() {
    const WITSCONFIG_PATH = path.join(
        util.CURRENT_PROJECT_PATH,
        WITS_CONFIG_FILE_NAME
    );

    try {
        if (util.isFileExist(WITSCONFIG_PATH) && isExistCustomFile()) {
            console.log('.witsconfig.json is already exist.');
            return;
        }
        util.createEmptyFile(WITSCONFIG_PATH);
        copyWitsconfigFile();
        console.log('.witsconfig.json is prepared.');
    } catch (error) {
        console.error(`Failed to makeWitsconfigFile ${error}`);
    }
}

function copyWitsconfigFile() {
    try {
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
        console.error(`Failed to copyWitsconfigFile ${e}`);
        util.close();
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
        witsConfigData.hasOwnProperty('profileInfo') &&
        witsConfigData.hasOwnProperty('connectionInfo')
    ) {
        return true;
    }
    return false;
}

async function prepareTool(name, downloadUrl) {
    new Promise((resolve, reject) => {
        await download(name, downloadUrl);
        await extract(name);
        resolve();
    })
}

async function download(name, downloadUrl) {
    const ZIP_FILE_PATH = path.join(
        util.WITS_BASE_PATH,
        '../',
        `${name}.zip`
    );

    if (util.isFileExist(ZIP_FILE_PATH)) {
        return;
    }

    const optionalInfo = await userInfoHelper.getOptionalInfo();
    const zip = fs.createWriteStream(ZIP_FILE_PATH);

    await new Promise((resolve, reject) => {
        let requestOptions = { uri: downloadUrl };
        if (util.isPropertyExist(optionalInfo, 'proxyServer')) {
            requestOptions = {
                uri: downloadUrl,
                strictSSL: false,
                proxy: optionalInfo.proxyServer
            };
        }
        progress(request(requestOptions))
            .on('response', data => {
                console.log('');
            })
            .on('progress', state => {
                overwrite(
                    `Downloading ${name}.zip ............. ${parseInt(
                        state.percent * 100
                    )} %`
                );
            })
            .pipe(zip)
            .on('finish', () => {
                overwrite(`Downloading ${name}.zip ............. 100 %`);
                console.log(`Download has been completed.`);
                console.log(``);
                overwrite.done();
                resolve();
            })
            .on('error', error => {
                console.warn(
                    `Failed to download, please check if you're behind proxy : ${error}`
                );
                reject(error);
            });
    }).catch(error => {
        console.warn(
            `Failed to download, please check if you're behind proxy : ${error}`
        );
    });
}

async function extract(name) {
    const ZIP_FILE_PATH = path.join(
        util.WITS_BASE_PATH,
        '../',
        `${name}.zip`
    );
    const DIRECTORY_PATH = path.join(
        util.WITS_BASE_PATH,
        '../',
        name
    );
    try {
        const zip = new admzip(ZIP_FILE_PATH);
        zip.extractAllTo(DIRECTORY_PATH);
    } catch (error) {
        console.log(`${error}`);
        if (util.isFileExist(ZIP_FILE_PATH)) {
            fs.unlinkSync(ZIP_FILE_PATH);
            console.log(
                `Invalid zip file was successfully removed. Retry please.`
            );
        }
        util.close();
    }
}
