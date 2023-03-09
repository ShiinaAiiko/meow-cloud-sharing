package controllersV1

import (
	"encoding/json"
	"path"
	"strings"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"

	"github.com/go-resty/resty/v2"
)

type UploadController struct {
}

func (fc *UploadController) UploadFile(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	// log.Info("------UploadFile------")

	// 2、获取参数
	data := new(protos.UploadFile_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Msg = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、校验参数
	err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Name, validation.Required()),
		validation.Parameter(&data.Size, validation.Required()),
		validation.Parameter(&data.Type, validation.Required()),
		validation.Parameter(&data.LastModified, validation.Required()),
		validation.Parameter(&data.Hash, validation.Required()),
		validation.Parameter(&data.VisitCount, validation.Type("int64")),
		validation.Parameter(&data.ExpirationTime, validation.Type("int64")),
	)

	if err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	authorId := c.MustGet("userInfo").(*sso.UserInfo).Uid

	// 4、获取数据
	// log.Info("data", data)
	chunkSize := int64(0)
	// "Image", "Video", "Audio", "Text", "File"
	typeStr := "File"
	switch data.Type {
	case "image/png":
		chunkSize = 256 * 1024
		typeStr = "Image"
		break
	case "image/jpeg":
		chunkSize = 256 * 1024
		typeStr = "Image"
		break
	case "video/mp4":
		chunkSize = 512 * 1024
		typeStr = "Video"
		break
	default:
		// 其他文件
		if data.Size >= 20*1024*1024 {
			chunkSize = 512 * 1024
		} else {
			chunkSize = 256 * 1024
		}
		break

	}
	fileNameWithSuffix := path.Base(data.Name)
	fileType := path.Ext(fileNameWithSuffix)

	fileInfoJson, _ := json.Marshal(map[string]string{
		"name":         data.Name,
		"size":         nstrings.ToString(data.Size),
		"type":         data.Type,
		"lastModified": nstrings.ToString(data.LastModified),
		"hash":         data.Hash,
	})
	// .SetFormData(query)
	resp, err := resty.New().R().SetHeaders(map[string]string{
		"Content-Type": "multipart/form-data",
	}).SetFormData(map[string]string{
		"appId":  "8cefb1f0-e491-45b6-9cc8-8268386193a1",
		"appKey": "b14533cd-1038-4b79-b3df-928e570226d9",
		"path":   "/" + strings.ToLower(typeStr) + "/" + cipher.MD5(nstrings.ToString(authorId)) + "/" + time.Now().Format("2006-01-02") + "/",
		// 要改为随机
		"fileName":       strings.ToLower(cipher.MD5(nstrings.ToString(time.Now().Unix())+nstrings.ToString(data.ExpirationTime)+data.Name+nstrings.ToString(data.LastModified)+data.Hash)) + fileType,
		"chunkSize":      nstrings.ToString(chunkSize),
		"visitCount":     nstrings.ToString(data.VisitCount),
		"expirationTime": nstrings.ToString(nint.Int64Or(data.ExpirationTime, -1)),
		"type":           typeStr,
		"fileInfo":       string(fileInfoJson),
	}).Post(
		conf.Config.StaticPathDomain + "/api/v1/chunkupload/create",
	)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10014
		res.Call(c)
		return
	}
	var respMap map[string]interface{}
	err = json.Unmarshal(resp.Body(), &respMap)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10014
		res.Call(c)
		return
	}
	dataMap := respMap["data"].(map[string]interface{})

	urlsMap := dataMap["urls"].(map[string]interface{})
	if dataMap["token"] != nil {
		uploadedOffset := []int64{}
		for _, v := range dataMap["uploadedOffset"].([]interface{}) {
			uploadedOffset = append(uploadedOffset, nint.ToInt64(v))
		}
		res.Data = protos.Encode(&protos.UploadFile_Response{
			Token:             dataMap["token"].(string),
			UploadedTotalSize: nint.ToInt64(dataMap["uploadedTotalSize"]),
			UploadedOffset:    uploadedOffset,
			ChunkSize:         chunkSize,
			ApiUrl:            conf.Config.StaticPathDomain + "/api/v1/chunkupload/upload",
			Urls: &protos.UploadFile_Response_Urls{
				DomainUrl:     urlsMap["domainUrl"].(string),
				EncryptionUrl: urlsMap["encryptionUrl"].(string),
				Url:           urlsMap["url"].(string),
			},
		})
	} else {
		res.Data = protos.Encode(&protos.UploadFile_Response{
			Urls: &protos.UploadFile_Response_Urls{
				EncryptionUrl: urlsMap["encryptionUrl"].(string),
				Url:           urlsMap["url"].(string),
			},
		})
	}
	res.Call(c)
}
