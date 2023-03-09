package middleware

import (
	"bytes"
	"encoding/json"
	"strings"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/encryption"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/gin-gonic/gin"
)

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func Encryption() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}
		var err error
		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")
		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}
		if isRoles && roles.isHttpServer {
			var res response.ResponseProtobufType
			res.Code = 10008

			// Reponse
			// defer func() {
			// 	fmt.Println("Encryption middleware", roles.ResponseEncryption)
			// 	// 暂时全部开放
			// 	if roles.ResponseEncryption == true {
			// 		res.Encryption(c)
			// 		// fmt.Println("Response解析成功！！！！！！！！！！")
			// 	}
			// }()
			// fmt.Println("Encryption middleware.")
			// Request

			if roles.RequestEncryption {
				var userAesKey *encryption.UserAESKey
				var data string
				var key string
				var tempAesKey string

				if roles.ResponseDataType == "protobuf" {
					dataProto := new(protos.RequestEncryptDataType)
					if err = protos.DecodeBase64(c.GetString("data"), dataProto); err != nil {
						res.Error = err.Error()
						res.Code = 10002
						res.Call(c)
						c.Abort()
						return
					}

					data = dataProto.Data
					key = dataProto.Key
					tempAesKey = dataProto.TempAesKey
				} else {
					switch c.Request.Method {
					case "GET":
						data = c.Query("data")
						key = c.Query("key")
						tempAesKey = c.Query("tempAesKey")

					case "POST":
						data = c.PostForm("data")
						key = c.PostForm("key")
						tempAesKey = c.PostForm("tempAesKey")
						// fmt.Println("aeskey enc", aeskey)
					default:
						break
					}

				}
				if data == "" {
					res.Code = 10002
					res.Call(c)
					c.Abort()
					return
				}
				var dataMap map[string]interface{}
				aes := cipher.AES{
					Key:  "",
					Mode: "CFB",
				}
				// 当没有临时AES秘钥时，前端传秘钥并公钥加密
				if tempAesKey != "" && key == "" {
					// RSA私钥解密
					deKey, err := conf.EncryptionClient.RsaKey.DecryptWithString(tempAesKey, nil)
					if err != nil {
						res.Data = "[Encryption hex.DecodeString]" + err.Error()
						res.Code = 10008
						res.Call(c)
						c.Abort()
						return
					}
					aes.Key = deKey.String()
				}
				// log.Info("tempAesKey", tempAesKey)
				// 当利用Public AESKey生成UID的Key存在的时候
				if key != "" && tempAesKey == "" {
					getAesKey := conf.EncryptionClient.GetUserAesKeyByKey(conf.Redisdb, key)
					if getAesKey == nil {
						res.Code = 10008
						res.Call(c)
						c.Abort()
						return
					}
					userAesKey = getAesKey
					c.Set("userAesKey", userAesKey)
					aes.Key = getAesKey.AESKey
				}
				// log.Info("userAesKey", userAesKey, "key", key, "tempAesKey", tempAesKey, roles.Authorize && (userAesKey == nil || key == ""))

				if isExchangeKey := strings.Contains(c.Request.URL.Path, "encryption/exchangeKey"); !isExchangeKey {
					// 要求登录的同时还没有key就说不过去了
					if roles.Authorize && (userAesKey == nil || key == "") {
						res.Code = 10008
						res.Call(c)
						c.Abort()
						return
					}
				}
				if aes.Key == "" {
					res.Data = "[Encryption] AesKey does not exist."
					res.Code = 10008
					res.Call(c)
					c.Abort()
					return
				}
				// log.Info((len(data)))

				deStr, deStrErr := aes.DecryptWithString(data, "")
				// log.Info("deStr", len(deStr.String()))
				if deStrErr != nil {
					res.Data = "[Encryption aes.DecryptWithString]" + deStrErr.Error()
					res.Code = 10008
					res.Call(c)
					c.Abort()
					return
				}
				err := json.Unmarshal(deStr.Byte(), &dataMap)
				if err != nil {
					res.Data = "[Encryption json.Unmarshal]" + err.Error()
					res.Code = 10008
					res.Call(c)
					c.Abort()
					return
				}

				// log.Info("dataMap", len(dataMap["data"].(string)))
				// 为Gin请求体赋值
				for key, item := range dataMap {
					c.Set(key, item)
				}
				// fmt.Println("Request解析成功！！！！！！！！！！")
			}
			c.Next()
		} else {
			c.Next()
		}
	}
}
