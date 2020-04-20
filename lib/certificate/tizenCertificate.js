var tizenCertificate = (function(){
	// Imports
	var fs = require('fs');
	var path = require('path');
	var common = require('./common');
	var logger = require('./logger');
	var p12ToPem = require('./p12ToPem');
	var parseString = require('xml2js').parseString;
	const { dialog } = require('electron').remote;
	var generateCertificate = require('./generateCertificate');
	var tizenCertificateViewControl = require('./tizenCertificateViewControl');

	//Certificate Resources
	var extensionPath = common.extensionRootPath;
	var certPath = common.extensionCertPath;
	var developerCA = certPath + path.sep + 'tizen-author.ca';
	var distributorPublicCA = certPath + path.sep + 'tizen-distributor-public.ca';
	var distributorPublicSigner = certPath + path.sep + 'tizen-distributor-public-signer.p12';
	var distributorPartnerCA = certPath + path.sep + 'tizen-distributor-partner.ca';
	var distributorPartnerSigner = certPath + path.sep + 'tizen-distributor-partner-signer.p12';
	var distributorSignerPassword = 'tizenpkcs12passfordsigner';
	var ResourcePath = extensionPath + '/resource'.split('/').join(path.sep);
	var AuthorPath = ResourcePath + '/Author'.split('/').join(path.sep);
	var profilePath = ResourcePath + '/profiles.xml'.split('/').join(path.sep);

	// Module name
	var moduleName = 'Tizen Certificate';

    var activeFlag = false ; // To distinguish whether set the new profile as active

	var registerProfile = function(profileName, authorCA, authorCertPath, authorPassword, distributorCA, distributorCertPath, distributorPassword){
		logger.info(moduleName, 'Register certificate to profile: ' + profilePath);
		var encryptedAuthorPassword = p12ToPem.encryptPassword(authorPassword);
		var encryptedDistributorPassword = p12ToPem.encryptPassword(distributorPassword);

		var profilePrefix = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'+
			'<profiles active=\"'+ profileName + '\" version="3.1">\n';

		var profileItem = '<profile name=\"'+ profileName + '\">\n' +
			'<profileitem ca=\"'+ authorCA +'\" distributor="0" key=\"' + authorCertPath + '\" password=\"' + encryptedAuthorPassword + '\" rootca=""/>\n' +
			'<profileitem ca=\"'+ distributorCA +'\" distributor="1" key=\"' + distributorCertPath + '\" password=\"' + encryptedDistributorPassword + '\" rootca=""/>\n' +
			'<profileitem ca="" distributor="2" key="" password="xmEcrXPl1ss=" rootca=""/>\n' +
			'</profile>\n';

		if(fs.existsSync(profilePath)){
			var originContent = fs.readFileSync(profilePath);
			originContent = originContent.toString();
			var newContent = '';
			var strPrefix = '';
			var strVersion = '';
			var strEndProfiles = '';
			/*if(activeFlag){ 
				var strBeginActive = originContent.indexOf('<profiles active=');
				strPrefix = originContent.substring(0,strBeginActive+17) + '\"' + profileName + '\"';
				strVersion= originContent.indexOf('version=\"3.1\"');
				strEndProfiles= originContent.indexOf('</profiles>');
				var strContent = originContent.substring(strVersion-1,strEndProfiles );
				newContent = strPrefix + strContent + profileItem+'</profiles>';

			}else{*/
				strEndProfiles= originContent.indexOf('</profiles>');
				var strContent = originContent.substring(0,strEndProfiles );
				newContent = strContent +profileItem+ '</profiles>';
			//}
			
			fs.writeFileSync(profilePath, newContent);
		}else{
			profileItem = profilePrefix + profileItem + '</profiles>';
			fs.writeFileSync(profilePath, profileItem);
		}

		common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Creating new profile successful');
		
	};

	var checkProfileName =function(name) {
		var nameFlag = true;
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			for(var i = 0;i< profileNames.length;i++){
				if(name == profileNames[i]){
					nameFlag = false;
					break;
				}
			}
		}
		return nameFlag ;
	};

	var checkCertificateName =function(name){
		var flag = true;
		var certName = AuthorPath + '/'+ name+'.p12';
		if(fs.existsSync(certName)){
			flag = false;
		}
		return flag ;
	};

	var getProfileItems =function(){
		var itemNum = 0;
		var nameArray = new Array();
		if(fs.existsSync(profilePath)){
			var data = fs.readFileSync(profilePath,'utf-8');
			//parse profiles.xml file to get author and distributor p12 certificate file 
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);

				var profiles = jsonArray.profiles.profile;   
				var name = '';  
				if(profiles && (!profiles.length)){ //For only one profile case 
					itemNum = 1; 
					name = profiles.$.name;
					nameArray.push(name);
				}else if(profiles && profiles.length){ //For multiple profile case
					itemNum = profiles.length;
					for(var i = 0; i<profiles.length;i++){
						name = profiles[i].$.name;
						nameArray.push(name);
					}
				}

			});     
		}
		
		return {itemNum, nameArray};
	};

	var setActiveProfileItem =function(name){
		if(fs.existsSync(profilePath)){	
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var strBeginActive = profileContent.indexOf('<profiles active=');
			strPrefix = profileContent.substring(0,strBeginActive+17) + '\"' + name + '\"';
			strVersion= profileContent.indexOf('version=\"3.1\"');
			var strContent = profileContent.substring(strVersion-1 , profileContent.length );
			var newContent = strPrefix + strContent;
			fs.writeFileSync(profilePath, newContent);	
		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}

    };

	return {
        handleCommand:function() {	
			tizenCertificateViewControl.showView().then((certInfo) => {
				let profileName = certInfo.profileInfo;
				let authorCA = developerCA;
				let authorCertPath = null;
				let authorPassword = null;
				let distributorCA = null;
				let distributorCertPath = null;
				let distributorPassword = null;

				console.log(certInfo);

				// Handle author certificate information
				if (certInfo.authorInfo.type == 'create') {
					generateCertificate.createCert(
						certInfo.authorInfo.info.authorFile, 
						certInfo.authorInfo.info.authorName, 
						certInfo.authorInfo.info.authorPassword, 
						certInfo.authorInfo.info.authorCountry, 
						certInfo.authorInfo.info.authorState, 
						certInfo.authorInfo.info.authorCity, 
						certInfo.authorInfo.info.authorOrganization, 
						certInfo.authorInfo.info.authorDepartment, 
						certInfo.authorInfo.info.authorEmail
					);

					authorCertPath = AuthorPath + path.sep + certInfo.authorInfo.info.authorFile + '.p12';
					authorPassword = certInfo.authorInfo.info.authorPassword;
				}
				else if (certInfo.authorInfo.type == 'select') {
					authorCertPath = certInfo.authorInfo.info.authorFile;
					authorPassword = certInfo.authorInfo.info.authorPassowrd;
				}

				// Handle distributor certificate information
				if (certInfo.distributorInfo.type == 'default') {
					if (certInfo.distributorInfo.info == 'public') {
						distributorCA = distributorPublicCA;
						distributorCertPath = distributorPublicSigner;
					}
					else if (certInfo.distributorInfo.info == 'partner') {
						distributorCA = distributorPartnerCA;
						distributorCertPath = distributorPartnerSigner;
					}
					distributorPassword = distributorSignerPassword;
				}
				else if (certInfo.distributorInfo.type == 'select') {
					distributorCA = '';
					distributorCertPath = certInfo.distributorInfo.info.distributorFile;
					distributorPassword = certInfo.distributorInfo.info.distributorPassword;
				}
				
				registerProfile(profileName, authorCA, authorCertPath, authorPassword, distributorCA, distributorCertPath, distributorPassword);

				dialog.showMessageBox({
					title: 'Tizen Certificate',
					buttons: ['OK'],
					message: 'The new certificate profile has been successfully created.',
					checkboxLabel: 'Set the new profile as active'
				}, function(response, checkboxChecked) {
					if (response == 0 && checkboxChecked == true) {
						setActiveProfileItem(profileName);
					}
				});
			});
        }
	};
})();
module.exports = tizenCertificate;


