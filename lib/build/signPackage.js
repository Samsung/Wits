/**
 * Code from SRC-Nanjing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const p12ToPem = require('./p12ToPem');
const util = require('../util.js');

// 3rd packager tool, enter into  'xml-crypto' to support xml signature
const Dom = require('xmldom').DOMParser;
const ExclusiveCanonicalization = require('./exclusive-canonicalization')
    .ExclusiveCanonicalization;

// Generated personal/public signature file
const AUTOR_SIGNATURE = path.join(util.WITS_BASE_PATH, '../', 'container', 'author-signature.xml');
const PUBLIC_SIGNATURE = path.join(util.WITS_BASE_PATH, '../', 'container', 'signature1.xml');
const PUBLIC_SIGNATURE2 = path.join(util.WITS_BASE_PATH, '../', 'container', 'signature2.xml');

//get the filename(contain relative filepath) in test app in workspace
const workspacePath = path.join(util.WITS_BASE_PATH, '../', 'container');
let digestURI = [];
let explist = '';

/**
 * Hash algorithm implementation
 * use "sha256" algorithm
 *
 * @param content xxx
 * @return res xxx
 */
function getHash(content) {
    var shasum = crypto.createHash('sha256');
    shasum.update(content, 'utf8');
    var res = shasum.digest('base64');
    return res;
}
function getDigestAlgorithmName() {
    return 'http://www.w3.org/2001/04/xmlenc#sha256';
}

function getSignInfoAlgorithmName() {
    return 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
}

function getCanonicalizationAlgorithms() {
    return 'http://www.w3.org/2001/10/xml-exc-c14n#';
}

var CanonicalizationAlgorithms = {
    'http://www.w3.org/2001/10/xml-exc-c14n#': ExclusiveCanonicalization,
};

function findCanonicalizationAlgorithm(name) {
    var algo = CanonicalizationAlgorithms[name];
    if (algo) {
        return new algo();
    } else {
        throw new Error(
            "canonicalization algorithm '" + name + "' is not supported"
        );
    }
}

var defaultNsForPrefix = {
    ds: 'http://www.w3.org/2000/09/xmldsig#',
};

function getCanonXml(CanAlgo, node, options) {
    options = options || {};
    options.defaultNsForPrefix =
        options.defaultNsForPrefix || defaultNsForPrefix;

    var transform = findCanonicalizationAlgorithm(CanAlgo);
    var canonizedSignedInfo = transform.process(node, options);
    return canonizedSignedInfo;
}

/**
 * Signature algorithm implementation
 * Sign the given string using the given key
 * use "RSA-SHA256" algorithm
 *
 * @param signedInfo xxx
 * @param signingKey xxx
 * @return res xxx
 */
function getSignature(signedInfo, signingKey) {
    var signer = crypto.createSign('RSA-SHA256');
    signer.update(signedInfo);
    var res = signer.sign(signingKey, 'base64');
    return res;
}

function findReferenceURI(filepath) {
    var files = fs.readdirSync(filepath);
    //fs.writeFileSync(workspacePath + path.sep + "../createReferences.txt", files);
    // It does noy support forEach
    for (var i = files.length - 1; i >= 0; i--) {
        if (files[i].indexOf('.') == 0) {
            //startWith is not support in the file, indexOf == 0 is equal to startWith
            files.splice(i, 1);
            continue;
        }
        var fullname = path.join(filepath, files[i]);
        var stats = fs.statSync(fullname);
        if (stats.isDirectory()) {
            fullname += path.sep;
            if (explist.indexOf(';' + fullname + ';') >= 0) {
                continue;
            }
            findReferenceURI(fullname);
        } else if (stats.isFile()) {
            if (explist.indexOf(';' + fullname + ';') < 0)
                digestURI.push(fullname);
        }
    }
}

/**
 * Generate the Reference nodes (as part of the signature process)
 *
 * @param target xxx
 * @return reference xxx
 */
function createReferences(target) {
    //clear the array
    digestURI = [];

    var files = fs.readdirSync(workspacePath);

    // It does not support "forEach", it can use "for"
    //Filter the file which the first word of name is "."
    for (var i = files.length - 1; i >= 0; i--) {
        if (files[i].indexOf('.') == 0) {
            //startWith is not support in the file, indexOf == 0 is equal to startWith
            files.splice(i, 1);
            continue;
        }
        if (files[i] == 'signature1.xml') continue;
        if (files[i] == 'buildExceptionPath.conf') continue;
        var fullname = path.join(workspacePath, files[i]);
        var stats = fs.statSync(fullname);
        if (stats.isDirectory()) {
            fullname += path.sep;
            if (explist.indexOf(';' + fullname + ';') >= 0) {
                continue;
            }
            findReferenceURI(fullname);
        } else if (stats.isFile()) {
            if (explist.indexOf(';' + fullname + ';') < 0)
                digestURI.push(fullname);
        }
    }

    //Sort order
    digestURI.sort(); //from URI to get content in files

    // add reference characters that contains content in test app
    var reference = '';
    for (var i = 0; i < digestURI.length; i++) {
        var leng = digestURI[i].indexOf(workspacePath); // leng = 0
        var digestId = digestURI[i].substring(leng + workspacePath.length + 1); // "1" is to "\\"
        digestId = digestId.replace(/\\/g, '/'); // '\' change into '/'
        //digestId = encodeURI(digestId); //URI encode
        digestId = encodeURIComponent(digestId); //URI encode

        var digestAlgorithm = getDigestAlgorithmName();

        var content = fs.readFileSync(digestURI[i]);
        var digestValue = getHash(content);

        reference = reference + '<Reference URI=\"' + digestId + '\">\n' +
			 '<DigestMethod Algorithm=\"' + digestAlgorithm + '\"></DigestMethod>\n' +
			 '<DigestValue>' + digestValue + '</DigestValue>\n</Reference>\n';
    }

    // add reference characters that contains Object, which Id is "#prop"
    var objId = 'prop';
    var objdigestValue;
    var objtransformAlgorithm = 'http://www.w3.org/2006/12/xml-c14n11';
    var objdigestAlgorithm = 'http://www.w3.org/2001/04/xmlenc#sha256';
    var objdigestValue_author = 'lpo8tUDs054eLlBQXiDPVDVKfw30ZZdtkRs1jd7H5K8=';
    var objdigestValue_distributor =
        'u/jU3U4Zm5ihTMSjKGlGYbWzDfRkGphPPHx3gJIYEJ4=';

    if (target == 'AuthorSignature') {
        objdigestValue = objdigestValue_author;
    } else if (target == 'DistributorSignature') {
        objdigestValue = objdigestValue_distributor;
    }
    reference = reference + '<Reference URI=\"#' + objId + '\">\n'+
				 '<Transforms>\n<Transform Algorithm=\"' + objtransformAlgorithm +'\"></Transform>\n</Transforms>\n'+
				 '<DigestMethod Algorithm=\"' + objdigestAlgorithm + '\"></DigestMethod>\n'+
				 '<DigestValue>' + objdigestValue + '</DigestValue>\n</Reference>\n';

    return reference;
}

/**
 * Create the SignedInfo element
 *
 * @param target xxx
 * @param canonicalizationAlgorithm xxx
 * @param signatureAlgorithm xxx
 * @param prefix xxx
 * @return res xxx
 */
function createSignInfo(
    target,
    canonicalizationAlgorithm,
    signatureAlgorithm,
    prefix
) {
    var currentPrefix;

    currentPrefix = prefix || '';
    currentPrefix = currentPrefix ? currentPrefix + ':' : currentPrefix;
    var res = '';
    res += '<' + currentPrefix + 'SignedInfo>\n';
    res += '<' + currentPrefix + 'CanonicalizationMethod Algorithm=\"' + canonicalizationAlgorithm + '\"></CanonicalizationMethod>\n' +
	      '<' + currentPrefix + 'SignatureMethod Algorithm=\"' + signatureAlgorithm + '\"></SignatureMethod>\n';

    res += createReferences(target);
    res += '</' + currentPrefix + 'SignedInfo>\n';

    return res;
}

/**
 * Create the KeyInfo element
 * Get certificate from certification file
 *
 * @param target xxx
 * @param destfile xxx
 * @return res xxx
 */

function createKeyInfo(target, destfile) {
    var res = '';
    var currentPrefix = '';

    //strCert is a buffer, not a string
    if (target == 'AuthorSignature') {
        if (fs.existsSync(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_CERT_FILE)) {
            var strCert = fs.readFileSync(
                p12ToPem.ACTIVE_PEM_FILE.AUTHOR_CERT_FILE
            );
        }
    } else if (target == 'DistributorSignature') {
        var distributorCertFile =
            p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_CERT_FILE;
        if (destfile.indexOf('signature2') >= 0) {
            distributorCertFile =
                p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_CERT_FILE;
        }
        if (fs.existsSync(distributorCertFile)) {
            var strCert = fs.readFileSync(distributorCertFile);
        }
    }

    if (typeof strCert == 'undefined') {
        var noStrCert =
            "There's no certificate file in resource, please check!";
        console.error(noStrCert);
        return;
    }

    strCert = strCert.toString();

    var strBeginCertificate = '-----BEGIN CERTIFICATE-----';
    var strEndCertificate = '-----END CERTIFICATE-----';

    var line1Beg = strCert.indexOf(strBeginCertificate);
    var line1End = strCert.indexOf(strEndCertificate);

    var line2Beg = strCert.lastIndexOf(strBeginCertificate);
    var line2End = strCert.lastIndexOf(strEndCertificate);

    var strBeginLen = strBeginCertificate.length;
    //var strEndLen = strEndCertificate.length;

    var cert1 = strCert.substring((line1Beg + strBeginLen + 1), line1End);
    var cert2 = strCert.substring((line2Beg + strBeginLen + 1), line2End);

    if (target == 'DistributorSignature') {
        cert1 = cert1.replace(/\r\n/g, '\n');
        cert2 = cert2.replace(/\r\n/g, '\n');
    }

    res += '<' + currentPrefix + 'KeyInfo>';
    res += '<X509Data>\n<X509Certificate>';
    res += cert1;
    res += '</X509Certificate>\n<X509Certificate>';
    res += cert2;
    res += '</X509Certificate>\n</X509Data>\n';
    res += '</' + currentPrefix + 'KeyInfo>\n';

    return res;
}

/**
 * Create the Object element
 *
 * @param target xxx
 * @return objstr xxx
 */
function createObject(target) {
    var role = '';
    if (target == 'AuthorSignature') {
        role = 'author';
    } else if (target == 'DistributorSignature') {
        role = 'distributor';
    }

    var objstr = '<Object Id=\"prop\">'+
		 '<SignatureProperties xmlns:dsp=\"http://www.w3.org/2009/xmldsig-properties\">'+
		 '<SignatureProperty Id=\"profile\" Target=\"#' + target + '\">'+
		 '<dsp:Profile URI=\"http://www.w3.org/ns/widgets-digsig#profile\"></dsp:Profile></SignatureProperty>'+
		 '<SignatureProperty Id=\"role\" Target=\"#' + target + '\">'+
		 '<dsp:Role URI=\"http://www.w3.org/ns/widgets-digsig#role-' + role +'\"></dsp:Role></SignatureProperty>'+
		 '<SignatureProperty Id=\"identifier\" Target=\"#' + target + '\">'+
		 '<dsp:Identifier></dsp:Identifier></SignatureProperty>'+
         '</SignatureProperties></Object>';
         
    return objstr;
}

/**
 * Create the all Signature element
 *
 * @param signatureId xxx
 * @param destfile xxx
 */
function createSignatureXML(signatureId, destfile) {
    try {
        var canAlgo = getCanonicalizationAlgorithms();
        var signAlgo = getSignInfoAlgorithmName();
        var signInfo = createSignInfo(signatureId, canAlgo, signAlgo);

        //get SignatureValue
        //1. canonicalization
        //2. sign + *.pem
        var xmlNsAttr = 'xmlns';
        var dummySignatureWrapper = '<Signature ' + xmlNsAttr + '=\"http://www.w3.org/2000/09/xmldsig#\">' + signInfo + '\n</Signature>';
        var xml = new Dom().parseFromString(dummySignatureWrapper);
        var node = xml.documentElement.firstChild;
        var canonedXMl = getCanonXml(canAlgo, node);

        if (signatureId === 'AuthorSignature') {
            console.log(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE);
            if (fs.existsSync(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE)) {
                var privateKey = fs.readFileSync(
                    p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE
                );
            }
        } else if (signatureId === 'DistributorSignature') {
            var distributorKeyFile = p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_KEY_FILE;
            if (destfile.indexOf('signature2') >= 0) {
                distributorKeyFile = p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_KEY_FILE;
            }
            if (fs.existsSync(distributorKeyFile)) {
                var privateKey = fs.readFileSync(distributorKeyFile);
            }
        }

        if (typeof privateKey === 'undefined') {
            var noPrivateKey =
                "There's no private key file in resource, please check!";
            console.error(noPrivateKey);
            return;
        }

        var SignatureValue = getSignature(canonedXMl, privateKey);

        //get all signature xml
        var res = '<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\" Id=\"' + signatureId + '\">\n';
        res += signInfo;
        res += '<SignatureValue>' + SignatureValue + '</SignatureValue>';
        res += createKeyInfo(signatureId, destfile);
        res += createObject(signatureId);
        res += '\n</Signature>';

        fs.writeFileSync(destfile, res);
    } catch(e) {
        console.log(`Failed to createSignatureXML ${e}`);
    }
}

function signPackage(profilePath) {
    console.log('============================== Signature Package start!');
    p12ToPem.checkActiveProfile(profilePath);

    createSignatureXML('AuthorSignature', AUTOR_SIGNATURE);
    createSignatureXML('DistributorSignature', PUBLIC_SIGNATURE);

    if (fs.existsSync(p12ToPem.getDistributorFile2())) {
        createSignatureXML('DistributorSignature', PUBLIC_SIGNATURE2);
    }

    console.log('Generated author-signature.xml and signature1.xml');
    console.log('============================== Signature Package completed!');
    console.log('');
}

exports.signPackage = signPackage;
