var certificateManager = (function(){
    // Imports
	var tizenCertificate = require('./tizenCertificate');
	var samsungCertificate = require('./samsungCertificate');
	var common = require('./common');
	var logger = require('./logger');
    const projectListView = require('./project-list-view');
    var fs = require('fs');
    var path = require('path');
    var parseString = require('xml2js').parseString;
    var p12ToPem = require('./p12ToPem');
    
    // Module name
    var moduleName = 'Certificate Manager';

    var AuthorPath = common.extensionRootPath + path.sep + 'resource/Author'.split('/').join(path.sep);
    var SamsungCertPath = common.extensionRootPath + path.sep + 'resource/SamsungCertificate'.split('/').join(path.sep);
    var profilePath = common.extensionRootPath + path.sep + 'resource/profiles.xml'.split('/').join(path.sep);

    var createProfile = function() {
        // Select Profile Type
        var selectTip = 'Select the type of certificate profile';
        var choices = [
            'Tizen',
            'Samsung'
        ];

        // Show App templates list
        projectListView.showSelectList(choices, selectTip).then(function (choice) {
            // Cancel without selecting
            if (!choice) {

                var waringMsg = 'Cancelled the "Certificate Manager" without selecting operation!';
                logger.warning(moduleName, waringMsg);
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
                throw waringMsg;
            }
            // Select 'Create Profile'
            if (choice === 'Tizen') {
                logger.info(moduleName, 'The "Tizen Profile" is selected');
                // call tizen profile API
                tizenCertificate.handleCommand();
                return;
            }
            // Select 'Remove Profile'
            else if (choice === 'Samsung') {
                logger.info(moduleName, 'The "Samsung Profile" is selected');
                // call samsung profile API
                samsungCertificate.handleCommand();
                return;
            }
        });
    }

    var removeProfile =function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			var selectTip = 'You can select a profile to remove from the profile list ';
			var activeProfileName = getActiveProfileName();
			var removeChoices= new Array();
			for(let i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					removeChoices.push(profileNames[i]+' (active)');
				}else{
					removeChoices.push(profileNames[i]);
				}
				
			}
			projectListView.showSelectList(removeChoices, selectTip).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Remove Profile" without selecting a profile to remove!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				var removeName = choice;
				var confirmTip = 'Are you sure you want to remove the '+ choice+' certificate profile?';
				var confirmchoices = [
					'Yes',
					'No'
				];

				projectListView.showSelectList(confirmchoices, confirmTip).then(function (choice) {
					if (!choice) {
						waringMsg = 'Cancelled the "Remove Profile" without select Yes or No to confirm';
						logger.warning(moduleName, waringMsg);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
						throw waringMsg;
					}
					if(choice == 'Yes'){
						removeProfileItem(removeName);
					}else{
						waringMsg = 'Cancelled the "Remove Profile" process';
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					}

				});

			});
		}else{
			var waringMsg = 'There is no profiles to delete ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
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

    var setActiveProfile = function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length > 0){
			var selectTip = 'You can set active profile from the profile list ';
			var activeProfileName = getActiveProfileName();
			var activeChoices= new Array();		
			for(var i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					activeChoices.push(profileNames[i]+' (active)');
				}else{
					activeChoices.push(profileNames[i]);
				}
				
			}
	
			projectListView.showSelectList(activeChoices, selectTip).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Set Active Profile" without selecting a profile!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}

				if(choice == activeProfileName+' (active)')
				{
					var waringMsg1 = 'The profile you selected is already the active profile';
					logger.warning(moduleName, waringMsg1);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg1);
					throw waringMsg1;
				}

				var activeName = choice;
				setActiveProfileItem(activeName);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Set active profile'+activeName+ ' successful');

			});
		}else{
			var waringMsg = 'There is no profiles to set active ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
    };
    
    var removeProfileItem = function(name) {
		logger.info(moduleName, '================Remove a profile item');
		if(fs.existsSync(profilePath)){
			let profileContent = fs.readFileSync(profilePath,'utf-8');
			let newContent = '';
			let isActiveFlag = false;

			// Remove active item ,set the first item to active item	
			if(name.includes('(active)')){ 
				name = name.substring(0, name.indexOf('(active)') - 1);
				isActiveFlag = true;
			}

			//let delFiles = getCertFilePathFromProfile(profileContent, name);
			//let delAuthorFile = delFiles.authorPath;
			//let delDistributorFile = delFiles.distributorPath;
			//console.log('Author P12 File: ' + delAuthorFile);
			//console.log('Distributor P12 File: ' + delDistributorFile);
		
			// Remove profile
			let nextName = getNextProfileItem(name);
			let strRemoveBegin = profileContent.indexOf('<profile name=\"'+name+'\">');
			let strNextItemBegin = '';
			if (nextName !='') { // Next profile Item exist		
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}
			else { //The remove item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			if (strRemoveBegin >0 && strNextItemBegin>0) {
				newContent = profileContent.substring(0,strRemoveBegin) + profileContent.substring(strNextItemBegin,profileContent.length);
			}

			// Modify active profile
			if (isActiveFlag) {
				let profileItems = getProfileItems();
				let activeContent1 = '<profiles active="';
				let activeContent2 = '" version="3.1">';
				let noActive = activeContent1 + activeContent2;
				if (profileItems.itemNum == 1) {
					// Removed item is last one
					newContent = newContent.replace(activeContent1 + name + activeContent2, noActive);
				}
				else if (profileItems.itemNum > 1) {
					// Set the first profile item as active profile after remove
					for (let i = 0; i < profileItems.itemNum; i++) {
						if (profileItems.nameArray[i] != name) {
							newContent = newContent.replace(activeContent1 + name + activeContent2, activeContent1 + profileItems.nameArray[i] + activeContent2);
						}
					}
				}
			}

			fs.writeFileSync(profilePath, newContent);

			// Remove certificate files
			//removeCertificateFiles(newContent, delAuthorFile, delDistributorFile);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Remove '+name+ ' profile successful');

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};
	
	var getCertFilePathFromProfile = function(profileData, itemName) {
		let authorPath = '';
		let distributorPath = '';
		
		parseString(profileData, {explicitArray : false, async: false}, function(err, result) {
			let jsonData = JSON.stringify(result);
			let jsonArray = JSON.parse(jsonData);
			let profiles = jsonArray.profiles.profile;

			// Search certificate file path
			if (profiles && profiles.length) {
				for (let i = 0; i < profiles.length; i++) {
					console.log('check profile: '+ profiles[i].$.name + ' with input: ' + itemName);
					if (profiles[i].$.name == itemName) {
						profileItems = profiles[i].profileitem;
						authorPath = profileItems[0].$.key;
						distributorPath = profileItems[1].$.key;
						break;
					}
				}
			}
			else if (profiles && !profiles.length) {
				profileItems = profiles.profileitem;
				authorPath = profileItems[0].$.key;
				distributorPath = profileItems[1].$.key;
			}
		});

		return {authorPath, distributorPath};
	}

	var removeCertificateFiles = function(profileData, authorFile, distributorFile) {
		let isAuthorUsed = false;
		let isDistributorUsed = false;

		parseString(profileData, {explicitArray : false, async: false}, function(err, result) {
			let jsonData = JSON.stringify(result);
			let jsonArray = JSON.parse(jsonData);
			let profiles = jsonArray.profiles.profile;

			if (profiles && profiles.length) {
				// Search certificate file path
				for (let i = 0; i < profiles.length; i++) {
					profileItems = profiles[i].profileitem;
					if (profileItems[0].$.key == authorFile) {
						isAuthorUsed = true;
						console.log('author p12 file used by: ' + profiles[i].$.name);
					}

					if (profileItems[1].$.key == distributorFile) {
						isDistributorUsed = true;
						console.log('author p12 file used by: ' + profiles[i].$.name);
					}

					if (isAuthorUsed == true && isDistributorUsed == true) {
						break;
					}
				}
			}
			else if (profiles && !profiles.length) {
				profileItems = profiles.profileitem;
				if (profileItems[0].$.key == authorFile) {
					isAuthorUsed = true;
					console.log('author p12 file used by: ' + profiles.$.name);
				}

				if (profileItems[1].$.key == distributorFile) {
					isDistributorUsed = true;
					console.log('author p12 file used by: ' + profiles.$.name);
				}
			}
		});

		// Author is not used by other profile, remove the file
		if (isAuthorUsed == false) {
			if (authorFile.includes(AuthorPath)) { // Remove Tizen Ceritifcate
				if (fs.existsSync(authorFile)) {
					fs.unlinkSync(authorFile);
				}
			}
			else if (authorFile.includes(SamsungCertPath)) { // Remove Samsung Certificate
				let thePath = path.dirname(authorFile);
				if (fs.existsSync(thePath)) {
					fs.unlinkSync(thePath + path.sep + 'author.crt');
					fs.unlinkSync(thePath + path.sep + 'author.csr');
					fs.unlinkSync(thePath + path.sep + 'author.p12');
					fs.unlinkSync(thePath + path.sep + 'author.pri');
				}

				if (fs.readdirSync(thePath).length == 0) {
					fs.rmdirSync(thePath);
				}
			}
		}

		if (isDistributorUsed == false) {
			if (distributorFile.includes(SamsungCertPath)) { // Remove Samsung Certificate
				let thePath = path.dirname(distributorFile);
				if (fs.existsSync(thePath)) {
					fs.unlinkSync(thePath + path.sep + 'distributor.crt');
					fs.unlinkSync(thePath + path.sep + 'distributor.csr');
					fs.unlinkSync(thePath + path.sep + 'distributor.p12');
					fs.unlinkSync(thePath + path.sep + 'distributor.pri');
					fs.unlinkSync(thePath + path.sep + 'device-profile.xml');
				}

				if (fs.readdirSync(thePath).length == 0) {
					fs.rmdirSync(thePath);
				}
			}
		}
	}
    
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

    var getActiveProfileName = function(){
		logger.info(moduleName, '================Load Profile');
		var activeName = '';
		if(fs.existsSync(profilePath)){
			logger.info(moduleName, 'Profile file path:'+profilePath);
			var data = fs.readFileSync(profilePath,'utf-8');
			//parse profiles.xml file to get author and distributor p12 certificate file 
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);	
				if(jsonArray.profiles.$.active){
					activeName = jsonArray.profiles.$.active ;
				}
			});     
		}
		return activeName;
	};

	var showCertificateInfo = function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length > 0){
			var selectTip = 'You can check or change the certificates info of the selected certificate profile ';
			var activeProfileName = getActiveProfileName();
			var selectChoices= new Array();		
			for(var i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					selectChoices.push(profileNames[i]+' (active)');
				}else{
					selectChoices.push(profileNames[i]);
				}
				
			}
	
			projectListView.showSelectList(selectChoices, selectTip).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Change Certificate Info" without selecting a certificate profile!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				var name = choice;
				if(name.indexOf('(active)') > 0){ // Remove active item ,set the first item to active item	
					name = name.substring(0, name.indexOf('(active)') - 1);
				}

				var selectResult = searchProfileItem(name);

				if(!selectResult){
					var warningMsg = 'Can not find '+ name + 'certificate profile in profiles.xml';
					logger.warning(moduleName, warningMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warningMsg);
					throw waringMsg;
				}
				var authorCert='';
				var authorPass ='';
				var distributorCert1='';
				var distributor1Pass='';
				var distributorCert2='';
				var distributor2Pass='';

				if(selectResult){
					authorCert = selectResult.authorFile;
					authorPass = selectResult.authorPassword;
					distributorCert1 = selectResult.distributorFile1;
					distributor1Pass = selectResult.distributorPassword1;
					distributorCert2 = selectResult.distributorFile2;
					distributor2Pass = selectResult.distributorPassword2;
				}

				var certificateTip = 'You can check Author Certificate or Distributor Certificate or Add Distributor';
				var checkchoices = [
					'Author Certificate: '+path.basename(authorCert),
					'Distributor Certificate1: '+path.basename(distributorCert1)
				];

				if(distributorCert2 != ''){ // only one distributor
					checkchoices.push('Distributor Certificate2: '+path.basename(distributorCert2));
				}

				projectListView.showSelectList(checkchoices, certificateTip).then(function (choice) {
					if (!choice) {
						waringMsg = 'Cancelled the "Change Certificate Info" without select Author or Distributor Certificate';
						logger.warning(moduleName, waringMsg);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
						throw waringMsg;
					}
					if(choice.indexOf('Author Certificate:') >=0){
						checkOrChange('author', 1, authorCert, authorPass, name);

					}else if (choice.indexOf('Distributor Certificate1:') >=0){
						checkOrChange('distributor1', checkchoices.length, distributorCert1, distributor1Pass, name);
					}else if(choice.indexOf('Distributor Certificate2:') >=0){
						checkOrChange('distributor2', checkchoices.length, distributorCert2, distributor2Pass, name);
					}

				});
				
			});
		}else{
			var waringMsg = 'There is no avaliable profile ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}


    };
    
    var checkOrChange = function(type, number , certPath,password, profilename){
		var certificateTip = 'You can check the certificate Information or change Certificate ';
		var choices = [
			'Change Certificate',
			'Certificate Information'
		];
		if(type != 'author' ){
			if(number>2){
				choices.push('Remove Certificate' );
			}else{
				choices.push('Add Distributor Certificate');
			}	
		}
		
		projectListView.showSelectList(choices, certificateTip).then(function (choice) {
			if (!choice) {
				waringMsg = 'Cancelled the "Change Certificate Info" without any operation';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			if(choice == 'Certificate Information'){
				detailCertificateInfo(certPath,password);
			}else if (choice == 'Change Certificate' || choice == 'Add Distributor Certificate'){
				changeCertificate(choice, type, profilename);
			}else if (choice == 'Remove Certificate'){
				removeDistributorCert( type, profilename, certPath);
			}

		});

	};
	
	var changeCertificate = function(label, type, profilename){
		var promptMsg1 = 'Please enter the Author certificate file location you want to change ';
		var dirNotDef = 'Cancelled "change certificate" without inputting the Author certificate file location';
		var passNotDef = 'Cancelled "change certificate" without inputting the changed author certificate password!';

		if(type != 'author'){
			if(label == 'Change Certificate'){
				promptMsg1 = 'Please enter the Distributor certificate file location you want to change ';
				dirNotDef = 'Cancelled "Change certificate" without inputting the Distributor certificate file location';
				passNotDef = 'Cancelled "Change certificate" without inputting the changed distributor certificate password!';
			}else if(label == 'Add Distributor Certificate'){
				promptMsg1 = 'Please enter the Distributor certificate file location you want to add ';
				dirNotDef = 'Cancelled "Add Distributor Certificate" without inputting the Distributor certificate file location';
				passNotDef = 'Cancelled "Add Distributor Certificate" without inputting the added distributor certificate password!';
			}
			
		}

		projectListView.showInputBox(promptMsg1).then(function (certpath) {
			if(!certpath){
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			var extension = path.extname(certpath);
			if(fs.existsSync(certpath) && extension == '.p12'){
				projectListView.showInputBox('Please enter the certificate password you selected').then(function(password){
					if(!password){
						logger.warning(moduleName, passNotDef);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, passNotDef);
						throw passNotDef;
					}else{
						modifyProfileItem(label, type, profilename, certpath, password );	
					}
					
				});
			}else{
				var waringMsg = 'The certificate path you entered is not correct';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;

			}

		});

	};

	var removeDistributorCert = function( type, profilename, certPath){
		var certificateTip = 'Are you sure you want to remove the '+path.basename(certPath) + ' certificate';
		var choices = [
			'Yes',
			'No'
		];
		
		projectListView.showSelectList(choices, certificateTip).then(function (choice) {
			if (!choice) {
				var waringMsg = 'Cancelled the "Remove Certificate" without select Yes or No';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			if(choice == 'Yes'){
				removeDistributorItem(type, profilename);
			}else{
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, 'Cancelled the "Remove Certificate"');
			}
		});

	};

	var removeDistributorItem = function(type, profilename){
		logger.info(moduleName, '================Remove a Distributor Certificate');

		var succMsg = 'Remove Distributor Certificate successful';

		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var newContent = '';
			var nextName = getNextProfileItem(profilename);
			var strRemoveBegin = profileContent.indexOf('<profile name=\"'+profilename+'\">');
			var strNextItemBegin = '';
			if(nextName !=''){ // Next profile Item exist		
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}else{ //The item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			var profileItemContent = profileContent.substring(strRemoveBegin, strNextItemBegin);

			var modifiedItemContent = '';
			
			if(type == 'distributor1'){
				var firstProfileItem = profileItemContent.indexOf('<profileitem ca=');

				var profileItemCAStart = profileItemContent.indexOf('<profileitem ca=', firstProfileItem + 10);
				var profileItemEnd = profileItemContent.indexOf('<profileitem ca=', profileItemCAStart + 10);
				certpath
				modifiedItemContent = profileItemContent.substring(0, profileItemCAStart-1) + profileItemContent.substring(profileItemEnd-1, profileItemEnd+32) + '1' + profileItemContent.substring(profileItemEnd+33, profileItemContent.indexOf('</profile>')) + 
				'<profileitem ca=\"\" distributor=\"2\" key=\"\" password=\"xmEcrXPl1ss=\" rootca=\"\"/>\n' + '</profile>\n';

			}else if(type == 'distributor2'){
				var keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
				var passStartStr = profileItemContent.lastIndexOf('password=');
				var caStartStr = profileItemContent.lastIndexOf('rootca=');	
	
				modifiedItemContent = profileItemContent.substring(0, keyStartStr+21) + '' + profileItemContent.substring(passStartStr - 2, passStartStr +10) + 'xmEcrXPl1ss=' + profileItemContent.substring(caStartStr-2 ,profileItemContent.length);
			}

			newContent = profileContent.substring(0,strRemoveBegin) + modifiedItemContent + profileContent.substring(strNextItemBegin,profileContent.length);

			fs.writeFileSync(profilePath, newContent);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, succMsg);

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}

	};

	var modifyProfileItem = function(label, type, profilename, keyPath, password){
		logger.info(moduleName, '================Modify a profile item');

		var succMsg = 'Change Certificate successful';
		var encrytPass = p12ToPem.encryptPassword(password);
		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var newContent = '';
			var nextName = getNextProfileItem(profilename);
			var strRemoveBegin = profileContent.indexOf('<profile name=\"'+profilename+'\">');
			var strNextItemBegin = '';
			if(nextName !=''){ // Next profile Item exist		
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}else{ //The remove item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			var profileItemContent = profileContent.substring(strRemoveBegin, strNextItemBegin);

			var keyStartStr = '';
			var passStartStr = '';
			var caStartStr = '';
			if( label == 'Change Certificate'){

				if(type == 'author'){
					keyStartStr = profileItemContent.indexOf('distributor=\"0\"');
					passStartStr = profileItemContent.indexOf('password=');
					caStartStr = profileItemContent.indexOf('rootca=');	
				}else if(type == 'distributor1'){
					keyStartStr = profileItemContent.indexOf('distributor=\"1\"');
					passStartStr = profileItemContent.indexOf('password=' ,keyStartStr);
					caStartStr = profileItemContent.indexOf('rootca=', passStartStr);	

				}else if(type == 'distributor2'){
					keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
					passStartStr = profileItemContent.lastIndexOf('password=');
					caStartStr = profileItemContent.lastIndexOf('rootca=');	
				}

			}else if( label == 'Add Distributor Certificate'){
				succMsg = 'Add Distributor Certificate successful';
				keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
				passStartStr = profileItemContent.lastIndexOf('password=');
				caStartStr = profileItemContent.lastIndexOf('rootca=');	
			}

			var subString1 = profileItemContent.substring(0, keyStartStr+21);
			var subString2 = profileItemContent.substring(passStartStr - 2, passStartStr +10);
			var subString3 = profileItemContent.substring(caStartStr-2 ,profileItemContent.length);

			var modifiedItemContent = subString1 + keyPath + subString2 + encrytPass + subString3;
			
	
			newContent = profileContent.substring(0,strRemoveBegin) + modifiedItemContent + profileContent.substring(strNextItemBegin,profileContent.length);
		
			fs.writeFileSync(profilePath, newContent);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, succMsg);

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};

	var detailCertificateInfo = function(certPath,password){
		var certificateTip = 'The certificate Info is below ';
		var expirationDate = '';
		var issuerName = '';
		var parseInfo = p12ToPem.getCertificateInfo(certPath, password);
		if(parseInfo){
			expirationDate = parseInfo.afterYear;
			issuerName = parseInfo.issuerName;
		}
		var	choices = [
			'Identity: ' +path.basename(certPath, '.p12'),
			'Expiration Date: ' +expirationDate,
			'Issuer: ' +issuerName,
			'Key file location: ' +certPath

		];
		projectListView.showSelectList(choices, certificateTip);
	};

	var searchProfileItem = function(selectedname){
		logger.info(moduleName, '================Load Profile');
		var authorFile= '';
		var authorPassword = '';

		var distributorFile1 = '';
		var distributorPassword1 = '';
		var distributorFile2= '';
		var distributorPassword2 = '';

		if(fs.existsSync(profilePath)){
			logger.info(moduleName, 'Profile file path:'+profilePath);
			var data = fs.readFileSync(profilePath,'utf-8');

			//parse profiles.xml file to get author and distributor p12 certificate file 
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);

				var profiles = jsonArray.profiles.profile;
				var profileItems ;           
				if(profiles && (!profiles.length)){ //For only one profile case 
					profileItems = profiles.profileitem;
					
				}else if(profiles && profiles.length){ //For multiple profile case

					for(var i = 0; i<profiles.length;i++){
						var name = profiles[i].$.name;
						console.log('name:'+name);
						if(selectedname == name){
							profileItems = profiles[i].profileitem;
						}

					}
				}else{
					return false;
				}
				
				if(typeof(profileItems) != 'undefined' && profileItems.length>2){

					authorFile = profileItems[0].$.key;
					distributorFile1 = profileItems[1].$.key;
					authorPassword = profileItems[0].$.password;
					distributorPassword1 = profileItems[1].$.password;
					distributorFile2 = profileItems[2].$.key;
					distributorPassword2 = profileItems[2].$.password;	
					//return {authorFile, authorPassword, distributorFile1, distributorPassword1, distributorFile2, distributorPassword2};
					//return 'abcd';
				
				}else{
					return false;
				}

			});     
		}else{
			return false;
		}
		return {authorFile, authorPassword, distributorFile1, distributorPassword1, distributorFile2, distributorPassword2};
    };

	var getNextProfileItem =function(name){
		var nextName = '';
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			for(var i = 0; i< profileNames.length;i++){
				if(name == profileNames[i] ){
					if(i<profileNames.length-1){
						nextName = profileNames[i+1];
					}
					break;
				}
			}
		}
		return nextName;
	};

	return {
        // Handle 'Run on TV' command
        handleCommand:function() {
            logger.info(moduleName, '==============================Certificate Manager start!');

			// check profile.xml access permission
            if (fs.existsSync(profilePath)) {
                try {
                    fs.accessSync(profilePath, fs.constants.R_OK | fs.constants.W_OK);
                } catch (err) {
                    console.info('modify access permission!');
                    fs.chmodSync(profilePath, 0666);
                }
            }
            
            // select operation
            var selectTip = 'You can create, remove or active a profile.';
            var choices = [
                'Create Profile',
                'Remove Profile',
                'Set Active Profile',
                'Change Certificate Info'
            ];
            
            // Show App templates list
            projectListView.showSelectList(choices, selectTip).then(function (choice) {
                // Cancel without selecting
                if (!choice) {
    
                    var waringMsg = 'Cancelled the "Certificate Manager" without selecting operation!';
                    logger.warning(moduleName, waringMsg);
                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
                    throw waringMsg;
                }
                // Select 'Create Profile'
                if (choice === 'Create Profile') {
                    logger.info(moduleName, 'The "Create Profile" is selected');
                    createProfile();
                    return;
                }
                // Select 'Remove Profile'
                else if (choice === 'Remove Profile') {
                    logger.info(moduleName, 'The "Remove Profile" is selected');
                    removeProfile();
                    return;
                }
                // Select 'Set Active Profile'
                else if (choice === 'Set Active Profile') {
                    logger.info(moduleName, 'The "Set Active Profile" is selected');
                    setActiveProfile();
                    return;
                }// Select 'Change Certificate Info'
                else if (choice === 'Change Certificate Info') {
                    logger.info(moduleName, 'The "Change Certificate Info" is selected');
                    showCertificateInfo();
                    return;
                }
            });
			
        }
	};
})();
module.exports = certificateManager;


