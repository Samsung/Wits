/*
 * Copyright 2018 Samsung Electronics Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

(function () {
    var iframeElem = null;
    var loadingElem = null;
    var pieSliceLeftElem = null;
    var pieSliceRightElem = null;
    var connectIconElem = null;
    var connectMessageElem = null;
    var socket = null;
    var iconDimTimer = null;
    var isLoadingContents = false;
    var CONTENT_PATH = '{{CONTENT_PATH}}';
    var CONTENT_SRC = '{{CONTENT_SRC}}';
    var IP = '{{HOST_IP}}';
    var PORT = '{{HOST_PORT}}';
    var CONNECTED = 'Connected';
    var DISCONNECTED = 'Disconnected';

    window.onload = function () {
        console.log('onload!!!');
        var CONNECTION_WAIT_TIME = 500;
        iframeElem = document.getElementById('contentHTML');
        loadingElem = document.getElementById('loading');
        connectIconElem = document.getElementById('connectIcon');
        connectMessageElem = document.getElementById('connectMessage');
        pieSliceLeftElem = document.getElementById('pieSliceLeft');
        pieSliceRightElem = document.getElementById('pieSliceRight');
        toggleConnectInfo(DISCONNECTED);
        runIconDimAnimation();

        if (isLaunchFromCommand()) {
            tizen.filesystem.resolve(
                CONTENT_PATH,
                function (path) {
                    path.parent.deleteDirectory(
                        path.fullPath,
                        true,
                        function () {
                            console.log('Directory Deleted');
                            connectPC();
                        },
                        function (e) {
                            console.log(
                                '[Warning]: Failed to delete directory ' +
                                    CONTENT_PATH
                            );
                            connectPC();
                        }
                    );
                },
                function (e) {
                    console.log(
                        '[Warning]: Failed to resolved ' + CONTENT_PATH
                    );
                    connectPC();
                },
                'rw'
            );
        } else {
            tizen.filesystem.resolve(
                CONTENT_PATH,
                function (path) {
                    loadingElem.innerHTML = 'loading : 100%';
                    loadingElem.style.width = '100%';
                    stopIconDimAnimation();
                    connectPC();
                    setTimeout(function () {
                        loadContent(CONTENT_SRC);
                    }, CONNECTION_WAIT_TIME);
                },
                function (e) {
                    alert('Failed to resolve Content Application');
                    tizen.application.getCurrentApplication().exit();
                },
                'r'
            );
        }
    };

    function loadContent(contentSrc) {
        var CONTENT_LOAD_WAIT_TIME = 1000;
        try {
            setTimeout(function () {
                iframeElem.src = contentSrc;
                iframeElem.style.display = 'block';
                iframeElem.onload = function () {
                    iframeElem.focus();
                    hideWitsContainer();
                };
            }, CONTENT_LOAD_WAIT_TIME);
        } catch (e) {
            console.log('Failed to load content', e);
        }
    }

    function reloadContent() {
        try {
            iframeElem.contentDocument.location.reload(true);
            iframeElem.style.display = 'block';
            iframeElem.focus();
        } catch (e) {
            console.log('Failed to reload content', e);
        }
    }

    function toggleConnectInfo(status) {
        if (status === CONNECTED) {
            connectIconElem.className = 'connected';
            connectMessageElem.innerHTML = CONNECTED;
        } else {
            connectIconElem.className = 'disconnected';
            connectMessageElem.innerHTML = DISCONNECTED;
        }
    }

    function runIconDimAnimation() {
        var ANIMATION_DURATION_TIME = 3000;
        var ANIMATION_PAUSE_TIME = 500;

        pieSliceLeftElem.className = 'slice-left slice-wrap';
        pieSliceRightElem.className = 'slice-right slice-wrap';
        iconDimTimer = setInterval(function () {
            pieSliceLeftElem.className = '';
            pieSliceRightElem.className = '';
            if (iconDimTimer) {
                setTimeout(function () {
                    pieSliceLeftElem.className = 'slice-left slice-wrap';
                    pieSliceRightElem.className = 'slice-right slice-wrap';
                }, ANIMATION_PAUSE_TIME);
            }
        }, ANIMATION_DURATION_TIME);
    }

    function stopIconDimAnimation() {
        if (iconDimTimer) {
            clearInterval(iconDimTimer);
            iconDimTimer = null;
        }
    }
    function hideWitsContainer() {
        var witsContainerElem = document.getElementById('witsContainer');
        witsContainerElem.style.display = 'none';
    }

    function isLaunchFromCommand() {
        var reqAppControl = tizen.application
            .getCurrentApplication()
            .getRequestedAppControl();

        var isFromCommand = true;

        if (reqAppControl.appControl.data) {
            console.log('reqAppControl.appControl.data');
            console.log(reqAppControl.appControl.data);
            var launchData = reqAppControl.appControl.data;
            launchData.forEach(function (item) {
                if (item.key === 'callerid') {
                    isFromCommand = false;
                }
            });
        }
        return isFromCommand;
    }

    function connectPC() {
        var url = IP + ':' + PORT;
        var options = {
            reconnection: false,
            reconnectionAttempts: 2,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 5000,
            autoConnect: false
        };

        socket = io(url, options);

        socket.on('response', function (chunk) {
            console.log('socket on::::response', chunk);
            if (chunk.rsp.status === 'connected') {
                toggleConnectInfo(CONNECTED);
                if (isLaunchFromCommand()) {
                    socket.emit('push_request');
                }
                socket.emit('watch_request', {
                    destPath: CONTENT_PATH
                });
            }
        });

        socket.on('disconnect', function () {
            console.log(' disconnect, id =  ' + socket.id);
            toggleConnectInfo(DISCONNECTED);
            socket.disconnect(true);
            socket.close();
            if (isLoadingContents) {
                alert('Failed to load Content Application');
                tizen.application.getCurrentApplication().exit();
            }
        });

        socket.on('push_progress', function (info) {
            console.log('socket on::::push_progress');
            isLoadingContents = true;
            loadingElem.innerHTML =
                'loading : ' +
                info.progressRate +
                ' (' +
                info.load +
                '/' +
                info.total +
                ')';
            loadingElem.style.width = info.progressRate;
        });

        socket.on('push_completed', function () {
            console.log('socket on::::push_completed');
            stopIconDimAnimation();
            loadContent(CONTENT_SRC);
            isLoadingContents = false;
        });

        socket.on('push_failed', function () {
            console.log('socket on::::push_failed');
            alert('Failed to load Content Application');
            tizen.application.getCurrentApplication().exit();
        });

        socket.on('changed', function () {
            reloadContent();
        });

        socket.on('remove', function (path) {
            tizen.filesystem.resolve(
                path,
                function (data) {
                    if (data.isDirectory) {
                        data.parent.deleteDirectory(
                            data.fullPath,
                            true,
                            function () {
                                console.log('Directory Deleted');
                                reloadContent();
                            },
                            function (e) {
                                console.log(
                                    'Error to Delete Directory.' + e.message
                                );
                            }
                        );
                    } else {
                        data.parent.deleteFile(
                            data.fullPath,
                            function () {
                                console.log('file Deleted');
                                reloadContent();
                            },
                            function (e) {
                                console.log(
                                    'Error to Delete file.' + e.message
                                );
                            }
                        );
                    }
                },
                function (e) {
                    console.log('Error: ' + e.message);
                },
                'rw'
            );
        });
        socket.open();
    }
})();
