# Wits

Wits for Your Samsung SMART TV web application development.

It will saved your development times and bring pleasure of developing out.

**Using Wits, You can instantly RELOAD your app's JavaScript/CSS code instead of reinstalling your app every time you make a change.**

<img src="https://user-images.githubusercontent.com/11974693/50271217-70b46280-0477-11e9-897b-7060f3a25fa2.jpg" width="100%" title="Wits">

To do so, run "npm start" from Wits.

For using Wits, Please refer to the followings.

# Project Structure
```
    ./
     |-tizen/ ................ Wits project
     |-www/ .................. Your Tizen web Application
     |-app.js ................ Node script for running Wits
     |-connectionInfo.json ... Recently connected Information which has application width and TV Ip address.
     |-package.json .......... npm package configuration
     '-README.md ............. Introduce Wits file.
```
# Supported Platforms
*  2017 Samsung Smart TV (Tizen 3.0)
*  2018 Samsung Smart TV (Tizen 4.0)
*  2019 Samsung Smart TV (Tizen 5.0)
# How to Build

## Precondition
First, Wits needs the followings. Please install these.

* [nodejs](https://nodejs.org/) **(Optimized Version v7.10.1)**
* [git](https://git-scm.com/)
* [Samsung Tizen Studio](http://developer.samsung.com/tv) **(Recommend Using The Latest Tizen Studio Version)**
* Command Line Interface
* Set the `PATH` of environment variables.

	* For use a Wits as a command line tool, then set "tizen" and "sdb" globally command.<br>
	To do so, You must add there installed path in the PATH which is one of the environment variables. 
		- For "tizen" command
			```./
			tizen-studio/tools/ide/bin
			```
		- For "sdb" command
			```./
			tizen-studio/tools
			```
* Set the Samsung Tizen TV to **DEVELOP MODE**.
	* Run Developer pop-up. (Press 1 2 3 4 5 keys in Apps)
	* Input your PC IP address.
	* reboot TV.

## git clone & install dependencies modules.

* `git clone` the Wits repository.

	```sh
	$ git clone https://github.com/Samsung/Wits.git
	```
* Install dependencies modules in Wits.

	```sh
	$ cd Wits
	$ npm install
	```
* Modify profileInfo.json

	Fill out your profile name and path for Tizen Web application package.

	```js
	{
		"name": "<yourprofileName>",
		"path": "C:/tizen-studio-data/profile/profiles.xml"
	}
	```

	- Check your profilePath
		* Case 1. Tizen TV SDK 2.4 (previous version) :

			`/<yourWorkspace>/.metadata/.plugins/org.tizen.common.sign/profiles.xml`
		* Case 2. Tizen Studio (Recommended) :

			`C:/tizen-studio-data/profile/profiles.xml`;
	- Check your profileName
		* Case 1. Tizen TV SDK 2.4 (previous version) : 

			`window > Preferences > Tizen SDK > Security Profiles`
		* Case 2. Tizen Studio (Recommended) :

			`Tools > Certificate Manager > Certificate Profile (Actived one)`
			
## Set Your Tizen web applications path on `baseAppPaths` property in connectionInfo.json file.

As a Tizen web application developer, the most of your code and assets should be placed here, such as .html .css .js and config.xml files.<br>
They will be copied to the TV that Wits is prepared. In this folder, every time you make a change, Wits can RELOAD your application instantly.<br>
The baseAppPaths is array type and be supported absolute / relative path, defalut value is `www` folder which Wits contains.

* on `Windows` and `Mac OS`, **Wits** recognize path segment only one separator(**`/`**).
	```js
	{
		...
		"baseAppPaths": [
		"www",
		"C:/YourProject/YourApp"
		],
		...
	}
	```
## Set `.witsignore` in Your Tizen web application.

Wits supported to ignore directory in your Tizen web application using `.witsignore` file.<br>
If you create a file in your Tizen web application `.witsignore`, Wits uses it to determine which directories to ignore,<br> before Wits project start. **This file MUST be located root** in your Tizen web application.<br>

  * `.witsignore` support relative path 
  * A blank line can serve as a separator for readablilty.
  * A slash(**`/`**) can serve as a separator for path segment. 
  	```js
	node_modules
	.git
	some/your/ignore/folder
	...
	```


## Run Wits

Run Wits on Samsung Tizen TV.

	```sh
	$ npm start
	```

## Debug your Tizen Web Application
Select the yes in the `Do you want to launch with chrome DevTools?` question.
- [Setup debug mode in your TV.](https://developer.samsung.com/tv/develop/legacy-platform-library/d44/index#Inspect-Your-Web-Application-in-Smart-TV)
- Focus the new chrome tab.
- Click the wits on page.
- In console tab, change the value of Execution Context Selector `top` to `ContentHTML`.

![change-to-iframe](https://user-images.githubusercontent.com/24784445/63758009-14eb8480-c8f6-11e9-9f8a-cff2b282e5cc.gif)



