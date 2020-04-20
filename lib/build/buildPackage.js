
var buildPackage = (function() {

	// Imports
	var os = require('os');
	var fs = require('fs');
	var path = require('path');
	var innerProcessBuild = require('child_process');
	var common = require('./common');
	var logger = require('./logger');
	var signPackage = require('./signPackage');
	var p12ToPem = require('./p12ToPem');
	// 3rd packager tool
	var archiver = require('archiver');

	// tizentv extension's path
	var extensionPath = __dirname + path.sep + '..';
	var outputPath = '/../';

	// Generated personal/public signature file
	var AUTOR_SIGNATURE = 'author-signature.xml';
	var PUBLIC_SIGNATURE = 'signature1.xml';
	var PUBLIC_SIGNATURE2 = 'signature2.xml';
	var MAINFEST_TMP = '.manifest.tmp';

	// Blank
	var BLANK_SPACE = ' ';
	// Module name
	var moduleName = 'Build Package';
	var workspacePath = '';

	var expconfname = 'buildExceptionPath.conf';
	var explist = '';


	// Remove exsiting files
	function removeFile(filepath){
		if(fs.existsSync(filepath)) {

			logger.warning(moduleName, 'The existing ' + filepath + ' will be removed firstly');
			logger.debug(moduleName, 'Remove existing ' + filepath);

			try {

				fs.unlinkSync(filepath);
			} catch (ex) {

				logger.warning(moduleName, 'The existing '+ filepath + ' cannot be removed');
				logger.debug(moduleName, ex.message);
				return false;
			}
		}
	}

	// Validate the path
	// Do App signature
	var prePackage = function(workspacePath, appName) {
		// Remove exsiting packager or signature1.xml or author-signature.xml
		var exsitingPackager = workspacePath + path.sep + appName + '.wgt';
		var exsitingAuthorSignatureXML = workspacePath + path.sep + AUTOR_SIGNATURE;
		var exsitingSignature1XML = workspacePath + path.sep + PUBLIC_SIGNATURE;
		var existingSignature2XML = workspacePath + path.sep + PUBLIC_SIGNATURE2;
		removeFile(exsitingPackager);
		removeFile(exsitingAuthorSignatureXML);
		removeFile(exsitingSignature1XML);
		removeFile(existingSignature2XML);

		//Remove existing active_cert pem files in Developer and Distributor
		removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_KEY_FILE);
		removeFile(p12ToPem.ACTIVE_PEM_FILE.AUTHOR_CERT_FILE);
		removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_KEY_FILE);
		removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR_CERT_FILE);
		removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_KEY_FILE);
		removeFile(p12ToPem.ACTIVE_PEM_FILE.DISTRIBUTOR2_CERT_FILE);

		//signature a package which use crypto nodejs library
		try {

			logger.info(moduleName, 'Signing app, please wait...');
			//signPackage.signPackage();

			signPackage.signPackage(workspacePath,explist);
			logger.info(moduleName, 'Completed sign...');
		} catch (ex) {

			logger.warning(moduleName, 'Do application signature failed, please check your environment');
			logger.warning(moduleName, 'xmldom is suggested for signature package');
			logger.debug(moduleName, + ex.message);
			return false;
		}

		return true;
	};
	var getZipFileDir = function(pathinput,archive){
		var filepath =workspacePath+path.sep+pathinput;
		var files = fs.readdirSync(filepath);
		//fs.writeFileSync(workspacePath + path.sep + "../createReferences.txt", files);
		// It does noy support forEach
		for(var i = files.length -1;i >= 0; i--) {
			if(files[i].indexOf('.') == 0){//startWith is not support in the file, indexOf == 0 is equal to startWith
				//files.splice(i,1);
				continue;
			}
			var fullname = filepath+ files[i];
			//var outname = fullname;
			//outname.replace(workspacePath,"");
			var stats = fs.statSync(fullname);
			if (stats.isDirectory()){
				fullname += path.sep;
				if(explist.indexOf(';'+fullname)>=0){
					if(explist.indexOf(';'+fullname+';')>=0)
					{
						continue;
					}
					getZipFileDir(pathinput+files[i]+path.sep,archive);
				}
				else
				{
					archive.directory(fullname,pathinput+files[i]);
				}

			}else if(stats.isFile()){
				if(explist.indexOf(';'+fullname+';')<0)
					archive.file(fullname,{name:pathinput+files[i]});
			}
		}

	};

	var doPackageExp = function(workspacePath, appName) {
		// Get Web App .wgt file default output path
		var outputFullPathTmp = workspacePath + outputPath + appName + '.wgt';
		var outputFullPath = workspacePath + path.sep + appName + '.wgt';
		logger.debug(moduleName, 'Output put has been set as: ' + outputFullPath);

		var output = fs.createWriteStream(outputFullPathTmp);
		var archive = archiver('zip');

		archive.on('error', function (err) {
			logger.debug(moduleName, err.message);
			throw err;
		});

		output.on('close', function () {

			// Remove tempory signature files
			var authorSignature = workspacePath + path.sep + AUTOR_SIGNATURE;
			var publicSignature = workspacePath + path.sep + PUBLIC_SIGNATURE;
			var publicSignature2 = workspacePath + path.sep + PUBLIC_SIGNATURE2;
			var tmpFile = workspacePath + path.sep + MAINFEST_TMP;
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
			fs.renameSync(outputFullPathTmp, outputFullPath);
			logger.info(moduleName, 'After build package, signature tempory files were removed');
			logger.info(moduleName, '==============================Build Package end!');
		});

		archive.pipe(output);
		var files = fs.readdirSync(workspacePath);

		// It does not support "forEach", it can use "for"
		//Filter the file which the first word of name is "."
		for(var i = files.length -1;i >= 0; i--) {
			if(files[i].indexOf('.') == 0){//startWith is not support in the file, indexOf == 0 is equal to startWith
				//files.splice(i,1);
				continue;
			}
			if(files[i] == expconfname)
				continue;
			var fullname = path.join(workspacePath, files[i]);
			var stats = fs.statSync(fullname);
			if (stats.isDirectory()){
				fullname += path.sep;
				//var subfilepath = path.join(workspacePath, files[i]);
				if(explist.indexOf(';'+fullname)>=0){
					if(explist.indexOf(';'+fullname+';')>=0)
					{
						continue;
					}
					getZipFileDir(files[i]+path.sep,archive);
				}
				else
				{
					archive.directory(fullname,files[i]);
				}
			}else if(stats.isFile()){
				if(explist.indexOf(';'+fullname+';')<0)
					archive.file(fullname,{name:files[i]});
			}
		}

		archive.finalize();

		// Move .wgt file to App path
		logger.info(moduleName, "Exception path:"+explist);

		logger.info(moduleName, 'Move .wgt from tempory path');

		// Complete the package build
		//while (!fs.existsSync(outputFullPath)) {
			//common.sleepMs(500);
		//}
		logger.info(moduleName, 'Generated the .wgt achiver');
		var buildSuccessMsg = 'Build the package Successfully!';
		common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, buildSuccessMsg);
		logger.info(moduleName, buildSuccessMsg);
	};
	// Do build package with 'archiver'
	var doPackage = function(workspacePath, appName) {

		if(explist.length > 0)
		{
			doPackageExp(workspacePath, appName);
			return;
		}
		// Get Web App .wgt file default output path
		var outputFullPathTmp = workspacePath + outputPath + appName + '.wgt';
		var outputFullPath = workspacePath + path.sep + appName + '.wgt';
		logger.debug(moduleName, 'Output put has been set as: ' + outputFullPath);

		var output = fs.createWriteStream(outputFullPathTmp);
		var archive = archiver('zip');

		archive.on('error', function (err) {
			logger.debug(moduleName, err.message);
			throw err;
		});

		output.on('close', function () {

			// Remove tempory signature files
			var authorSignature = workspacePath + path.sep + AUTOR_SIGNATURE;
			var publicSignature = workspacePath + path.sep + PUBLIC_SIGNATURE;
			var publicSignature2 = workspacePath + path.sep + PUBLIC_SIGNATURE2;
			var tmpFile = workspacePath + path.sep + MAINFEST_TMP;
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
			fs.renameSync(outputFullPathTmp, outputFullPath);
			logger.info(moduleName, 'After build package, signature tempory files were removed');
			logger.info(moduleName, '==============================Build Package end!');
		});

		archive.pipe(output);
		archive.bulk([
			{
				src: ['**'],
				dest: '/',
				cwd: path.join(workspacePath, '/'),
				expand: true
			}
		]);
		archive.finalize();

		// Move .wgt file to App path

		logger.info(moduleName, 'Move .wgt from tempory path');

		// Complete the package build
		//while (!fs.existsSync(outputFullPath)) {
			//common.sleepMs(500);
		//}
		logger.info(moduleName, 'Generated the .wgt achiver');
		var buildSuccessMsg = 'Build the package Successfully!';
		common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, buildSuccessMsg);
		logger.info(moduleName, buildSuccessMsg);
	};

	var checkExpFile = function(workspacePath, appName) {
		explist = '';
		var expfile = workspacePath+path.sep+ expconfname;
		if(fs.existsSync(expfile))
		{
			explist = fs.readFileSync(expfile, 'utf8');;
		}
	};


	return {
		// Do 'Build Package' command
		// Also invoked by launch App functions
		handleCommand:function() {

			logger.info(moduleName, '==============================Build Package start!');


			//var workspacePath = common.getWorkspacePath();
			if (common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER && common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR) {
				logger.debug(moduleName, 'If is debug mode ,set workspace to current work dir');
				workspacePath = common.getWorkspacePath();

				//logger.info('work path dir: ' + workspacePath);
			}
				// Check if there's workspace
			if (typeof(workspacePath) == 'undefined')
			{
				var noWorkspace = 'No project in workspace, please check!';
				logger.error(moduleName, noWorkspace);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, noWorkspace);
				return;
			}

			// Get App's name
			var pathArray = workspacePath.split(path.sep);
			var appName = pathArray[pathArray.length - 1];

			logger.info(moduleName, "The app's path is: " + workspacePath);
			logger.info(moduleName, "The app's name is: " + appName);

			if (appName == '')
			{
				var warning_path = 'The input workspace is a invalid, please check if it is a root!';
				logger.warning(moduleName, warning_path);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warning_path);
				return;
			}

			//check if there is exception file
			checkExpFile(workspacePath, appName);

			if (workspacePath && prePackage(workspacePath, appName)) {

				// Package
				doPackage(workspacePath, appName);
			}
			else {

				// Show error to users
				var errorMsg = 'Failed to build package!';
				logger.error(moduleName, errorMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, errorMsg);
			}

		},

		// Handle 'Debug on TV 3.0' command
		prepareBuildForDebug:function(dirpath) {

			logger.info(moduleName, '==============================Build package for debug!');

			workspacePath = dirpath;
			buildPackage.handleCommand();

		}
	};
})();
module.exports = buildPackage;
