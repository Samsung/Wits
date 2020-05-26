const initCommand = require('./command/init.js');
const watchCommand = require('./command/watch.js');
const startCommand = require('./command/start.js');
const userInfoHelper = require('./lib/userInfoHelper');

const setWitsconfigInfo = async data => {
    console.log('WITs::setWitsconfigInfo');
    await initCommand.prepareRun();
    await userInfoHelper.updateLatestUserAnswer(data);
    return;
    /**
        {
            width: '1920',
            deviceIp: '192.168.250.250',
            socketPort: 8498, (optional)
            hostIp: '192.168.250.250', 
            baseAppPath: 'E:/dev/workspace/test', 
            isDebugMode: false,
            profilePath: 'C:/tizen-studio-data/profile/profiles.xml',
        }
     */
};

const start = async () => {
    console.log('WITs::start');
    await startCommand.run();
    return;
};

const watch = async () => {
    console.log('WITs::watch');
    await watchCommand.run();
    return;
};

module.exports = {
    setWitsconfigInfo,
    start,
    watch
};
