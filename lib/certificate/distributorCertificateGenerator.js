var fs = require('fs');
var path = require('path');
var forge = require('node-forge');
var https = require('https');
//var tls = require('tls');
var FormData = require('form-data');
var common = require('./common');
var p12ToPem = require('./p12ToPem');
const Q = require('q');
var ProfilesHandler = require('./profilesHandler');
var crypto = require('crypto');

const rootFilePath = common.extensionRootPath + path.sep + 'resource/SamsungCertificate'.split('/').join(path.sep);
const fetchServerInfo = {
    host: 'dev.tizen.samsung.com',
    port: '443',
    xmlPath: '/apis/v1/distributors',
    crtPath: '/apis/v2/distributors'
};
//const caCertPath = common.extensionRootPath + path.sep + 'resource/ca'.split('/').join(path.sep) + path.sep + 'vd_tizen_dev_author_ca.cer';
//const publicCaPath = common.extensionRootPath + path.sep + 'resource/ca'.split('/').join(path.sep) + path.sep + 'vd_tizen_dev_public2.crt';
//const partnerCaPath = common.extensionRootPath + path.sep + 'resource/ca'.split('/').join(path.sep) + path.sep + 'vd_tizen_dev_partner2.crt';
const publicCaPath = common.extensionCertPath + path.sep + 'samsung-distributor-public.ca';
const partnerCaPath = common.extensionCertPath + path.sep + 'samsung-distributor-partner.ca';
//const profilePath = common.extensionRootPath + path.sep + 'resource' + path.sep + 'profiles.xml';

module.exports = class DistributorCertificateGenerator {
    constructor(props) {
        this.profileName = props.profileInfo;
        this.password = props.certInfo.distributorPassword;
        this.distributorFilePath = rootFilePath + path.sep + this.profileName;
        this.privilegeLevel = props.certInfo.privilegeLevel;
        this.accessInfo = props.accessInfo;
        this.duids = props.certInfo.duidList;

        if (this.privilegeLevel == 'Public') {
            this.caCertPath = publicCaPath;
        }
        else {
            this.caCertPath = partnerCaPath;
        }
        //this.activeFlag = true;
    }

    generate() {
        let deferred = Q.defer();

        this.generateCSR();
        this.fetchCRT('fetch_xml').then(this.fetchCRT.bind(this)).then((message) => {
            this.generatePCKS12();
            //this.registerProfile();
            deferred.resolve('success');
        }).catch((message) => {
            common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, message);
            deferred.resolve(message);
        });

        return deferred.promise;
    }

    generateCSR() {
        // make file path
        common.makeFilePath(this.distributorFilePath);

        // generate key pair
        var keys = forge.pki.rsa.generateKeyPair(2048);

        // generate csr file
        var csr = forge.pki.createCertificationRequest();
        csr.publicKey = keys.publicKey;
        csr.setSubject([{
            name: 'commonName',
            value: 'TizenSDK'
        }, {
            name: 'emailAddress',
            value: this.accessInfo.userEmail
        }]);

        let subjectAltNames = new Array();
        subjectAltNames.push({type:6, value: 'URN:tizen:packageid='});

        if (this.duids.length > 0) {
            this.duids.forEach((duid) => {
                subjectAltNames.push({type:6, value: 'URN:tizen:deviceid='+duid});
            });
        }

        csr.setAttributes([{
            name: 'extensionRequest',
            extensions: [{
                name: 'subjectAltName',
                altNames: subjectAltNames
            }]
        }]);

        // generate .pri file to keep private key
        let privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
        fs.writeFileSync(this.distributorFilePath + path.sep + 'distributor.pri', privateKeyPem);
    
        // generate .csr file
        csr.sign(keys.privateKey);
        var pem = forge.pki.certificationRequestToPem(csr);
        fs.writeFileSync(this.distributorFilePath + path.sep + 'distributor.csr', pem);
    }

    fetchCRT(isCrt) {
        console.log('Action: ' + isCrt);
        let deferred = Q.defer();

        // set form data
        let form = new FormData();
        form.append('access_token', this.accessInfo.accessToken);
        form.append('user_id', this.accessInfo.userId);
        form.append('privilege_level', this.privilegeLevel);
        form.append('developer_type', 'Individual');
        form.append('platform', 'VD');
        form.append('csr', fs.createReadStream(this.distributorFilePath + path.sep + 'distributor.csr', {encoding: 'utf-8'}));

        // config https options
        let httpsOpt = {
            host: fetchServerInfo.host,
            port: fetchServerInfo.port,
            path: '',
            method: 'POST',
            headers: form.getHeaders()
        };

        if (isCrt == 'fetch_crt') {
            httpsOpt.path = fetchServerInfo.crtPath;
        }
        else if (isCrt == 'fetch_xml') {
            httpsOpt.path = fetchServerInfo.xmlPath;
        }

        // post 'multipart/form-data' request
        let request = https.request(httpsOpt);
        form.pipe(request);
        request.on('response', (res) => {
            console.log('status code: ' + res.statusCode);
            console.log('status msg: ' + res.statusMessage);
            
            if (res.statusCode == '200') {
                res.on('data', (chunk) => {
                    //console.log(`BODY: ${chunk}`);
                    console.log('get response success!');
                    if (isCrt == 'fetch_crt') {
                        fs.writeFileSync(this.distributorFilePath + path.sep + 'distributor.crt', chunk);
                        deferred.resolve('fetch_xml');
                    }
                    else if (isCrt == 'fetch_xml') {
                        fs.writeFileSync(this.distributorFilePath + path.sep + 'device-profile.xml', chunk);
                        deferred.resolve('fetch_crt');
                    }
                });
            }
            else {
                res.on('error', (err) => {
                    console.log('problem with request: ' + err.message);
                    deferred.reject(err.message);
                });
            }
        });

        return deferred.promise;
    }

    generatePCKS12() {
        let DistributorCert = this.loadCaCert(this.distributorFilePath + path.sep + 'distributor.crt');
        let caCert = this.loadCaCert(this.caCertPath);

        let certArray = [DistributorCert, caCert];

        let privateKeyPem = fs.readFileSync(this.distributorFilePath + path.sep + 'distributor.pri');
        let privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

        let newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
            privateKey, certArray, this.password,
            {generateLocalKeyId: true, friendlyName: 'UserCertificate'});

        let newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
        fs.writeFileSync(this.distributorFilePath + path.sep + 'distributor.p12', newPkcs12Der, {encoding: 'binary'});
    }

    registerProfile() {
        let profileHandler = new ProfilesHandler();
        let encryptedPassword = p12ToPem.encryptPassword(this.password);
        let distributorProfile = {
            ca: '',
            key: this.distributorFilePath + path.sep + 'distributor.p12',
            password: encryptedPassword
        };

        profileHandler.modifyProfile(this.profileName, distributorProfile, 'distributor') 
    }

    loadCaCert(certFile) {
        let certContent = '';

        if (path.extname(certFile) == '.ca') {
            let key = 'SRCNSDKTEAM2019';
            key = crypto.createHash('sha256').update(key).digest('base64').substr(0, 32);
            
            let inputData = fs.readFileSync(certFile);
            const iv = Buffer.alloc(16, 0);
            let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

            certContent = Buffer.concat([decipher.update(inputData,'hex'), decipher.final()]);
        }
        else {
            certContent = fs.readFileSync(certFile);
        }
        let caContent = certContent.toString('utf8');

        let strBeginCertificate = '-----BEGIN CERTIFICATE-----';
        let strEndCertificate = '-----END CERTIFICATE-----';
        
        let line1Beg  = caContent.indexOf(strBeginCertificate);
        let line1End  = caContent.indexOf(strEndCertificate);

        let strEndLen = strEndCertificate.length;

        var cert1 = caContent.substring(line1Beg, line1End+strEndLen);
        //console.log(caContent);
        return cert1;
    }
}