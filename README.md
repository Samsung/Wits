# WITs

WITs is a useful development tool for helping to run and develop your Tizen web application easily on your **2017+ Samsung TV**.
It is the fastest way to get your local code running on the TV device during development. Saving you from having to build, package, and reinstall your application every time you want to see how it will run on device. We call it a `LIVE RELOAD`.
**WITs is helpful to continue your developing context.**

<img src="https://user-images.githubusercontent.com/11974693/73414912-a2267f80-4353-11ea-9685-fefb09d8e6b5.jpg" width="100%" title="Wits">

## Supported WITs guide in other languages

-   [简体中文](doc/README_zh_HANS.md)
-   [正體中文](doc/README_zh_HANT.md)

Always welcome, if you contribute WITs guide in your language!
Guides should be placed in "doc" directory.
Please pull-request and join it!

## Installing and Configuring WITs

### For developers using npm

#### 1. Install WITs npm globally

```sh
    $ npm install -g @tizentv/wits
```

### For developers using Git repository

#### 1. Clone WITs git repository.

```sh
    $ git clone https://github.com/Samsung/Wits.git
```

#### 2. Install WITs Dependencies

```sh
    $ cd ~/{path-to}/Wits
    $ npm install -g
```

## **System Requirements**

WITs needs the following prerequisites on your local development machine.

#### 1. Open **`Terminal` on MacOS / Linux** or **`CMD` / `PowerShell` on Windows**

#### 2. Install Node.js and Git (recommend v7.10.1 ~)

We will not describe how to do these installations as there are many ways to do it and its developer preference. We recommend using something like `nvm` or `asdf` to manage different versions of Node.js across your code projects.

#### 3. Developer Mode is enabled on your Samsung TV.

-   1 With your Samsung Remote, press the `Home` button.

-   2 Navigate to the `Apps` button and press `Enter/OK`.

-   3 When on the `Apps` screen, press `1` `2` `3` `4` `5` in order on the remote to open the `Developer Mode Dialog`. If this doesn't work, try it again.

-   4 When the Developer Mode Dialog appears, toggle the switch to `On` and enter the IP address of your development machine.

#### 4. Certification for packaging application (Tizen / Samsung)

    Certification(Tizen / Samsung) is required for packaging your tizen web application.

`Using Editor`

-   Tizen Studio
    Install the latest version of [Tizen Studio](http://developer.samsung.com/tv).

-   VSCode
    Install the latest version of [VSCode](https://code.visualstudio.com/).
    And download the extension "tizensdk.tizentv".

-   Atom
    Install the latest version of [Atom](https://atom.io/).
    And download the package "atom-tizentv-2"

`Using WITs`

-   WITs (v2.4.0 ~) supports creating a Tizen certification.
    Please do "wits -c" for making a new Tizen certification.

## WITs details

### The Project Structure for using WITs

.witsconfig.json, .witsignore files are only added at the your tizen web application.

### WITs CLI

#### `wits`

For showing which options you can use

#### `wits -i` / `wits --init`

For configuring WITs
Please note that, It should be run when you use first time on your tizen application project.
.witsconfig.json and .witsignore files are generated on your tizen app project.
After then, you can modify your information to them.

![witsi](https://user-images.githubusercontent.com/1733182/77503919-3ddef280-6ea2-11ea-9bb4-06f3cb9ebbc6.gif)

#### `wits -c` / `wits --certificate`

For creating a certification(Supported Tizen certification only).
As following steps, you can create a certification on `~/{path-to}/wits/resource/profiles.xml`.

![witsc](https://user-images.githubusercontent.com/1733182/92706471-7fe7ec00-f38f-11ea-8d47-47b13f956906.gif)

#### `wits -s` / `wits --start`

All in one. For connecting to TV, installing and launching your app and using Live Reload
If `wits -i` hasn't run before, It is not allowed to run.

```sh
# Run wits --start
$ wits -s

# Run wits --start with deviceIp. Available to switch the device Ip easily.
$ wits -s deviceIp=192.168.250.250

# Run wits --start with deviceIp. Available to switch the device Ip easily. For debugging, add --verbose option. It should be at the end of command.
$ wits -s deviceIp=192.168.250.250 --verbose
```

![witss](https://user-images.githubusercontent.com/1733182/77503927-420b1000-6ea2-11ea-88f5-49ab0c5fc227.gif)

#### `wits -w` / `wits --watch`

For connecting to TV, using Live Reload
After connecting, every time you make changes on `your tizen app project`, It is reflected to TV device instantly.

```sh
# Run wits --watch
$ wits -w

# Run wits --watch with deviceIp. Available to switch the device Ip easily.
$ wits -w deviceIp=192.168.250.250

# Run wits --watch with deviceIp. Available to switch the device Ip easily. For debugging, add --verbose option. It should be at the end of command.
$ wits -w deviceIp=192.168.250.250 --verbose
```

![witsw](https://user-images.githubusercontent.com/1733182/77503928-43d4d380-6ea2-11ea-8ece-4f5182cb7d6d.gif)

### WITs API

WITs supports the following APIs

-   [setWitsconfigInfo(WitsInfoData data)](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#setwitsconfiginfo) : This API is for setting WITs environment, It should be called before start function or watch function.
-   [start()](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#start) : This API is a sequence for building and installing your application, connecting PC and Target TV, pushing files, supporting live-reload feature.
-   [watch()](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#watch) : This API is a sequence for connecting PC and Target TV, pushing files, supporting live-reload feature. (Except for re-building and re-installing your application.)
-   [disconnect()](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#disconnect) : This API is for disconnecting communications between PC and Target TV.
-   [setOutputChannel(OutputCallback callback)](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#setoutputchannel) : This is for getting WITs' log information. The return value is integer value between 1000 and 9999, and this value will be used to unsetOutputChannel().
-   [unsetOutputChannel()](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs#unsetoutputchannel) : This is for unregistering the output callback. Call the unsetOutputChannel() with the return value of the setOutputChannel().

For detail, check whole APIs in [How to use WITs as APIs](https://github.com/Samsung/Wits/wiki/How-to-use-WITs-as-APIs).

### .witsconfig.json of WITs

For details, [Sample data for .witsconfig.json](https://github.com/Samsung/Wits/wiki/Set-Wits-Environment#data-structure-of-witsconfigjson)
on `Windows` and `MacOS` both, **WITs** recognises path segment only one separator(**`/`**).

-   **connectionInfo** (mandatory)
    -   deviceIp [string] : Device(TV) Ip address (In case of Emulator, Please input 0.0.0.0)
    -   hostIp [string] : Host(PC) Ip address
    -   width [string] : Resolution
    -   isDebugMode [boolean] : Setting true, chrome inspector is launched automatically. / Setting false, nothing happened.
-   **profileInfo** (mandatory)
    -   path [string] : Tizen Studio Certificate Profile path

### .witsignore of WITs

Sometimes there are a few files what you do not want to push to your TV device such as `.git` or `node_modules`.
If you input unnecessary files or directories on .witsignore file before pushing files to the TV device, It would be pushed except them to your TV.
You can use it optionally.
This works exactly same as `.gitignore`.

Example of `.witsignore`:

```text
node_modules
.git
deprecated
stglib
```

## FAQ

-   [WITs FAQ](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions)
-   [How to use debug mode on WITs with Chrome inspector](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions#answer-1)
-   [How to get your TV IP Address](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions#question-7)

## Supported Platforms

-   2017 Samsung Smart TV (Tizen 3.0)
-   2018 Samsung Smart TV (Tizen 4.0)
-   2019 Samsung Smart TV (Tizen 5.0)
-   2020 Samsung Smart TV (Tizen 5.5)
