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
const crtServerInfo = {
    host: 'dev.tizen.samsung.com',
    port: '443',
    path: '/apis/v2/authors'
};
//const caCertPath = common.extensionRootPath + path.sep + 'resource/ca'.split('/').join(path.sep) + path.sep + 'vd_tizen_dev_author_ca.cer';
const caCertPath = common.extensionCertPath + path.sep + 'samsung-author.ca';
//const profilePath = common.extensionRootPath + path.sep + 'resource' + path.sep + 'profiles.xml';

module.exports = class AuthorCertificateGenerator {
    constructor(props) {
        this.profileName = props.profileInfo;
        this.authorName = props.certInfo.authorName;
        this.password = props.certInfo.authorPassword;
        this.optionInfo = {
            country: props.certInfo.authorCountry,
            state: props.certInfo.authorState,
            city: props.certInfo.authorCity,
            organization: props.certInfo.authorOrganization,
            department: props.certInfo.authorDepartment
        }
        this.accessInfo = props.accessInfo;
        this.authorFilePath = rootFilePath + path.sep + this.profileName;

        this.activeFlag = true;
    }

    generate() {
        let deferred = Q.defer();

        this.generateCSR();
        this.fetchCRT().then((message) => {
            if (message == 'success') {
                this.generatePCKS12();
                //this.registerProfile();
            }
            else {
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, message);
            }

            deferred.resolve(message);
        });

        return deferred.promise;
    }

    generateCSR() {
        // make file path
        common.makeFilePath(this.authorFilePath);

        // generate key pair
        var keys = forge.pki.rsa.generateKeyPair(2048);

        // generate csr file
        var csr = forge.pki.createCertificationRequest();
        csr.publicKey = keys.publicKey;
        csr.setSubject([{
            name: 'commonName',
            value: this.authorName
        }, {
            shortName: 'OU',
            value: this.optionInfo.department
        }, {
            name: 'organizationName',
            value: this.optionInfo.organization
        }, {
            name: 'localityName',
            value: this.optionInfo.city
        }, {
            shortName: 'ST',
            value: this.optionInfo.state
        }, {
            name: 'countryName',
            value: this.optionInfo.country
        }]);

        // generate .pri file to keep private key
        //var salt = forge.random.getBytesSync(128);
        //var derivedKey = forge.pkcs5.pbkdf2(this.password, salt, 20, 16);
        let privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
        fs.writeFileSync(this.authorFilePath + path.sep + 'author.pri', privateKeyPem);
    
        // generate .csr file
        csr.sign(keys.privateKey);
        var pem = forge.pki.certificationRequestToPem(csr);
        fs.writeFileSync(this.authorFilePath + path.sep + 'author.csr', pem);
    }

    fetchCRT() {
        let deferred = Q.defer();

        // set form data
        let form = new FormData();
        form.append('access_token', this.accessInfo.accessToken);
        form.append('user_id', this.accessInfo.userId);
        form.append('platform', 'VD');
        form.append('csr', fs.createReadStream(this.authorFilePath + path.sep + 'author.csr', {encoding: 'utf-8'}));

        // config https options
        let httpsOpt = {
            host: crtServerInfo.host,
            port: crtServerInfo.port,
            path: crtServerInfo.path,
            method: 'POST',
            headers: form.getHeaders()
        };

        // post 'multipart/form-data' request
        let request = https.request(httpsOpt);
        form.pipe(request);
        request.on('response', (res) => {
            console.log('status code: ' + res.statusCode);
            console.log('status msg: ' + res.statusMessage);

            if (res.statusCode == '200') {
                res.on('data', (chunk) => {
                    console.log('get response success!');
                    fs.writeFileSync(this.authorFilePath + path.sep + 'author.crt', chunk);
                    deferred.resolve('success');
                });
            }
            else {
                res.on('error', (err) => {
                    deferred.resolve(err.message);
                });
            }
        });

        return deferred.promise;
    }

    generatePCKS12() {
        let authorCert = this.loadCaCert(this.authorFilePath + path.sep + 'author.crt');
        let caCert = this.loadCaCert(caCertPath);
        let certArray = [authorCert, caCert];

        let privateKeyPem = fs.readFileSync(this.authorFilePath + path.sep + 'author.pri');
        let privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

        let newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
            privateKey, certArray, this.password,
            {generateLocalKeyId: true, friendlyName: 'UserCertificate'});

        let newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
        fs.writeFileSync(this.authorFilePath + path.sep + 'author.p12', newPkcs12Der, {encoding: 'binary'});
    }

    registerProfile() {
        let profileHandler = new ProfilesHandler();
        let encryptedPassword = p12ToPem.encryptPassword(this.password);
        let authorProfile = {
            ca: '',
            key: this.authorFilePath + path.sep + 'author.p12',
            password: encryptedPassword
        };

        // Remove profile if it already exist. (For select profile case)
        profileHandler.removeProfile(this.profileName);
        profileHandler.addNewProfile(this.profileName, authorProfile);
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
        return cert1;
    }
}