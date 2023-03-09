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

type GroupMembersPermissions struct {
	// UpdateTime int64 `bson:"updateTime" json:"updateTime,omitempty"`
	// 是否接受群的消息
	ReceiveMessage bool `bson:"receiveMessage" json:"receiveMessage,omitempty"`
}

type GroupMembersJoinHistory struct {
	JoinTime int64 `bson:"joinTime" json:"joinTime,omitempty"`
}
type GroupMembersLeaveHistory struct {
	LeaveTime int64 `bson:"leaveTime" json:"leaveTime,omitempty"`
}
type GroupMembers struct {
	Id    primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	AppId string             `bson:"appId" json:"appId,omitempty"`
	// GroupId
	GroupId  string `bson:"groupId" json:"groupId,omitempty"`
	AuthorId string `bson:"authorId" json:"authorId,omitempty"`
	// Custom nickname
	// 针对群 这就是自己设置的昵称，没有，在群里就显示自己的nickname
	Nickname string `bson:"nickname" json:"nickname,omitempty"`
	// Permissions 预留
	Permissions *GroupMembersPermissions `bson:"permissions" json:"permissions"`
	// Status:
	// 1 normal
	// -1 leave
	Status int64 `bson:"status" json:"status,omitempty"`

	// 暂时弃用
	JoinHistory  []GroupMembersJoinHistory  `bson:"joinHistory" json:"joinHistory,omitempty"`
	LeaveHistory []GroupMembersLeaveHistory `bson:"leaveHistory" json:"leaveHistory,omitempty"`
	// CreateTime Unix timestamp
	CreateTime int64 `bson:"createTime" json:"createTime,omitempty"`

	// LastSeenTime int64              `bson:"lastSeenTime" json:"lastSeenTime,omitempty"`
	LastMessage primitive.ObjectID `bson:"lastMessage" json:"lastMessage,omitempty"`
	// LastMessageTime Unix timestamp
	LastMessageTime int64 `bson:"lastMessageTime" json:"lastMessageTime,omitempty"`
}

func (m *GroupMembers) GetCollectionName() string {
	return "GroupMembers"
}

func (m *GroupMembers) Default() error {
	if m.Id == primitive.NilObjectID {
		m.Id = primitive.NewObjectID()
	}
	if m.Status == 0 {
		m.Status = 1
	}
	if m.Permissions == nil {
		m.Permissions = new(GroupMembersPermissions)
	}
	if len(m.JoinHistory) == 0 {
		m.JoinHistory = []GroupMembersJoinHistory{}
	}
	if len(m.LeaveHistory) == 0 {
		m.LeaveHistory = []GroupMembersLeaveHistory{}
	}
	unixTimeStamp := time.Now().Unix()
	if m.CreateTime == 0 {
		m.CreateTime = unixTimeStamp
	}
	// if m.LastSeenTime == 0 {
	// 	m.LastSeenTime = -1
	// }

	if m.LastMessageTime == 0 {
		m.LastMessageTime = time.Now().Unix()
	}

	if err := m.Validate(); err != nil {
		return errors.New(m.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (m *GroupMembers) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *GroupMembers) Validate() error {
	errStr := ""
	if m.Permissions == nil {
		err := validation.ValidateStruct(
			m.Permissions,
		)
		if err != nil {
			errStr += err.Error()
		}
	}
	err := validation.ValidateStruct(
		m,
		validation.Parameter(&m.AppId, validation.Required()),
		validation.Parameter(&m.GroupId, validation.Required()),
		validation.Parameter(&m.AuthorId, validation.Required()),
		validation.Parameter(&m.Status, validation.Enum([]int64{1, -1})),
		validation.Parameter(&m.CreateTime, validation.Required()),
		// validation.Parameter(&m.LastSeenTime, validation.Required()),
		validation.Parameter(&m.LastMessageTime, validation.Required()),
	)
	if err != nil {
		errStr += err.Error()
	}
	if errStr == "" {
		return nil
	}
	return errors.New(errStr)
}
