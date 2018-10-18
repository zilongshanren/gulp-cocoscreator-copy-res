'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const gutil = require('gulp-util');

const mkdirp = require('mkdirp');

var rimraf = require('rimraf');

var getDirName = require('path').dirname;

function writeFile(path, contents, cb) {
  mkdirp(getDirName(path), function (err) {
    if (err) return cb(err);

    fs.writeFile(path, contents, cb);
  });
}


function getSceneJsonFile (settings, sceneName) {
    var scenes = settings.scenes;
    var loginSceneUUid;
    for (var i = 0; i< scenes.length; ++i) {
        var obj = scenes[i];
        if (obj.url === sceneName) {
            // console.error(obj.uuid);
            loginSceneUUid = obj.uuid;
            break;
        }
    }


   // loginSceneUUid = settings.uuids[loginSceneUUid];

    var loginSceneJsonUUid;
    var packedAssets = settings.packedAssets;
    var packedAssetsKeys = Object.keys(packedAssets);
    for (var i = 0; i < packedAssetsKeys.length; ++i) {
        var key = packedAssetsKeys[i];
        var packedAssetsArray = packedAssets[key];
        for (var j = 0; j < packedAssetsArray.length; ++j) {
            if (packedAssetsArray[j] === loginSceneUUid) {
                // console.log(key);
                loginSceneJsonUUid = key;
                break;
            }
        }
    }

    var jsonPathNoMd5NoExt = loginSceneJsonUUid.substring(0,2) + "/" + loginSceneJsonUUid;
    var jsonPathNoMd5 = jsonPathNoMd5NoExt + ".json";
    // console.log(jsonPathNoMd5);
    let md5Value = settings.md5AssetsMap.import[settings.md5AssetsMap.import.indexOf(loginSceneJsonUUid)+1];
    var jsonPathWithMd5 = jsonPathNoMd5NoExt + "." + md5Value + ".json";
    var sceneJsonpath = 'res/import/' + jsonPathWithMd5;
    // console.log(sceneJsonpath);
    return sceneJsonpath;
}

function getAllSceneImgMina (settings) {
    const codeRawResList = [
        'assets/RawResources/UITexture/Login/Loading_Bk.png',
        'assets/RawResources/UITexture/Login/Loading_Pic2.png',
        'assets/RawResources/UITexture/Login/login_BK.jpg',
        'assets/RawResources/UITexture/Login/logo.png',
        'assets/RawResources/UITexture/Login/Btn_Play.png',
        'assets/RawResources/UITexture/Login/Play_Bottom.png',
        'assets/RawResources/UITexture/Login/Selected_Bottom.png',
        'assets/RawResources/UITexture/Login/Selected_Icon.png',
        'assets/RawResources/UITexture/Login/Loading_Bk2.png',
        'assets/RawResources/UITexture/Login/XCX_Share_Tips.png',
        'assets/RawResources/UITexture/Login/Mask.png',
        'assets/RawResources/UITexture/Login/XCX_Commond_Loading_Pic.png',
                            ];
    const codeRawInternalList = ['internal/image/default_btn_disabled.png',
                                 'internal/image/default_btn_normal.png',
                                 'internal/image/default_btn_pressed.png'];
    var resList = [];
    var ExtnameRegex = /(\.[^.\n\\/]*)$/;

    let allPaths = Object.keys(settings.rawAssetMap);

    codeRawResList.forEach ( (url) => {
        let realPath = '';
        let suffix = url.substring(url.lastIndexOf('.'));
        for (let i = 0; i < allPaths.length; ++i) {
            let item = allPaths[i];
            if (item.includes(url)) {
                let uuid = settings.rawAssetMap[item][0];
                let compressedUUidIndex = settings.uuids.indexOf(settings.rawAssetMap[item][1]);
                let md5 = settings.md5AssetsMap['raw-assets'][settings.md5AssetsMap['raw-assets'].indexOf(compressedUUidIndex) + 1];
                realPath = 'res/raw-assets/' + uuid.substring(0,2) + '/' + uuid + '.' + md5 + suffix;
                resList.push(realPath);
            }
        }
    })

    codeRawInternalList.forEach ( (url) => {
        let realPath = '';
        let suffix = url.substring(url.lastIndexOf('.'));
        for (let i = 0; i < allPaths.length; ++i) {
            let item = allPaths[i];
            if (item.includes(url)) {
                let uuid = settings.rawAssetMap[item][0];
                let compressedUUidIndex = settings.uuids.indexOf(settings.rawAssetMap[item][1]);
                let md5 = settings.md5AssetsMap['raw-assets'][settings.md5AssetsMap['raw-assets'].indexOf(compressedUUidIndex) + 1];
                realPath = 'res/raw-assets/' + uuid.substring(0,2) + '/' + uuid + '.' + md5 + suffix;
                resList.push(realPath);
            }
        }
    })

    // console.log(resList);
    return resList;
}

function copySceneAssetsFilesMina (settings) {
    const resList = [];
    var loginSceneName = "db://assets/scenes/LoginScene.fire";
    resList.push(getSceneJsonFile(settings, loginSceneName));
    // var mainSceneName = 'db://assets/scenes/ChooseUI_ChooseMainUI.fire';
    // resList.push(getSceneJsonFile(settings, mainSceneName));
    console.log(resList);

    //copy from dist/cdn to mina directory
    Array.prototype.push.apply(resList, getAllSceneImgMina(settings));
    console.log(resList);

    rimraf('./src/mina/res', function () {
        for (let i = 0; i < resList.length; ++i) {
            let destFilePath = './src/mina/' + resList[i];
    
            try {
               // mkdirp.sync(path.dirname(destFilePath));
                const data = fs.readFileSync(path.join('./dist/cdn/', resList[i]));        
                //fs.writeFileSync(destFilePath, data);
                writeFile(destFilePath, data, function () {
                    console.log("write file " + destFilePath + " successfully!");
                });
            } catch (e) {
                console.log('write file ' + destFilePath + ' failed!' + e.message);
            }
          
        }
    });    

  
   
   
    //write back to settings.js
    return resList;
}


module.exports = ({
    src,
    dest,
    settingsDest
} = {}) => {
    return () => {
        if (!src || !dest || !settingsDest) return Promise.reject(new Error('缺少参数'));

        // 资源存放路径
        const rawPath = `${src}/res/raw-assets`;
        // json存放路径
        const importPath = `${src}/res/import`;
        const internalPath = `${src}/res/raw-internal`;
        // setting.js文件路径
        const settingsPath = `${src}/src/settings.js`;

        const assetMapPath = `${src}/src/assetMap.js`;

        // 资源md5前后的一个map, 保存的是文件的路径和新的 md5 的文件的路径的映射
        const assetsMap = {};

        // 将资源存放到新的文件夹
        function mkWebPath(path) {
            const _path = path.split('/res/');
            _path[0] = dest;
            return _path.join('/res/');
        }


        function appendMD5ToFileSuffix(file, writePath) {
            const data = fs.readFileSync(path.join(writePath, file));
            const hash = crypto.createHash('md5');

            let md5 = hash.update(data).digest('hex');
            const _md5 = md5.slice(0, 5);

            const i = file.lastIndexOf('.');
            const newFile = ~i ? `${file.slice(0, i)}.${_md5}${file.slice(i)}` : `${file}.${_md5}`;
            // 新文件放到web文件夹下
            // 不对build产生负作用，可重复跑gulp任务
            let webFile = `${mkWebPath(writePath)}/${newFile}`;

            try {
                mkdirp.sync(path.dirname(webFile));
                fs.writeFileSync(webFile, data);
            } catch (err) {
                gutil.log(`\x1B[31m[MD5 ASSETS] write file error: ${err.message}\x1B[0m`);
            }

            return _md5;
        }

        /**
         * 遍历文件目录
         */
        function walkDirectory(dir, file_list) {
            let files = fs.readdirSync(dir);
            file_list = file_list || [];
            files.forEach(function(file) {
                let filePath = dir + "/" + file;
                if (fs.statSync(filePath).isDirectory()) {
                    file_list = walkDirectory(filePath, file_list);
                } else {
                    file_list.push(dir + "/" + file);
                }
            });
            return file_list;
        }

        function handleAssets(settingsJson) {
            gutil.log('\x1B[32m[MD5 import json ASSETS] start...\x1B[0m');

            copySceneAssetsFilesMina(settingsJson);

            //copy all assets to mina

            gutil.log('\x1B[32m[MD5 import json ASSETS] all done!\x1B[0m');
        }

        return new Promise(resolve => {
            global.window = {};
            const prefix = 'window._CCSettings=';

            let settings = fs.readFileSync(settingsPath, {
                encoding: 'utf8'
            });
            let rawAssetMap = fs.readFileSync(assetMapPath, {
                encoding: 'utf8'
            });
            rawAssetMap = eval(rawAssetMap);

            let appendFunc = settings.match(/\(function.*$/)[0];
            settings = settings.replace(new RegExp('\\(function.*'), '');

            settings = eval(settings);

            settings.rawAssetMap = rawAssetMap;


            handleAssets(settings);

            fs.writeFileSync(settingsDest, prefix + JSON.stringify(settings) +';' + appendFunc);

            // fs.writeFileSync(settingsDest, `${prefix} = ${JSON.stringify(settings, null, 4).replace(/"([a-zA-Z]+)":/gm, '$1:')}`);

            resolve();
        });
    };
};
