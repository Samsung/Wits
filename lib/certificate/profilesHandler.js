const fs = require('fs');
const extensionRootPath = require('./common').extensionRootPath;
const sep = require('path').sep;
const Parser = require('xml2js').Parser;
const Builder = require('xml2js').Builder;


const profileFilePath = extensionRootPath + sep + 'resource' + sep + 'profiles.xml';

module.exports = class ProfilesHandler {
    constructor(props) {
        this.xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' ;
        this.parser = new Parser({explicitArray : false, async: false});
        this.builder = new Builder({headless: true, renderOpts:{'pretty': true, 'indent':''}});
        this.profileCache = null;
        this.init();
    }

    // Check if file existed and file access permission
    init() {
        // check profile.xml access permission
        if (fs.existsSync(profileFilePath)) {
            try {
                fs.accessSync(profileFilePath, fs.constants.R_OK | fs.constants.W_OK);
            } catch (err) {
                fs.chmodSync(profileFilePath, 666);
            }
        }
        else {
            let initContent = this.xmlHeader + '<profiles active="" version="3.1">\n' + '</profiles>';
            fs.writeFileSync(profileFilePath, initContent);
        }

        let fileData = fs.readFileSync(profileFilePath);
        this.parser.parseString(fileData, function(err, result) {
            this.profileCache = result;
        }.bind(this));
    }

    // modified data will be writen to profiles.xml only after sync() is called
    sync() {
        let updateBody = this.builder.buildObject(this.profileCache);
        fs.writeFileSync(profileFilePath, this.xmlHeader + updateBody);
    }

    getProfileNames() {
        let nameArray = new Array();
        if (this.profileCache.profiles.profile != null) {
            if (this.profileCache.profiles.profile != null) {
                if (this.profileCache.profiles.profile.length == null) { // One profile case
                    nameArray.push(this.profileCache.profiles.profile.$.name);
                }
                else {
                    this.profileCache.profiles.profile.forEach((profile) => { // Muti-Profile case
                        nameArray.push(profile.$.name);
                    });
                }
            }
        }
        return nameArray;
    }

    getActiveProfile() {
        return this.profileCache.profiles.$.active;
    }

    setActiveProfile(activeProfile) {
        this.profileCache.profiles.$.active = activeProfile;
        this.sync();
    }

    addNewProfile(profileName, authorProfile, distributorProfile) {
        let profileItems = new Array();

        profileItems.push({$:{ca: authorProfile.ca, distributor:'0', key: authorProfile.key, password: authorProfile.password, rootca: ''}});
        if (distributorProfile != null) {
            profileItems.push({$:{ca: distributorProfile.ca, distributor:'1', key: distributorProfile.key, password: distributorProfile.password, rootca: ''}});
        }
        else {
            profileItems.push({$:{ca: '', distributor:'1', key: '', password:'', rootca: ''}});
        }
        profileItems.push({$:{ca: '', distributor:'2', key: '', password:'', rootca: ''}});

        let newProfile = {
            $: {name: profileName},
            profileitem: profileItems
        }
        if (this.profileCache.profiles.profile == null) {
            this.profileCache.profiles.profile = newProfile;
        }
        else {
            if (this.profileCache.profiles.profile.length == null) {
                let profileArray = new Array();
                profileArray.push(this.profileCache.profiles.profile);
                profileArray.push(newProfile);
                this.profileCache.profiles.profile = profileArray;
            }
            else {
                this.profileCache.profiles.profile.push(newProfile);
            }
        }
        this.sync();
    }

    removeProfile(profileName) {
        if (this.profileCache.profiles.profile == null)
            return;

        if (this.profileCache.profiles.profile.length == null) {
            if (this.profileCache.profiles.profile.$.name != profileName) {
                return;
            }
            else {
                this.profileCache.profiles.profile = null;
            }
        }
        else {
            let removeIndex = this.profileCache.profiles.profile.findIndex((profile) => {
                return profile.$.name == profileName;
            })

            if (removeIndex >= 0) {
                this.profileCache.profiles.profile.splice(removeIndex, 1);
            }
        }
        this.sync();
    }

    modifyProfile(profileName, profileInfo, type) {
        if (this.profileCache.profiles.profile == null)
            return;

        let itemIndex = (type == 'author' ? 0 : 1);
        if (this.profileCache.profiles.profile.length == null) {
            if (this.profileCache.profiles.profile.$.name != profileName) {
                return;
            }
            else {
                this.profileCache.profiles.profile.profileitem[itemIndex].$.ca = profileInfo.ca;
                this.profileCache.profiles.profile.profileitem[itemIndex].$.key = profileInfo.key;
                this.profileCache.profiles.profile.profileitem[itemIndex].$.password = profileInfo.password;
            }
        }
        else {
            let modifyIndex = this.profileCache.profiles.profile.findIndex((profile) => {
                return profile.$.name == profileName;
            })

            if (modifyIndex == -1)
                return;
            
            this.profileCache.profiles.profile[modifyIndex].profileitem[itemIndex].$.ca = profileInfo.ca;
            this.profileCache.profiles.profile[modifyIndex].profileitem[itemIndex].$.key = profileInfo.key;
            this.profileCache.profiles.profile[modifyIndex].profileitem[itemIndex].$.password = profileInfo.password;
        }
        this.sync();
    }
/*
    getProfileItem(profileName, type) {
        if (this.profileCache.profiles.profile == null)
            return null;

        let itemIndex = (type == 'author' ? 0 : 1);
        if (this.profileCache.profiles.profile.length == null) {
            if (this.profileCache.profiles.profile.$.name != profileName) {
                return null;
            }
            else {
                return this.profileCache.profiles.profile.profileitem[itemIndex];
            }
        }
        else {
            let index = this.profileCache.profiles.profile.findIndex((profile) => {
                return profile.$.name == profileName;
            })

            if (index == -1)
                return null;

            return this.profileCache.profiles.profile[index].profileitem[itemIndex];
        }
    }
*/
    isProfileExist(profileName) {
        if (this.profileCache.profiles.profile == null)
            return false;

        if (this.profileCache.profiles.profile.length == null) {
            if (this.profileCache.profiles.profile.$.name != profileName) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            let index = this.profileCache.profiles.profile.findIndex((profile) => {
                return profile.$.name == profileName;
            })

            if (index == -1)
                return false;
        }

        return true;
    }
}