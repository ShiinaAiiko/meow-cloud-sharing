package encryption

import (
	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nrand"
	"github.com/cherrai/nyanyago-utils/nredis"
	"github.com/cherrai/nyanyago-utils/nstrings"
)

type UserAESKey struct {
	AESKey   string
	Uid      string
	DeviceId string
	// GenerateTime int64
}

func (e *EncryptionOption) GetUserAesKeyByDeviceId(rdb *nredis.NRedis, deviceId string) *UserAESKey {
	userAesKey := new(UserAESKey)
	rKey := rdb.GetKey("User-AESKey")
	err := rdb.GetStruct(rKey.GetKey("deviceId"+deviceId), &userAesKey)
	log.Warn("UserAesKey 获取成功", deviceId, userAesKey, err)
	if err != nil {
		log.Error(err)
		return nil
	}
	return userAesKey
}
func (e *EncryptionOption) GetUserAesKeyByKey(rdb *nredis.NRedis, key string) *UserAESKey {
	userAesKey := new(UserAESKey)
	rKey := rdb.GetKey("User-AESKey")
	err := rdb.GetStruct(rKey.GetKey("key"+key), &userAesKey)
	log.Warn("UserAesKey 获取成功", err)
	if err != nil {
		log.Error(err)
		return nil
	}
	return userAesKey
}

func (e *EncryptionOption) SetUserAesKey(rdb *nredis.NRedis, aesKeyMd5 string, uid string, deviceId string) (key string, err error) {
	rKey := rdb.GetKey("User-AESKey")

	userAesKey := UserAESKey{
		AESKey:   aesKeyMd5,
		Uid:      uid,
		DeviceId: deviceId,
		// GenerateTime: time.Now().Unix(),
	}
	log.Info(" rKey.GetExpiration()", rKey.GetExpiration())
	key = cipher.MD5(nstrings.ToString(nrand.GetRandomNum(18)))
	if err != nil {
		return
	}

	if err = rdb.SetStruct(rKey.GetKey("key"+key), &userAesKey, rKey.GetExpiration()); err != nil {
		log.Error(err)
	}
	// err = rdb.SetStruct(rKey.GetKey("uid"+nstrings.ToString(uid)), &aesKeyMd5, rKey.GetExpiration())
	if err = rdb.SetStruct(rKey.GetKey("deviceId"+deviceId), &userAesKey, rKey.GetExpiration()); err != nil {
		log.Error(err)
	}
	return
}
