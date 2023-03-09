package controllersV1

import (
	"encoding/hex"
	"math/big"
	"net/url"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/dhkea-go"
	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/validation"

	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
)

type EncryptionController struct {
}

// 1、没有登录的话，就用RSA公钥加密AES秘钥再用AES秘钥加密数据的形式发后端
// 2、登录就先交换秘钥
func (enc *EncryptionController) ExchangeKey(c *gin.Context) {
	// log.Info("-----ExchangeKey-----")
	// 1、初始化返回值
	var res response.ResponseProtobufType
	res.Code = 200
	// 2、获取参数
	data := new(protos.ExchangeKey_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、校验参数
	err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.TempAESKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.RSASign, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.RSAPublicKey, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.DHPublicKey, validation.Type("string"), validation.Required()),
	)
	if err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// 4、解密临时AESKey
	// log.Info(len(c.GetString("data")))
	// // log.Info("data.TempAESKey", data)
	// log.Info("data.TempAESKey", data.RSAPublicKey)
	// log.Info("data.TempAESKey", data.DHPublicKey)
	// log.Info("data.TempAESKey", data.RSASign)
	tempAesKey, err := conf.EncryptionClient.RsaKey.DecryptWithString(data.TempAESKey, nil)
	log.Info(tempAesKey, err)
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	aes := cipher.AES{
		Key:  tempAesKey.String(),
		Mode: "CFB",
	}

	// 5、解密公钥签名
	rsaSign, err := aes.DecryptWithString(data.RSASign, "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	// res.Code = 10007
	// res.Call(c)
	// return

	// 6、解密客户端RSAPublicKey
	rsaPublicKey, err := aes.DecryptWithString(data.RSAPublicKey, "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}

	// log.Info("Data.TempAESKey", tempAesKey.String())
	// log.Info("Data.RSASign", rsaSign.String())
	// log.Info("clientRSAPublicKey", strings.Trim(rsaPublicKey.String(), `"`))
	// log.Info("clientRSAPublicKey", string(rsaPublicKey.Byte()))

	publicKey, err := url.QueryUnescape(rsaPublicKey.Trim(`"`))
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	rsaSignBytes, err := hex.DecodeString(rsaSign.Trim(`"`))
	// publicKeyBytes, err := hex.DecodeString(publicKey)
	publicKeyBytes := []byte(publicKey)
	// rsaSignBytes := []byte(strings.Trim(rsaSign.String(), `"`))
	// log.Info("rsaSignBytes", string(rsaSignBytes))
	// log.Info("publicKeyBytes", string(publicKeyBytes))
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	// 7、RSA验签
	issuc, err := conf.EncryptionClient.RsaKey.VerifySignWithSha256(publicKeyBytes, rsaSignBytes, publicKeyBytes)
	// log.Info("issuc, err ", issuc, err)
	if !issuc || err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}

	// 8、解密客户端DHPublicKey
	dhPublicKey, err := aes.DecryptWithString(data.DHPublicKey, "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}

	// log.Info("Data.DHPublicKey", data.DHPublicKey, dhPublicKey.Trim(`"`))

	// 9、生成秘钥
	dh := dhkea.DHKeaNew(1024)
	bi := new(big.Int)
	bi.SetString(dhPublicKey.Trim(`"`), 10)
	// log.Info("dh", dh.PublicKey)
	key := dh.GetSharedKey(bi)
	// log.Info("key", key)

	aes = cipher.AES{
		Key:  tempAesKey.String(),
		Mode: "CFB",
	}
	// 11、为公钥加签
	// log.Info(string(conf.EncryptionClient.RsaKey.PublicKey))
	rsaSign, err = conf.EncryptionClient.RsaKey.RSASignWithSha256(publicKeyBytes)
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	rsaSignEnStr, err := aes.Encrypt(rsaSign.HexEncodeToString(), "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	// 12、加密dhpublickkey
	dhKeyEnStr, err := aes.Encrypt(dh.PublicKey.String(), "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	// log.Info(tempAesKeyResEnStr.HexEncodeToString())
	// log.Info(dhKeyEnStr.HexEncodeToString())
	userInfo, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10002
		res.Call(c)
		return
	}
	authorId := userInfo.(*sso.UserInfo).Uid
	deviceId := c.GetString("deviceId")

	// 13、生成UserAesKey
	aesKeyMd5 := cipher.MD5(key.String())
	userAesKey, err := conf.EncryptionClient.SetUserAesKey(conf.Redisdb, aesKeyMd5, authorId, deviceId)
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	aesKeyEnStr, err := aes.Encrypt(userAesKey, "")
	if err != nil {
		res.Errors(err)
		res.Code = 10007
		res.Call(c)
		return
	}
	// log.Info("userAesKey", userAesKey)

	// log.Info("rsaSign.HexEncodeToString()", rsaSign.HexEncodeToString())
	// log.Info(conf.EncryptionClient.RsaKey.VerifySignWithSha256(publicKeyBytes, rsaSign.Byte(), conf.EncryptionClient.RsaKey.PublicKey))
	responseData := protos.ExchangeKey_Response{
		// DeviceId: getAnonymousUser.DeviceId,
		// Token:    getAnonymousUser.Token,
		// UserInfo: ssoUser,
		// TempAESKey:  tempAesKeyResEnStr.HexEncodeToString(),
		UserAESKey:  aesKeyEnStr.HexEncodeToString(),
		RSASign:     rsaSignEnStr.HexEncodeToString(),
		DHPublicKey: dhKeyEnStr.HexEncodeToString(),
		// Deadline:    time.Now().Unix() + 8,
		Deadline: time.Now().Unix() + 60*30,
	}

	res.Data = protos.Encode(&responseData)
	res.Call(c)

	// go func() {
	// 	// key
	// 	// 存储redis
	// 	// log.Info("key", key, authorId)
	// 	rKey := conf.Redisdb.GetKey("User-AESKey")
	// 	err := conf.Redisdb.Set(rKey.GetKey(nstrings.ToString(authorId)), cipher.MD5(key.String()), rKey.GetExpiration())
	// 	if err != nil {
	// 		log.Error(err)
	// 	}
	// 	// _, aesKeyErr := conf.EncryptionClient.SetUserAesKey(sharePublicKeyInt64, strconv.FormatInt(userInfo.Uid, 10))
	// 	// if aesKeyErr != nil {
	// 	// 	res.Code = 10007
	// 	// 	res.Data = aesKeyErr.Error()
	// 	// 	res.Call(c)
	// 	// }
	// }()
}

// func (enc *EncryptionController) GetRsaPublicKey(c *gin.Context) {
// 	// 1、初始化返回值
// 	var res response.ResponseProtobufType
// 	res.Code = 200

// 	// 4、获取RSAKey
// 	if conf.EncryptionClient.RsaKey.PublicKey == nil {
// 		res.Code = 10007
// 		res.Msg = "Publickey is empty."

// 		res.Call(c)
// 		return
// 	}
// 	// fmt.Println("控制器内开始报错")
// 	// panic(errors.New("sadsadasda"))
// 	publicKey := string(conf.EncryptionClient.RsaKey.PublicKey)
// 	sign, _ := conf.EncryptionClient.RsaKey.RSASignWithSha256([]byte(publicKey))
// 	// a := protos.GetRsaPublicKeyType_Response{
// 	// 	PublicKey: publicKey,
// 	// 	Sign:      sign,
// 	// }
// 	// // fmt.Println(a)
// 	res.Data = protos.Encode(
// 		&protos.GetRsaPublicKeyType_Response{
// 			PublicKey: publicKey,
// 			Sign:      sign.String(),
// 		},
// 	)
// 	// res.Data = response.H{
// 	// 	"rsa": response.H{
// 	// 		"publicKey": publicKey,
// 	// 		"sign":      sign,
// 	// 	},
// 	// 	// "randomKey":    randomKey,
// 	// 	// "dhKey": response.H{
// 	// 	// 	"prime":     dhKey.Prime.String(),
// 	// 	// 	"base":      dhKey.Base.String(),
// 	// 	// 	"publicKey": dhKey.InsidePublicKey.String(),
// 	// 	// },
// 	// }
// 	res.Call(c)
// }

// func (enc *EncryptionController) PostClientRsaPublicKeAndGenerateDhKey(c *gin.Context) {
// 	// 1、初始化返回值
// 	var res response.ResponseProtobufType
// 	res.Code = 200

// 	// 2、校验参数
// 	// err := validation.Validation(c,
// 	// 	validation.Field("publicKey", validation.Required()),
// 	// 	validation.Field("sign", validation.Required()),
// 	// )

// 	// if err != nil {
// 	// 	res.Msg = err.Error()
// 	// 	res.Code = 10002
// 	// 	res.Call(c)
// 	// 	return
// 	// }
// 	// 3、获取参数
// 	// 其实客户端Key就是临时数据，仅仅只是为了返DH数据用
// 	publicKey := c.GetString("publicKey")
// 	// sign := c.GetString("sign")
// 	enEscapeUrl, _ := url.QueryUnescape(publicKey)
// 	publicKey = enEscapeUrl
// 	// fmt.Println("enEscapeUrl", publicKey)
// 	getUserInfo, _ := c.Get("userInfo")
// 	userInfo := getUserInfo.(*sso.UserInfo)

// 	// 4、验签
// 	// signBytes, _ := hex.DecodeString(sign)
// 	// publicKeyBytes, err := hex.DecodeString(publicKey)
// 	// publicKeyBytes := []byte(publicKey)
// 	// isPass := conf.EncryptionClient.RsaKey.VerifySignWithSha256(publicKeyBytes, signBytes, publicKeyBytes)
// 	// // fmt.Println("isPass,", isPass)

// 	// if !isPass {
// 	// 	res.Data = ("Sign verification failed.")
// 	// 	res.Code = 10007
// 	// 	res.Call(c)
// 	// 	return
// 	// }
// 	// 2、获取RandomKey
// 	// randomKey, randomKeyErr := conf.EncryptionClient.GetRandomKey(strconv.FormatInt(userInfo.Uid, 10))
// 	// if randomKeyErr != nil {
// 	// 	res.Code = 10007
// 	// 	res.Data = (randomKeyErr.Error())
// 	// 	res.Call(c)
// 	// 	return
// 	// }
// 	// 3、获取DHKEY
// 	// dhKey, dhKeyErr := conf.EncryptionClient.GetDhKey(strconv.FormatInt(userInfo.Uid, 10))
// 	// if dhKeyErr != nil {
// 	// 	res.Code = 10007
// 	// 	res.Data = (randomKeyErr.Error())
// 	// 	res.Call(c)
// 	// 	return
// 	// }

// 	// res.Data = protos.Encode(&protos.PostClientRsaPublicKeAndGenerateDhKeyType_Response{
// 	// 	RandomKey: randomKey,
// 	// 	DhKey: &protos.PostClientRsaPublicKeAndGenerateDhKeyType_Response_DhKeyType{
// 	// 		Prime:          dhKey.Prime.String(),
// 	// 		Base:           dhKey.Base.String(),
// 	// 		SharePublicKey: dhKey.InsidePublicKey.String(),
// 	// 	},
// 	// })
// 	res.Call(c)
// }

// func (enc *EncryptionController) GetAesKey(c *gin.Context) {
// 	// fmt.Println("==========controllers GetAesKey")
// 	// 1、初始化返回值
// 	var res response.ResponseProtobufType
// 	res.Code = 200

// 	// 2、校验参数
// 	// err := validation.Validation(c,
// 	// 	validation.Field("sharePublicKey", validation.Required()),
// 	// )

// 	// if err != nil {
// 	// 	res.Msg = err.Error()
// 	// 	res.Code = 10002
// 	// 	res.Call(c)
// 	// 	return
// 	// }
// 	// 3、获取参数
// 	sharePublicKey := c.GetString("sharePublicKey")
// 	sharePublicKeyInt64, _ := strconv.ParseInt(sharePublicKey, 10, 64)
// 	// fmt.Println("enEscapeUrl", publicKey)
// 	getUserInfo, _ := c.Get("userInfo")
// 	userInfo := getUserInfo.(*sso.UserInfo)

// 	// 4、获取AES Key

// 	_, aesKeyErr := conf.EncryptionClient.SetUserAesKey(sharePublicKeyInt64, strconv.FormatInt(userInfo.Uid, 10))
// 	if aesKeyErr != nil {
// 		res.Code = 10007
// 		res.Data = aesKeyErr.Error()
// 		res.Call(c)
// 	}
// 	// 10以下hex无法转码所以+1000000
// 	// enUId, enUIDErr := conf.EncryptionClient.PublicAesKey.EncrypToString(encryption.GetRandomKey()+"."+strconv.FormatInt(userInfo.Uid, 10), conf.EncryptionClient.PublicAesKey.Key)
// 	// if enUIDErr != nil {
// 	// 	res.Code = 10007
// 	// 	res.Call(c)
// 	// }
// 	// res.Data = protos.Encode(&protos.GetAesKeyType_Response{
// 	// 	Key: enUId,
// 	// })
// 	// fmt.Println("sasas", enUId, "sasasa", res.Data)
// 	res.Call(c)
// }
