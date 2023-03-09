package controllersV1

import (
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/jinzhu/copier"
	"github.com/mitchellh/mapstructure"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
)

type MessageController struct {
}

func (fc *MessageController) GetRecentChatDialogueList(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetRecentChatDialogueList------")

	// 2、获取参数
	data := new(protos.GetRecentChatDialogueList_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10004
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	appId := c.GetString("appId")
	list := []*protos.ChatDialogue{}

	roomIds := []string{}
	roomIdsMap := map[string]int64{}

	messagesMap := map[string]*models.Messages{}
	messgeIds := []primitive.ObjectID{}
	// messgeIdsMap := map[string]primitive.ObjectID{}

	// 获取所有聊天过的好友关系
	// 未来预留 一年内的
	getContact, err := contactDbx.GetAllContact(appId, userInfo.Uid, []int64{
		1540947600, 0,
		// 1540947600, time.Now().Unix(),
	})
	if err != nil {
		res.Code = 10001
		res.Call(c)
		return
	}
	for _, v := range getContact {
		cd := new(protos.ChatDialogue)
		cd.RoomId = v.Id
		cd.Type = "Contact"

		if v.LastMessage != primitive.NilObjectID {
			cd.LastMessageId = v.LastMessage.Hex()
			messgeIds = append(messgeIds, v.LastMessage)
		}
		cd.LastMessageTime = v.LastMessageTime
		for _, sv := range v.Users {
			if sv.Uid != userInfo.Uid {
				cd.Id = sv.Uid
				break
			}
		}

		roomIds = append(roomIds, v.Id)
		roomIdsMap[cd.RoomId] = 0
		// messgeIdsMap[cd.RoomId] = v.LastMessage
		list = append(list, cd)
	}
	// 获取所有聊天过群组关系
	// 未来预留 一年内的
	getGroup, err := groupDbx.GetAllJoinedGroups(appId, userInfo.Uid)
	// log.Info("getGroup", getGroup)

	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	for _, v := range getGroup {
		cd := new(protos.ChatDialogue)
		cd.Type = "Group"
		gp := v.Group[0]

		if len(v.Group) > 0 {
			cd.RoomId = v.Group[0].Id
		}
		if gp.LastMessage != primitive.NilObjectID {
			cd.LastMessageId = gp.LastMessage.Hex()
			messgeIds = append(messgeIds, gp.LastMessage)
		}
		if gp.LastMessageTime >= 1540947600 {
			cd.LastMessageTime = gp.LastMessageTime
		}
		cd.Id = gp.Id

		roomIds = append(roomIds, cd.RoomId)
		roomIdsMap[cd.RoomId] = 0
		list = append(list, cd)
	}

	// 获取所有未读消息
	log.Info("roomIds", roomIds)

	allUnredMessages, err := messagesDbx.GetUnredMessages(
		roomIds, userInfo.Uid,
	)
	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	log.Info("allUnredMessages, err", allUnredMessages, err)

	for _, v := range allUnredMessages {
		// log.Info(v)
		if v.AuthorId != userInfo.Uid {
			roomIdsMap[v.RoomId]++
		}
	}

	getMessageById, err := messagesDbx.GetMessageById(
		messgeIds,
	)
	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	for _, v := range getMessageById {
		messagesMap[v.Id.Hex()] = v
	}

	for _, v := range list {
		v.UnreadMessageCount = roomIdsMap[v.RoomId]
		pm := new(protos.Messages)
		if v.LastMessageId != "" {
			if messagesMap[v.LastMessageId] == nil {
				continue
			}
			copier.Copy(pm, messagesMap[v.LastMessageId])
			pm.Id = messagesMap[v.LastMessageId].Id.Hex()
			v.LastMessage = pm
		}
	}
	responseData := protos.GetRecentChatDialogueList_Response{
		List:  list,
		Total: nint.ToInt64(len(list)),
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *MessageController) GetHistoricalMessages(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetHistoricalMessages------")

	// 2、获取参数
	data := new(protos.GetHistoricalMessages_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.PageNum, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.PageSize, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.Type, validation.Type("string"), validation.Enum([]string{"Group", "Contact"}), validation.Required()),
		validation.Parameter(&data.TimeRange, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if err = validation.ValidateStruct(
		data.TimeRange,
		validation.Parameter(&data.TimeRange.Start, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.TimeRange.End, validation.Type("int64"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10004
		res.Call(c)
		return
	}
	userInfo := u.(*sso.UserInfo)
	appId := c.GetString("appId")

	// 判断是否在此room内
	if code := methods.IsMemberOfRoom(appId, data.RoomId, userInfo.Uid); code != 200 {
		res.Code = code
		res.Call(c)
		return
	}

	getMessages, err := messagesDbx.GetHistoricalMessages(data.RoomId, userInfo.Uid, data.PageNum, data.PageSize, data.TimeRange.Start, data.TimeRange.End)
	// log.Info("getMessages, err ", getMessages, err)
	if err != nil {
		res.Code = 10006
		res.Call(c)
		return
	}
	list := []*protos.Messages{}

	for i := len(getMessages) - 1; i >= 0; i-- {
		v := getMessages[i]
		pm := new(protos.Messages)
		// copier.Copy(pm, v)

		mapstructure.Decode(v, pm)

		// log.Info("len(v.ReplyMessage) > 0", v["replyMessage"])
		rmlist := v["replyMessage"].(primitive.A)
		if len(rmlist) > 0 {
			rm := new(protos.Messages)
			vrm := rmlist[0].(primitive.M)
			mapstructure.Decode(vrm, rm)
			rm.Id = vrm["_id"].(primitive.ObjectID).Hex()
			if vrm["replyId"] != nil {
				rm.ReplyId = vrm["replyId"].(primitive.ObjectID).Hex()
			}
			pm.ReplyMessage = rm
		}

		pm.Id = v["_id"].(primitive.ObjectID).Hex()
		if v["replyId"] != nil {
			pm.ReplyId = v["replyId"].(primitive.ObjectID).Hex()
		}

		// pm.ForwardMessages = []*protos.MessagesForwardMessages{}
		// for _, v := range v.ForwardMessages {
		// 	mfm := new(protos.MessagesForwardMessages)
		// 	mfm.Id = v.Id.Hex()
		// 	pm.ForwardMessages = append(pm.ForwardMessages, mfm)
		// }
		list = append(list, pm)
	}
	responseData := protos.GetHistoricalMessages_Response{
		List:  list,
		Total: nint.ToInt64(len(list)),
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *MessageController) ReadAllMessages(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------ReadAllMessages------")

	// 2、获取参数
	data := new(protos.ReadAllMessages_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := u.(*sso.UserInfo)
	appId := c.GetString("appId")
	deviceId := c.GetString("deviceId")

	if code := methods.IsMemberOfRoom(appId, data.RoomId, userInfo.Uid); code != 200 {
		res.Code = code
		res.Call(c)
		return
	}

	if err = messagesDbx.ReadAllMessages(data.RoomId, userInfo.Uid); err != nil {
		res.Errors(err)
		res.Code = 10011
		res.Call(c)
		return
	}
	responseData := protos.ReadAllMessages_Response{
		RoomId: data.RoomId,
		Uid:    userInfo.Uid,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	cc := conf.SocketIO.GetConnContextByTag(namespace["chat"], "DeviceId", deviceId)

	log.Info("ccc", cc)
	if len(cc) == 0 {
		return
	}
	msc := methods.SocketConn{
		Conn: cc[0],
	}

	// 暂定只有1v1需要加密e2ee，其他的用自己的即可
	msc.BroadcastToRoom(data.RoomId,
		routeEventName["readAllMessages"],
		&res,
		false)
}

func (fc *MessageController) DeleteMessages(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------DeleteMessages------")

	// 2、获取参数
	data := new(protos.DeleteMessages_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Type, validation.Enum([]string{"AllUser", "MySelf"}), validation.Type("string"), validation.Required()),
		validation.Parameter(&data.ExpirationTime, validation.Type("int64"), validation.Required()),
	); err != nil || len(data.MessageIdList) == 0 {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	u, isExists := c.Get("userInfo")
	if !isExists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := u.(*sso.UserInfo)
	deviceId := c.GetString("deviceId")

	log.Info("data.Type", data.Type)
	if data.Type == "MySelf" {
		// 操作所有人发的 加自己Uid
		if err = messagesDbx.DeleteMessages(data.RoomId, data.MessageIdList, userInfo.Uid, "All", userInfo.Uid, data.ExpirationTime); err != nil {
			res.Errors(err)
			res.Code = 10019
			res.Call(c)
			return
		}
	} else {
		// 操作别人发的 加自己的Uid
		if err = messagesDbx.DeleteMessages(data.RoomId, data.MessageIdList, userInfo.Uid, "false", userInfo.Uid, data.ExpirationTime); err != nil {
			log.Info(err)
			res.Errors(err)
			res.Code = 10019
			res.Call(c)
			return
		}

		// 操作自己发的 加AllUser
		if err = messagesDbx.DeleteMessages(data.RoomId, data.MessageIdList, userInfo.Uid, "true", "AllUser", data.ExpirationTime); err != nil {
			log.Info(err)
			res.Errors(err)
			res.Code = 10019
			res.Call(c)
			return
		}
	}

	responseData := protos.DeleteMessages_Response{
		RoomId:        data.RoomId,
		MessageIdList: data.MessageIdList,
		Uid:           userInfo.Uid,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	cc := conf.SocketIO.GetConnContextByTag(namespace["chat"], "DeviceId", deviceId)

	if len(cc) == 0 {
		return
	}
	msc := methods.SocketConn{
		Conn: cc[0],
	}

	if data.Type == "AllUser" {
		// 暂定只有1v1需要加密e2ee，其他的用自己的即可
		msc.BroadcastToRoom(data.RoomId,
			routeEventName["deleteMessages"],
			&res,
			false)
	}
}
