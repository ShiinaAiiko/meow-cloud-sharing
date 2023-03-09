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

type GroupController struct {
}

func (fc *GroupController) NewGroup(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------NewGroup------")

	// 2、获取参数
	data := new(protos.NewGroup_Request)
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
		validation.Parameter(&data.Name, validation.Type("string"), validation.Required()),
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

	appId := c.GetString("appId")

	// 预留 检测是否必须验证，验证则是存储验证记录。
	add, err := groupDbx.NewGroup(appId, userInfo.Uid, data.Name, data.Avatar)
	if add == nil || err != nil {
		res.Errors(err)
		res.Code = 10301
		res.Call(c)
		return
	}

	// 添加成员

	log.Info("add", add, data.Members)
	data.Members = append(data.Members, &protos.GroupMemberUpdateParams{
		Type: "Join",
		Uid:  userInfo.Uid,
	})
	protpData := protos.UpdateGroupStatus_Response{
		Type:   "New",
		RoomId: add.Id,
		Uid:    []string{},
	}

	for _, v := range data.Members {
		if v.Type == "Join" {
			err := groupDbx.JoinGroupMembers(appId, add.Id, v.Uid)
			if err != nil {
				res.Errors(err)
				res.Code = 10303
				res.Call(c)
				return
			}
			protpData.Uid = append(protpData.Uid, v.Uid)
		}
	}

	responseData := protos.NewGroup_Response{
		Type: "Added",
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	var sres response.ResponseProtobufType
	sres.Code = 200
	sres.Data = protos.Encode(&protpData)

	for _, v := range protpData.Uid {
		new(methods.SocketConn).BroadcastToUser(namespace["chat"], v,
			routeEventName["updateGroupStatus"],
			&sres)
	}
	log.Info("protpData.Uid", protpData.Uid)
}

func (fc *GroupController) GetAllJoinedGroups(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetAllJoinedGroups------")

	// 2、获取参数
	data := new(protos.GetAllJoinedGroups_Request)
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

	getGroup, err := groupDbx.GetAllJoinedGroups(appId, userInfo.Uid)
	log.Info("getGroup", getGroup)

	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}

	list := []*protos.Group{}

	for _, v := range getGroup {
		// log.Info(v.Group)
		// log.Info(v, v.AuthorId)
		gr := new(protos.Group)
		gm := new(protos.GroupMembers)

		copier.Copy(gm, v)
		if len(v.Group) != 0 {
			copier.Copy(gr, v.Group[0])
			if v.Group[0].LastMessage != primitive.NilObjectID {
				gr.LastMessage = v.Group[0].LastMessage.Hex()
			}
		}
		if v.LastMessage != primitive.NilObjectID {
			gm.LastMessage = v.LastMessage.Hex()
		}

		gr.OwnMemberInfo = gm

		gr.Members = groupDbx.GetNumberOfGroupMembers(appId, gr.Id)
		log.Info(gr.Members, "groupDbx.GetNumberOfGroupMembers(appId, v.Id)")
		list = append(list, gr)
	}
	responseData := protos.GetAllJoinedGroups_Response{
		Total: nint.ToInt64(len(getGroup)),
		List:  list,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *GroupController) GetGroupInfo(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetGroupInfo------")

	// 2、获取参数
	data := new(protos.GetGroupInfo_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	appId := c.GetString("appId")

	getGroup, err := groupDbx.GetGroup(appId, data.GroupId)
	log.Info("getGroup", getGroup, appId, data.GroupId)
	if err != nil || getGroup == nil {
		res.Errors(err)
		res.Code = 10306
		res.Call(c)
		return
	}
	gr := new(protos.Group)
	copier.Copy(gr, getGroup)

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

			getM := groupDbx.GetGroupMember(appId, data.GroupId, v.UserInfo.Uid, []int64{1, 0})
			// log.Info("getM", getM)
			if getM != nil {
				gm := new(protos.GroupMembers)
				copier.Copy(gm, getM)
				if getM.LastMessage != primitive.NilObjectID {
					gm.LastMessage = getM.LastMessage.Hex()
				}
				gr.OwnMemberInfo = gm
			}

		}
	}

	gr.Members = groupDbx.GetNumberOfGroupMembers(appId, data.GroupId)

	responseData := protos.GetGroupInfo_Response{
		Group: gr,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *GroupController) GetGroupMembers(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------GetGroupMembers------")

	// 2、获取参数
	data := new(protos.GetGroupMembers_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	appId := c.GetString("appId")

	getMembers, err := groupDbx.GetGroupMembers(appId, data.GroupId)
	// log.Info("getMembers", getMembers, appId, data.GroupId)
	if err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}
	uids := []string{}
	list := []*protos.GroupMembers{}

	for _, v := range getMembers {
		uids = append(uids, v.AuthorId)
		gm := new(protos.GroupMembers)
		copier.Copy(gm, v)
		list = append(list, gm)
	}

	getUsers, err := conf.SSO.GetUsers(uids)
	// log.Info("getUsers", getUsers)
	if err != nil || len(getUsers) == 0 {
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}

	for i, j := 0, len(list)-1; i <= j; i, j = i+1, j-1 {
		if j == i {
			methods.FormatGroupMembers(list[i], getUsers)
			break
		}
		methods.FormatGroupMembers(list[i], getUsers)
		methods.FormatGroupMembers(list[j], getUsers)
	}

	responseData := protos.GetGroupMembers_Response{
		List:  list,
		Total: nint.ToInt64(len(getMembers)),
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *GroupController) LeaveGroup(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------LeaveGroup------")

	// 2、获取参数
	data := new(protos.LeaveGroup_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Required()),
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

	appId := c.GetString("appId")

	getGroup, err := groupDbx.GetGroup(appId, data.GroupId)
	// log.Info("getGroup", getGroup, appId, data.GroupId)
	if getGroup == nil {
		res.Errors(err)
		res.Code = 10306
		res.Call(c)
		return
	}

	allow := false

	// 需要判断是不是创建人
	if userInfo.Uid == getGroup.AuthorId {
		allow = true
		// res.Code = 10302
		// res.Call(c)
		// return
	} else {
		// 未来判断是否是管理员
		allow = false

		// getM := groupDbx.GetGroupMember(appId, data.GroupId, userInfo.Uid, []int64{1, 0})
		// if getM == nil {
		// 	res.Code = 10305
		// 	res.Call(c)
		// 	return
		// }
	}

	if !allow {
		// 判断该群组是不是允许其他人邀请加入(预留)
		// allow = false
		allow = true

		// 判断是不是自己在申请
		// 自己申请只有一个人
		if len(data.Uid) == 1 && data.Uid[0] == userInfo.Uid {
			allow = true
		}
	}

	if !allow {
		res.Code = 10303
		res.Call(c)
		return

	}

	sc := new(methods.SocketConn)

	responseData := protos.LeaveGroup_Response{}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	var sres response.ResponseProtobufType
	sres.Code = 200
	sres.Data = protos.Encode(&protos.UpdateGroupStatus_Response{
		Type:   "Leave",
		RoomId: data.GroupId,
		Uid:    data.Uid,
	})

	sc.BroadcastToRoomByDeviceId(namespace["chat"],
		c.GetString("deviceId"),
		data.GroupId,
		routeEventName["updateGroupStatus"],
		&sres,
		true)

	for _, v := range data.Uid {
		getM := groupDbx.GetGroupMember(appId, data.GroupId, v, []int64{1, 0})
		// log.Info("getM", getM)
		if getM == nil {
			res.Code = 10305
			res.Call(c)
			return
		}
		if err = groupDbx.LeaveGroup(appId, data.GroupId, v); err != nil {
			res.Code = 10304
			res.Call(c)
			return
		}
		sc.LeaveRoom(namespace["chat"], v, data.GroupId)
	}
}

func (fc *GroupController) JoinGroup(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200
	log.Info("------JoinGroup------")

	// 2、获取参数
	data := new(protos.JoinGroup_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Uid, validation.Required()),
		// validation.Parameter(&data.Remark, validation.Type("string"), validation.Required()),
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

	appId := c.GetString("appId")

	getGroup, err := groupDbx.GetGroup(appId, data.GroupId)
	// log.Info("getGroup", getGroup, appId, data.GroupId)
	if getGroup == nil {
		res.Errors(err)
		res.Code = 10306
		res.Call(c)
		return
	}

	allow := false

	// 需要判断是不是创建人
	if userInfo.Uid == getGroup.AuthorId {
		allow = true
		// res.Code = 10302
		// res.Call(c)
		// return
	} else {
		// 未来判断是否是管理员
		allow = false

		// getM := groupDbx.GetGroupMember(appId, data.GroupId, userInfo.Uid, []int64{1, 0})
		// if getM == nil {
		// 	res.Code = 10305
		// 	res.Call(c)
		// 	return
		// }
	}

	if !allow {
		// 判断该群组是不是允许其他人邀请加入(预留)
		// allow = false
		allow = true

		// 判断是不是自己在申请
		// 自己申请只有一个人
		if len(data.Uid) == 1 && data.Uid[0] == userInfo.Uid {
			allow = true
		}
	}

	if !allow {
		res.Code = 10303
		res.Call(c)
		return

	}

	// 预留 检测是否必须验证，验证则是存储验证记录。

	for _, v := range data.Uid {
		getM := groupDbx.GetGroupMember(appId, data.GroupId, v, []int64{1, 0})
		if getM != nil {
			res.Code = 10307
			res.Call(c)
			return
		}

		if err = groupDbx.JoinGroupMembers(appId, data.GroupId, v); err != nil {
			res.Code = 10303
			res.Call(c)
			return
		}
	}

	responseData := protos.JoinGroup_Response{
		Type: "Added",
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	var sres response.ResponseProtobufType
	sres.Code = 200
	sres.Data = protos.Encode(&protos.UpdateGroupStatus_Response{
		Type:   "Join",
		RoomId: data.GroupId,
		Uid:    data.Uid,
	})

	sc := new(methods.SocketConn)
	for _, v := range data.Uid {
		sc.BroadcastToUser(namespace["chat"], v,
			routeEventName["updateGroupStatus"],
			&sres)
	}

	sc.BroadcastToRoomByDeviceId(namespace["chat"],
		c.GetString("deviceId"),
		data.GroupId,
		routeEventName["updateGroupStatus"],
		&sres,
		false)
}

func (fc *GroupController) DisbandGroup(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.DisbandGroup_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
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

	getGroup, err := groupDbx.GetGroup(appId, data.GroupId)
	// log.Info("getGroup", getGroup, appId, data.GroupId)
	if getGroup == nil {
		res.Errors(err)
		res.Code = 10306
		res.Call(c)
		return
	}

	// 需要判断是不是创建人
	if getGroup.AuthorId != userInfo.Uid {
		res.Code = 10302
		res.Call(c)
		return
	}

	if err = groupDbx.DisbandGroup(appId, data.GroupId, getGroup.AuthorId); err != nil {
		res.Code = 10308
		res.Call(c)
		return
	}

	// 所有成员退出群组
	go func() {
		// 先发提醒,提醒对方已被解散
		if err = groupDbx.AllMembersLeaveGroup(appId, data.GroupId); err != nil {
			log.Info(err)
		}
		sc := new(methods.SocketConn)

		// sc.LeaveRoom(namespace["chat"], v, data.GroupId)

		var sres response.ResponseProtobufType
		sres.Code = 200
		sres.Data = protos.Encode(&protos.UpdateGroupStatus_Response{
			Type:   "Disband",
			RoomId: data.GroupId,
			// Uid:    userInfo.Uid,
		})

		sc.BroadcastToRoomByDeviceId(namespace["chat"],
			c.GetString("deviceId"),
			data.GroupId,
			routeEventName["updateGroupStatus"],
			&sres,
			false)

		conf.SocketIO.ClearRoom(namespace["chat"], data.GroupId)
	}()

	responseData := protos.DisbandGroup_Response{}
	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (fc *GroupController) UpdateGroupInfo(c *gin.Context) {
	// 1、初始化返回体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.UpdateGroupInfo_Request)
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
		validation.Parameter(&data.GroupId, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Name, validation.Type("string"), validation.Required()),
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

	getGroup, err := groupDbx.GetGroup(appId, data.GroupId)
	// log.Info("getGroup", getGroup, appId, data.GroupId)
	if getGroup == nil {
		res.Errors(err)
		res.Code = 10306
		res.Call(c)
		return
	}

	// 需要判断是不是创建人
	if getGroup.AuthorId != userInfo.Uid {
		res.Code = 10302
		res.Call(c)
		return
	}

	if err = groupDbx.UpdateGroupInfo(appId, data.GroupId, data.Name, nstrings.StringOr(data.Avatar, getGroup.Avatar)); err != nil {
		res.Code = 10011
		res.Call(c)
		return
	}

	responseData := protos.UpdateGroupInfo_Response{
		GroupId: data.GroupId,
		Avatar:  nstrings.StringOr(data.Avatar, getGroup.Avatar),
		Name:    data.Name,
	}
	res.Data = protos.Encode(&responseData)
	res.Call(c)

	new(methods.SocketConn).BroadcastToRoomByDeviceId(namespace["chat"],
		c.GetString("deviceId"),
		data.GroupId,
		routeEventName["updateGroupInfo"],
		&res,
		true)
}
