package controllersV1

import (
	"strings"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/ncredentials"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/saass"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
)

type FileController struct {
}

func (fc *FileController) GetFiles(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.GetUploadFileToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.FileInfo, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if err = validation.ValidateStruct(
		data.FileInfo,
		validation.Parameter(&data.FileInfo.Name, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.Size, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.FileInfo.Type, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.Suffix, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.LastModified, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.FileInfo.Hash, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10002
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	authorId := userInfo.Uid

	// 4、获取Token
	chunkSize := int64(128 * 1024)

	if data.FileInfo.Size < 1024*1024 {
		chunkSize = 128 * 1024
	}
	if data.FileInfo.Size > 1024*1024 {
		chunkSize = 256 * 1024
	}
	if data.FileInfo.Size > 15*1024*1024 {
		chunkSize = 512 * 1024
	}

	ut, err := conf.SAaSS.CreateChuunkUploadToken(&saass.CreateUploadTokenOptions{
		FileInfo: &saass.FileInfo{
			Name:         data.FileInfo.Name,
			Size:         data.FileInfo.Size,
			Type:         data.FileInfo.Type,
			Suffix:       data.FileInfo.Suffix,
			LastModified: data.FileInfo.LastModified,
			Hash:         data.FileInfo.Hash,
		},
		Path:           "/" + cipher.MD5(authorId) + "/files/" + time.Now().Format("2006/01/02") + "/",
		FileName:       strings.ToLower(cipher.MD5(data.FileInfo.Hash+nstrings.ToString(data.FileInfo.Size)+nstrings.ToString(time.Now().Unix()))) + data.FileInfo.Suffix,
		ChunkSize:      chunkSize,
		VisitCount:     -1,
		ExpirationTime: -1,
		// Type:           "File",
		FileConflict: "Replace",
		OnProgress: func(progress saass.Progress) {
			// log.Info("progress", progress)
		},
		OnSuccess: func(urls saass.Urls) {
			// log.Info("urls", urls)
		},
		OnError: func(err error) {
			// log.Info("err", err)
		},
	})
	log.Info("	ut, err", ut, err)
	if err != nil {
		res.Errors(err)
		res.Code = 10014
		res.Call(c)
		return
	}
	urls := protos.FileUrls{
		DomainUrl:     conf.Config.StaticPathDomain,
		EncryptionUrl: ut.Urls.EncryptionUrl,
		Url:           ut.Urls.Url,
	}
	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)
	protoData := &protos.GetUploadFileToken_Response{
		Urls:           &urls,
		ApiUrl:         ut.ApiUrl,
		Token:          ut.Token,
		ChunkSize:      ut.ChunkSize,
		UploadedOffset: ut.UploadedOffset,
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}

func (fc *FileController) GetUploadFileToken(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.GetUploadFileToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.FileInfo, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if err = validation.ValidateStruct(
		data.FileInfo,
		validation.Parameter(&data.FileInfo.Name, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.Size, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.FileInfo.Type, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.Suffix, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.FileInfo.LastModified, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.FileInfo.Hash, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10002
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	authorId := userInfo.Uid

	// 4、获取Token
	chunkSize := int64(128 * 1024)

	if data.FileInfo.Size < 1024*1024 {
		chunkSize = 128 * 1024
	}
	if data.FileInfo.Size > 1024*1024 {
		chunkSize = 256 * 1024
	}
	if data.FileInfo.Size > 15*1024*1024 {
		chunkSize = 512 * 1024
	}

	ut, err := conf.SAaSS.CreateChuunkUploadToken(&saass.CreateUploadTokenOptions{
		FileInfo: &saass.FileInfo{
			Name:         data.FileInfo.Name,
			Size:         data.FileInfo.Size,
			Type:         data.FileInfo.Type,
			Suffix:       data.FileInfo.Suffix,
			LastModified: data.FileInfo.LastModified,
			Hash:         data.FileInfo.Hash,
		},
		Path:           "/" + cipher.MD5(authorId) + "/files/" + time.Now().Format("2006/01/02") + "/",
		FileName:       strings.ToLower(cipher.MD5(data.FileInfo.Hash+nstrings.ToString(data.FileInfo.Size)+nstrings.ToString(time.Now().Unix()))) + data.FileInfo.Suffix,
		ChunkSize:      chunkSize,
		VisitCount:     -1,
		ExpirationTime: -1,
		// Type:           "File",
		FileConflict: "Replace",
		OnProgress: func(progress saass.Progress) {
			// log.Info("progress", progress)
		},
		OnSuccess: func(urls saass.Urls) {
			// log.Info("urls", urls)
		},
		OnError: func(err error) {
			// log.Info("err", err)
		},
	})
	log.Info("	ut, err", ut, err)
	if err != nil {
		res.Errors(err)
		res.Code = 10014
		res.Call(c)
		return
	}
	urls := protos.FileUrls{
		DomainUrl:     conf.Config.StaticPathDomain,
		EncryptionUrl: ut.Urls.EncryptionUrl,
		Url:           ut.Urls.Url,
	}
	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)
	protoData := &protos.GetUploadFileToken_Response{
		Urls:           &urls,
		ApiUrl:         ut.ApiUrl,
		Token:          ut.Token,
		ChunkSize:      ut.ChunkSize,
		UploadedOffset: ut.UploadedOffset,
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}

func (fc *FileController) GetCustomStickersUploadFileToken(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.GetCustomStickersUploadFileToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Size, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.Hash, validation.Type("string"), validation.Required()),
		// validation.Parameter(&data.Password, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10002
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	authorId := userInfo.Uid

	// 4、获取Token
	chunkSize := int64(128 * 1024)

	if data.Size < 1024*1024 {
		chunkSize = 128 * 1024
	}
	if data.Size > 1024*1024 {
		chunkSize = 256 * 1024
	}
	if data.Size > 15*1024*1024 {
		chunkSize = 512 * 1024
	}

	password := cipher.MD5(authorId + "CustomStickers" + nstrings.ToString(time.Now().Unix()))

	ut, err := conf.SAaSS.CreateChuunkUploadToken(&saass.CreateUploadTokenOptions{
		FileInfo: &saass.FileInfo{
			Name:         cipher.MD5(authorId+"CustomStickers") + ".json",
			Size:         data.Size,
			Type:         "application/json",
			Suffix:       ".json",
			LastModified: time.Now().UnixMilli(),
			Hash:         data.Hash,
		},
		Path:           "/" + cipher.MD5(authorId) + "/emoji/",
		FileName:       "customStickers.json",
		ChunkSize:      chunkSize,
		VisitCount:     -1,
		Password:       password,
		ExpirationTime: -1,
		// Type:           "File",
		FileConflict: "Replace",
		OnProgress: func(progress saass.Progress) {
			// log.Info("progress", progress)
		},
		OnSuccess: func(urls saass.Urls) {
			// log.Info("urls", urls)
		},
		OnError: func(err error) {
			// log.Info("err", err)
		},
	})
	// log.Info("	ut, err", ut, err)

	if err != nil {
		res.Errors(err)
		res.Code = 10014
		res.Call(c)
		return
	}

	d := map[string]string{
		"password": password,
		"url":      ut.Urls.EncryptionUrl,
	}

	if err = conf.SSO.AppData.Set("CustomStickers", d, c.GetString("token"), c.GetString("deviceId"), c.MustGet("userAgent").(*sso.UserAgent)); err != nil {
		res.Errors(err)
		res.Code = 10014
		res.Call(c)
		return
	}
	urls := protos.FileUrls{
		DomainUrl:     conf.Config.StaticPathDomain,
		EncryptionUrl: ut.Urls.EncryptionUrl,
		Url:           ut.Urls.Url,
	}
	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)
	protoData := &protos.GetCustomStickersUploadFileToken_Response{
		Urls:           &urls,
		ApiUrl:         ut.ApiUrl,
		Token:          ut.Token,
		ChunkSize:      ut.ChunkSize,
		UploadedOffset: ut.UploadedOffset,
	}

	res.Code = 200

	res.Data = protos.Encode(protoData)

	res.Call(c)

}

func (fc *FileController) GetCustomStickersFileUrl(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	d, err := conf.SSO.AppData.Get("CustomStickers", c.GetString("token"), c.GetString("deviceId"), c.MustGet("userAgent").(*sso.UserAgent))
	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	data := d.(map[string]interface{})
	password := data["password"].(string)
	url := data["url"].(string)
	log.Info("data", password, url)

	t := time.Duration(conf.Config.Saass.Auth.Duration) * time.Second

	log.Info(conf.Config.Saass.AppKey + password)
	u, p := ncredentials.GenerateCredentials(conf.Config.Saass.AppKey+password, t)
	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	res.Code = 200
	res.Data = protos.Encode(&protos.GetCustomStickersFileUrl_Response{
		Url: conf.Config.StaticPathDomain + url + "?u=" + u + "&p=" + p,
	})
	res.Call(c)
}
