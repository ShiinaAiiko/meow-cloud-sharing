package models

import (
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	mongodb "github.com/ShiinaAiiko/meow-cloud-sharing/server/db/mongo"

	"github.com/cherrai/nyanyago-utils/validation"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// 聊天记录策略：
// 1、包含有个人、群的ID存储
// 2、包含有发送人、回复ID、群ID、信息内容、发送时间、
// 有效期时间（倒计时、拓展）、撤回时间、
// 已有哪些人看过（记录UID）。
// 3、缓存30天，过期自动删除。
// 4、本地聊天记录最后一条ID的时间戳开始拉取线上之前的记
// 录，直到没有
// 5、接口：获取当前好友或者群的有效期内的未读信息数量、
// 红点
// 6、艾特人除了msg里有该标签名称外。还要加上艾特UID数组

type MessagesAudio struct {
	// Time Unix timestamp
	Time int64 `bson:"time" json:"time"`
	// Url
	Url string `bson:"url" json:"url"`
}
type MessagesVideo struct {
	// Time Unix timestamp
	Time int64 `bson:"time" json:"time"`
	// Url
	Url    string `bson:"url" json:"url"`
	Width  int64  `bson:"width" json:"width"`
	Height int64  `bson:"height" json:"height"`
}
type MessagesImage struct {
	// Url
	Url    string `bson:"url" json:"url"`
	Width  int64  `bson:"width" json:"width"`
	Height int64  `bson:"height" json:"height"`
	// 'image/gif' | 'image/jpeg'
	Type string `bson:"type" json:"type"`
}
type MessagesFile struct {
	// Url
	Url string `bson:"url" json:"url"`
}
type MessagesCallParticipants struct {
	Uid string `bson:"uid" json:"uid"`
	// 发起人与否
	Caller bool `bson:"caller" json:"caller"`
}
type MessagesCall struct {
	// Status:
	// 1 connected successfully
	// 0 calling
	// -1 Missing call
	// -2 Other devices calling
	// -3 Invite to join the call
	Status int64 `bson:"status" json:"status"`
	// RoomId
	RoomId string `bson:"roomId" json:"roomId"`
	// Participants UID
	Participants []*MessagesCallParticipants `bson:"participants" json:"participants"`
	// Type: Audio Video ScreenShare
	Type string `bson:"type" json:"type"`
	// Time Unix timestamp
	Time int64 `bson:"time" json:"time"`
}
type MessagesAtUsers struct {
	Uid string `bson:"uid" json:"uid"`
}
type MessagesReadUsers struct {
	Uid string `bson:"uid" json:"uid"`
}
type MessagesDeletedUsers struct {
	// 如果有个uid是"AllUser",则是所有人都不可见
	Uid string `bson:"uid" json:"uid"`
	// Forever 100 years
	// （预留，暂时永久。按天数来，每天4点将到期的消息恢复
	ExpirationTime int64 `bson:"expirationTime" json:"expirationTime"`
}
type MessagesForwardMessages struct {
	// MessageId
	Id primitive.ObjectID `bson:"id" json:"id,omitempty"`
}

type Messages struct {
	Id primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	// RoomId md5(appId+groupId/appId+authorId+friendId)
	RoomId   string             `bson:"roomId" json:"roomId,omitempty"`
	AuthorId string             `bson:"authorId" json:"authorId"`
	ReplyId  primitive.ObjectID `bson:"replyId,omitempty" json:"replyId"`

	AtUsers   []*MessagesAtUsers   `bson:"atUsers" json:"atUsers"`
	ReadUsers []*MessagesReadUsers `bson:"readUsers" json:"readUsers"`
	// 转发一堆聊天记录、（预留）
	ForwardMessages []*MessagesForwardMessages `bson:"forwardMessages" json:"forwardMessages"`
	Message         string                     `bson:"message" json:"message"`
	Audio           *MessagesAudio             `bson:"audio" json:"audio"`
	Video           *MessagesVideo             `bson:"video" json:"video"`
	Image           *MessagesImage             `bson:"image" json:"image"`
	Call            *MessagesCall              `bson:"call" json:"call"`
	// 预留
	File         *MessagesFile           `bson:"file" json:"file"`
	DeletedUsers []*MessagesDeletedUsers `bson:"deletedUsers" json:"deletedUsers"`
	// Status:
	// 1 normal
	// 0 recall
	// -1 deleted （暂时弃用）
	Status       int64 `bson:"status" json:"status,omitempty"`
	CreateTime   int64 `bson:"createTime" json:"createTime"`
	DeadlineTime int64 `bson:"deadlineTime" json:"deadlineTime"`
	RecallTime   int64 `bson:"recallTime" json:"recallTime"`
	EditTime     int64 `bson:"editTime" json:"editTime"`
}

func (cr *Messages) GetCollectionName() string {
	return "Messages"
}

func (cr *Messages) Default() error {
	if cr.Id == primitive.NilObjectID {
		cr.Id = primitive.NewObjectID()
	}
	unixTimeStamp := time.Now().Unix()
	if cr.AtUsers == nil {
		cr.AtUsers = []*MessagesAtUsers{}
	}
	if cr.ForwardMessages == nil {
		cr.ForwardMessages = []*MessagesForwardMessages{}
	}
	// if cr.ReplyId == primitive.NilObjectID {
	// 	cr.ReplyId = primitive.NewObjectID()
	// }
	if cr.Status == 0 {
		cr.Status = 1
	}

	if cr.Audio == nil {
		cr.Audio = &MessagesAudio{}
	}
	if cr.Video == nil {
		cr.Video = &MessagesVideo{}
	}
	if cr.Image == nil {
		cr.Image = &MessagesImage{}
	}
	if cr.Call == nil {
		cr.Call = &MessagesCall{}
	}
	if cr.File == nil {
		cr.File = &MessagesFile{}
	}

	if cr.ReadUsers == nil {
		cr.ReadUsers = []*MessagesReadUsers{}
	}
	if cr.ReadUsers == nil {
		cr.ReadUsers = []*MessagesReadUsers{}
	}
	if cr.ReadUsers == nil {
		cr.ReadUsers = []*MessagesReadUsers{}
	}
	if cr.DeletedUsers == nil {
		cr.DeletedUsers = []*MessagesDeletedUsers{}
	}
	if cr.CreateTime == 0 {
		cr.CreateTime = unixTimeStamp
	}
	if cr.DeadlineTime == 0 {
		cr.DeadlineTime = -1
	}
	if cr.RecallTime == 0 {
		cr.RecallTime = -1
	}
	if cr.EditTime == 0 {
		cr.EditTime = -1
	}

	if err := cr.Validate(); err != nil {
		return errors.New(cr.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (cr *Messages) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, cr.GetCollectionName())
}

func (cr *Messages) Validate() error {
	return validation.ValidateStruct(
		cr,
		validation.Parameter(&cr.RoomId, validation.Required()),
		validation.Parameter(&cr.Id, validation.Required()),
		validation.Parameter(&cr.Status, validation.Enum([]int64{1, 0, -1})),
		validation.Parameter(&cr.AuthorId, validation.Required()),
		validation.Parameter(&cr.CreateTime, validation.Required()),
	)
}

// 获取总页码的最后一条是根据时间排序的最后一条正确
// 远程和本地分为两个。

// 优先获取远程，页码全部独立。前端的页码显示加起来即可。

// 而如果远程则时间倒序，第一个就是之前的讨论的第一条。然后添加到本地，获取了一半就从之前的记录。
// 均是优先远程
