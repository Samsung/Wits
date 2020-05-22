const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const mkdirp = require('mkdirp');
const archiver = require('archiver');
const recursiveReadDir = require('recursive-readdir');

const util = require('./util.js');
const userInfoHelper = require('./userInfoHelper.js');
const regExp = require('./regexp.js');
const p12ToPem = require('./build/p12ToPem.js');
const signPackage = require('./build/signPackage.js');

const CONFIG_FILE = 'config.xml';
const WITS_NAME_TAG = 'WITs';
const WITS_PACKAGE = 'Wits.wgt';
const AUTOR_SIGNATURE = 'author-signature.xml';
const PUBLIC_SIGNATURE = 'signature1.xml';
const PUBLIC_SIGNATURE2 = 'signature2.xml';
const MAINFEST_TMP = '.manifest.tmp';
const RESOURCES = '.resource';

module.exports = {
    setHostAppEnv: async (userAnswer, deviceInfo) => {
        await makeHostAppConfigFile(userAnswer.baseAppPath);
        await setBaseJSData(userAnswer, deviceInfo);
        setBaseHtmlData(userAnswer);
    },
    getHostAppId: baseAppPath => {
        try {
            let file = baseAppPath + '/' + CONFIG_FILE;
            let data = fs.readFileSync(file, 'utf8');
            data = util.clearComment(data);
            let id = data
                .match(regExp.APPLICATION_ID)[0]
                .replace(regExp.APPLICATION_ID_ATTRIBUTE, '');
            return id + WITS_NAME_TAG;
        } catch (e) {
            console.error(`Failed to read base app config.xml. ${e}`);
            util.close();
        }
    },
    // buildPackage: profileInfo => {
    // // @deprecated
    //     console.log(`\nStart packaging Samsung Tizen TV Platform......`);
    //     const WITS_PACKAGE = 'Wits.wgt';
    //     try {
    //         let www = path.join(util.WITS_BASE_PATH, '../', 'container');
    //         let dest = path.join(
    //             util.WITS_BASE_PATH,
    //             '../',
    //             'container',
    //             'build'
    //         );
    //         let TEMPORARY_BUILD_DIR = '.buildResult';
    //         let result = null;

    //         result = execSync(`tizen version`);

    //         if (result.err) {
    //             console.log(result.stderr);
    //             console.log(
    //                 `The command "tizen" failed. Make sure you have the latest Tizen SDK installed, and the "tizen" command (inside the tools/ide/bin folder) is added to your path.`
    //             );
    //             util.close();
    //         }

    //         result = execSync(
    //             `tizen cli-config "default.profiles.path=${profileInfo.path}"`
    //         );

    //         if (result.code) {
    //             console.log(`Failed to Bulid ${result.output}`);
    //             util.close();
    //         }
    //         result = execSync(
    //             `tizen build-web -out ${TEMPORARY_BUILD_DIR} -- "${www}"`
    //         );
    //         if (result.code) {
    //             console.log(`Failed to Bulid ${result.output}`);
    //             util.close();
    //         }
    //         let tempBuildPath = path.resolve(
    //             path.join(www, TEMPORARY_BUILD_DIR)
    //         );
    //         result = execSync(
    //             `tizen package --type wgt --sign ${profileInfo.name} -- ${tempBuildPath}`
    //         );

    //         if (result.code) {
    //             console.log(`Failed to Bulid ${result.output}`);
    //             util.close();
    //         } else {
    //             let packagePath = result.stdout.match(
    //                 /Package File Location\:\s*(.*)/
    //             );
    //             if (packagePath && packagePath[1]) {
    //                 mkdirp.sync(dest);
    //                 console.log(`packagePath[1] : ${packagePath[1]}`);
    //                 console.log(`dest :${dest}`);
    //                 shelljs.mv(
    //                     '-f',
    //                     packagePath[1],
    //                     path.resolve(dest + '/' + WITS_PACKAGE)
    //                 );
    //                 shelljs.rm(
    //                     '-rf',
    //                     path.resolve(path.join(www, TEMPORARY_BUILD_DIR))
    //                 );
    //                 console.log(
    //                     `Package created at ${path.join(
    //                         dest,
    //                         path.basename(packagePath[1])
    //                     )}`
    //                 );
    //             } else {
    //                 console.log(`Fail to retrieve Package File Location.`);
    //                 util.close();
    //             }
    //         }
    //     } catch (e) {
    //         console.log(`Fail to buildPackage ${e}`);
    //         util.close();
    //     }
    // },
    buildPackage: async () => {
        await new Promise(async (resolve, reject) => {
            console.log(`\nStart packaging Samsung Tizen TV Platform......`);

            try {
                preparePackage();
            } catch (e) {
                reject(e);
                return;
            }

            const workspacePath = path.join(
                util.WITS_BASE_PATH,
                '../',
                'container'
            );

            console.log('workspacePath: ', workspacePath);
            const BUILD_DIR = 'build';
            const TEMPORARY_BUILD_DIR = '.buildResult';

            const outputPath = path.resolve(
                path.join(workspacePath, BUILD_DIR)
            );
            const outputTempPath = path.resolve(
                path.join(workspacePath, TEMPORARY_BUILD_DIR)
            );

            const archive = archiver('zip');

            mkdirp.sync(outputTempPath);
            console.log('Output put has been set as: ' + outputPath);

            const files = recursiveReadDir(workspacePath);
            (await files).forEach(file => {
                fse.copySync(file, outputTempPath, {
                    filter: src => {
                        if (src === RESOURCES || src === TEMPORARY_BUILD_DIR) {
                            return false;
                        }
                    }
                });
            });

            archive.on('error', function (err) {
                reject(err);
            });

            const output = fs.createWriteStream(
                path.join(outputTempPath, WITS_PACKAGE)
            );

            archive.pipe(output);

            archive.bulk([
                {
                    src: ['**'],
                    dest: '/',
                    cwd: path.join(workspacePath, '/'),
                    expand: true
                }
            ]);
            archive.finalize((err, bytes) => {
                if (err) {
                    reject(err);
                }
                console.log('done: ', bytes);
                console.log('Generated the .wgt achiver');
            });

            output.on('close', async () => {
                // Remove tempory signature files
                util.removeFile(
                    path.resolve(path.join(outputTempPath, AUTOR_SIGNATURE))
                );
                util.removeFile(
                    path.resolve(path.join(outputTempPath, PUBLIC_SIGNATURE))
                );
                util.removeFile(
                    path.resolve(path.join(outputTempPath, PUBLIC_SIGNATURE2))
                );
                util.removeFile(
                    path.resolve(path.join(outputTempPath, MAINFEST_TMP))
                );

                util.removeFile(
                    path.resolve(path.join(workspacePath, AUTOR_SIGNATURE))
                );
                util.removeFile(
                    path.resolve(path.join(workspacePath, PUBLIC_SIGNATURE))
                );
                util.removeFile(
                    path.resolve(path.join(workspacePath, PUBLIC_SIGNATURE2))
                );
                util.removeFile(
                    path.resolve(path.join(workspacePath, MAINFEST_TMP))
                );

                fse.removeSync(
                    path.resolve(path.join(workspacePath), RESOURCES)
                );
                mkdirp.sync(outputPath);
                fse.moveSync(
                    path.resolve(path.join(outputTempPath, WITS_PACKAGE)),
                    path.resolve(path.join(outputPath, WITS_PACKAGE)),
                    { overwrite: true }
                );
                fse.removeSync(path.resolve(outputTempPath));
                console.log(
                    'After build package, signature tempory files were removed'
                );
                console.log(
                    '============================== Build Package completed!'
                );
                console.log('');
                resolve();
            });
        });
    }
};

function preparePackage() {
    const dest = path.join(util.WITS_BASE_PATH, '../', 'container', 'build');
    const profilePath = userInfoHelper.getRefinedData().profilePath;

    // Remove exsiting packager or signature1.xml or author-signature.xml
    const exsitingPackager = path.join(dest, WITS_PACKAGE);
    const exsitingAuthorSignatureXML = path.join(dest, AUTOR_SIGNATURE);
    const exsitingSignature1XML = path.join(dest, PUBLIC_SIGNATURE);
    const existingSignature2XML = path.join(dest, PUBLIC_SIGNATURE2);

    util.removeFile(exsitingPackager);
    util.removeFile(exsitingAuthorSignatureXML);
    util.removeFile(exsitingSignature1XML);
    util.removeFile(existingSignature2XML);

    //Remove existing active_cert pem files in Developer and Distributor
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE);
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_CERT_FILE);
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_KEY_FILE);
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_CERT_FILE);
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_KEY_FILE);
    util.removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_CERT_FILE);

    try {
        signPackage.signPackage(profilePath);
    } catch (e) {
        console.error(`Failed to signPackage`);
        throw e;
    }
}

async function makeHostAppConfigFile(baseAppPath) {
    let userConfigData = '';
    try {
        userConfigData = fs.readFileSync(
            baseAppPath + '/' + CONFIG_FILE,
            'utf8'
        );
    } catch (e) {
        console.error(`Failed to read user config.xml. ${e}`);
        util.close();
        return;
    }

    let xmlParser = new xml2js.Parser({ attrkey: 'attributes' });

    let parsedXmlData = await new Promise((resolve, reject) =>
        xmlParser.parseString(userConfigData, function (err, result) {
            resolve(result);
        })
    );

    if (parsedXmlData && parsedXmlData.widget) {
        setDefaultConfigData(parsedXmlData.widget);
    } else {
        console.log(`User config.xml is not supported format.`);
        util.close();
    }

    let xmlBuilder = new xml2js.Builder({
        attrkey: 'attributes',
        xmldec: { version: '1.0', encoding: 'UTF-8' }
    });

    let witsConfigData = xmlBuilder.buildObject(parsedXmlData);

    try {
        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', CONFIG_FILE),
            witsConfigData,
            'utf8'
        );
    } catch (e) {
        console.error(`Failed to write Wits config.xml. ${e}`);
        util.close();
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

    configData[WITS_CONFIG_CONTENT_TAG] = [
        {
            attributes: {
                src: 'index.html'
            }
        }
    ];

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

async function setBaseJSData(userAnswer, deviceInfo) {
    try {
        let file = path.join(
            util.WITS_BASE_PATH,
            '../',
            'container',
            'js',
            'base.js'
        );
        let data = fs.readFileSync(file, 'utf8');
        let contentSrc = getContentSrc(userAnswer.baseAppPath);
        let hostAppId = module.exports.getHostAppId(userAnswer.baseAppPath);
        let hostAppName = hostAppId.split('.')[1];
        let hostAppPath = deviceInfo.appInstallPath + hostAppName;

        contentSrc.replace(regExp.FIRST_BACKSLASH, '');
        let contentFullSrc = util.isRemoteUrl(contentSrc)
            ? contentSrc
            : hostAppPath +
              '/' +
              contentSrc.replace(regExp.FIRST_BACKSLASH, '');

        let hostIp = userAnswer.hostIp;

        let convertData = {
            '{{CONTENT_PATH}}': hostAppPath,
            '{{CONTENT_SRC}}': contentFullSrc,
            '{{HOST_IP}}': 'http://' + hostIp,
            '{{HOST_PORT}}': userAnswer.socketPort,
            '{{HOST_BASE_CONTENT_PATH}}': userAnswer.baseAppPath
        };

        let str = data.replace(regExp.HOST_DATA, key => {
            return convertData[key];
        });

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', 'js', 'main.js'),
            str,
            'utf8'
        );
        return;
    } catch (e) {
        console.error(`Failed to set Wits baseJS data to file ${e}`);
        util.close();
        return;
    }
}

function setBaseHtmlData(userAnswer) {
    try {
        let file = path.join(
            util.WITS_BASE_PATH,
            '../',
            'container',
            'base.html'
        );
        let data = fs.readFileSync(file, 'utf8');

        let str = data.replace(regExp.HOST_WIDTH, userAnswer.width);

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', 'index.html'),
            str,
            'utf8'
        );
    } catch (e) {
        console.error(`Failed to set Wits baseHtml data to file`);
        util.close();
    }
}

function getContentSrc(baseAppPath) {
    let contentSrc = 'index.html';

    try {
        let file = path.resolve(path.join(baseAppPath, 'config.xml'));
        let data = fs.readFileSync(file, 'utf8');
        data = util.clearComment(data);
        contentSrc = data
            .match(regExp.CONTENT_SRC)[0]
            .replace(regExp.CONTENT_SRC_ATTRIBUTE, '');
    } catch (e) {
        console.warn(
            `[warning] Failed to read config.xml. Set Content src to default.`
        );
    }

    console.log(`content src is : ${contentSrc}`);

    return contentSrc;
}
