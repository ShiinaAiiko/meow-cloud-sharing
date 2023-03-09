package main

import (
	"context"
	"os"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	mongodb "github.com/ShiinaAiiko/meow-cloud-sharing/server/db/mongo"
	redisdb "github.com/ShiinaAiiko/meow-cloud-sharing/server/db/redis"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/encryption"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/gin_service"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nredis"
	"github.com/cherrai/nyanyago-utils/saass"
	sso "github.com/cherrai/saki-sso-go"

	// sfu "github.com/pion/ion-sfu/pkg/sfu"

	"github.com/go-redis/redis/v8"
)

var (
	log = conf.Log
)

func main() {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Count}}] [{{Type}}] [{{File}}]@{{Name}}")
	nlog.SetName("mwc")
	// nlog.SetFullFileName(true)
	nlog.SetFileNameLength(20)
	nlog.SetTimeDigits(3)

	// 正式代码
	defer func() {
		log.Info("=========Error=========")
		if err := recover(); err != nil {
			log.FullCallChain(err.(error).Error(), "Error")
		}
		log.Info("=========Error=========")
	}()

	configPath := ""
	for k, v := range os.Args {
		switch v {
		case "--config":
			if os.Args[k+1] != "" {
				configPath = os.Args[k+1]
			}

		}
	}
	if configPath == "" {
		log.Error("Config file does not exist.")
		return
	}
	conf.GetConfig(configPath)

	// Connect to redis.
	redisdb.ConnectRedis(&redis.Options{
		Addr:     conf.Config.Redis.Addr,
		Password: conf.Config.Redis.Password, // no password set
		DB:       conf.Config.Redis.DB,       // use default DB
	})

	conf.Redisdb = nredis.New(context.Background(), &redis.Options{
		Addr:     conf.Config.Redis.Addr,
		Password: conf.Config.Redis.Password, // no password set
		DB:       conf.Config.Redis.DB,       // use default DB
	}, conf.BaseKey, log)
	conf.Redisdb.CreateKeys(conf.RedisCacheKeys)

	// Connect to mongodb.
	mongodb.ConnectMongoDB(conf.Config.Mongodb.Currentdb.Uri, conf.Config.Mongodb.Currentdb.Name)
	mongodb.ConnectMongoDB(conf.Config.Mongodb.Ssodb.Uri, conf.Config.Mongodb.Ssodb.Name)

	methods.InitAppList()
	methods.WatchEmailNotification()

	// SSO Init
	conf.SSO = sso.New(&sso.SakiSsoOptions{
		AppId:  conf.Config.SSO.AppId,
		AppKey: conf.Config.SSO.AppKey,
		Host:   conf.Config.SSO.Host,
		Rdb:    conf.Redisdb,
		Log:    log,
	})
	conf.SAaSS = saass.New(&saass.Options{
		AppId:      conf.Config.Saass.AppId,
		AppKey:     conf.Config.Saass.AppKey,
		BaseUrl:    conf.Config.Saass.BaseUrl,
		ApiVersion: conf.Config.Saass.ApiVersion,
	})

	// Test()
	conf.EncryptionClient = encryption.New(encryption.NewOption{
		RedisClient:     redisdb.Rdb,
		RsaKeyDelayDays: 10,
		UserAesKeyMins:  10,
		TempDataMins:    1,
	})
	// socketio_service.Init()
	gin_service.Init()

	// time.Sleep(time.Second * time.Duration(1))
	// gin_service.Init()
}
