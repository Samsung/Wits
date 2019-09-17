# Wits

Wits is a development tool to help run your Tizen web application on your **2017+ Samsung TV** during development.

It is the fastest way to get your local code running on device during development. Saving you from having to build, package, and reinstall your app each time you want to see how it will run on device. We call it a `LIVE RELOAD`.

**Wits is a help to continue your developing context.**

<img src="https://user-images.githubusercontent.com/11974693/50271217-70b46280-0477-11e9-897b-7060f3a25fa2.jpg" width="100%" title="Wits">

## System Requirements

Wits needs the following prerequisites on your local development machine.

1. `Terminal` on MacOS / Linux or `PowerShell` on Windows

2. You must have Node.js (we recommend v7.10.1 for Wits) and Git installed on your system. We will not describe how to do these installations as there are many ways to do it and its developer preference. We recommend using something like `nvm` or `asdf` to manage different versions of Node.js across your code projects.

4. Install the Latest Version of [Samsung Tizen Studio](http://developer.samsung.com/tv).

5. Wits requires the Tizen Studio CLI binaries added to your `$PATH` for access to the `tizen` and `sdb` command-line utilities.
    * For **bash**:
      ~~~ bash
      $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.bash_profile
      $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.bash_profile
      ~~~
    * For **Ubuntu Desktop**:
      ~~~ bash
      $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.bashrc
      $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.bashrc
      ~~~
    * For **Zsh**:
      ~~~ zsh
      $ echo 'export PATH="$HOME/tizen-studio/tools/ide/bin:$PATH"' >> ~/.zshrc
      $ echo 'export PATH="$HOME/tizen-studio/tools:$PATH"' >> ~/.zshrc
      ~~~
    * For **Fish shell**:
      ~~~ fish
      $ set -Ux fish_user_paths $HOME/tizen-studio/tools/ide/bin $fish_user_paths
      $ set -Ux fish_user_paths $HOME/tizen-studio/tools $fish_user_paths
      ~~~

## Installing and Configuring Wits

1. Clone the Wits repository to your machine.

	~~~sh
	$ git clone https://github.com/Samsung/Wits.git
	~~~

2. Install Wits Dependencies
	~~~ bash
	$ cd ~/path-to/Wits
	$ npm install
	~~~

3. Modify `profileInfo.json` within the `Wits` directory.

    Configure the Tizen Studio Certificate Profile Name and the path to your `profiles.xml`.

    You can modify and run the following command on `MacOS` to set this to the default.

    ~~~ bash
    $ cd ~/path-to/Wits
    $ echo `{
      "name": "my-certificate-profile",
      "path": "$HOME/tizen-studio-data/profile/profiles.xml"
    }` >> profileInfo.json
    ~~~

    The default `path` on `MacOS` should be `/Users/my-mac-username/tizen-studio-data/profile/profiles.xml` and on `Windows` `C:/tizen-studio-data/profile/profiles.xml`.

    The `name` should be your pre-configured certificate profile name found in one of these locations:
		
    - **Tizen Studio (Recommended)** `Tools > Certificate Manager > Certificate Profile (Actived one)`
    - **Tizen TV SDK 2.4 (legacy)** `window > Preferences > Tizen SDK > Security Profiles`

    If your `profiles.xml` is not in one of the default locations, you may have it in the following legacy location.
    
    - **Tizen TV SDK 2.4 (legacy)** `/<yourWorkspace>/.metadata/.plugins/org.tizen.common.sign/profiles.xml`

## Running Your App

Write your application path(html, js and css files for your project) in the `connectionInfo.json` file. The contents of this directory will be copied to the TV that Wits is configured for. 

Each time you make a change in `your application path`, Wits will RELOAD your application on the TV instantly.

### Configuring the Connection
You may change the directory that Wits uses to serve your app in the `connectionInfo.json` file within the Wits directory.

You may configure Wits to listen to multiple paths for changes.

```js
// connectionInfo.json
{
	...
	"baseAppPaths": [
      "www",
      "my-app",
      "C:\YourProject\YourApp"
	],
	...
}
```

### Configure Wits to Ignore Files

Sometimes there are files you do not want Wits to copy to your TV device such as your apps `src` directory or `node_modules`.

For this, add a `.witsignore` to the base of your `www` or code directory.

This works the same as `.gitignore`.

Example of `.witsignore`:
~~~text
node_modules
.git
src
~~~

### Launching Wits on your TV

To launch the Wits container on your Samsung TV you will need to ensure Developer Mode is enabled on the device.

#### Enabling Developer Mode on Samsung TV
1. With your Samsung Remote, press the `Home` button.
2. Navigate to the `Apps` button and press `Enter/OK`.
3. When on the `Apps` screen, press `1` `2` `3` `4` `5` in order on the remote to open the `Developer Mode Dialog`.  If this doesn't work, try it again.
4. When the Developer Mode Dialog appears, toggle the switch to `On` and enter the IP address of your development machine.

#### Start Wits from your Development Machine

You will need to know the IP address of the TV.
Get this from the `Settings > General > Network Status` on your Samsung TV screen using the Samsung Remote.

Now, within the Wits project directory on your computer run `npm start` to start it up and deploy it to your TV.

~~~bash
$ cd ~/path-to/Wits
$ npm start
~~~

You will be prompted to confirm each field in `connectionInfo.json` before the app installs. Simply press `Enter/Return` if the default is to be used.  


The results when you're finished should look similar to the following:

```bash
? Input your Application Path : www
? Input your Application width (1920 or 1280) : 1920
? Input your TV Ip address(If using Emulator, input 0.0.0.0) : 10.8.83.8
? Input your port number : 8498
? Do you want to launch with chrome DevTools? :  Yes
```

### Debugging with Google Chrome DevTools

After running `npm start` in the previous step, one of the prompts will ask `Do you want to launch with chrome DevTools?`.  Answer `Yes` or press `Enter` if default.

- A Google Chrome window should have opened after your app installs on the TV.
- Click the address link on the page.
- This opens a DevTools window.
- In console tab, change the value of Execution Context Selector `top` to `ContentHTML`.

![change-to-iframe](https://user-images.githubusercontent.com/24784445/63758009-14eb8480-c8f6-11e9-9f8a-cff2b282e5cc.gif)

## The Wits Project Structure

```
    ./
     |-tizen/ ................ Wits project
     |-www/ .................. Your Tizen web Application
     |-app.js ................ Node script for running Wits
     |-connectionInfo.json ... Recently connected Information which has application width and TV Ip address.
     |-package.json .......... npm package configuration
     '-README.md ............. Introduce Wits file.
```

## Supported Platforms

*  2017 Samsung Smart TV (Tizen 3.0)
*  2018 Samsung Smart TV (Tizen 4.0)
*  2019 Samsung Smart TV (Tizen 5.0)
