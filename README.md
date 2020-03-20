# Wits

Wits is a useful development tool for helping to run and develop your Tizen web application easily on your **2017+ Samsung TV**.

It is the fastest way to get your local code running on the TV device during development. Saving you from having to build, package, and reinstall your application every time you want to see how it will run on device. We call it a `LIVE RELOAD`.

**Wits is helpful to continue your developing context.**

<img src="https://user-images.githubusercontent.com/11974693/73414912-a2267f80-4353-11ea-9685-fefb09d8e6b5.jpg" width="100%" title="Wits">

## System Requirements

Wits needs the following prerequisites on your local development machine.

1. **`Terminal` on MacOS / Linux** or **`PowerShell` on Windows**

2. Node.js and Git are required.(we recommend v7.10.1 for Wits). We will not describe how to do these installations as there are many ways to do it and its developer preference. We recommend using something like `nvm` or `asdf` to manage different versions of Node.js across your code projects.

3. Install the Latest Version of [Samsung Tizen Studio](http://developer.samsung.com/tv).

4. For using Wits, Tizen Studio CLI binaries should be added to your `$PATH` for accessing to `tizen` and `sdb` command-line utilities.
    - For **bash**:
        ```bash
        $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.bash_profile
        $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.bash_profile
        ```
    - For **Ubuntu Desktop**:
        ```bash
        $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.bashrc
        $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.bashrc
        ```
    - For **Zsh**:
        ```zsh
        $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.zshrc
        $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.zshrc
        ```
    - For **Fish shell**:
        ```fish
        $ set -Ux fish_user_paths $HOME/tizen-studio/tools/ide/bin $fish_user_paths
        $ set -Ux fish_user_paths $HOME/tizen-studio/tools $fish_user_paths
        ```

## Installing and Configuring Wits

### For developers using npm

1. Install wits npm globally

    ```sh
    npm install -g tizentv@wits
    ```

### For developers using Git repository

1. Clone Wits git repository.

    ```sh
    $ git clone https://github.com/Samsung/Wits.git
    ```

2. Install Wits Dependencies

    ```bash
    $ cd ~/{path-to}/Wits
    $ npm install
    ```

3. Modify `.witsconfig.json` within `Wits` directory.

    Configure Tizen Studio Certificate Profile `Name` and the `path` of your profiles.xml to **.witsconfig.json**

    The default `path` on `MacOS` is `/Users/{your-mac-username}/tizen-studio-data/profile/profiles.xml` and on `Windows` is `C:/tizen-studio-data/profile/profiles.xml`.

    The `name` should be your pre-configured certificate profile name which is foundable at the one of these locations:

    - **Tizen Studio (Recommended)** `Tools > Certificate Manager > Certificate Profile (Actived one)`
    - **Tizen TV SDK 2.4 (legacy)** `window > Preferences > Tizen SDK > Security Profiles`

    If your `profiles.xml` is not exist at the one of the default locations, you might have it in the following legacy location.

    - **Tizen TV SDK 2.4 (legacy)** `/{your-workspace}/.metadata/.plugins/org.tizen.common.sign/profiles.xml`

## wits details

### The Project Structure for using wits

.witsconfig.json, .witsignore files are only added at the your tizen web application.

### Wits command options

1. `wits`
    - For showing which options you can use
2. `wits -i` / `wits --init`
    - For configuring wits
      Please note that, It should be run when you use first time on your tizen application project.
      .witsconfig.json and .witsignore files are generated on your tizen app project.
      After then, you can modify your information to them.
3. `wits -s` / `wits --start`
    - All in one. For connecting to TV, installing and launching your app and using Live Reload
      If `wits -i` hasn't run before, It is not allowed to run.
4. `wits -w` / `wits --watch`
    - For conneting to TV, using Live Reload
      After connecting, every time you make changes on `your tizen app project`, It is reflected to TV device instantly.

### .witsconfig.json of Wits

```js
{
  "connectionInfo": {
    "recentlyBaseAppPath": ".",
    "baseAppPaths": [
      "."
    ],
    "width": "1920",
    "ip": "192.168.250.250",
    "port": 8498,
    "isDebugMode": false
  },
  "profileInfo": {
    "name": "yourProfileName",
    "path": "C:/tizen-studio-data/profile/profiles.xml"
  },
  "optionalInfo": {
    "proxyServer": "http://192.168.250.250:8080",
    "hostIp": "192.168.250.250"
  }
}
```

    - connectionInfo (mandatory)
        - recentlyBaseAppPath [string] : Recently using project path. Let it be as a default. Wits is mainly run on your current project ex) "."
        - baseAppPaths [array] : Paths of your working projects
        - width [string] : Resolution
        - ip [string] : TV Ip address
        - port [integer] : TV port. It is generated randomly in Wits.
        - isDebugMode [boolean] : Setting true, chrome inspector is launched automatically. / Setting false, nothing happened.
    - profileInfo (mandatory)
        - name [string] : Tizen Studio Certificate Profile name
        - path [string] : Tizen Studio Certificate Profile path
    - optionalInfo (optional)
        - proxyServer [string] : In case you are behind proxy ex) http://192.168.250.250:8080
        - hostIp [string] : Basically wits gets your pc ip address automatically, but use it in case you need to use your custom pc Ip.

    * on `Windows` and `MacOS` both, **Wits** recognises path segment only one separator(**`/`**).

### .witsignore of Wits

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

## Running Your App

Open the cli tool at your project path or move to your project path

1.  Configuration for the first time

    After running `wits -i`, you can see .witsconfig.json and .witsignore files are created at your project.

    ```sh

    $ wits -i
    Start configuration for Wits............
    .witsignore is prepared.
    .witsconfig.json is prepared.

        > [ Stored Information ]
        > baseAppPath : E:/dev/workspace/WitsTest
        > width       : 1920
        > ip          : 192.168.250.250
        > port        : 6321
        > isDebugMode : true

    ? .witsconfig.json is already exist. Do you want to use this data for running Wits? (Y/n)
    ```

2.  Open .witsconfig.json file to set your connection Information and profile Information

    ```js
    {
        "connectionInfo": {
            "recentlyBaseAppPath": ".",
            "baseAppPaths": [
            "."
            ],
            "width": "1920",
            "ip": "192.168.250.250",
            "port": 8498,
            "isDebugMode": false
        },
        "profileInfo": {
            "name": "yourProfileName",
            "path": "C:/tizen-studio-data/profile/profiles.xml"
        }
    }
    ```

3.  Turn on the TV device (Enabled Developer Mode)

    Make sure for using wits with TV device, It should be used same network as your PC one.
    Also It is required developer mode is enabled.

4.  Start wits

    Once you type wits -s, wits will do everything such as connecting to TV, installing your app, launching your app, pushing your local files, even watching your changes on your local codes.

    ```sh

    $ wits -s
    Start running Wits............

         > [ Stored Information ]
         > baseAppPath : E:/dev/workspace/WitsTest
         > width       : 1920
         > ip          : 192.168.250.250
         > port        : 1233

    ? .witsconfig.json is already exist. Do you want to use this data for running Wits? No
    ? Input your Application Path : .
    ? Input your Application width (1920 or 1280) : 1920
    ? Input your TV Ip address(If using Emulator, input 0.0.0.0) : 192.168.250.250
    ? Do you want to launch with chrome DevTools? : Yes
    ```

5.  Reconnect
    After disconnecting, if you just want to connect and use live reload feature, Just use `wits -w`

## Launching Wits on your TV

To launch the Wits container on your Samsung TV you will need to ensure Developer Mode is enabled on the device.

### Enabling Developer Mode on Samsung TV

1. With your Samsung Remote, press the `Home` button.
2. Navigate to the `Apps` button and press `Enter/OK`.
3. When on the `Apps` screen, press `1` `2` `3` `4` `5` in order on the remote to open the `Developer Mode Dialog`. If this doesn't work, try it again.
4. When the Developer Mode Dialog appears, toggle the switch to `On` and enter the IP address of your development machine.

### Get TV IP address

You need to know the IP address of the TV for connecting.
Get it from `Settings > General > Network Status` on your Samsung TV screen using the Samsung Remote controller.

## Debugging with Google Chrome DevTools

If you set isDebugMode to true,

-   A Google Chrome window should have opened after your app installs on the TV.
-   Click the address link on the page.
-   This opens a DevTools window.
-   In console tab, change the value of Execution Context Selector `top` to `ContentHTML`.

![change-to-iframe](https://user-images.githubusercontent.com/24784445/63758009-14eb8480-c8f6-11e9-9f8a-cff2b282e5cc.gif)

## FAQ

## Supported Platforms

-   2017 Samsung Smart TV (Tizen 3.0)
-   2018 Samsung Smart TV (Tizen 4.0)
-   2019 Samsung Smart TV (Tizen 5.0)
