const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');
const util = require('../lib/util.js');
const chalk = require('chalk');

module.exports = {
    run: async () => {
        console.log(
            chalk.cyanBright(`Start running Wits watch mode............\n`)
        );

        await util.initTools();

        const data = await userInfoHelper.getLatestWitsconfigInfo()
            .connectionInfo;
        const baseAppPath = userInfoHelper.getBaseAppPath(data.baseAppPath);

        const deviceInfo = await userInfoHelper.getDeviceInfo(data.deviceIp);

        const hostAppId = hostAppHelper.getHostAppId(baseAppPath);
        const deviceName = deviceInfo.deviceName;
        data.baseAppPath = baseAppPath;

        watchHelper.openSocketServer(data, deviceInfo);
        // appLaunchHelper.terminateApp(deviceName, hostAppId);

        try {
            data.isDebugMode
                ? appLaunchHelper.launchDebugMode(
                      deviceName,
                      hostAppId,
                      data.deviceIp
                  )
                : appLaunchHelper.launchApp(deviceName, hostAppId);
        } catch (e) {
            console.log(e);
            util.exit();
        }
    }
};
