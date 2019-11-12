
let fs = require('fs');
let path = require('path');
let xml2js = require('xml2js');
let ip = require('ip');
let shelljs = require('shelljs');
let mkdirp = require('mkdirp');

const util = require('./util.js');
const REG_EXP = require('./regexp.js');

const CONFIG_FILE = 'config.xml';

module.exports = {
    setHostAppEnv: async (userAnswer,deviceInfo) => {
        await makeHostAppConfigFile(userAnswer.baseAppPath);
        setBaseJSData(userAnswer,deviceInfo);
        setBaseHtmlData(userAnswer);
    },
    getHostAppId: () => {
        try {
            let file = path.resolve(path.join('tizen','config.xml'));
            let data = fs.readFileSync(file,'utf8');
            data = util.clearComment(data);
            let id = data.match(REG_EXP.APPLICATION_ID)[0].replace(REG_EXP.APPLICATION_ID_ATTRIBUTE,'');
            return id;
        }
        catch(e) {
            console.log('Failed to read Wits config.xml.',e);
            process.exit(0);
        }
    },
    buildPackage: (profileInfo) => {
        console.log('\nStart packaging Samsung Tizen TV Platform......');
        const WITS_PACKAGE = 'Wits.wgt';
        try {
            let www = path.resolve(path.join('tizen'));
            let dest = path.resolve(path.join('tizen', 'build'));
            let TEMPORARY_BUILD_DIR = '.buildResult';
            let result = null;

            result = shelljs.exec('tizen version');

            if(result.err) {
                console.log(result.stderr);
                console.log('The command \"tizen\" failed. Make sure you have the latest Tizen SDK installed, and the \"tizen\" command (inside the tools/ide/bin folder) is added to your path.');
                process.exit(0);
            }

            result = shelljs.exec('tizen cli-config "default.profiles.path=' + profileInfo.path + '"');
            if(result.code) {
                console.log('Failed to Bulid'+result.output);
                process.exit(0);
            }
            result = shelljs.exec('tizen build-web -out ' + TEMPORARY_BUILD_DIR + ' -- "' + www + '"');
            if(result.code) {
                console.log('Failed to Bulid'+result.output);
                process.exit(0);
            }
            result = shelljs.exec('tizen package --type wgt --sign ' + profileInfo.name + ' -- ' + path.resolve(path.join(www, TEMPORARY_BUILD_DIR)));

            if(result.code) {
                console.log('Failed to Bulid'+result.output);
                process.exit(0);
            }
            else {
                let packagePath = result.stdout.match(/Package File Location\:\s*(.*)/);
                if(packagePath && packagePath[1]) {
                    mkdirp.sync(dest);
                    console.log('packagePath[1]',packagePath[1]);
                    console.log('dest',dest);
                    shelljs.mv('-f', packagePath[1], path.resolve(dest+ '/' + WITS_PACKAGE));
                    shelljs.rm('-rf', path.resolve(path.join(www, TEMPORARY_BUILD_DIR)));
                    console.log('Package created at ' + path.join(dest, path.basename(packagePath[1])));
                }
                else {
                    console.log('Fail to retrieve Package File Location.');
                    process.exit(0);
                }
            }
        }
        catch(e) {
            console.log('Fail to buildPackage',e);
            process.exit(0);
        }
    }
}

async function makeHostAppConfigFile(baseAppPath) {
    let userConfigData = '';
    try {
        userConfigData = fs.readFileSync(baseAppPath + '/' + CONFIG_FILE, 'utf8');
    }
    catch(e) {
        console.log('Failed to read user config.xml.',e);
        process.exit(0);
    }

    let xmlParser = new xml2js.Parser({attrkey: 'attributes'});

    let parsedXmlData = await new Promise ((resolve,reject) => xmlParser.parseString(userConfigData, function(err, result) {
        resolve(result);
    }));

    if(parsedXmlData && parsedXmlData.widget) {
        setDefaultConfigData(parsedXmlData.widget);
    }
    else {
        console.log('User config.xml is not supported format.');
        process.exit(0);
    }

    let xmlBuilder = new xml2js.Builder({attrkey: 'attributes', xmldec: {'version': '1.0', 'encoding': 'UTF-8'}});

    let witsConfigData = xmlBuilder.buildObject(parsedXmlData);

    try {
        fs.writeFileSync(path.join(__dirname,'../tizen',CONFIG_FILE), witsConfigData, 'utf8');
    }
    catch (e) {
        console.log('Failed to write Wits config.xml.',e);
        process.exit(0);
    }
}

function setDefaultConfigData(configData) {
    const WITS_CONFIG_ACCESS_TAG = 'access';
    const WITS_CONFIG_CONTENT_TAG = 'content';
    const WITS_CONFIG_ICON_TAG = 'icon';
    const WITS_CONFIG_PRIVILEGE_TAG = 'tizen:privilege';
    const FILESYSTEM_READ_PRIVILEGE = 'http://tizen.org/privilege/filesystem.read';
    const FILESYSTEM_WRITE_PRIVILEGE = 'http://tizen.org/privilege/filesystem.write';

    configData[WITS_CONFIG_ACCESS_TAG] = [{
        attributes: {
            origin: '*',
            subdomains: 'true'
        }
    }];

    configData[WITS_CONFIG_CONTENT_TAG] = [{
        attributes: {
            src: 'index.html'
        }
    }];

    configData[WITS_CONFIG_ICON_TAG] = [{
        attributes: {
            src: 'icon.png'
        }
    }];

    if(configData.hasOwnProperty(WITS_CONFIG_PRIVILEGE_TAG)) {
        configData[WITS_CONFIG_PRIVILEGE_TAG].push({
            attributes: {
                name: FILESYSTEM_READ_PRIVILEGE
            }
        },{
            attributes: {
                name: FILESYSTEM_WRITE_PRIVILEGE
            }
        });
    }
    else {
        configData[WITS_CONFIG_PRIVILEGE_TAG] = [{
            attributes: {
                name: FILESYSTEM_READ_PRIVILEGE
            }
        },{
            attributes: {
                name: FILESYSTEM_WRITE_PRIVILEGE
            }
        }];
    }
}

function setBaseJSData(userAnswer,deviceInfo) {
    try {
        let file = path.resolve(path.join('tizen','js','base.js'));
        let data = fs.readFileSync(file,'utf8');
        let contentSrc = getContentSrc(userAnswer.baseAppPath);
        let hostAppId = module.exports.getHostAppId();
        let hostAppName = hostAppId.split('.')[1];
        let hostAppPath = deviceInfo.appInstallPath + hostAppName;
        let contentFullSrc = util.isRemoteUrl(contentSrc)? contentSrc : (hostAppPath + '/' + contentSrc.replace(REG_EXP.FISRT_BACKSLASH,''));
        let convertData = {
            '{{CONTENT_PATH}}': hostAppPath,
            '{{CONTENT_SRC}}': contentFullSrc,
            '{{HOST_IP}}': 'http://'+ip.address(),
            '{{HOST_PORT}}': userAnswer.socketPort,
            '{{HOST_BASE_CONTENT_PATH}}': userAnswer.baseAppPath
        };

        let str = data.replace(REG_EXP.HOST_DATA, (key) => {
            return convertData[key];
        });

        fs.writeFileSync(path.join('tizen','js','main.js'), str, 'utf8');
    }
    catch(e) {
        console.log('Failed to set Wits baseJS data to file',e);
        process.exit(0);
    }
}

function setBaseHtmlData(userAnswer) {
    try {
        let file = path.resolve(path.join('tizen','base.html'));
        let data = fs.readFileSync(file,'utf8');

        let str = data.replace(REG_EXP.HOST_WIDTH,userAnswer.hostWidth);

        fs.writeFileSync(path.join('tizen','index.html'), str, 'utf8');
    }
    catch(e) {
        console.log('Failed to set Wits baseHtml data to file');
        process.exit(0);
    }
}

function getContentSrc(baseAppPath) {
    let contentSrc = 'index.html';

    try {
        let file = path.resolve(path.join(baseAppPath,'config.xml'));
        let data = fs.readFileSync(file,'utf8');
        data = util.clearComment(data);
        contentSrc = data.match(REG_EXP.CONTENT_SRC)[0].replace(REG_EXP.CONTENT_SRC_ATTRIBUTE,'');
    }
    catch(e) {
        console.log('[warning] Failed to read config.xml. Set Content src to default.');
    }

    console.log('content src is : ' + contentSrc);

    return contentSrc;
}
