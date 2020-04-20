const os = require('os');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const shelljs = require('shelljs');
const innerProcessBuild = require('child_process');
const mkdirp = require('mkdirp');
const archiver = require('archiver');

const util = require('./util.js');
const userInfoHelper = require('./userInfoHelper.js');
const regExp = require('./regexp.js');
const common = require('./build/common.js');
const p12ToPem = require('./build/p12ToPem.js');
const signPackage = require('./build/signPackage.js');

const CONFIG_FILE = 'config.xml';
const WITS_NAME_TAG = 'WITs';
const WITS_PACKAGE = 'Wits.wgt';

var AUTOR_SIGNATURE = 'author-signature.xml';
var PUBLIC_SIGNATURE = 'signature1.xml';
var PUBLIC_SIGNATURE2 = 'signature2.xml';
var MAINFEST_TMP = '.manifest.tmp';

module.exports = {
    setHostAppEnv: async (userAnswer, deviceInfo) => {
        await makeHostAppConfigFile(userAnswer.baseAppPath);
        await setBaseJSData(userAnswer, deviceInfo);
        setBaseHtmlData(userAnswer);
    },
    getHostAppId: (baseAppPath) => {
        try {
            let file = baseAppPath + '/' + CONFIG_FILE;
            let data = fs.readFileSync(file, 'utf8');
            data = util.clearComment(data);
            let id = data
                .match(regExp.APPLICATION_ID)[0]
                .replace(regExp.APPLICATION_ID_ATTRIBUTE, '');
            return id + WITS_NAME_TAG;
        } catch (e) {
            console.log(`Failed to read base app config.xml. ${e}`);
            process.exit(0);
        }
    },
    buildPackage_: (profileInfo) => {
        // @ deprecated
        console.log(`\nStart packaging Samsung Tizen TV Platform......`);
        try {
            let www = path.join(util.WITS_BASE_PATH, '../', 'container');
            let dest = path.join(
                util.WITS_BASE_PATH,
                '../',
                'container',
                'build'
            );
            let TEMPORARY_BUILD_DIR = '.buildResult';
            let result = null;

            result = shelljs.exec(`tizen version`);

            if (result.err) {
                console.log(result.stderr);
                console.log(
                    `The command "tizen" failed. Make sure you have the latest Tizen SDK installed, and the "tizen" command (inside the tools/ide/bin folder) is added to your path.`
                );
                process.exit(0);
            }

            result = shelljs.exec(
                `tizen cli-config "default.profiles.path=${profileInfo.path}"`
            );

            if (result.code) {
                console.log(`Failed to Bulid ${result.output}`);
                process.exit(0);
            }
            result = shelljs.exec(
                `tizen build-web -out ${TEMPORARY_BUILD_DIR} -- "${www}"`
            );
            if (result.code) {
                console.log(`Failed to Bulid ${result.output}`);
                process.exit(0);
            }
            let tempBuildPath = path.resolve(
                path.join(www, TEMPORARY_BUILD_DIR)
            );
            result = shelljs.exec(
                `tizen package --type wgt --sign ${profileInfo.name} -- ${tempBuildPath}`
            );

            if (result.code) {
                console.log(`Failed to Bulid ${result.output}`);
                process.exit(0);
            } else {
                let packagePath = result.stdout.match(
                    /Package File Location\:\s*(.*)/
                );
                if (packagePath && packagePath[1]) {
                    mkdirp.sync(dest);
                    console.log(`packagePath[1] : ${packagePath[1]}`);
                    console.log(`dest :${dest}`);
                    shelljs.mv(
                        '-f',
                        packagePath[1],
                        path.resolve(dest + '/' + WITS_PACKAGE)
                    );
                    shelljs.rm(
                        '-rf',
                        path.resolve(path.join(www, TEMPORARY_BUILD_DIR))
                    );
                    console.log(
                        `Package created at ${path.join(
                            dest,
                            path.basename(packagePath[1])
                        )}`
                    );
                } else {
                    console.log(`Fail to retrieve Package File Location.`);
                    process.exit(0);
                }
            }
        } catch (e) {
            console.log(`Fail to buildPackage ${e}`);
            process.exit(0);
        }
    },
    buildPackage: (profileInfo) => {
        console.log(`\nStart packaging Samsung Tizen TV Platform......`);

        // preparePackage();

        const workspacePath = path.join(
            util.WITS_BASE_PATH,
            '../',
            'container'
        );
        const BUILD_DIR = 'build';
        const TEMPORARY_BUILD_DIR = '.buildResult';

        const outputPath = path.join(workspacePath, BUILD_DIR);
        const outputTempPath = path.join(workspacePath, TEMPORARY_BUILD_DIR);

        mkdirp.sync(outputTempPath);
        console.log('Output put has been set as: ' + outputPath);

        var output = fs.createWriteStream(
            path.resolve(path.join(outputTempPath, WITS_PACKAGE))
        );
        var archive = archiver('zip');

        archive.on('error', function (err) {
            console.log(err.message);
            throw err;
        });

        output.on('close', function () {
            // Remove tempory signature files
            var authorSignature = path.join(outputTempPath, AUTOR_SIGNATURE);
            var publicSignature = path.join(outputTempPath, PUBLIC_SIGNATURE);
            var publicSignature2 = path.join(outputTempPath, PUBLIC_SIGNATURE2);
            var tmpFile = path.join(outputTempPath, MAINFEST_TMP);
            if (fs.existsSync(authorSignature)) {
                fs.unlinkSync(authorSignature);
            }
            if (fs.existsSync(publicSignature)) {
                fs.unlinkSync(publicSignature);
            }
            if (fs.existsSync(publicSignature2)) {
                fs.unlinkSync(publicSignature2);
            }
            if (fs.existsSync(tmpFile)) {
                fs.unlinkSync(tmpFile);
            }
            fs.renameSync(outputTempPath, outputPath);
            console.log(
                'After build package, signature tempory files were removed'
            );
            console.log('==============================Build Package end!');
        });

        archive.pipe(output);
        archive.bulk([
            {
                src: ['**'],
                dest: '/',
                cwd: path.join(outputTempPath),
                expand: true,
            },
        ]);
        archive.finalize();

        // Move .wgt file to App path

        console.log('Move .wgt from tempory path');

        // Complete the package build
        //while (!fs.existsSync(outputFullPath)) {
        //common.sleepMs(500);
        //}
        console.log('Generated the .wgt achiver');
        var buildSuccessMsg = 'Build the package Successfully!';
        console.log(buildSuccessMsg);
    },
};

function removeFile(filepath) {
    if (fs.existsSync(filepath)) {
        console.log('The existing ' + filepath + ' will be removed firstly');
        console.log('Remove existing ' + filepath);

        try {
            fs.unlinkSync(filepath);
        } catch (ex) {
            console.log('The existing ' + filepath + ' cannot be removed');
            console.error(ex.message);
            return false;
        }
    }
}

function preparePackage() {
    let dest = path.join(util.WITS_BASE_PATH, '../', 'container', 'build');
    // Remove exsiting packager or signature1.xml or author-signature.xml
    var exsitingPackager = path.join(dest, WITS_PACKAGE);
    var exsitingAuthorSignatureXML = path.join(dest, AUTOR_SIGNATURE);
    var exsitingSignature1XML = path.join(dest, PUBLIC_SIGNATURE);
    var existingSignature2XML = path.join(dest, PUBLIC_SIGNATURE2);
    // removeFile(exsitingPackager);
    // removeFile(exsitingAuthorSignatureXML);
    // removeFile(exsitingSignature1XML);
    // removeFile(existingSignature2XML);

    // //Remove existing active_cert pem files in Developer and Distributor
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE);
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_CERT_FILE);
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_KEY_FILE);
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_CERT_FILE);
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_KEY_FILE);
    // removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_CERT_FILE);

    //signature a package which use crypto nodejs library
    try {
        console.log('Signing app, please wait...');
        //signPackage.signPackage();

        signPackage.signPackage(dest);
        console.log('Completed sign...');
    } catch (ex) {
        console.log(
            'Do application signature failed, please check your environment'
        );
        console.log('xmldom is suggested for signature package');
        console.log(ex.message);
    }
}
var getZipFileDir = function (pathinput, archive) {
    var filepath = workspacePath + path.sep + pathinput;
    var files = fs.readdirSync(filepath);
    //fs.writeFileSync(workspacePath + path.sep + "../createReferences.txt", files);
    // It does noy support forEach
    for (var i = files.length - 1; i >= 0; i--) {
        if (files[i].indexOf('.') == 0) {
            //startWith is not support in the file, indexOf == 0 is equal to startWith
            //files.splice(i,1);
            continue;
        }
        var fullname = filepath + files[i];
        //var outname = fullname;
        //outname.replace(workspacePath,"");
        var stats = fs.statSync(fullname);
        if (stats.isDirectory()) {
            fullname += path.sep;
            if (explist.indexOf(';' + fullname) >= 0) {
                if (explist.indexOf(';' + fullname + ';') >= 0) {
                    continue;
                }
                getZipFileDir(pathinput + files[i] + path.sep, archive);
            } else {
                archive.directory(fullname, pathinput + files[i]);
            }
        } else if (stats.isFile()) {
            if (explist.indexOf(';' + fullname + ';') < 0)
                archive.file(fullname, { name: pathinput + files[i] });
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
        console.log(`Failed to read user config.xml. ${e}`);
        process.exit(0);
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
        process.exit(0);
    }

    let xmlBuilder = new xml2js.Builder({
        attrkey: 'attributes',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    let witsConfigData = xmlBuilder.buildObject(parsedXmlData);

    try {
        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', CONFIG_FILE),
            witsConfigData,
            'utf8'
        );
    } catch (e) {
        console.log(`Failed to write Wits config.xml. ${e}`);
        process.exit(0);
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
                subdomains: 'true',
            },
        },
    ];

    configData[WITS_CONFIG_CONTENT_TAG] = [
        {
            attributes: {
                src: 'index.html',
            },
        },
    ];

    configData[WITS_CONFIG_ICON_TAG] = [
        {
            attributes: {
                src: 'icon.png',
            },
        },
    ];

    if (configData.hasOwnProperty(WITS_CONFIG_PRIVILEGE_TAG)) {
        configData[WITS_CONFIG_PRIVILEGE_TAG].push(
            {
                attributes: {
                    name: FILESYSTEM_READ_PRIVILEGE,
                },
            },
            {
                attributes: {
                    name: FILESYSTEM_WRITE_PRIVILEGE,
                },
            }
        );
    } else {
        configData[WITS_CONFIG_PRIVILEGE_TAG] = [
            {
                attributes: {
                    name: FILESYSTEM_READ_PRIVILEGE,
                },
            },
            {
                attributes: {
                    name: FILESYSTEM_WRITE_PRIVILEGE,
                },
            },
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
            '{{HOST_BASE_CONTENT_PATH}}': userAnswer.baseAppPath,
        };

        let str = data.replace(regExp.HOST_DATA, (key) => {
            return convertData[key];
        });

        fs.writeFileSync(
            path.join(util.WITS_BASE_PATH, '../', 'container', 'js', 'main.js'),
            str,
            'utf8'
        );
        return;
    } catch (e) {
        console.log(`Failed to set Wits baseJS data to file ${e}`);
        process.exit(0);
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
        console.log(`Failed to set Wits baseHtml data to file`);
        process.exit(0);
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
        console.log(
            `[warning] Failed to read config.xml. Set Content src to default.`
        );
    }

    console.log(`content src is : ${contentSrc}`);

    return contentSrc;
}
