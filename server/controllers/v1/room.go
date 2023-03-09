package controllersV1

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type RoomController struct {
}

func (cl *RoomController) CreateRoom(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.CreateRoom_Request)
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
		validation.Parameter(&data.AuthorId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Type, validation.Enum([]string{"Personal", "Group"}), validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Name, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Avatar, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AvailableRange, validation.Required()),
	); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	if err = validation.ValidateStruct(
		data.AvailableRange,
		validation.Parameter(&data.AvailableRange.MaximumMembers, validation.Type("int64"), validation.Required(), validation.GreaterEqual(1)),
		validation.Parameter(&data.AvailableRange.E2Ee, validation.Type("bool"), validation.Required()),
		validation.Parameter(&data.AvailableRange.AllowMembersJoin, validation.Type("bool"), validation.Required()),
		validation.Parameter(&data.AvailableRange.AllowMembersChat, validation.Type("bool"), validation.Required()),
	); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	appId := c.GetString("appId")
	log.Info("appId", appId)

	responseData := protos.CreateRoom_Response{
		RoomId: "",
	}

	res.Data = protos.Encode(&responseData)
	res.Call(c)
}
