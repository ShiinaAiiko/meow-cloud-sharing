#! /bin/bash
name="meow-cloud-sharing"
port=16101
version=1.0.0
branch="main"
# webConfigFilePath="config.linux.json"
webConfigFilePath="config.pro.web.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("dockerlogs push run protos stop npmconfig install gitpull dockerremove start logs")

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
  cp -r ./protos $DIR/protos_temp
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

  # echo "-> 构建成功后、复制数据出来"
  # docker cp $name:/app/build/ $DIR/server

  # echo "-> 停止运行Docker"
  # stop
  # rm

  echo "-> 整理文件资源"
  rm -rf $DIR/build/*
  docker cp $name:/dist/. $DIR/build
  stop

  cd ./server
  ./release.sh start
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

  cd ./server
  ./release.sh protos
  cd ..
}

logs() {
  docker logs -f $name
}

push() {
  git tag v$version
  git push origin v$version
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
