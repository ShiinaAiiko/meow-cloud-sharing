package response

import (
	"encoding/json"
	"time"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"

	"github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nrand"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/gin-gonic/gin"
	anypb "google.golang.org/protobuf/types/known/anypb"
)

var (
	log = nlog.New()
)

type ResponseProtobufType struct {
	protos.ResponseType
}

func (res *ResponseProtobufType) Call(c *gin.Context) {
	var r ResponseType
	r.Code = res.Code
	r.Data = res.Data
	r.Msg = res.Msg
	r.CnMsg = res.CnMsg
	r.Error = res.Error
	r.RequestId = res.RequestId
	r.RequestTime = res.RequestTime
	r.Platform = res.Platform
	c.Set("protobuf", r.GetResponse())
}

func (res *ResponseProtobufType) Errors(err error) {
	if err != nil {
		res.Error = err.Error()
	}
}

func (res *ResponseProtobufType) GetResponse() interface{} {
	var r ResponseType
	r.Code = res.Code
	r.Data = res.Data
	r.Msg = res.Msg
	r.CnMsg = res.CnMsg
	r.Error = res.Error
	r.RequestId = res.RequestId
	r.RequestTime = res.RequestTime
	r.Platform = res.Platform
	return r.GetResponse()
}
func (res *ResponseProtobufType) CallSocketIo(c *nsocketio.EventInstance) {
	var r ResponseType
	r.Code = res.Code
	r.Data = res.Data
	r.Msg = res.Msg
	r.CnMsg = res.CnMsg
	r.Error = res.Error
	r.RequestId = res.RequestId
	r.RequestTime = res.RequestTime
	r.Platform = res.Platform
	// fmt.Println("r.GetResponse()", r.GetResponse())
	c.Set("protobuf", r.GetResponse())
}

func (res *ResponseProtobufType) Encryption(userAesKey string, getReponseData interface{}) string {
	if getReponseData == nil {
		return ""
	}

	// fmt.Println("getReponseProtobufData", getReponseProtobufData)
	// 目标用户没有成功生成AesKey的时候
	// 应该换成获取对应用户的AesKey，并不返key值

	aes := cipher.AES{
		Key:  "",
		Mode: "CFB",
	}
	if userAesKey == "" {
		aes.Key = cipher.MD5(nstrings.ToString(nrand.GetRandomNum(18)))
	} else {
		aes.Key = userAesKey
	}
	// log.Info("userAesKey", aes.Key, userAesKey, userAesKey != "")

	getResponseStr, _ := json.Marshal(getReponseData)
	bodyStr, _ := aes.Encrypt(string(getResponseStr), aes.Key)
	if userAesKey != "" {
		return protos.Encode(
			&protos.ResponseEncryptDataType{
				Data: bodyStr.HexEncodeToString(),
			},
		)
	}
	return protos.Encode(
		&protos.ResponseEncryptDataType{
			Data: bodyStr.HexEncodeToString(),
			Key:  aes.Key,
		},
	)
}

type ResponseType struct {
	// Code 200, 10004
	Code        int64  `json:"code,omitempty"`
	Msg         string `json:"msg,omitempty"`
	CnMsg       string `json:"cnMsg,omitempty"`
	Error       string `json:"error,omitempty"`
	RequestId   string `json:"requestId,omitempty"`
	RequestTime int64  `json:"requestTime,omitempty"`
	Author      string `json:"author,omitempty"`
	Platform    string `json:"platform,omitempty"`
	// RequestTime int64                  `json:"requestTime"`
	// Author      string                 `json:"author"`
	Data interface{} `json:"data,omitempty"`
}

type H map[string]interface{}
type Any *anypb.Any

func (res *ResponseType) Errors(err error) {
	if err != nil {
		res.Error = err.Error()
	}
}

func (res *ResponseType) Call(c *gin.Context) {

	// Log.Info("setResponse", res.GetResponse())
	c.Set("body", res.GetResponse())
	// fmt.Println("setResponse")
	// c.JSON(http.StatusOK, res.GetResponse())
}

func (res *ResponseType) GetResponse() *ResponseType {
	msg := res.Msg
	cnMsg := res.CnMsg
	if res.Msg == "" {
		res.Msg = "Request success."
	}
	if res.CnMsg == "" {
		res.CnMsg = "请求成功"
	}
	if res.Platform == "" {
		res.Platform = "Meow Whisper<喵言私语>"
	}
	if res.Author == "" {
		res.Author = "Metahorizon Lab."
	}
	res.RequestTime = time.Now().Unix()

	switch res.Code {
	case 200:
		break
	// case 10306:
	// 	res.Msg = "Token creation failed."
	// 	res.CnMsg = "Token创建失败"
	// 	break
	// case 10304:
	// 	res.Msg = "Anonymous user login failed."
	// 	res.CnMsg = "匿名用户登陆信息错误"
	// 	break
	case 10501:
		res.Msg = "Room join failed."
		res.CnMsg = "房间加入失败"
	case 10402:
		res.Msg = "Message sending failed."
		res.CnMsg = "消息发送失败"
	case 10401:
		res.Msg = "Message sending failed."
		res.CnMsg = "消息发送失败"
		break
	case 10308:
		res.Msg = "Failed to disband the group."
		res.CnMsg = "群组解散失败"
		break
	case 10307:
		res.Msg = "Already a member of this group."
		res.CnMsg = "已是该群组的成员了"
		break
	case 10306:
		res.Msg = "The group does not exist."
		res.CnMsg = "该群组不存在"
		break
	case 10305:
		res.Msg = "No longer a member of this group."
		res.CnMsg = "已不是该群组的成员了"
		break
	case 10304:
		res.Msg = "Failed to leave group."
		res.CnMsg = "群组离开失败"
		break
	case 10303:
		res.Msg = "Failed to join group."
		res.CnMsg = "群组加入失败"
		break
	case 10302:
		res.Msg = "Not founder."
		res.CnMsg = "非创建人"
		break
	// case 10302:
	// 	res.Msg = "Invite code verification failed."
	// 	res.CnMsg = "邀请码验证失败"
	// 	break
	case 10301:
		res.Msg = "Failed to create group."
		res.CnMsg = "创建群组失败"
		break
	case 10203:
		res.Msg = "Call token verification failed."
		res.CnMsg = "通话令牌校验失败"
		break
	case 10202:
		res.Msg = "non-author."
		res.CnMsg = "非作者"
		break
	case 10201:
		res.Msg = "Failed to send message."
		res.CnMsg = "发送信息失败"
		break
	case 10108:
		res.Msg = "Can't add yourself as friend."
		res.CnMsg = "不能添加自己为好友"
		break
	case 10107:
		res.Msg = "Friend already exists."
		res.CnMsg = "好友已存在"
		break
	case 10106:
		res.Msg = "Failed to reject friend."
		res.CnMsg = "好友拒绝失败"
		break
	case 10105:
		res.Msg = "Non-friends."
		res.CnMsg = "非好友也"
		break
	case 10104:
		res.Msg = "Failed to delete friend."
		res.CnMsg = "好友删除失败"
		break
	case 10103:
		res.Msg = "Failed to add friend."
		res.CnMsg = "好友添加失败"
		break
	case 10102:
		res.Msg = "Friend verification failed."
		res.CnMsg = "好友数据校验不通过"
		break
	case 10101:
		res.Msg = "Failed to update friend log status."
		res.CnMsg = "更新好友添加状态失败"
		break
	// case 10005:
	// 	res.Msg = "Invalid request."
	// 	res.CnMsg = "无效请求"
	// 	break
	case 10019:
		res.Msg = "Delete failed."
		res.CnMsg = "删除失败"
		break
	case 10018:
		res.Msg = "Application token creation failed."
		res.CnMsg = "应用Token创建失败"
		break
	case 10017:
		res.Msg = "Application does not exist."
		res.CnMsg = "应用不存在"
		break
	case 10016:
		res.Msg = "Message sending failed."
		res.CnMsg = "信息发送失败"
		break
	case 10015:
		res.Msg = "Update no changes."
		res.CnMsg = "更新无变化"
		break
	case 10014:
		res.Msg = "File upload error."
		res.CnMsg = "文件上传错误"
		break
	case 10013:
		res.Msg = "Route does not exist."
		res.CnMsg = "路由不存在"
		break
	case 10012:
		res.Msg = "Already executed."
		res.CnMsg = "已执行过了"
		break
	case 10011:
		res.Msg = "Update failed."
		res.CnMsg = "更新失败"
		break
	case 10010:
		res.Msg = "Insufficient Privilege."
		res.CnMsg = "权限不足."
		break
	case 10009:
		res.Msg = "Decryption failed."
		res.CnMsg = "解密失败."
		break
	case 10008:
		res.Msg = "Encryption key error."
		res.CnMsg = "秘钥错误."
		break
	case 10007:
		res.Msg = "Encryption key generation failed."
		res.CnMsg = "加密秘钥生成失败"
		break
	case 10006:
		res.Msg = "No more."
		res.CnMsg = "没有更多内容了"
		break
	case 10005:
		res.Msg = "Repeat request."
		res.CnMsg = "重复请求"
		break
	case 10004:
		res.Msg = "Login error."
		res.CnMsg = "登陆信息错误"
		break
	case 10001:
		res.Msg = "Request error."
		res.CnMsg = "请求失败"
		break
	case 10002:
		res.Msg = "Parameter error."
		res.CnMsg = "参数错误"
		break
	default:
		res.Msg = "Request error."
		res.CnMsg = "请求失败"
		break
	}
	if res.Code == 0 {
		res.Code = 10001
	}

	if msg != "" {
		res.Msg = msg
	}
	if cnMsg != "" {
		res.CnMsg = cnMsg
	}

	return res
}
