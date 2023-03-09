#! /bin/bash
name="meow-cloud-sharing"
appName="meow-cloud-sharing"
port=16101
version=1.0.0
branch="main"
# configFilePath="config.dev.json"
webConfigFilePath="config.pro.web.json"
# electronConfigFilePath="config.test.json"
electronConfigFilePath="config.pro.electron.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("dockerlogs el:icon el:install el:run el:build push run protos stop npmconfig install gitpull dockerremove start logs")

# yarn --registry https://registry.npmmirror.com/
#  yarn add @nyanyajs/utils @saki-ui/core
npmconfig() {
  echo "-> 配置npm config"
  # yarn config set electron_mirror https://registry.npmmirror.com/binary.html?path=electron/
  npm config set @vue:registry $registryUrl
  npm config set @typescript-eslint:registry $registryUrl
  npm config set @babel:registry $registryUrl
  npm config set @next:registry $registryUrl
  npm config set @reduxjs:registry $registryUrl
}

install() {
  npmconfig
  rm -rf ./node_modules
  rm -rf ./yarn-error.log
  rm -rf ./yarn.lock
  yarn install
  yarn proto
}
gitpull() {
  echo "-> 正在拉取远程仓库"
  git reset --hard
  git pull origin $branch
}

dockerremove() {
  echo "-> 删除无用镜像"
  docker rm $(docker ps -q -f status=exited)
  docker rmi -f $name
  docker rmi -f $(docker images | grep '<none>' | awk '{print $3}')
}

start() {
  echo "-> 正在启动「${name}」服务"

  # gitpull
  npmconfig
  dockerremove

  echo "-> 正在准备相关资源"
  cp -r ../../protos $DIR/protos_temp
  cp -r ./$webConfigFilePath $DIR/config.pro.temp.json
  # 获取npm配置
  cp -r ~/.npmrc $DIR
  cp -r ~/.yarnrc $DIR

  echo "-> 准备构建Docker"
  docker build \
    -t $name \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    . \
    -f Dockerfile.multi
  rm $DIR/.npmrc
  rm $DIR/.yarnrc
  rm -rf $DIR/protos_temp
  rm -rf $DIR/config.pro.temp.json

  echo "-> 准备运行Docker"
  stop

  docker run \
    --name=$name \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    -p $port:$port \
    --restart=always \
    -d $name
}

stop() {
  docker stop $name
  docker rm $name
}

protos() {
  echo "-> 准备编译Protobuf"
  cp -r ./protos $DIR/protos_temp
  yarn protos
  rm -rf $DIR/protos_temp
  echo "-> 编译Protobuf成功"
}

logs() {
  docker logs -f $name
}

el:icon() {
  rm -rf $DIR/public/icons
  sudo cp -r $DIR/public/logo.png $DIR/electron/logo.png
  cd ./electron
  yarn el:icon
  cd ../

  cp -r $DIR/electron/icons $DIR/public/icons
  rm -rf $DIR/electron/logo.png
  rm -rf $DIR/electron/icons

  rm -rf $DIR/public/icons-wb
  sudo cp -r $DIR/public/logo-white-bg.png $DIR/electron/logo.png
  cd ./electron
  yarn el:icon
  cd ../

  cp -r $DIR/electron/icons $DIR/public/icons-wb
  rm -rf $DIR/electron/logo.png
  rm -rf $DIR/electron/icons
}

el:build() {
  el:icon
  # yarn el:icon

  cp -r $DIR/$electronConfigFilePath $DIR/src/config.temp.json
  yarn build_to_el

  download:saki-ui
  download:meow-apps

  cp -r ./build ./electron/build

  cd ./electron

  mkdir -p ./el-build/packages
  cp -r ./el-build/*.AppImage ./el-build/packages/
  cp -r ./el-build/*.deb ./el-build/packages/
  cp -r ./el-build/*.exe ./el-build/packages/

  rm -rf ./el-build/linux-unpacked
  rm -rf ./el-build/*.AppImage
  rm -rf ./el-build/*.deb
  rm -rf ./el-build/*.exe
  yarn el:build-win
  yarn el:build-linux
  rm -rf ./build

  # Meow Sticky Note Setup 1.0.1.exe
  # Meow Sticky Note-1.0.1.AppImage
  # meow-sticky-note_1.0.1_amd64.deb
  mv "./el-build/Meow Whisper Setup "$version".exe" \
    ./el-build/$appName-v$version-win-x64.exe
  mv "./el-build/Meow Whisper-"$version".AppImage" \
    ./el-build/$appName-v$version-linux-x64.AppImage
  mv "./el-build/meow-whisper_"$version"_amd64.deb" \
    ./el-build/$appName-v$version-linux-amd64-x64.deb

  rm -rf ./el-build/*.exe.blockmap
  cd ../

  # el:install
  # el:run
}

push() {
  git tag v$version
  git push origin v$version
}

el:install() {
  # ./release.sh el:install && ./release.sh el:run
  sudo apt remove -y ${appName}
  sudo apt install -f -y ./src/electron/el-build/*.deb
}

download:saki-ui() {
  wget https://saki-ui.aiiko.club/saki-ui.tgz
  tar zxvf ./saki-ui.tgz -C ./build
  rm -rf ./saki-ui*
}

download:meow-apps() {
  wget https://apps.aiiko.club/meow-apps.tgz
  tar zxvf ./meow-apps.tgz -C ./build
  rm -rf ./meow-apps*
}

el:run() {
  # chmod a+x ./*.AppImage
  chmod a+x ./src/electron/el-build/*.AppImage
  # ./src/electron/el-build/*.AppImage
  ${appName}
}
dockerlogs() {
  docker logs -f $name
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"

#  "dmg": {
#  	"contents": [
#  		{
#  			"x": 410,
#  			"y": 150,
#  			"type": "link",
#  			"path": "/Applications"
#  		},
#  		{
#  			"x": 130,
#  			"y": 150,
#  			"type": "file"
#  		}
#  	]
#  },
#  "mac": {
#  	"icon": "build/icons/icon.icns"
#  },
#  "win": {
#  	"icon": "build/icons/icon.ico"
#  },
