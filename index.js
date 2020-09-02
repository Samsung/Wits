const util = require('./lib/util.js');
const userInfoHelper = require('./lib/userInfoHelper.js');

const setWitsconfigInfo = async data => {
    const initCommand = require('./command/init.js');
    console.log('WITs::setWitsconfigInfo');

    if (data.hasOwnProperty('baseAppPath')) {
        util.CURRENT_PROJECT_PATH = userInfoHelper.getBaseAppPath(
            data.baseAppPath
        );
    }

    await initCommand.prepareRun();
    await userInfoHelper.updateLatestUserAnswer(data);
    return;
    /**
     {
         width: '1920',
         deviceIp: '192.168.250.250',
         hostIp: '192.168.250.250', 
         baseAppPath: 'E:/dev/workspace/test', 
         isDebugMode: false,
         profilePath: 'C:/tizen-studio-data/profile/profiles.xml',
        }
        */
};

const start = async () => {
    const startCommand = require('./command/start.js');
    console.log('WITs::start');
    await startCommand.run();
    return;
};

const watch = async () => {
    const watchCommand = require('./command/watch.js');
    console.log('WITs::watch');
    await watchCommand.run();
    return;
};

const disconnect = () => {
    const watchHelper = require('./lib/watchHelper.js');
    watchHelper.closeSocketServer();
};

module.exports = {
    setWitsconfigInfo,
    start,
    watch,
    disconnect
};
