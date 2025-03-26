#! /bin/bash
name="meow-cloud-sharing"
port=16101
version=1.0.0
branch="main"
# webConfigFilePath="config.linux.json"
webConfigFilePath="config.pro.web.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("unzip exec compress downloadSakiUI dockerlogs push run protos stop npmconfig install gitpull dockerremove start logs")

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
    --network host \
    -m "2048m" \
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
    -m "2048m" \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    -p $port:$port \
    --restart=always \
    -d $name

  echo "-> 整理文件资源"
  mkdir -p $DIR/build
  rm -rf $DIR/build/*
  rm -rf $DIR/build.tgz
  # docker cp $name:/build/. $DIR/build
  docker cp $name:/build.tgz $DIR/build.tgz
  stop

  # 执行ssh命令
  ./ssh.sh run
  rm -rf $DIR/build.tgz
}

stop() {
  docker stop $name
  docker rm $name
}

unzip() {
  tar -zxvf ./build.tgz -C ./
  rm -rf build.tgz
}

compress() {
  tar cvzf /app/build.tgz -C /app build
}

downloadSakiUI() {
  wget https://saki-ui.aiiko.club/packages/saki-ui-v1.0.1.tgz -O saki-ui.tgz
  tar zxvf ./saki-ui.tgz -C ./build
  rm -rf ./saki-ui* ./saki-ui.tgz
}

protos() {
  echo "-> 准备编译Protobuf"
  mkdir -p ./src/protos
  cp -r ./protos $DIR/protos_temp
  yarn protos
  rm -rf $DIR/protos_temp
  echo "-> 编译Protobuf成功"

  # cd ./server
  # ./release.sh protos
  # cd ..
}

logs() {
  docker logs -f $name
}

push() {
  git tag v$version
  git push origin v$version
}

exec() {
  echo $name
  docker exec -it $name /bin/bash
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
