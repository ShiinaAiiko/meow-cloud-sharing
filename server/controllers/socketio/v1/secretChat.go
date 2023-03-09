package socketIoControllersV1

// import (
// 	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
// 	dbxV1 "github.com/ShiinaAiiko/meow-cloud-sharing/server/dbx/v1"
// 	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
// 	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
// 	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"

// 	"github.com/cherrai/nyanyago-utils/nsocketio"
// 	"github.com/cherrai/nyanyago-utils/nstrings"
// 	"github.com/cherrai/nyanyago-utils/validation"
// 	sso "github.com/cherrai/saki-sso-go"
// 	"github.com/jinzhu/copier"
// )

// var secretChatDbx = new(dbxV1.SecretChatDbx)

// func SecretChatDisconnect(e *nsocketio.EventInstance) error {

// 	// log.Warn("私密聊天离开监听", c.Conn.ID()+"关闭了"+c.Namespace()+"连接：", reason)
// 	return nil
// }

// func SendJoinAnonymousRoomMessage(e *nsocketio.EventInstance, roomId string, user *sso.UserInfo) {
// 	c := e.ConnContext()
// 	conns := c.GetAllConnContextInRoomWithNamespace(roomId)
// 	list := []*protos.RoomUserInfo{}
// 	for _, conn := range conns {
// 		userInfoInteface := conn.GetSessionCacheWithConnId(conn.ID(), "anonymousUserInfo")
// 		if userInfoInteface == nil {
// 			return
// 		}
// 		userInfo := userInfoInteface.(*sso.UserInfo)
// 		auser := protos.RoomUserInfo{
// 			Uid:      userInfo.Uid,
// 			Avatar:   userInfo.Avatar,
// 			Nickname: userInfo.Nickname,
// 			Username: userInfo.Username,
// 			Letter:   nstrings.GetLetter(nstrings.StringOr(userInfo.Nickname, userInfo.Username)),
// 			Email:    "",
// 			Bio:      userInfo.Bio,
// 		}

// 		list = append(list, &auser)
// 	}

// 	for _, conn := range conns {
// 		if conn.ID() == c.Conn.ID() {
// 			continue
// 		}

// 		userInfo := conn.GetSessionCacheWithConnId(conn.ID(), "userInfo").(*sso.UserInfo)
// 		anonymousUserInfo := conn.GetSessionCacheWithConnId(conn.ID(), "anonymousUserInfo")
// 		auid := int64(0)
// 		if anonymousUserInfo != nil {
// 			auid = anonymousUserInfo.(*sso.UserInfo).Uid
// 		}
// 		var res response.ResponseProtobufType
// 		res.Code = 200

// 		res.Data = protos.Encode(&protos.JoinRoom_Response{
// 			RoomId:       roomId,
// 			AuthorId:     user.Uid,
// 			AnonymousUID: auid,
// 			TotalUser:    int64(len(conns)),
// 			List:         list,
// 		})

// 		getConnContext := e.ServerContext().GetConnContextByTag(conf.SocketRouterNamespace["Chat"], "Uid", nstrings.ToString(userInfo.Uid))
// 		log.Info("getConnContext", getConnContext)
// 		for _, c := range getConnContext {
// 			// log.Info(c)
// 			deviceId := c.GetTag("DeviceId")
// 			// log.Info(deviceId)

// 			if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId); userAesKey != nil {
// 				// log.Info("userAesKey SendJoinAnonymousRoomMessage", userAesKey)

// 				eventName := conf.SocketRouterEventNames["JoinRoom"]
// 				responseData := res.Encryption(userAesKey.AESKey, res.GetReponse())

// 				isEmit := c.Emit(eventName, responseData)
// 				if isEmit {
// 					// 发送成功或存储到数据库
// 				} else {
// 					// 存储到数据库作为离线数据
// 				}
// 			}
// 		}
// 	}
// }

// // 检测匿名Token是否有效
// func CheckAnonymousToken(e *nsocketio.EventInstance, token string, deviceId string, userAgent *sso.UserAgent, invitationCode string) (*sso.UserInfo, error) {
// 	ret, err := conf.SSO.Verify(token, deviceId, *userAgent)
// 	if err != nil {
// 		return nil, err
// 	}
// 	// log.Info("ret", ret, ret.Payload.CustomData)
// 	if ret != nil && ret.Payload.Uid != 0 {
// 		// customData := ret.Payload.CustomData.(map[string]interface{})
// 		// if customData["invitationCode"].(string) == invitationCode {
// 		e.SetSessionCache("anonymousUserInfo", &ret.Payload)
// 		// 	return &ret.Payload, nil
// 		// }
// 		// return nil, nil
// 		return &ret.Payload, nil
// 	}
// 	return nil, nil
// }

// // 加入匿名房间
// func JoinAnonymousRoom(e *nsocketio.EventInstance) error {
// 	c := e.ConnContext()
// 	// 1、初始化返回体
// 	var res response.ResponseProtobufType

// 	// 2、获取参数
// 	data := new(protos.JoinAnonymousRoom_Request)

// 	var err error
// 	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
// 		res.Errors(err)
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}
// 	// 3、校验参数
// 	userAgent, formatUserAgent := e.GetSessionCache("userAgent").(*sso.UserAgent)
// 	asUser, err := methods.ValidateSecretChatToken(data.Token, userAgent)
// 	c.SetSessionCache("anonymousUserInfo", asUser)
// 	if asUser == nil || err != nil || !formatUserAgent {
// 		res.Errors(err)
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}

// 	// 5、检测邀请码是否有效
// 	invitationCode, err := secretChatDbx.GetInvitationCode(data.Token.InvitationCode, 100)
// 	if err != nil {
// 		res.Error = err.Error()
// 		res.Code = 10302
// 		res.CallSocketIo(e)
// 		return err
// 	}
// 	// if invitationCode.Usage.JoinCount >= invitationCode.AvailableRange.Count {
// 	// 	res.Code = 10302
// 	// 	res.CallSocketIo(e)
// 	// 	return err
// 	// }

// 	// 6、加入房间
// 	roomId := methods.GetAnonymousRoomId(data.Token.InvitationCode)
// 	isJoin := c.JoinRoomWithNamespace(roomId)
// 	if !isJoin {
// 		res.Code = 10303
// 		res.CallSocketIo(e)
// 		return err
// 	}

// 	icItem := new(protos.InvitationCodeItem)
// 	copier.Copy(icItem, invitationCode)
// 	icItem.AvailableRange.E2Ee = invitationCode.AvailableRange.E2ee
// 	// icItem.AvailableRange.E2Ee = false
// 	res.Code = 200
// 	res.Data = protos.Encode(&protos.JoinAnonymousRoom_Response{
// 		RoomId:             roomId,
// 		TotalNumberOfJoins: int64(len(c.GetAllConnOfRoomWithNamespace(roomId))),
// 		InvitationCodeInfo: icItem,
// 	})
// 	res.CallSocketIo(e)

// 	userInfo := e.GetSessionCache("userInfo").(*sso.UserInfo)

// 	go SendJoinAnonymousRoomMessage(e, roomId, userInfo)
// 	return nil
// }

// // 发送匿名信息
// func SendMessageWithAnonymousRoom(e *nsocketio.EventInstance) error {
// 	c := e.ConnContext()
// 	// 1、初始化返回体
// 	var res response.ResponseProtobufType
// 	// log.Info("------SendMessageWithAnonymousRoom------")

// 	// 2、获取参数
// 	data := new(protos.SendMessageWithAnonymousRoom_Request)

// 	var err error
// 	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
// 		res.Msg = err.Error()
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}
// 	// 3、校验参数
// 	err = validation.ValidateStruct(
// 		data,
// 		validation.Parameter(&data.Token, validation.Required()),
// 		validation.Parameter(&data.ApiName, validation.Type("string"), validation.Required()),
// 		validation.Parameter(&data.Data, validation.Type("string"), validation.Required()),
// 	)
// 	if err != nil {
// 		res.Msg = err.Error()
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}

// 	userAgent, formatUserAgent := e.GetSessionCache("userAgent").(*sso.UserAgent)
// 	asUser, err := methods.ValidateSecretChatToken(data.Token, userAgent)
// 	c.SetSessionCache("anonymousUserInfo", asUser)
// 	if asUser == nil || err != nil || !formatUserAgent {
// 		res.Errors(err)
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}

// 	// // 4、校验token是否有效
// 	// aUser, err := CheckAnonymousToken(c, data.AnonymousUserToken, data.AnonymousUserDeviceId, userAgent, data.InvitationCode)
// 	// if aUser == nil || err != nil {
// 	// 	if err != nil {
// 	// 		res.Msg = err.Error()
// 	// 	}
// 	// 	res.Code = 10304
// 	// 	res.CallSocketIo(e)
// 	// 	return err
// 	// }
// 	roomId := methods.GetAnonymousRoomId(data.Token.InvitationCode)
// 	// log.Info("「"+data.ApiName+"」,"+data.InvitationCode+" ：", data.Data)
// 	// 5、发送群消息
// 	conns := c.GetAllConnContextInRoomWithNamespace(roomId)
// 	// log.Info("roomId", roomId, conns)

// 	sendTimes := int64(0)
// 	successTimes := int64(0)
// 	for _, conn := range conns {
// 		// log.Info(conn.ID(), c.ID())
// 		if conn.ID() == "" || conn.ID() == c.ID() {
// 			continue
// 		}
// 		deviceId := conn.GetTag("DeviceId")
// 		// log.Info("deviceId", deviceId)
// 		if deviceId == c.GetTag("DeviceId") {
// 			continue
// 		}
// 		sendTimes++
// 		// userInfo, isuserInfo := conn.GetSessionCacheWithConnId(conn.ID(), "userInfo").(*sso.UserInfo)
// 		// // log.Info(userInfo, isuserInfo)
// 		// if !isuserInfo {
// 		// 	continue
// 		// }
// 		var res response.ResponseProtobufType
// 		res.Code = 200
// 		res.Data = protos.Encode(&protos.OnAnonymousMessage_Response{
// 			RoomId:         roomId,
// 			InvitationCode: data.Token.InvitationCode,
// 			AuthorId:       asUser.Uid,
// 			ApiName:        data.ApiName,
// 			Data:           data.Data,
// 		})

// 		// uid := sConn.GetTag("Uid")
// 		// // log.Info("uid", uid)

// 		if userAesKey := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId); userAesKey != nil {

// 			eventName := conf.SocketRouterEventNames["OnAnonymousMessage"]
// 			responseData := res.Encryption(userAesKey.AESKey, res.GetReponse())
// 			// 4、目标对象返回体
// 			// log.Info("eventName", eventName, sConn.GetTag("Uid"), sConn)
// 			isEmit := conn.Emit(eventName, responseData)
// 			if isEmit {
// 				// 发送成功或存储到数据库
// 				successTimes++
// 			} else {
// 				// 存储到数据库作为离线数据
// 			}
// 		}

// 		// getConnContext := e.ServerContext().GetConnContextByTag(conf.SocketRouterNamespace["Chat"], "Uid", nstrings.ToString(userInfo.Uid))
// 		// // log.Info("getConnContext", nstrings.ToString(userInfo.Uid), getConnContext)
// 		// for _, sConn := range getConnContext {

// 		// }
// 	}
// 	res.Code = 200
// 	if successTimes == 0 || successTimes < sendTimes {
// 		res.Code = 10016
// 	}
// 	res.Data = protos.Encode(&protos.SendMessageWithAnonymousRoom_Response{
// 		SendTimes:    sendTimes,
// 		SuccessTimes: successTimes,
// 	})
// 	res.CallSocketIo(e)
// 	return nil
// }

// // 获取房间在线状态
// func GetAnonymousRoomOnlineStatus(e *nsocketio.EventInstance) error {
// 	// c := e.ConnContext()
// 	// 1、初始化返回体
// 	var res response.ResponseProtobufType

// 	// log.Info("------JoinAnonymousRoom------")

// 	// 2、获取参数
// 	data := new(protos.GetAnonymousRoomOnlineStatus_Request)
// 	// authorId := e.GetSessionCache("userInfo").(*sso.UserInfo).Uid

// 	var err error
// 	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
// 		res.Msg = err.Error()
// 		res.Code = 10002
// 		res.CallSocketIo(e)
// 		return err
// 	}
// 	// 3、校验参数
// 	// err = validation.ValidateStruct(
// 	// 	data,
// 	// 	validation.Parameter(&data.InvitationCode, validation.Type("string"), validation.Required()),
// 	// 	validation.Parameter(&data.AnonymousUserToken, validation.Type("string"), validation.Required()),
// 	// 	validation.Parameter(&data.AnonymousUserDeviceId, validation.Type("string"), validation.Required()),
// 	// )
// 	// if err != nil {
// 	// 	res.Msg = err.Error()
// 	// 	res.Code = 10002
// 	// 	res.CallSocketIo(e)
// 	// 	return err
// 	// }

// 	res.Code = 200
// 	res.CallSocketIo(e)
// 	return nil
// }

// // 获取匿名房间的所有用户
// // func GetAllUsersInAnonymousRoom(e *nsocketio.EventInstance) error {
// // 	// 1、初始化返回体
// // 	var res response.ResponseProtobufType

// // 	// 2、获取参数
// // 	data := new(protos.GetAllUsersInAnonymousRoom_Request)

// // 	// userAgent, formatUserAgent := e.GetSessionCache("userAgent").(*sso.UserAgent)

// // 	var err error
// // 	// if err = protos.DecodeBase64(e.GetString("data"), data); err != nil || !formatUserAgent {
// // 	// 	res.Msg = err.Error()
// // 	// 	res.Code = 10002
// // 	// 	res.CallSocketIo(e)
// // 	// 	return err
// // 	// }
// // 	// 3、校验参数
// // 	// err = validation.ValidateStruct(
// // 	// 	data,
// // 	// 	validation.Parameter(&data.InvitationCode, validation.Type("string"), validation.Required()),
// // 	// 	validation.Parameter(&data.AnonymousUserToken, validation.Type("string"), validation.Required()),
// // 	// 	validation.Parameter(&data.AnonymousUserDeviceId, validation.Type("string"), validation.Required()),
// // 	// )
// // 	// if err != nil {
// // 	// 	res.Msg = err.Error()
// // 	// 	res.Code = 10002
// // 	// 	res.CallSocketIo(e)
// // 	// 	return err
// // 	// }

// // 	// // 4、校验token是否有效
// // 	// aUser, err := CheckAnonymousToken(c, data.AnonymousUserToken, data.AnonymousUserDeviceId, userAgent, data.InvitationCode)
// // 	// if aUser == nil || err != nil {
// // 	// 	if err != nil {
// // 	// 		res.Msg = err.Error()
// // 	// 	}
// // 	// 	res.Code = 10304
// // 	// 	res.CallSocketIo(e)
// // 	// 	return err
// // 	// }

// // 	// 5、加入房间
// // 	roomId := methods.GetAnonymousRoomId(data.Token.InvitationCode)
// // 	isJoin := c.JoinRoomWithNamespace(roomId)
// // 	if !isJoin {
// // 		res.Code = 10303
// // 		res.CallSocketIo(e)
// // 		return err
// // 	}
// // 	// 6、解析数据
// // 	responseData := protos.GetAllUsersInAnonymousRoom_Response{
// // 		RoomId: roomId,
// // 	}

// // 	conns := c.GetAllConnContextInRoomWithNamespace(roomId)
// // 	// log.Info("conns", conns)
// // 	responseData.TotalUser = int64(len(conns))
// // 	for _, conn := range conns {
// // 		userInfo := conn.GetSessionCacheWithConnId(conn.ID(), "anonymousUserInfo").(*sso.UserInfo)
// // 		auser := protos.RoomUserInfo{
// // 			Uid:      userInfo.Uid,
// // 			Avatar:   userInfo.Avatar,
// // 			Nickname: userInfo.Nickname,
// // 			Username: userInfo.Username,
// // 			Letter:   nstrings.GetLetter(nstrings.StringOr(userInfo.Nickname, userInfo.Username)),
// // 			Email:    "",
// // 			Bio:      userInfo.Bio,
// // 		}

// // 		responseData.List = append(responseData.List, &auser)
// // 	}

// // 	res.Code = 200
// // 	res.Data = protos.Encode(&responseData)
// // 	res.CallSocketIo(e)
// // 	return nil
// // }
