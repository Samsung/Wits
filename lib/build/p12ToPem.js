/**
 * Code from SRC-Nanjing
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const forge = require('node-forge');

const util = require('../util');
const cryptUtil = require('./cryptUtil');

const parseString = require('xml2js').parseString;

const witsPath = path.join(util.WITS_BASE_PATH, '../', 'container');

const certificatesPath = path.join(
    witsPath,
    '/.resource/certificate-generator/certificates/'
);

const ACTIVE_PEM_FILE = {
    AUTHOR_KEY_FILE: path.join(
        certificatesPath,
        'developer/active_cert/tizen_developer_private_key.pem'
    ),
    AUTHOR_CERT_FILE: path.join(
        certificatesPath + 'developer/active_cert/tizen_developer_cert.pem'
    ),
    DISTRIBUTOR_KEY_FILE: path.join(
        certificatesPath +
            'distributor/active_cert/tizen_distributor_private_key.pem'
    ),
    DISTRIBUTOR_CERT_FILE: path.join(
        certificatesPath + 'distributor/active_cert/tizen_distributor_cert.pem'
    ),
    DISTRIBUTOR2_KEY_FILE: path.join(
        certificatesPath +
            'distributor/active_cert/tizen_distributor2_private_key.pem'
    ),
    DISTRIBUTOR2_CERT_FILE: path.join(
        certificatesPath + 'distributor/active_cert/tizen_distributor2_cert.pem'
    )
};
exports.ACTIVE_PEM_FILE = ACTIVE_PEM_FILE;

let activeProfile = '';
let authorFile = '';
let distributorFile = '';
let authorPassword = '';
let distributorPassword = '';
let distributorFile2 = '';
let distributorPassword2 = '';

/**
 * Extract the private key from a PKCS12 file.
 * @param  {Buffer|String(Base64-encoded)} p12Buffer
 *         The PKCS12 file as a buffer or base-64 encoded string.
 * @param  {String} password  The password for the PKCS12 file.
 * @param  {String} type  The type of PKCS12 file ,developer or distributor.
 * @param  {String} keyfile  The pem key file path.
 * @param  {String} certfile The pem cert file path.
 */
function p12ToPem(p12Buffer, password, type, keyfile, certfile) {
    var entry = parseCertificate(p12Buffer, password);
    if (!entry) {
        console.error('Parse Certififate failed');
        throw 'Parse Certififate failed';
    }

    //Write map content to file
    if (entry.privateKey) {
        var privateKeyP12Pem = forge.pki.privateKeyToPem(entry.privateKey);

        //console.log('\nPrivate Key:');
        //console.log(privateKeyP12Pem);
        createDir(path.join(certificatesPath + type, 'active_cert'));
        fs.writeFileSync(keyfile, privateKeyP12Pem, 'utf8');
        // console.log('Converted pem private key file is in ' + keyfile);
    } else {
        console.log('');
    }

    //console.log('certChain.length:'+entry.certChain.length);

    var certChainData = '';

    if (entry.certChain.length > 0) {
        var certChain = entry.certChain;
        for (var i = 0; i < certChain.length; ++i) {
            var certP12Pem = forge.pki.certificateToPem(certChain[i]);

            certChainData = certChainData + certP12Pem;
        }
    }

    //console.log('\nCert Content:');
    //console.log(certChainData);
    createDir(path.join(certificatesPath + type, 'active_cert'));
    fs.writeFileSync(certfile, certChainData, 'utf8');
    // console.log('Converted pem cert file is in ' + certfile);
}

function parseCertificate(p12Buffer, password) {
    // console.log('Start Parse Certificate');
    var p12Der = p12Buffer.toString();
    var pkcs12Asn1;
    var pkcs12;
    try {
        pkcs12Asn1 = forge.asn1.fromDer(p12Der);
        pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, password || '');
    } catch (ex) {
        //For case p12 author cert created by Tizen Studio
        var p12Base64 = p12Buffer.toString('base64');
        p12Der = forge.util.decode64(p12Base64);
        try {
            pkcs12Asn1 = forge.asn1.fromDer(p12Der);
            pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, password || '');
        } catch (e) {
            console.error(
                'Parse certificate failed, the password may not match the certificate'
            );
            console.error(ex.message);
            throw e;
        }
    }

    // load keypair and cert chain from safe content(s) and map to key ID
    var map = {};
    for (var sci = 0; sci < pkcs12.safeContents.length; ++sci) {
        var safeContents = pkcs12.safeContents[sci];

        var localKeyId = null;
        for (var sbi = 0; sbi < safeContents.safeBags.length; ++sbi) {
            var safeBag = safeContents.safeBags[sbi];
            if (safeBag.attributes.localKeyId) {
                localKeyId = forge.util.bytesToHex(
                    safeBag.attributes.localKeyId[0]
                );
                if (!(localKeyId in map)) {
                    map[localKeyId] = {
                        privateKey: null,
                        certChain: []
                    };
                }
            }

            // this bag has a private key
            if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                map[localKeyId].privateKey = safeBag.key;
            } else if (safeBag.type === forge.pki.oids.certBag) {
                // this bag has a certificate
                map[localKeyId].certChain.push(safeBag.cert);
            }
        }
    }

    var entry;
    //Get cert attributes
    for (var localKeyId in map) {
        entry = map[localKeyId];
    }

    return entry;
}

function getCertificateInfo(certPath, password) {
    var afterYear = '';
    var issuerName = '';

    if (fs.existsSync(certPath)) {
        var p12Buffer = fs.readFileSync(certPath);
        var decodePass = cryptUtil.decryptPassword(password);

        var entry = parseCertificate(p12Buffer, decodePass);
        if (!entry) {
            console.error('Parse Certififate failed');
            throw 'Parse Certififate failed';
        }
        var certChain = entry.certChain;
        certChain = certChain.slice(0);
        var certs = certChain.slice(0);

        var parsecert = certChain.shift();

        //console.log('cert.validity.notBefore :'+parsecert.validity.notBefore);
        //var beforeDate = parsecert.validity.notBefore;
        var afterDate = parsecert.validity.notAfter;

        afterYear = afterDate.toString();
        afterYear = afterYear.substring(3, 15);

        issuerName = '';
        for (var j = 0; j < parsecert.issuer.attributes.length; j++) {
            var name = parsecert.issuer.attributes[j].name;
            var value = parsecert.issuer.attributes[j].value;
            if (name == 'commonName') {
                issuerName = value;
                break;
            }
        }
    } else {
        var noCert = certPath + " is not exist ,can't get the certificate info";
        console.log(noCert);
        throw noCert;
    }

    return { afterYear, issuerName };
}

exports.getCertificateInfo = getCertificateInfo;

// load and parse profiles.xml
function loadProfile(profilePath) {
    console.log('================ Load Profile\n');

    var profileFlag = false;
    authorFile = '';
    distributorFile = '';
    activeProfile = '';
    authorPassword = '';
    distributorPassword = '';
    distributorFile2 = '';
    distributorPassword2 = '';

    authorCa = '';
    distributorCa = '';
    distributorCa2 = '';

    isSamsungCertificate = false;
    certificateFilePath = '';

    if (fs.existsSync(profilePath)) {
        console.log(`Profile file path is "${profilePath}"`);
        var data = fs.readFileSync(profilePath, 'utf-8');

        //parse profiles.xml file to get author and distributor p12 certificate file
        parseString(data, { explicitArray: false }, function (err, result) {
            var jsonData = JSON.stringify(result);
            var jsonArray = JSON.parse(jsonData);
            activeProfile = jsonArray.profiles.$.active;

            if (typeof activeProfile != 'undefined') {
                console.log(`Active profile name is "${activeProfile}"`);
                var profiles = jsonArray.profiles.profile;
                var profileItems;
                if (profiles && !profiles.length) {
                    //For only one profile case
                    profileItems = profiles.profileitem;
                } else if (profiles && profiles.length) {
                    //For multiple profile case

                    for (var i = 0; i < profiles.length; i++) {
                        var name = profiles[i].$.name;
                        if (activeProfile == name) {
                            profileItems = profiles[i].profileitem;
                        }
                    }
                }

                if (
                    typeof profileItems != 'undefined' &&
                    profileItems.length > 2
                ) {
                    // console.log('Find active profile:' + activeProfile);

                    var tmpAuthorFile = __dirname + profileItems[0].$.key;
                    if (
                        !fs.existsSync(profileItems[0].$.key) &&
                        profileItems[0].$.key.length > 0 &&
                        fs.existsSync(tmpAuthorFile)
                    ) {
                        authorFile = tmpAuthorFile;
                    } else {
                        authorFile = profileItems[0].$.key;
                    }

                    var tmpDistributorFile = __dirname + profileItems[1].$.key;
                    if (
                        !fs.existsSync(profileItems[1].$.key) &&
                        profileItems[1].$.key.length > 0 &&
                        fs.existsSync(tmpDistributorFile)
                    ) {
                        distributorFile = tmpDistributorFile;
                    } else {
                        distributorFile = profileItems[1].$.key;
                    }

                    var tmpDistributorFile2 = __dirname + profileItems[2].$.key;
                    if (fs.existsSync(profileItems[2].$.key)) {
                        distributorFile2 = profileItems[2].$.key;
                    } else if (
                        profileItems[2].$.key.length > 0 &&
                        fs.existsSync(tmpDistributorFile2)
                    ) {
                        distributorFile2 = tmpDistributorFile2;
                    }
                    authorPassword = profileItems[0].$.password;
                    distributorPassword = profileItems[1].$.password;

                    distributorPassword2 = profileItems[2].$.password;
                    if (
                        fs.existsSync(authorFile) &&
                        fs.existsSync(distributorFile)
                    ) {
                        // console.log('Developer p12 File: ' + authorFile);
                        // console.log('Distributor p12 File: ' + distributorFile);
                        profileFlag = true;
                    }
                }
            }
        });
    }

    return profileFlag;
}
exports.loadProfile = loadProfile;

function getDistributorFile2() {
    return distributorFile2;
}
exports.getDistributorFile2 = getDistributorFile2;

// Handle 'Create Web Project' commands
function checkActiveProfile(profilePath) {
    console.log('================ Check Active Profile');

    var flag = loadProfile(profilePath);
    if (flag) {
        var authorP12Buffer = fs.readFileSync(authorFile);
        var distributorP12Buffer = fs.readFileSync(distributorFile);

        var decodedAuthorPass = cryptUtil.decryptPassword(authorPassword);
        var decodedDistributorPass = cryptUtil.decryptPassword(
            distributorPassword
        );

        p12ToPem(
            authorP12Buffer,
            decodedAuthorPass,
            'developer',
            ACTIVE_PEM_FILE.AUTHOR_KEY_FILE,
            ACTIVE_PEM_FILE.AUTHOR_CERT_FILE
        );
        p12ToPem(
            distributorP12Buffer,
            decodedDistributorPass,
            'distributor',
            ACTIVE_PEM_FILE.DISTRIBUTOR_KEY_FILE,
            ACTIVE_PEM_FILE.DISTRIBUTOR_CERT_FILE
        );

        console.log(distributorFile2);
        if (fs.existsSync(distributorFile2)) {
            var distributorP12Buffer2 = fs.readFileSync(distributorFile2);
            var decodeDistributor2Pass = cryptUtil.decryptPassword(
                distributorPassword2
            );
            p12ToPem(
                distributorP12Buffer2,
                decodeDistributor2Pass,
                'distributor',
                ACTIVE_PEM_FILE.DISTRIBUTOR2_KEY_FILE,
                ACTIVE_PEM_FILE.DISTRIBUTOR2_CERT_FILE
            );
        }
    } else {
        var warningMsg =
            'No Active certificate profile for building the package on ' +
            process.platform +
            ', you can create new profile or set active by Certificate Manager';
        console.log(warningMsg);
        throw warningMsg;
    }
}
exports.checkActiveProfile = checkActiveProfile;

function createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        // console.log('Create dir path:' + dirPath);
        try {
            mkdirp.sync(dirPath);
        } catch (ex) {
            console.debug(ex.message);
            throw ex;
        }
    } else {
        //console.log(moduleName, dirPath+' is exist');
    }
}
exports.createDir = createDir;
