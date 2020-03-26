# WITs

WITs is a useful development tool for helping to run and develop your Tizen web application easily on your 2017+ Samsung TV. It is the fastest way to get your local code running on the TV device during development. Saving you from having to build, package, and reinstall your application every time you want to see how it will run on device. We call it a LIVE RELOAD. WITs is helpful to continue your developing context.

<img src="https://user-images.githubusercontent.com/11974693/73414912-a2267f80-4353-11ea-9685-fefb09d8e6b5.jpg" width="100%" title="Wits">

## System Requirements

WITs needs the following prerequisites on your local development machine.

1. Open **`Terminal` on MacOS / Linux** or **`CMD` / `PowerShell` on Windows**

2. Install Node.js and Git (recommend v7.10.1 for WITs)
   We will not describe how to do these installations as there are many ways to do it and its developer preference. We recommend using something like `nvm` or `asdf` to manage different versions of Node.js across your code projects.

3. Install the Latest Version of [Samsung Tizen Studio](http://developer.samsung.com/tv).

4. Tizen Studio CLI binaries should be added to your `$PATH` for accessing to `tizen` and `sdb` command-line utilities.
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

## Installing and Configuring WITs

1. Clone the WITs repository to your machine.

    ```sh
    $ git clone https://github.com/Samsung/Wits.git
    ```

2. Install WITs Dependencies

    ```bash
    $ cd ~/{path-to}/Wits
    $ npm install
    ```

3. Modify `profileInfo.json` within `WITs` directory.

    Configure Tizen Studio Certificate Profile `Name` and the `path` of your profiles.xml to `profileInfo.json`.
    You can modify and run the following command on `MacOS` to set this as a default.

    ```bash
    $ cd ~/{path-to}/Wits
    $ echo `{
      "name": "my-certificate-profile",
      "path": "$HOME/tizen-studio-data/profile/profiles.xml"
    }` >> profileInfo.json
    ```

    The default `path` on `MacOS` should be `/Users/my-mac-username/tizen-studio-data/profile/profiles.xml` and on `Windows` `C:/tizen-studio-data/profile/profiles.xml`.

    The `name` should be your pre-configured certificate profile name found in one of following locations:

    - **Tizen Studio (Recommended)** `Tools > Certificate Manager > Certificate Profile (Actived one)`
    - **Tizen TV SDK 2.4 (legacy)** `window > Preferences > Tizen SDK > Security Profiles`

    If your `profiles.xml` is not exist in one of the default locations, you may have it in the following legacy location.

    - **Tizen TV SDK 2.4 (legacy)** `/<yourWorkspace>/.metadata/.plugins/org.tizen.common.sign/profiles.xml`

## Running Your App

Default user app path is `www`. If you want to use it, only what to do is put your tizen web application within `~/{path-to}/Wits/www` directory.
If you want to use another path, you can write your app directory path in `connectionInfo.json` manually.
The contents of the directory which is configured in `connectionInfo.json` are copied to the TV.

Every time you make changes on your tizen app project, It is reflected to TV device instantly.
We call it `Live Reload` feature.

### Configuring the Connection

WITs can be configured for multiple paths.
You can write paths in `connectionInfo.json` to make WITs listen respectively.

-   on `Windows` and `MacOS`, **WITs** recognises path segment only one separator(**`/`**).

```js
// connectionInfo.json
{
	...
	"baseAppPaths": [
      "www",
      "my-app",
      "C:/YourProject/YourApp"
	],
	...
}
```

### Configure WITs to Ignore Files

Sometimes there are a few files what you do not want to push to your TV device such as your apps `src` directory or `node_modules`.
If you input unnecessary files or directories on .witsignore file before pushing files to the TV device, It would be pushed except them to your TV.

For this, add a `.witsignore` to the root of your `www` or your project directory which is already configured in `connectionInfo.json`.
You can use it optionally. This works exactly same as `.gitignore`.

Example of `.witsignore`:

```text
node_modules
.git
src
```

### Launch WITs on your TV

In order to launch WITs container on your Samsung TV, enabled Developer Mode is required on the device.

#### Enable Developer Mode on Samsung TV

1. With your Samsung Remote, press the `Home` button.
2. Navigate to the `Apps` button and press `Enter/OK`.
3. When on the `Apps` screen, press `1` `2` `3` `4` `5` in order on the remote to open the `Developer Mode` Dialog. If this doesn't work, try it again.
4. When the `Developer Mode` Dialog appears, toggle the switch to `On` and enter the IP address of your development machine.

#### Start WITs from your Development Machine

If you want to know the IP address of your TV.
Get it from `Settings > General > Network > Network Status > IP settings` on your TV using the Samsung Remote controller.

Now, within WITs project directory on your terminal run `npm start` to start it up and deploy it to your TV.

```bash
$ cd ~/{path-to}/Wits
$ npm start
```

You are prompted to confirm each field in `connectionInfo.json` before the app installs. Simply press `Enter/Return` if the default values are available.

```bash
? Input your Application Path : www
? Input your Application width (1920 or 1280) : 1920
? Input your TV Ip address(If using Emulator, input 0.0.0.0) : 10.8.83.8
? Input your port number : 8498
? Do you want to launch with chrome DevTools? :  Yes
```

### Debugging with Google Chrome DevTools

After running `npm start` in the previous step,
one of the prompts asks `Do you want to launch with chrome DevTools?`.
If you want to use Google Chrome DevTools for debugging, you can answer `Yes` or press `Enter`.

-   A Google Chrome browser is opened.
-   Click the address link on the page.
-   It opens a DevTools window.
-   In console tab, change the value of Execution Context Selector `top` to `ContentHTML`.

![change-to-iframe](https://user-images.githubusercontent.com/24784445/63758009-14eb8480-c8f6-11e9-9f8a-cff2b282e5cc.gif)

## The WITs Project Structure

```
    ./
     |-tizen/ ................ WITs project
     |-www/ .................. Your Tizen web Application
     |-app.js ................ Node script for running WITs
     |-connectionInfo.json ... Recently connected Information
     |-package.json .......... npm package configuration
     '-README.md ............. Manual for WITs file
```

## Supported Platforms

-   2017 Samsung Smart TV (Tizen 3.0)
-   2018 Samsung Smart TV (Tizen 4.0)
-   2019 Samsung Smart TV (Tizen 5.0)
