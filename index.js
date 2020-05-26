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

const start = () => {
    console.log('WITs::start');
    startCommand.run();
};

const watch = () => {
    console.log('WITs::watch');
    watchCommand.run();
};

module.exports = {
    setWitsconfigInfo,
    start,
    watch
};
