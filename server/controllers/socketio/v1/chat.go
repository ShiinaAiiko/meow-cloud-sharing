package socketIoControllersV1

import (
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/pion/turn/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// var friendsDbx = new(dbxV1.FriendsDbx)
// var chatDbx = new(dbxV1.ChatDbx)

type ChatController struct {
}

func (cc *ChatController) Connect(e *nsocketio.EventInstance) error {
	log.Info("/Chat => 正在进行连接.")

	var res response.ResponseProtobufType
	c := e.ConnContext()
	baseNS := e.ConnContext().GetConnContext(e.Conn().ID())
	log.Info(baseNS)
	log.Info(baseNS.GetSessionCache("appId"))

	userInfoAny := baseNS.GetSessionCache("userInfo")

	if userInfoAny == nil {
		res.Code = 10004
		response := res.GetResponse()
		baseNS.Emit(routeEventName["error"], response)
		go c.Close()
		return errors.New(res.Error)
	}

	userInfo := userInfoAny.(*sso.UserInfo)
	deviceId := baseNS.GetSessionCache("deviceId").(string)
	log.Info("userInfo", userInfo)

	c.SetSessionCache("loginTime", baseNS.GetSessionCache("loginTime"))
	c.SetSessionCache("appId", baseNS.GetSessionCache("appId"))
	c.SetSessionCache("userInfo", userInfo)
	c.SetSessionCache("deviceId", deviceId)
	c.SetSessionCache("userAgent", baseNS.GetSessionCache("userAgent"))
	c.SetTag("Uid", userInfo.Uid)
	c.SetTag("DeviceId", deviceId)

	return nil
}

func (cc *ChatController) Disconnect(e *nsocketio.EventInstance) error {
	log.Info("/Chat => 已经断开了")

	return nil
}
func (cc *ChatController) JoinRoom(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	log.Info("/Chat => JoinRoom")
	res.Code = 200
	res.CallSocketIo(e)

	// 2、获取参数
	data := new(protos.JoinRoom_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomIds, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	appId := e.GetSessionCache("appId")
	// deviceId := e.GetSessionCache("deviceId").(string)
	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)

	log.Info(data, data.RoomIds, appId, userInfo)

	for _, v := range data.RoomIds {
		if b := e.ConnContext().JoinRoomWithNamespace(v); !b {
			res.Errors(err)
			res.Code = 10501
			res.CallSocketIo(e)
			return nil
		}
	}
	res.Code = 200

	responseData := protos.JoinGroup_Response{}
	res.Data = protos.Encode(&responseData)
	res.CallSocketIo(e)

	return nil
}

func (cc *ChatController) SendMessage(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	log.Info("/Chat => 发送信息")
	res.Code = 200
	res.CallSocketIo(e)

	// 2、获取参数
	data := new(protos.SendMessage_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Type, validation.Enum([]string{"Group", "Contact"}), validation.Required()),
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AuthorId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	if data.Call == nil && data.Image == nil {
		if err = validation.ValidateStruct(
			data.Call,
			validation.Parameter(&data.Message, validation.Type("string"), validation.Required()),
		); err != nil {
			res.Errors(err)
			res.Code = 10002
			res.CallSocketIo(e)
			return err
		}
	}

	if data.Image != nil && data.Image.Url != "" {
		if err = validation.ValidateStruct(
			data.Image,
			validation.Parameter(&data.Image.Url, validation.Required()),
			validation.Parameter(&data.Image.Width, validation.Greater(0), validation.Required()),
			validation.Parameter(&data.Image.Height, validation.Greater(0), validation.Required()),
			validation.Parameter(&data.Image.Type, validation.Enum([]string{
				"image/gif", "image/jpeg",
			}), validation.Required()),
		); err != nil {
			res.Errors(err)
			res.Code = 10002
			res.CallSocketIo(e)
			return err
		}
	}

	appId := e.GetSessionCache("appId")
	// deviceId := e.GetSessionCache("deviceId").(string)
	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)

	log.Info(data, appId, userInfo)
	mp := models.Messages{
		RoomId:   data.RoomId,
		AuthorId: data.AuthorId,
		Message:  data.Message,
	}
	if data.ReplyId != "" {
		if replyId, err := primitive.ObjectIDFromHex(data.ReplyId); err == nil {
			mp.ReplyId = replyId
		}
	}

	if data.Call != nil && data.Call.Type != "" {
		p := []*models.MessagesCallParticipants{}
		for _, v := range data.Call.Participants {
			p = append(p, &models.MessagesCallParticipants{
				Uid:    v.Uid,
				Caller: v.Caller,
			})
		}
		mp.Call = &models.MessagesCall{
			Status:       data.Call.Status,
			RoomId:       data.Call.RoomId,
			Participants: p,
			Type:         data.Call.Type,
			Time:         data.Call.Time,
		}
	}

	if data.Image != nil && data.Image.Url != "" {
		mp.Image = &models.MessagesImage{
			Url:    data.Image.Url,
			Width:  data.Image.Width,
			Height: data.Image.Height,
			Type:   data.Image.Type,
		}
	}

	message, err := messagesDbx.SendMessage(&mp)
	log.Info("message", message, err)
	if err != nil {
		res.Errors(err)
		res.Code = 10401
		res.CallSocketIo(e)
		return err
	}

	// 更新状态
	switch data.Type {
	case "Contact":
		// 更新 Contact
		if err = contactDbx.UpdateContactChatStatus(data.RoomId, message.Id); err != nil {
			res.Errors(err)
			res.Code = 10401
			res.CallSocketIo(e)
			return err
		}
	case "Group":
		// 更新 Group
		if err = groupDbx.UpdateGroupChatStatus(data.RoomId, message.Id); err != nil {
			res.Errors(err)
			res.Code = 10401
			res.CallSocketIo(e)
			return err
		}
		// 更新 GroupMembers
		if err = groupDbx.UpdateGroupMemberChatStatus(data.RoomId, message.Id); err != nil {
			res.Errors(err)
			res.Code = 10401
			res.CallSocketIo(e)
			return err
		}

	}

	res.Code = 200

	fMessage := methods.FormatMessages([]*models.Messages{message})

	if len(fMessage) == 0 {
		res.Errors(err)
		res.Code = 10011
		res.CallSocketIo(e)
		return err
	}

	responseData := protos.SendMessage_Response{
		Message: fMessage[0],
	}
	res.Data = protos.Encode(&responseData)
	// log.Info("res.Data ", res.Data)
	res.CallSocketIo(e)

	msc := methods.SocketConn{
		Conn: e.ConnContext(),
	}

	// 暂定只有1v1需要加密e2ee，其他的用自己的即可
	msc.BroadcastToRoom(data.RoomId,
		routeEventName["receiveMessage"],
		&res,
		false)
	return nil
}

func (cc *ChatController) EditMessage(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	// log.Info("/Chat => 发送信息")
	res.Code = 200
	res.CallSocketIo(e)

	// 2、获取参数
	data := new(protos.EditMessage_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MessageId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.AuthorId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Message, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// appId := e.GetSessionCache("appId")
	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)

	if data.AuthorId != userInfo.Uid {
		res.Errors(err)
		res.Code = 10202
		res.CallSocketIo(e)
		return err
	}

	messageId, err := primitive.ObjectIDFromHex(data.MessageId)
	if err != nil {
		res.Errors(err)
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	message := messagesDbx.EditMessage(messageId, data.RoomId, data.AuthorId, data.Message)
	if message == nil {
		res.Errors(err)
		res.Code = 10011
		res.CallSocketIo(e)
		return err
	}

	log.Info("message", message.Message)

	fMessage := methods.FormatMessages([]*models.Messages{message})

	if len(fMessage) == 0 {
		res.Errors(err)
		res.Code = 10011
		res.CallSocketIo(e)
		return err
	}
	responseData := protos.EditMessage_Response{
		Message: fMessage[0],
	}
	res.Code = 200
	res.Data = protos.Encode(&responseData)
	res.CallSocketIo(e)

	msc := methods.SocketConn{
		Conn: e.ConnContext(),
	}

	msc.BroadcastToRoom(data.RoomId,
		routeEventName["receiveEditMessage"],
		&res,
		false)
	return nil
}

// 支持群组多人通话或者个人通话
// groupId string，uids array
func (cc *ChatController) StartCalling(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.StartCalling_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
		validation.Parameter(&data.Type, validation.Required(), validation.Enum([]string{"Audio", "Video", "ScreenShare"})),
		validation.Parameter(&data.Participants, validation.Required()),
	); err != nil || len(data.Participants) <= 1 {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}

	// 3、获取参数
	appId := e.GetSessionCache("appId").(string)
	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)
	authorId := userInfo.Uid

	// 存储一个临时token到redis,每个用户一个 key由roomId和uid生成
	// 用于校验通话

	rKey := conf.Redisdb.GetKey("SFUCallToken")
	ck := cipher.MD5(data.RoomId + nstrings.ToString(time.Now().Unix()))
	for _, v := range data.Participants {
		err = conf.Redisdb.Set(rKey.GetKey(appId+data.RoomId+v.Uid), ck, rKey.GetExpiration())
		if err != nil {
			res.Error = err.Error()
			res.Code = 10001
			res.CallSocketIo(e)
			return nil
		}
	}

	// fmt.Println(msgRes)
	t := time.Duration(conf.Config.Turn.Auth.Duration) * time.Second

	u, p, err := turn.GenerateLongTermCredentials(conf.Config.Turn.Auth.Secret, t)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10001
		res.CallSocketIo(e)
		return nil
	}

	res.Code = 200
	res.Data = protos.Encode(&protos.StartCalling_Response{
		Participants:  data.Participants,
		RoomId:        data.RoomId,
		Type:          data.Type,
		CurrentUserId: authorId,
		CallToken:     ck,
		TurnServer: &protos.TurnServer{
			Urls: []string{
				conf.Config.Turn.Address,
			},
			Username:   u,
			Credential: p,
		},
	})
	res.CallSocketIo(e)

	msc := methods.SocketConn{
		Conn: e.ConnContext(),
	}
	msc.BroadcastToRoom(data.RoomId,
		routeEventName["startCallingMessage"],
		&res,
		true)

	return nil
}

func (cc *ChatController) Hangup(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、校验参数
	data := new(protos.Hangup_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
		validation.Parameter(&data.Type, validation.Required(), validation.Enum([]string{"Audio", "Video", "ScreenShare"})),
		validation.Parameter(&data.Participants, validation.Required()),
	); err != nil || len(data.Participants) <= 1 {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、获取参数
	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)
	authorId := userInfo.Uid

	// fmt.Println("fromUid", fromUid, toUids, typeStr)
	// if data.Send {
	// 	// 需要发送信息告知结果
	// 	log.Info("需要发送信息告知结果(预留)")
	// 	if err = validation.ValidateStruct(
	// 		data,
	// 		validation.Parameter(&data.CallTime, validation.Required()),
	// 		validation.Parameter(&data.Status, validation.Required(), validation.Enum([]int64{1, 0, -1, -2, -3})),
	// 	); err != nil {
	// 		res.Error = err.Error()
	// 		res.Code = 10002
	// 		res.CallSocketIo(e)
	// 		return err
	// 	}
	// }

	res.Code = 200

	res.Data = protos.Encode(&protos.Hangup_Response{
		Participants:  data.Participants,
		RoomId:        data.RoomId,
		Type:          data.Type,
		Status:        data.Status,
		CallTime:      data.CallTime,
		CurrentUserId: authorId,
	})
	res.CallSocketIo(e)

	msc := methods.SocketConn{
		Conn: e.ConnContext(),
	}
	msc.BroadcastToRoom(data.RoomId,
		routeEventName["hangupMessage"],
		&res,
		true)

	return nil
}

func (cc *ChatController) CallReconnect(e *nsocketio.EventInstance) error {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、校验参数
	data := new(protos.CallReconnect_Request)
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、校验参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
		validation.Parameter(&data.ReconnectUserId, validation.Required()),
	); err != nil || len(data.ReconnectUserId) == 0 {
		res.Error = err.Error()
		res.Code = 10002
		res.CallSocketIo(e)
		return err
	}
	// 3、获取参数
	res.Code = 200

	res.Data = protos.Encode(&protos.CallReconnect_Response{
		RoomId:          data.RoomId,
		ReconnectUserId: data.ReconnectUserId,
	})
	res.CallSocketIo(e)

	msc := methods.SocketConn{
		Conn: e.ConnContext(),
	}
	appId := e.GetSessionCache("appId").(string)

	rKey := conf.Redisdb.GetKey("SFUCallToken")
	ck := cipher.MD5(data.RoomId + nstrings.ToString(time.Now().Unix()))
	for _, v := range data.ReconnectUserId {
		err = conf.Redisdb.Set(rKey.GetKey(appId+data.RoomId+v), ck, rKey.GetExpiration())
		if err != nil {
			res.Error = err.Error()
			res.Code = 10001
			res.CallSocketIo(e)
			return nil
		}
	}

	t := time.Duration(conf.Config.Turn.Auth.Duration) * time.Second

	u, p, err := turn.GenerateLongTermCredentials(conf.Config.Turn.Auth.Secret, t)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10001
		res.CallSocketIo(e)
		return nil
	}

	for _, v := range data.ReconnectUserId {
		var cres response.ResponseProtobufType
		cres.Code = 200

		cres.Data = protos.Encode(&protos.CallReconnect_Response{
			RoomId:          data.RoomId,
			ReconnectUserId: data.ReconnectUserId,
			CallToken:       ck,
			TurnServer: &protos.TurnServer{
				Urls: []string{
					conf.Config.Turn.Address,
				},
				Username:   u,
				Credential: p,
			},
		})
		msc.BroadcastToUser(namespace["chat"], v,
			routeEventName["callReconnectMessages"],
			&cres,
		)
	}

	return nil
}
