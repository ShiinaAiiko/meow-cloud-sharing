package socketioMiddleware

import (
	"encoding/base64"
	"encoding/json"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/encryption"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	sso "github.com/cherrai/saki-sso-go"
)

// 解密Request
func Decryption() nsocketio.HandlerFunc {
	return func(e *nsocketio.EventInstance) (err error) {
		log.Info("-----Decryption-----")
		var res response.ResponseProtobufType
		res.Code = 10008
		enDataMap := e.GetParamsMap("data")
		enProtobufData := enDataMap["data"].(string)
		// requestId := c.GetParamsString("requestId")
		// log.Info("en requestId", requestId)
		// c.Set("requestId", requestId)

		// log.Info("enData", enProtobufData)
		if enProtobufData == "" {
			res.Code = 10002
			res.CallSocketIo(e)
			return
		}
		var userAesKey *encryption.UserAESKey
		aes := cipher.AES{
			Key:  "",
			Mode: "CFB",
		}
		// log.Info("DecryptionSoc中间件", enProtobufData)
		dataBase64, dataBase64Err := base64.StdEncoding.DecodeString(enProtobufData)
		if dataBase64Err != nil {
			res.Data = "[Encryption]" + dataBase64Err.Error()
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}
		data := new(protos.RequestEncryptDataType)
		deErr := protos.Decode(dataBase64, data)
		if deErr != nil {
			res.Data = "[Encryption]" + deErr.Error()
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}

		// log.Info("开始处理加密内容", 1, data.Data, 2, data.Key, 3, data.TempAesKey)
		getAesKey := conf.EncryptionClient.GetUserAesKeyByKey(conf.Redisdb, data.Key)
		if getAesKey == nil {
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}
		userAesKey = getAesKey
		aes.Key = getAesKey.AESKey
		e.Set("userAesKey", userAesKey)

		ui := e.GetSessionCache("userInfo")
		if ui == nil {
			res.Code = 10004
			res.CallSocketIo(e)
			return
		}

		userInfo := ui.(*sso.UserInfo)
		deviceId := e.GetSessionCache("deviceId").(string)

		// log.Info(userAesKey, userInfo, userAesKey.Uid != userInfo.Uid || userAesKey.DeviceId != userInfo.UserAgent.DeviceId)
		if userAesKey.Uid != userInfo.Uid || userAesKey.DeviceId != deviceId {
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}
		deStr, deStrErr := aes.DecryptWithString(data.Data, "")
		if deStrErr != nil {
			res.Data = "[Encryption]" + deStrErr.Error()
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}
		var dataMap map[string]interface{}
		unErr := json.Unmarshal(deStr.Byte(), &dataMap)
		if unErr != nil {
			res.Data = "[Encryption]" + unErr.Error()
			res.Code = 10008
			res.CallSocketIo(e)
			return
		}
		for key, item := range dataMap {
			e.Set(key, item)
		}

		e.Next()
		return
	}
}
