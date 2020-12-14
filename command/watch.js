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

        const data = userInfoHelper.getRefinedData();

        if (option !== undefined) {
            await supportDeviceIpOption(data, option);
        }

        const deviceInfo = await userInfoHelper.getDeviceInfo();

        const hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
        const deviceName = deviceInfo.deviceName;

        watchHelper.openSocketServer(data, deviceInfo);
        // appLaunchHelper.terminateApp(deviceName, hostAppId);

        try {
            data.isDebugMode
                ? appLaunchHelper.launchDebugMode(deviceName, hostAppId)
                : appLaunchHelper.launchApp(deviceName, hostAppId);
        } catch (e) {
            logger.log(e);
            util.exit();
        }
    }
};

async function supportDeviceIpOption(data, option) {
    const optionDeviceIp = util.parseDeviceIp(option);
    if (optionDeviceIp === null && typeof option !== 'boolean') {
        logger.error(
            chalk.red(
                `Invalid Type of cli option. Please retry with correct type. ex) deviceIp=0.0.0.0`
            )
        );
        util.exit();
    }

    if (optionDeviceIp) {
        data.deviceIp = optionDeviceIp;
        await userInfoHelper.updateLatestUserAnswer({
            deviceIp: optionDeviceIp
        });
    }
}
