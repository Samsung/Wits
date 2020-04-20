var tizenCertificateViewControl = (function() {
    const Q = require('q');
    var PageObject = require('./views/pageObject');
    var TizenCertificateProfileView = require('./views/tizenCertificateProfileView');
    var TizenCertificateAuthorStartView = require('./views/tizenCertificateAuthorStartView');
    var TizenCertificateAuthorCreateView = require('./views/tizenCertificateAuthorCreateView');
    var TizenCertificateAuthorSelectView = require('./views/tizenCertificateAuthorSelectView');
    var TizenCertificateDistributorStartView = require('./views/tizenCertificateDistributorStartView');
    var TizenCertificateDistributorSelectView = require('./views/tizenCertificateDistributorSelectView');

    var profilePage = null;
    var authorStartPage = null;
    var authorCreatePage = null;
    var authorSelectPage = null;
    var distributorStartPage = null;
    var distributorSelectPage = null;

    var deferred = null;

    var showProfileView = function() {
        if (profilePage == null) {
            profilePage = new PageObject({
                view: new TizenCertificateProfileView({
                    onClickNextBtn: () => showAuthorStartView(),
                    onClickCancelBtn: () => profilePage.hide()
                })
            })
        }

        profilePage.show();
    }

    var showAuthorStartView = function() {
        if (authorStartPage == null) {
            authorStartPage = new PageObject({
                view: new TizenCertificateAuthorStartView({
                    onClickBackBtn: () => showProfileView(),
                    onClickNextBtn: () => {
                        if (authorStartPage.getView().isCreateNewSelected() == true) {
                            showAuthorCreateView();
                        }
                        else {
                            showAuthorSelectView();
                        }
                    },
                    onClickCancelBtn: () => authorStartPage.hide()
                })
            })
        }

        authorStartPage.show();
    }

    var showAuthorCreateView = function() {
        if (authorCreatePage == null) {
            authorCreatePage = new PageObject({
                view: new TizenCertificateAuthorCreateView({
                    onClickBackBtn: () => showAuthorStartView(),
                    onClickNextBtn: () => showDistributorStartView(),
                    onClickCancelBtn: () => authorCreatePage.hide()
                })
            })
        }

        authorCreatePage.show();
    }

    var showAuthorSelectView = function() {
        if (authorSelectPage == null) {
            authorSelectPage = new PageObject({
                view: new TizenCertificateAuthorSelectView({
                    onClickBackBtn: () => showAuthorStartView(),
                    onClickNextBtn: () => showDistributorStartView(),
                    onClickCancelBtn: () => authorSelectPage.hide()
                })
            })
        }

        authorSelectPage.show();
    }

    var showDistributorStartView = function() {
        if (distributorStartPage == null) {
            distributorStartPage = new PageObject({
                view: new TizenCertificateDistributorStartView({
                    onClickBackBtn: () => {
                        if (authorStartPage.getView().isCreateNewSelected() == true) {
                            showAuthorCreateView();
                        }
                        else {
                            showAuthorSelectView();
                        }
                    },
                    onClickNextBtn: () => {
                        if (distributorStartPage.getView().isUseDefaultSelected() == false) {
                            showDistributorSelectView();
                        }
                    },
                    onClickFinishBtn: () => finishOperation(),
                    onClickCancelBtn: () => distributorStartPage.hide()
                })
            })
        }

        distributorStartPage.show();
    }

    var showDistributorSelectView = function() {
        
        if (distributorSelectPage == null) {
            distributorSelectPage = new PageObject({
                view: new TizenCertificateDistributorSelectView({
                    onClickBackBtn: () => showDistributorStartView(),
                    onClickFinishBtn: () => finishOperation(),
                    onClickCancelBtn: () => distributorSelectPage.hide()
                })
            })
        }

        distributorSelectPage.show();
    }

    var finishOperation = function() {
        let profileViewInfo = profilePage.getView().getInfo();
        let authorViewInfo = null;
        let distributorViewInfo = null;

        if (authorStartPage.getView().isCreateNewSelected() == true) {
            authorViewInfo = {
                type: 'create',
                info: authorCreatePage.getView().getInfo()
            } 
        }
        else {
            authorViewInfo = {
                type: 'select',
                info: authorSelectPage.getView().getInfo()
            }
        }

        if (distributorStartPage.getView().isUseDefaultSelected() == true) {
            distributorViewInfo = {
                type: 'default',
                info: distributorStartPage.getView().getInfo()
            }
        }
        else {
            distributorViewInfo = {
                type: 'select',
                info: distributorSelectPage.getView().getInfo()
            }
        }

        deferred.resolve({
            profileInfo: profileViewInfo,
            authorInfo: authorViewInfo,
            distributorInfo: distributorViewInfo
        });

        if (distributorStartPage.getView().isUseDefaultSelected() == false) {
            distributorSelectPage.hide();
        }
        else {
            distributorStartPage.hide();
        }
    }

    var destroyAllPage = function() {
        profilePage = null;
        authorStartPage = null;
        authorCreatePage = null;
        authorSelectPage = null;
        distributorStartPage = null;
        distributorSelectPage = null;
    }

    return {
        showView: function() {
            deferred = Q.defer();

            PageObject.addFinishListener(() => destroyAllPage());
            showProfileView();

            return deferred.promise;
        }
    }
})();
module.exports = tizenCertificateViewControl;
