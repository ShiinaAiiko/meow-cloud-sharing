package conf

import (
	"time"

	"github.com/cherrai/nyanyago-utils/nredis"
)

var Redisdb *nredis.NRedis

var BaseKey = "meow-whisper"

var RedisCacheKeys = map[string]*nredis.RedisCacheKeysType{
	"SFUCallToken": {
		Key:        "SFUCallToken",
		Expiration: 5 * 60 * time.Second,
	},
	"User-AESKey": {
		Key: "User-AESKey",
		// Expiration: 8 * time.Second,
		Expiration: 30 * 60 * time.Second,
	},
}
