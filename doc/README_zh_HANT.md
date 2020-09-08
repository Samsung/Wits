# WITs
WITs 是一個非常有效的開發工具，很容易幫助開發屬於你的 Tizen web 項目，並支援**2017+ Samsung tv**的機型。
它可以非常快地將你開發期間的實時代碼推送到電視機上。每次您想檢視項目如何在設備上運行時，都無需經曆再次構建，打包和重新安裝應用程式。我們稱為 `實時開發`。
**WITs 對於你的開發內容有持續性幫助。**

<img src="https://user-images.githubusercontent.com/11974693/73414912-a2267f80-4353-11ea-9685-fefb09d8e6b5.jpg" width="100%" title="Wits">

## 介紹
 - [ENGLISH](/README.md)
 - [簡體中文](/doc/README_zh_HANS.md)

## 安裝與配置WITs

### 開發者請使用npm


#### 1. 全局安裝 WITs

```sh
    $ npm install -g @tizentv/wits
```

### 開發者們請使用git repository

#### 1. 克隆對應項目
```sh
    $ git clone https://github.com/Samsung/Wits.git
```

#### 2. 安裝WITs依賴

```sh
    $ cd ~/{path-to}/Wits
    $ npm install -g
```

#### 3. 在 Wits 的目錄下更改 .witsconfig.json。

Tizen Studio的證書路徑（profiles.xml）是在 **.witsconfig.json** 的 `path` 上配置,
在mac與Windows係統上預設路徑 `path` 都是 `tizen-studio-data/profile/profiles.xml` 。


## **係統要求**

WITs 需要進一步地在你在地開發機器上配置對應的的步驟。

#### 1. 打開 **`Terminal（終端器）` on MacOS / Linux** or **`CMD （命令提示符）` / `PowerShell` on Windows**

#### 2. 安裝 Node.js 和 Git (推薦 v7.10.1 ~)

我們不能很好告訴你這些安裝步驟，因為有太多方法與開發者各有自己的性能配置，但我們推薦你使用一些，例如 `nvm` 或 `asdf` 等的項目管理器去管理不同的Node.js 版本去控製你的代碼項目。


#### 3. 安裝最新的 [Samsung Tizen Studio](http://developer.samsung.com/tv).


#### 4. 打開你的Samsung電視上的開發者模式：
-   1 使用你的三星遙控器，按 `Home` 的按鍵。
-   2 移動所選到  `Apps` 的按鍵並按 `Enter/OK`。
-   3 如當前顯示`Apps` 熒幕，依次在遙控器上按`1` `2` `3` `4` `5`並同時彈出`開發模式對話框`，如果不成功或不出現，再一次嘗試。
-   4 當開發者對話框出現， 切換並點選按鈕 `On` 和 輸入你的開發機器所對應的IP位址。

## WITs 細節

###  WITs所使用的項目結構


.witsconfig.json, .witsignore 隻需這兩個文件增加到你的tizen web項目。

### WITs 命令選項


#### 1. `wits`

顯示當前可供你選擇的那些命令

#### 2. `wits -i` / `wits --init`

對於正在配置的 WITs
請留意及註意，隻需第一次運行在你的 tizen項目即可。
.witsconfig.json 和 .witsignore會同時生成並增加到你的 tizen項目。
你可以稍後修改對這些文件的配置。


#### 3. `wits -s` / `wits --start`

這命令是所有都一樣，對於連接，安裝及運行在TV都是使用實時加載。如`wits -i` 冇有在此之前運行，這個是不允許的。

#### 4. `wits -w` / `wits --watch`

對於連接TV時使用是實時加載。
在連接之後，每次你在 `你的tizen app項目`的改動文件都會即時反應同步你的電視設備。

### .witsconfig.json of WITs

細節： [關於.witsconfig.json的範例](https://github.com/Samsung/Wits/wiki/Set-Wits-Environment#data-structure-of-witsconfigjson)

無論在`Windows` 和 `MacOS`上，都必須認識到路徑的唯一符號是分隔符 (**`/`**)。


-   **connectionInfo** (必選)
    -   deviceIp [string] : 設備(TV) Ip 地址 (如是調試器，請填寫 0.0.0.0)

    -   hostIp [string] : Host(PC) Ip 地址
    -   socketPort [integer] : TV 端口. 他是由WITs隨機生成的。
    -   width [string] : 分辨率寬度
   -   isDebugMode [boolean] : 如設定為true, chrome調試器會打開並自動運行。如設定為false, 預設無動作。
-   **profileInfo** (必選)
    -   path [string] : Tizen Studio 證書路徑。
-   **optionalInfo** (可選)
    -   proxyServer [string] : 如你使用代理，例如：http://255.255.255.255:8080

### WITs的.witsignore:

有時候如果你不想將你的一些文件，例如`.git` 或 `node_modules`這類文件推送到電視或設備， 你可以通過填寫 .witsignore 文件規定這類文件格式，下次你就發現這些文件不會推送到調試的設備之上。
實現道理與`.gitignore` 一樣。

`.witsignore`的範例:

```text
node_modules
.git
deprecated
stglib
```

## 運行你的APP

如果你想一步一步按以下設定。
請關註： [Running Your App using WITs](https://github.com/Samsung/Wits/wiki/Running-Your-App-using-Wits)

### wits -i

![witsi](https://user-images.githubusercontent.com/1733182/77503919-3ddef280-6ea2-11ea-9bb4-06f3cb9ebbc6.gif)

### wits -s

![witss](https://user-images.githubusercontent.com/1733182/77503927-420b1000-6ea2-11ea-88f5-49ab0c5fc227.gif)

### wits -w

![witsw](https://user-images.githubusercontent.com/1733182/77503928-43d4d380-6ea2-11ea-8ece-4f5182cb7d6d.gif)

## FAQ

-   [WITs FAQ](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions)
-   [怎樣使用Chrome inspector的開發模式](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions#answer-1)
-   [使用proxy之後](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions#question-6)
-   [怎麼去獲取你的電視或設備IP](https://github.com/Samsung/Wits/wiki/Frequently-Asked-Questions#question-7)

## 支援的設備

-   2017 Samsung Smart TV (Tizen 3.0)
-   2018 Samsung Smart TV (Tizen 4.0)
-   2019 Samsung Smart TV (Tizen 5.0)


