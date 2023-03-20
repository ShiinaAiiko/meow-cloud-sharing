#! /bin/bash
name="meow-cloud-sharing-server"
port=16102
branch="main"
configFilePath="config.dev.ubuntu.json"
# configFilePath="config.pro.json"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("exec stop gitpull protos dockerremove start dockerlogs")

gitpull() {
  echo "-> 正在拉取远程仓库"
  git reset --hard
  git pull origin $branch
}

dockerremove() {
  echo "-> 删除无用镜像"
  docker rm $(docker ps -q -f status=exited)
  docker rmi -f $(docker images | grep '<none>' | awk '{print $3}')
}

start() {
  echo "-> 正在启动「${name}」服务"
  # gitpull
  dockerremove

  echo "-> 正在准备相关资源"
  cp -r ../protos $DIR/protos_temp
  cp -r ~/.ssh $DIR
  cp -r ~/.gitconfig $DIR

  echo "-> 准备构建Docker"
  docker build -t $name $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') . -f Dockerfile.multi
  rm -rf $DIR/.ssh
  rm -rf $DIR/.gitconfig
  rm -rf $DIR/protos_temp

  echo "-> 准备运行Docker"
  docker stop $name
  docker rm $name
  docker run \
    -v $DIR/$configFilePath:/config.json \
    -v $DIR/certs:/certs \
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
  cp -r ../protos $DIR/protos_temp
  cd ./protos_temp && protoc --go_out=../protos *.proto

  rm -rf $DIR/protos_temp

  echo "-> 编译Protobuf成功"
}

dockerlogs() {
  docker logs -f $name
}

exec() {
  docker exec -it $name /bin/sh
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"
