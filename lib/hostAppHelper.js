const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const chalk = require('chalk');
const common = require('@tizentv/webide-common-tizentv');

const util = require('./util.js');
const userInfoHelper = require('./userInfoHelper.js');
const regExp = require('./regexp.js');
const { logger } = require('./logger');

const CONFIG_FILE = 'config.xml';
const WITS_NAME_TAG = 'WITs';

module.exports = {
    setHostAppEnv: async (userAnswer, deviceInfo) => {
        await makeHostAppConfigFile(userAnswer.baseAppPath);
        setBaseJSData(userAnswer, deviceInfo);
        setBaseFsWrapper(userAnswer, deviceInfo);
        setBaseHtmlData(userAnswer);
    },
    getHostAppId: baseAppPath => {
        try {
            const file = baseAppPath + '/' + CONFIG_FILE;
            let data = fs.readFileSync(file, 'utf8');
            data = util.clearComment(data);
            const id = data
                .match(regExp.APPLICATION_ID)[0]
                .replace(regExp.APPLICATION_ID_ATTRIBUTE, '');
            return id + WITS_NAME_TAG;
        } catch (e) {
            logger.error(chalk.red(`Failed to read base app config.xml. ${e}`));
            util.exit();
        }
    },
    buildPackage: async () => {
        const buildPath = path.join(util.WITS_BASE_PATH, '../', 'container');
        const profilePath = userInfoHelper.getLatestWitsconfigInfo().profileInfo
            .path;
        const hostAppId = module.exports.getHostAppId(
            util.CURRENT_PROJECT_PATH
        );
        try {
            logger.log(
                chalk.cyanBright(
                    `\nStart packaging Samsung Tizen TV Platform......\n`
                )
            );
            const app = new common.TVWebApp(
                WITS_NAME_TAG,
                buildPath,
                hostAppId
            );
            if (!util.isFileExist(profilePath)) {
                logger.error(
                    chalk.red(
                        `Please check ${profilePath} is valid. For making a new certification, please do "wits -c"`
                    )
                );
                util.exit();
            }
            await app.buildWidget(profilePath);

            logger.log(
                chalk.cyanBright(
                    '============================== Build Package completed!'
                )
            );
            logger.log('');
            return;
        } catch (error) {
            logger.log('Failed to buildPackage : ' + error);
        }
    }
};

async function makeHostAppConfigFile(baseAppPath) {
    let userConfigData = '';
    try {
        userConfigData = fs.readFileSync(
            baseAppPath + '/' + CONFIG_FILE,
            'utf8'
        );
    } catch (e) {
        logger.error(chalk.red(`Failed to read user config.xml. ${e}`));
        util.exit();
        return;
    }

    const xmlParser = new xml2js.Parser({ attrkey: 'attributes' });

    const parsedXmlData = await new Promise((resolve, reject) =>
        xmlParser.parseString(userConfigData, function (err, result) {
            resolve(result);
        })
    );

    if (parsedXmlData && parsedXmlData.widget) {
        setDefaultConfigData(parsedXmlData.widget);
    } else {
        logger.log(`User config.xml is not supported format.`);
        util.exit();
    }

    const xmlBuilder = new xml2js.Builder({
        attrkey: 'attributes',
        xmldec: { version: '1.0', encoding: 'UTF-8' }
    });

    const witsConfigData = xmlBuilder.buildObject(parsedXmlData);

    try {
        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', CONFIG_FILE),
            witsConfigData,
            'utf8'
        );
    } catch (e) {
        logger.error(chalk.red(`Failed to write Wits config.xml. ${e}`));
        util.exit();
        return;
    }
}

function setDefaultConfigData(configData) {
    const WITS_CONFIG_APPLICATION = 'tizen:application';
    const WITS_CONFIG_ACCESS_TAG = 'access';
    const WITS_CONFIG_CONTENT_TAG = 'content';
    const WITS_CONFIG_ICON_TAG = 'icon';
    const WITS_CONFIG_PRIVILEGE_TAG = 'tizen:privilege';
    const FILESYSTEM_READ_PRIVILEGE =
        'http://tizen.org/privilege/filesystem.read';
    const FILESYSTEM_WRITE_PRIVILEGE =
        'http://tizen.org/privilege/filesystem.write';

    configData[WITS_CONFIG_APPLICATION][0].attributes.id += WITS_NAME_TAG;

    configData[WITS_CONFIG_ACCESS_TAG] = [
        {
            attributes: {
                origin: '*',
                subdomains: 'true'
            }
        }
    ];

    // configData[WITS_CONFIG_CONTENT_TAG] = [
    //     {
    //         attributes: {
    //             src: 'index.html'
    //         }
    //     }
    // ];

    configData[WITS_CONFIG_ICON_TAG] = [
        {
            attributes: {
                src: 'icon.png'
            }
        }
    ];

    if (configData.hasOwnProperty(WITS_CONFIG_PRIVILEGE_TAG)) {
        configData[WITS_CONFIG_PRIVILEGE_TAG].push(
            {
                attributes: {
                    name: FILESYSTEM_READ_PRIVILEGE
                }
            },
            {
                attributes: {
                    name: FILESYSTEM_WRITE_PRIVILEGE
                }
            }
        );
    } else {
        configData[WITS_CONFIG_PRIVILEGE_TAG] = [
            {
                attributes: {
                    name: FILESYSTEM_READ_PRIVILEGE
                }
            },
            {
                attributes: {
                    name: FILESYSTEM_WRITE_PRIVILEGE
                }
            }
        ];
    }
}

function setBaseJSData(userAnswer, deviceInfo) {
    try {
        const file = path.join(
            util.WITS_BASE_PATH,
            '../',
            'container',
            'js',
            'base.js'
        );
        const data = fs.readFileSync(file, 'utf8');
        const contentSrc = getContentSrc(userAnswer.baseAppPath);
        const hostAppId = module.exports.getHostAppId(userAnswer.baseAppPath);
        const hostAppName = hostAppId.split('.')[1];
        const hostAppPath = deviceInfo.appInstallPath + hostAppName;

        contentSrc.replace(regExp.FIRST_BACKSLASH, '');
        const contentFullSrc = util.isRemoteUrl(contentSrc)
            ? contentSrc
            : hostAppPath +
              '/' +
              contentSrc.replace(regExp.FIRST_BACKSLASH, '');

        const hostIp = userAnswer.hostIp;

        const convertData = {
            '{{CONTENT_PATH}}': hostAppPath,
            '{{CONTENT_SRC}}': contentFullSrc,
            '{{HOST_IP}}': 'http://' + hostIp,
            '{{HOST_PORT}}': userAnswer.socketPort,
            '{{HOST_BASE_CONTENT_PATH}}': userAnswer.baseAppPath
        };

        const str = data.replace(regExp.HOST_DATA, key => {
            return convertData[key];
        });

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', 'js', 'main.js'),
            str,
            'utf8'
        );
    } catch (e) {
        logger.error(chalk.red(`Failed to set Wits baseJS data to file ${e}`));
        util.exit();
    }
}

function setBaseHtmlData(userAnswer) {
    try {
        const file = path.join(
            util.WITS_BASE_PATH,
            '../',
            'container',
            'base.html'
        );
        const data = fs.readFileSync(file, 'utf8');

        const str = data.replace(regExp.HOST_WIDTH, userAnswer.width);

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', 'index.html'),
            str,
            'utf8'
        );
    } catch (e) {
        logger.error(chalk.red(`Failed to set Wits baseHtml data to file`));
        util.exit();
    }
}

function getContentSrc(baseAppPath) {
    let contentSrc = 'index.html';

    try {
        const file = path.resolve(path.join(baseAppPath, 'config.xml'));
        let data = fs.readFileSync(file, 'utf8');
        data = util.clearComment(data);
        contentSrc = data
            .match(regExp.CONTENT_SRC)[0]
            .replace(regExp.CONTENT_SRC_ATTRIBUTE, '');
    } catch (e) {
        logger.warn(
            `[warning] Failed to read config.xml. Set Content src to default.`
        );
    }

    logger.log(`content src is : ${contentSrc}`);

    return contentSrc;
}

function setBaseFsWrapper(userAnswer, deviceInfo) {
    try {
        const file = path.join(
            util.WITS_BASE_PATH,
            'wrapper',
            'baseFilesystemWrapper.js'
        );
        const data = fs.readFileSync(file, 'utf8');
        const hostAppId = module.exports.getHostAppId(userAnswer.baseAppPath);
        const hostAppName = hostAppId.split('.')[1];
        const hostAppPath = deviceInfo.appInstallPath + hostAppName;

        const convertData = {
            '{{CONTENT_PATH}}': hostAppPath
        };

        const str = data.replace(regExp.HOST_DATA, key => {
            return convertData[key];
        });

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, 'wrapper', 'filesystemWrapper.js'),
            str,
            'utf8'
        );
    } catch (e) {
        console.error(
            chalk.red(`Failed to set Wits baseFsWrapper data to file ${e}`)
        );
    }
}
