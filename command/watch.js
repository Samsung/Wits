const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');
const util = require('../lib/util.js');
const chalk = require('chalk');
const { logger } = require('../lib/logger');

module.exports = {
    run: async option => {
        logger.log(
            chalk.cyanBright(`Start running Wits watch mode............\n`)
        );

        await util.initTools();

        const data = await userInfoHelper.getLatestWitsconfigInfo()
            .connectionInfo;

        const optionDeviceIp = util.parseDeviceIp(option);
        if (optionDeviceIp) {
            data.deviceIp = optionDeviceIp;
            await userInfoHelper.updateLatestUserAnswer({
                deviceIp: optionDeviceIp
            });
        }

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
            logger.log(e);
            util.exit();
        }
    }
};
