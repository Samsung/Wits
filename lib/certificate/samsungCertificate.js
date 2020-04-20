var samsungCertificate = (function() {
    const Q = require('q');
    const { BrowserWindow, dialog } = require('electron').remote;
    var ProfilesHandler = require('./profilesHandler');
    var AuthorCertificateGenerator = require('./authorCertificateGenerator');
	var DistributorCertificateGenerator = require('./distributorCertificateGenerator');
    var PageObject = require('./views/pageObject');
    var SamsungCertificateProfileView = require('./views/samsungCertificateProfileView');
    var SamsungCertificateAuthorStartView = require('./views/samsungCertificateAuthorStartView');
    var SamsungCertificateAuthorCreateView = require('./views/samsungCertificateAuthorCreateView');
    var SamsungCertificateAuthorSelectView = require('./views/samsungCertificateAuthorSelectView');
    var SamsungCertificateDistributorStartView = require('./views/samsungCertificateDistributorStartView');
    var SamsungCertificateDistributorSelectView = require('./views/samsungCertificateDistributorSelectView');
    var SamsungCertificateDistributorCreateView = require('./views/samsungCertificateDistributorCreateView');
    var extensionRootPath = require('./common').extensionRootPath;
    var sep = require('path').sep;
    var encryptPassword = require('./p12ToPem').encryptPassword;

    const rootFilePath = extensionRootPath + sep + 'resource' + sep + 'SamsungCertificate'


    var profilePage = null;
    var authorStartPage = null;
    var authorCreatePage = null;
    var authorSelectPage = null;
    var distributorStartPage = null;
    var distributorSelectPage = null;
    var distributorCreatePage = null;

    let profileHandler = null;
    let samsungAccountInfo = null;

    var showProfileView = function() {
        if (profilePage == null) {
            profilePage = new PageObject({
                view: new SamsungCertificateProfileView({
                    onClickNextBtn: (opt) => {
                        if (opt == 'create')
                            showAuthorStartView(profilePage);
                        else
                            showDistributorStartView(profilePage);
                    },
                    onClickCancelBtn: () => profilePage.hide()
                })
            })
        }

        profilePage.show();
    }

    var showAuthorStartView = function(prevPage) {
        if (authorStartPage == null) {
            authorStartPage = new PageObject({
                view: new SamsungCertificateAuthorStartView({
                    onClickBackBtn: () => prevPage.show(),
                    onClickNextBtn: () => {
                        if (authorStartPage.getView().isCreateNewSelected() == true) {
                            showAuthorCreateView(authorStartPage);
                        }
                        else {
                            showAuthorSelectView(authorStartPage);
                        }
                    },
                    onClickCancelBtn: () => authorStartPage.hide()
                })
            })
        }

        authorStartPage.show();
    }

    var showAuthorCreateView = function(prevPage) {
        if (authorCreatePage == null) {
            authorCreatePage = new PageObject({
                view: new SamsungCertificateAuthorCreateView({
                    onClickBackBtn: () => prevPage.show(),
                    onClickNextBtn: () => createAuthorCert(),
                    onClickCancelBtn: () => authorCreatePage.hide()
                })
            })
        }

        authorCreatePage.show();
    }

    var showAuthorSelectView = function(prevPage) {
        if (authorSelectPage == null) {
            authorSelectPage = new PageObject({
                view: new SamsungCertificateAuthorSelectView({
                    onClickBackBtn: () => prevPage.show(),
                    onClickNextBtn: () => showDistributorStartView(authorSelectPage, false),
                    onClickCancelBtn: () => authorSelectPage.hide()
                })
            })
        }

        authorSelectPage.show();
    }

    var showDistributorStartView = function(prevPage, applyPassword) {
        if (distributorStartPage == null) {
            distributorStartPage = new PageObject({
                view: new SamsungCertificateDistributorStartView({
                    backDisabled: prevPage == null ? true : false,
                    onClickBackBtn: () => {
                        prevPage == null ? {} : prevPage.show();
                    },
                    onClickNextBtn: () => {
                        if (distributorStartPage.getView().isCreateNewSelected() == true) {
                            showDistributorCreateView(distributorStartPage, applyPassword);
                        }
                        else {
                            showDistributorSelectView(distributorStartPage);
                        }
                    },
                    onClickCancelBtn: () => distributorStartPage.hide()
                })
            })
        }

        distributorStartPage.show();
    }

    var showDistributorCreateView = function(prevPage, applyPassword) {
        if (distributorCreatePage == null) {
            distributorCreatePage = new PageObject({
                view: new SamsungCertificateDistributorCreateView({
                    defaultPassword: applyPassword == true ? authorCreatePage.getView().getInfo().authorPassword : '',
                    onClickBackBtn: () => prevPage.show(),
                    onClickFinishBtn: () => createDistributorCert(),
                    onClickCancelBtn: () => distributorCreatePage.hide()
                })
            })
        }

        distributorCreatePage.show();
    }

    var showDistributorSelectView = function(prevPage) {
        
        if (distributorSelectPage == null) {
            distributorSelectPage = new PageObject({
                view: new SamsungCertificateDistributorSelectView({
                    onClickBackBtn: () => prevPage.show(),
                    onClickFinishBtn: () => selectDistributorCert(),
                    onClickCancelBtn: () => distributorSelectPage.hide()
                })
            })
        }

        distributorSelectPage.show();
    }

    var createAuthorCert = function() {
        authorCreatePage.getView().setViewDisabled(true);
        dialog.showMessageBox({
			title: 'Samsung certificate',
			message: 'Please sign in to your Samsung account.',
			buttons: ['OK', 'Cancel']
		}, (response) => {
			if (response == 0)
			{
                loginSamsungAccount(authorCreatePage).then((accessInfo) => {
                    let profileName = profilePage.getView().getInfo();
                    let authorInfo = authorCreatePage.getView().getInfo();

                    let authorCert = new AuthorCertificateGenerator({
                        profileInfo: profileName,
                        certInfo: authorInfo,
                        accessInfo: accessInfo
                    });

                    samsungAccountInfo = accessInfo;

                    // Generate Author certificate
                    authorCreatePage.getView().loadingStart();
                    authorCert.generate().then((message) => {
                        authorCreatePage.getView().loadingStop();
                        if (message == 'success') {
                            let authorProfile = {
                                ca: '',
                                key: rootFilePath + sep + profileName + sep + 'author.p12',
                                password: encryptPassword(authorInfo.authorPassword)
                            }

                            // Register author profile
                            profileHandler.addNewProfile(profileName, authorProfile);

                            dialog.showMessageBox({
                                title: 'Samsung certificate',
                                message: 'Your new author certificate is located in:',
                                detail: authorProfile.key,
                                buttons: ['OK']
                            }, () => {
                                authorCreatePage.getView().setViewDisabled(false);
                                showDistributorStartView(null, authorCreatePage.getView().isApplySamePassword());
                            });
                        }
                        else {
                            dialog.showMessageBox({
                                title: 'Samsung certificate',
                                message: 'Generate author certificate failed!',
                                detail: message,
                                button: ['OK']
                            });
                            authorCreatePage.getView().setViewDisabled(false);
                        }
                    });
                });
            }
            else {
                authorCreatePage.getView().setViewDisabled(false);
            }
		});
    }

    var distributorGenerate = function(profileName, distributorInfo, distributorCert) {
        distributorCreatePage.getView().loadingStart();
        // Generate Distributor certificate
        distributorCert.generate().then((message) => {
            distributorCreatePage.getView().loadingStop();
            if (message == 'success') {
                // Register profiles
                let distributorProfile = {
                    ca: '',
                    key: rootFilePath + sep + profileName + sep + 'distributor.p12',
                    password: encryptPassword(distributorInfo.distributorPassword)
                }

                if (profileHandler.isProfileExist(profileName) == true) { // Profile select case and author create case
                    profileHandler.modifyProfile(profileName, distributorProfile, 'distributor');
                }
                else { // Author select case
                    let authorSelectInfo = authorSelectPage.getView().getInfo();
                    console.log(authorSelectInfo);
                    let authorProfile = {
                        ca: '',
                        key: authorSelectInfo.authorFile,
                        password: encryptPassword(authorSelectInfo.authorPassowrd)
                    }
                    profileHandler.addNewProfile(profileName, authorProfile, distributorProfile);
                }
                profileHandler.setActiveProfile(profileName);

                dialog.showMessageBox({
                    title: 'Samsung certificate',
                    message: 'Your new distributor certificate is located in:',
                    detail: distributorProfile.key,
                    buttons: ['OK']
                }, () => {
                    distributorCreatePage.getView().setViewDisabled(false);
                    distributorCreatePage.hide();
                });
            }
        });
    }

    var createDistributorCert = function() {
        let profileName = profilePage.getView().getInfo();
        let distributorInfo = distributorCreatePage.getView().getInfo();
        let distributorCert = null;

        distributorCreatePage.getView().setViewDisabled(true);
        if (samsungAccountInfo == null) { // Samsung account is not login
            let answer = dialog.showMessageBox({
                title: 'Samsung certificate',
                message: 'Please sign in to your Samsung account.',
                buttons: ['OK', 'Cancel']
            });

            if (answer == 0)
            {
                loginSamsungAccount(distributorCreatePage).then((accessInfo) => {
                    distributorCert = new DistributorCertificateGenerator({
                        profileInfo: profileName,
                        certInfo: distributorInfo,
                        accessInfo: accessInfo
                    });

                    distributorGenerate(profileName, distributorInfo, distributorCert);
                });
            }
        }
        else {
            distributorCert = new DistributorCertificateGenerator({
                profileInfo: profileName,
                certInfo: distributorInfo,
                accessInfo: samsungAccountInfo
            });

            distributorGenerate(profileName, distributorInfo, distributorCert);
        }
    }

    var selectDistributorCert = function() {
        let profileName = profilePage.getView().getInfo();
        let distributorInfo = distributorSelectPage.getView().getInfo();
        let distributorProfile = {
            ca: '',
            key: distributorInfo.distributorFile,
            password: encryptPassword(distributorInfo.distributorPassword)
        }

        if (profileHandler.isProfileExist(profileName) == true) { // Profile select case and author create case
            profileHandler.modifyProfile(profileName, distributorProfile, 'distributor');
        }
        else { // Author select case
            let authorSelectInfo = authorSelectPage.getView().getInfo();
            let authorProfile = {
                ca: '',
                key: authorSelectInfo.authorFile,
                password: encryptPassword(authorSelectInfo.authorPassword)
            }
            profileHandler.addNewProfile(profileName, authorProfile, distributorProfile);
        }

        profileHandler.setActiveProfile(profileName);
        distributorSelectPage.hide();
    }

    var destroyAllPage = function() {
        profilePage = null;
        authorStartPage = null;
        authorCreatePage = null;
        authorSelectPage = null;
        distributorStartPage = null;
        distributorSelectPage = null;
        distributorCreatePage = null;
        profileHandler = null;
        samsungAccountInfo = null;
    }

    var loginSamsungAccount = function(currentPage) {
		let deferred = Q.defer();
		let serviceID = '4fb7fnf3np';
        let loginRUL = 'https://account.samsung.com/mobile/account/check.do?serviceID=' + serviceID + '&actionID=StartOAuth2&languageCode=en&accessToken=Y';


        let win = new BrowserWindow({width:450, useContentSize: true, show: false, autoHideMenuBar: true, webPreferences: {nodeIntegration: false}});
        
        win.webContents.addListener('did-start-loading', () => {
            win.hide();
            currentPage.getView().loadingStart();
		});

        win.webContents.addListener('did-stop-loading', () => {
            let currentUrl = win.webContents.getURL();
            currentPage.getView().loadingStop();
            if (true == currentUrl.includes('access_token=') && true == currentUrl.includes('userId=')) {

				// get access token
				let start = currentUrl.indexOf('access_token=') + new String('access_token=').length;
				let end = currentUrl.indexOf('&', start);
				let accessToken = currentUrl.substring(start,end);

				// get user ID
				start = currentUrl.indexOf('userId=') + new String('userId=').length;
				end = currentUrl.indexOf('&', start);
				let userId = currentUrl.substring(start,end);

				// get user Email
				start = currentUrl.indexOf('inputEmailID=') + new String('inputEmailID=').length;
				end = currentUrl.indexOf('&', start);
                let userEmail = currentUrl.substring(start,end).replace('%40','@');

				deferred.resolve({
					accessToken: accessToken,
					userId: userId,
					userEmail: userEmail
				});
                return;
            }
            win.show();
        });

		win.loadURL(loginRUL);
		return deferred.promise;
	}

    return {
        handleCommand: function() {
            profileHandler = new ProfilesHandler();
            PageObject.addFinishListener(() => destroyAllPage());

            showProfileView();
        }
    }
})();
module.exports = samsungCertificate;
