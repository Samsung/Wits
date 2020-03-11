const util = require('../lib/util.js');

const WITS_CONFIG_FILE_NAME = '.witsconfig.json';
const WITS_IGNORE_FILE_NAME = '.witsignore';

module.exports = {
    run: () => {
        createWitsconfigFile();
    }
};

function createWitsconfigFile() {
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME);
    util.createEmptyFile(util.CURRENT_PROJECT_PATH, WITS_IGNORE_FILE_NAME);
}
