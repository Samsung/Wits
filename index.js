const userInfoHelper = require('./lib/userInfoHelper');

const setWitsconfigInfo = async data => {
    const initCommand = require('./command/init.js');
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

module.exports = {
    setWitsconfigInfo,
    start,
    watch
};
