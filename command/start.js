const chalk = require('chalk');
const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');
const { logger } = require('../lib/logger');

module.exports = {
    run: async option => {
        logger.log(chalk.cyanBright(`Start running Wits............\n`));

        await util.initTools();

        const data = userInfoHelper.getRefinedData();

        if (option !== undefined) {
            await supportDeviceIpOption(data, option);
        }

        let deviceInfo = '';

        try {
            deviceInfo = await userInfoHelper.getDeviceInfo(data.deviceIp);
        } catch (error) {
            logger.log(`Failed to getDeviceInfo: ${error}`);
        }

        await hostAppHelper.setHostAppEnv(data, deviceInfo);
        hostAppHelper
            .buildPackage()
            .then(() => {
                logger.log(
                    chalk.cyanBright(
                        '============================== Start to install the package'
                    )
                );

                const hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
                const hostAppName = hostAppId.split('.')[1];
                const deviceName = deviceInfo.deviceName;

                appLaunchHelper.unInstallPackage(deviceName, hostAppName);
                appLaunchHelper.installPackage(deviceInfo, hostAppName);
                watchHelper.openSocketServer(data, deviceInfo);
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
            })
            .catch(e => {
                logger.error(chalk.red(`Failed to buildPackage: ${e}`));
                util.exit();
            });
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
        logger.log(
            chalk.cyanBright(`WITs tries connecting with ${optionDeviceIp}\n`)
        );
        await userInfoHelper.updateLatestUserAnswer({
            deviceIp: optionDeviceIp
        });
    }
}
