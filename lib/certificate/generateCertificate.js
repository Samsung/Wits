var forge = require('node-forge');
var fs = require('fs');
var path = require('path');
var logger = require('./logger');
var common = require('./common');
var crypto = require('crypto');

var extensionPath = common.extensionRootPath;
var certPath = common.extensionCertPath;
var authorPath = extensionPath + '/resource/Author'.split('/').join(path.sep);
var caPriKeyPath = certPath + path.sep + 'tizen-author.pri';
var caCertPath = certPath + path.sep + 'tizen-author.ca';

// Module name
var moduleName = 'Generate Certificate';

function createCert(
    keyfileName,
    authorName,
    authorPassword,
    countryInfo,
    stateInfo,
    cityInfo,
    organizationInfo,
    DepartmentInfo,
    EmailInfo
) {
    try {
        // generate a keypair
        logger.info(moduleName, 'Generating 1024-bit key-pair...');
        var keys = forge.pki.rsa.generateKeyPair(1024);
        logger.info(moduleName, 'Key-pair created.');

        // create a certificate
        logger.info(moduleName, 'Creating certificate...');
        var cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();

        var notAfterDate = new Date();
        notAfterDate.setFullYear(cert.validity.notBefore.getFullYear() + 8);
        cert.validity.notAfter = notAfterDate;

        var attrs = [
            {
                name: 'commonName',
                value: authorName,
            },
            {
                name: 'countryName',
                value: countryInfo,
            },
            {
                shortName: 'ST',
                value: stateInfo,
            },
            {
                name: 'localityName',
                value: cityInfo,
            },
            {
                name: 'organizationName',
                value: organizationInfo,
            },
            {
                shortName: 'OU',
                value: DepartmentInfo,
            },
            {
                name: 'emailAddress',
                value: EmailInfo,
            },
        ];

        var issurInfo = [
            {
                name: 'organizationName',
                value: 'Tizen Association',
            },
            {
                shortName: 'OU',
                value: 'Tizen Association',
            },
            {
                shortName: 'CN',
                value: 'Tizen Developers CA',
            },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(issurInfo);

        cert.setExtensions([
            {
                name: 'basicConstraints',
                cA: true,
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true,
            },
            {
                name: 'extKeyUsage',
                codeSigning: true,
            },
        ]);

        //read ca private Key
        logger.info(moduleName, 'Read ca private Key');
        //var caPriPem = fs.readFileSync(caPriKeyPath);
        let key = 'SRCNSDKTEAM2019';
        key = crypto
            .createHash('sha256')
            .update(key)
            .digest('base64')
            .substr(0, 32);

        let inputData = fs.readFileSync(caPriKeyPath);
        const iv = Buffer.alloc(16, 0);
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let caPriPem = Buffer.concat([
            decipher.update(inputData, 'hex'),
            decipher.final(),
        ]);
        var caPassword = 'tizencertificatefordevelopercaroqkfwk';

        var decryptedCaPriKey = forge.pki.decryptRsaPrivateKey(
            caPriPem.toString('utf8'),
            caPassword
        );

        cert.sign(decryptedCaPriKey);
        logger.info(moduleName, 'Certificate created.');

        //var userPriKey = forge.pki.privateKeyToPem(keys.privateKey);
        var userCert = forge.pki.certificateToPem(cert);

        var caCert = loadCaCert();
        var certArray = [userCert, caCert];

        // create PKCS12
        logger.info(moduleName, 'Creating PKCS#12...');
        var newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
            keys.privateKey,
            certArray,
            authorPassword,
            { generateLocalKeyId: true, friendlyName: authorName }
        );

        var newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();

        if (!fs.existsSync(authorPath)) {
            common.makeFilePath(authorPath);
        }
        fs.writeFileSync(
            authorPath + path.sep + keyfileName + '.p12',
            newPkcs12Der,
            { encoding: 'binary' }
        );

        logger.info(
            moduleName,
            authorPath + path.sep + keyfileName + ' created.'
        );
    } catch (ex) {
        if (ex.stack) {
            console.log(ex.stack);
        } else {
            console.log('Error', ex);
        }
    }
}
exports.createCert = createCert;

function loadCaCert() {
    let key = 'SRCNSDKTEAM2019';
    key = crypto
        .createHash('sha256')
        .update(key)
        .digest('base64')
        .substr(0, 32);

    let inputData = fs.readFileSync(caCertPath);
    const iv = Buffer.alloc(16, 0);
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let caCert = Buffer.concat([
        decipher.update(inputData, 'hex'),
        decipher.final(),
    ]);
    let caContent = caCert.toString('utf8');

    let strBeginCertificate = '-----BEGIN CERTIFICATE-----';
    let strEndCertificate = '-----END CERTIFICATE-----';

    let line1Beg = caContent.indexOf(strBeginCertificate);
    let line1End = caContent.indexOf(strEndCertificate);

    let strBeginLen = strBeginCertificate.length;
    let strEndLen = strEndCertificate.length;

    let cert1 = caContent.substring(line1Beg, line1End + strEndLen);
    //console.log(cert1);
    return cert1;
}
exports.loadCaCert = loadCaCert;
