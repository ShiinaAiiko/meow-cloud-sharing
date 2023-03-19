package controllersV1

import (
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
)

type SAaSSController struct {
}

func (fc *SAaSSController) GetAppToken(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	log.Info("GetAppToken")
	// 2、获取参数
	data := new(protos.GetAppToken_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10002
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	authorId := userInfo.Uid

	// // 4、获取Token
	// chunkSize := int64(128 * 1024)

	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)
	log.Info(conf.SAaSS.GenerateRootPath(authorId), authorId)
	token, err := conf.SAaSS.GetAppToken(conf.SAaSS.GenerateRootPath(authorId), authorId)
	log.Info(token, err)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10018
		res.Call(c)
		return
	}
	protoData := &protos.GetAppToken_Response{
		BaseUrl:  conf.Config.Saass.BaseUrl,
		AppToken: token.Token,
		Deadline: token.Deadline,
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}
