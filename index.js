const initCommand = require('./command/init.js');
const watchCommand = require('./command/watch.js');
const startCommand = require('./command/start.js');
const userInfoHelper = require('./lib/userInfoHelper');

const setWitsconfigInfo = data => {
    console.log('wits::setWitsconfigInfo');
    initCommand.prepareRun();
    userInfoHelper.updateLatestUserAnswer(data);

    // // @ data type
    // {
    //     width: '1920',
    //     deviceIp: '192.168.250.250',
    //     socketPort: 8498,
    //     hostIp: '192.168.250.250',
    //     baseAppPath: 'E:/dev/workspace/test',
    //     isDebugMode: false,
    //     profileName: 'test',
    //     profilePath: 'C:/tizen-studio-data/profile/profiles.xml',
    // };
};

const start = () => {
    console.log('wits::start');
    startCommand.run();
};

const watch = () => {
    console.log('wits::watch');
    watchCommand.run();
};

module.exports = {
    setWitsconfigInfo,
    start,
    watch
};
