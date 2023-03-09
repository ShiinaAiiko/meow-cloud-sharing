package controllersV1

import (
	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/methods"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/services/response"
	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
)

type ContactController struct {
}

func (fc *ContactController) SearchContact(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------SearchContact------")

	// 2、获取参数
	data := new(protos.SearchContact_Request)
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
		validation.Parameter(&data.UserId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	appId := c.GetString("appId")
	log.Info(appId, data.UserId)

	// 4、搜索此ID是否存在
	getUsers, err := conf.SSO.GetUsers([]string{
		data.UserId,
	})
	if err != nil || len(getUsers) == 0 {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}

	// 5、查看好友关系
	isFriend := false
	roomId := ""

	token := c.GetString("token")
	if token != "" {
		appId := c.GetString("appId")
		deviceId := c.GetString("deviceId")
		var userAgent *sso.UserAgent
		if u, ok := c.Get("userAgent"); ok {
			userAgent = u.(*sso.UserAgent)
		}

		v, err := conf.SSO.Verify(token, deviceId, userAgent)
		// Log.Info("ret", ret, err)
		if err != nil {
			// Log.Info("jwt: ", err)
			res.Errors(err)
			res.Code = 10004
			res.Call(c)
			c.Abort()
			return
		}
		if v != nil && v.UserInfo.Uid != "" {
			if getUsers[0].Uid == v.UserInfo.Uid {
				isFriend = false
				roomId = ""
			} else {
				added := contactDbx.GetContact(appId, []string{
					v.UserInfo.Uid, getUsers[0].Uid,
				}, []int64{1, 0}, "")
				log.Info("added", added)
				if added != nil {
					isFriend = true
					roomId = added.Id
				}
			}
		}
	}

	// ssoUser := new(protos.SSOUserInfo)
	// copier.Copy(ssoUser, update.User)
	responseData := protos.SearchContact_Response{
		IsFriend: isFriend,
		RoomId:   roomId,
	}

	sUser := new(protos.SimpleSSOUserInfo)

	log.Info("getUsers", sUser, getUsers[0])

	copier.Copy(sUser, getUsers[0])
	sUser.Letter = nstrings.GetLetter(sUser.Nickname)

	responseData.UserInfo = sUser
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *ContactController) SearchUserInfoList(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------SearchUserInfoList------")

	// 2、获取参数
	data := new(protos.SearchUserInfoList_Request)
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
		validation.Parameter(&data.Uid, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	appId := c.GetString("appId")
	log.Info(appId)

	getUsers, err := conf.SSO.GetUsers(
		data.Uid,
	)
	if err != nil || len(getUsers) == 0 {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}

	// ssoUser := new(protos.SSOUserInfo)
	// copier.Copy(ssoUser, update.User)

	list := []*protos.SimpleSSOUserInfo{}

	for _, v := range getUsers {
		sUser := new(protos.SimpleSSOUserInfo)

		copier.Copy(sUser, v)
		sUser.Letter = nstrings.GetLetter(sUser.Nickname)

		list = append(list, sUser)

	}
	responseData := protos.SearchUserInfoList_Response{
		List:  list,
		Total: nint.ToInt64(len(list)),
	}

	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *ContactController) AddContact(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------AddContact------")

	// 2、获取参数
	data := new(protos.AddContact_Request)
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
		validation.Parameter(&data.UserId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Remark, validation.Type("string")),
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

	getUsers, err := conf.SSO.GetUsers([]string{
		data.UserId,
	})
	if err != nil || len(getUsers) == 0 {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	uid := getUsers[0].Uid

	log.Info(userInfo.Uid, uid)
	if userInfo.Uid == uid {
		res.Code = 10108
		res.Call(c)
		return
	}

	appId := c.GetString("appId")

	added := contactDbx.GetContact(appId, []string{
		userInfo.Uid, uid,
	}, []int64{1, 0}, "")
	// log.Info("added", added)
	if added != nil {
		res.Code = 10107
		res.Call(c)
		return
	}

	// 预留 检测是否必须验证，验证则是存储验证记录。
	add, err := contactDbx.AddContact(appId, []string{
		userInfo.Uid, uid,
	})
	if add == nil || err != nil {
		res.Errors(err)
		res.Code = 10103
		res.Call(c)
		return
	}
	// log.Info("add", add)

	responseData := protos.AddContact_Response{
		Type:   "Added",
		RoomId: add.Id,
		Uid:    uid,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	var sres response.ResponseProtobufType
	sres.Code = 200
	sres.Data = protos.Encode(&protos.UpdateContactStatus_Response{
		Type:   "Add",
		RoomId: add.Id,
		Uid:    userInfo.Uid,
	})

	// 暂定只有1v1需要加密e2ee，其他的用自己的即可
	new(methods.SocketConn).BroadcastToUser(namespace["chat"], uid,
		routeEventName["updateContactStatus"],
		&sres)

}

func (fc *ContactController) DeleteContact(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------DeleteContact------")

	// 2、获取参数
	data := new(protos.DeleteContact_Request)
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
		validation.Parameter(&data.Uid, validation.Type("string"), validation.Required()),
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

	log.Info(userInfo.Uid, data.Uid)
	if userInfo.Uid == data.Uid {
		res.Code = 10108
		res.Call(c)
		return
	}

	appId := c.GetString("appId")

	added := contactDbx.GetContact(appId, []string{
		userInfo.Uid, data.Uid,
	}, []int64{1, 0}, "")
	// log.Info("added", added)
	if added == nil {
		res.Code = 10105
		res.Call(c)
		return
	}
	if err = contactDbx.DeleteContact(appId, []string{
		userInfo.Uid, data.Uid,
	}); err != nil {
		res.Errors(err)
		res.Code = 10104
		res.Call(c)
		return
	}
	// log.Info("add", add)

	responseData := protos.DeleteContact_Response{
		RoomId: added.Id,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	var sres response.ResponseProtobufType
	sres.Code = 200
	sres.Data = protos.Encode(&protos.UpdateContactStatus_Response{
		Type:   "Delete",
		RoomId: added.Id,
		Uid:    userInfo.Uid,
	})

	msc := methods.SocketConn{}

	// 暂定只有1v1需要加密e2ee，其他的用自己的即可
	msc.BroadcastToUser(namespace["chat"], data.Uid,
		routeEventName["updateContactStatus"],
		&sres)
	for _, v := range added.Users {
		msc.LeaveRoom(namespace["chat"], v.Uid, added.Id)
	}
}

func (fc *ContactController) GetContactList(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetContactList------")

	// 2、获取参数
	data := new(protos.GetContactList_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
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

	appId := c.GetString("appId")

	getContacts, err := contactDbx.GetAllContact(appId, userInfo.Uid, []int64{})
	// log.Info("getContacts", getContacts, err)
	if err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// log.Info("add", add)

	list := []*protos.Contact{}

	if len(getContacts) > 0 {
		uids := []string{}
		for _, v := range getContacts {
			ctt := new(protos.Contact)

			copier.Copy(ctt, v)
			for _, sv := range ctt.Users {
				if sv.Uid != userInfo.Uid {
					// log.Info(sv)
					uids = append(uids, sv.Uid)
				}
			}
			if v.LastMessage != primitive.NilObjectID {
				ctt.LastMessage = v.LastMessage.Hex()
			}
			// log.Info(v.Permissions.E2Ee, ctt.Permissions.E2Ee)
			list = append(list, ctt)
		}

		getUsers, err := conf.SSO.GetUsers(uids)
		// log.Info("getUsers", getUsers, uids)
		if err != nil || len(getUsers) == 0 {
			res.Errors(err)
			res.Code = 10001
			res.Call(c)
			return
		}

		for _, v := range list {
			for _, sv := range v.Users {
				// log.Info(sv.Uid != userInfo.Uid)
				if sv.Uid != userInfo.Uid {
					for _, gv := range getUsers {
						// log.Info(gv.Uid == sv.Uid)
						// log.Info("lastSeenTime", gv.LastSeenTime)
						if gv.Uid == sv.Uid {
							sUser := new(protos.SimpleSSOUserInfo)
							copier.Copy(sUser, gv)
							sUser.Letter = nstrings.GetLetter(sUser.Nickname)
							// log.Info("sUser", sUser.LastSeenTime)
							sv.UserInfo = sUser
							break
						}
					}
					break
				}
			}
		}
	}

	responseData := protos.GetContactList_Response{
		Total: nint.ToInt64(len(getContacts)),
		List:  list,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}
