package models

import (
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	mongodb "github.com/ShiinaAiiko/meow-cloud-sharing/server/db/mongo"
	"github.com/lithammer/shortuuid"

	"github.com/cherrai/nyanyago-utils/validation"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type GroupPermissionsAdministratorList struct {
	Uid string `bson:"uid" json:"uid,omitempty"`
}

type GroupPermissions struct {
	// 暂时弃用
	MaximumMembers int64 `bson:"maximumMembers" json:"maximumMembers,omitempty"`

	// 以下预留：
	// true 可加入
	// false 不能加入
	// 启用
	AllowMembersJoin bool `bson:"allowMembersJoin" json:"allowMembersJoin,omitempty"`
	// true 可聊天
	// false 不能进行聊天
	// 启用
	AllowMembersChat bool `bson:"allowMembersChat" json:"allowMembersChat,omitempty"`
	// 无需验证即可加入
	JoinWithoutAuthentication bool `bson:"joinWithoutAuthentication" json:"joinWithoutAuthentication,omitempty"`

	// 暂时弃用
	AdministratorList []*GroupPermissionsAdministratorList `bson:"administratorList" json:"administratorList,omitempty"`
}

type Group struct {
	Id string `bson:"_id" json:"id,omitempty"`
	// AppId
	AppId       string            `bson:"appId" json:"appId,omitempty"`
	AuthorId    string            `bson:"authorId" json:"authorId,omitempty"`
	Name        string            `bson:"name" json:"name,omitempty"`
	Avatar      string            `bson:"avatar" json:"avatar,omitempty"`
	Permissions *GroupPermissions `bson:"permissions" json:"permissions,omitempty"`
	// Status:
	// 1 normal
	// 0 ban speech
	// -1 deleted
	Status          int64              `bson:"status" json:"status,omitempty"`
	CreateTime      int64              `bson:"createTime" json:"createTime,omitempty"`
	DeleteTime      int64              `bson:"deleteTime" json:"deleteTime,omitempty"`
	LastUpdateTime  int64              `bson:"lastUpdateTime" json:"lastUpdateTime,omitempty"`
	LastMessage     primitive.ObjectID `bson:"lastMessage" json:"lastMessage,omitempty"`
	LastMessageTime int64              `bson:"lastMessageTime" json:"lastMessageTime,omitempty"`
}

func (m *Group) GetCollectionName() string {
	return "Group"
}

func (m *Group) Default() error {
	if m.Id == "" {
		// 生成一个短一点的ID
		m.Id = "G" + shortuuid.New()
	}
	// if m.Id == primitive.NilObjectID {
	// 	m.Id = primitive.NewObjectID()
	// }
	if m.Status == 0 {
		m.Status = 1
	}
	if m.Permissions == nil {
		m.Permissions = new(GroupPermissions)
	}

	unixTimeStamp := time.Now().Unix()
	if m.CreateTime == 0 {
		m.CreateTime = unixTimeStamp
	}
	if m.DeleteTime == 0 {
		m.DeleteTime = -1
	}
	if m.LastUpdateTime == 0 {
		m.LastUpdateTime = time.Now().Unix()
	}
	if m.LastMessageTime == 0 {
		m.LastMessageTime = time.Now().Unix()
	}

	if err := m.Validate(); err != nil {
		return errors.New(m.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (m *Group) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *Group) Validate() error {
	errStr := ""
	if m.Permissions != nil {
		err := validation.ValidateStruct(
			m.Permissions,
			// validation.Parameter(&m.Permissions.MaximumMembers, validation.Required(), validation.GreaterEqual(1)),
		)
		if err != nil {
			errStr += err.Error()
		}
	}
	err := validation.ValidateStruct(
		m,
		validation.Parameter(&m.AppId, validation.Required()),
		validation.Parameter(&m.AuthorId, validation.Required()),
		validation.Parameter(&m.Name, validation.Required()),
		// validation.Parameter(&m.Avatar, validation.Required()),
		validation.Parameter(&m.Status, validation.Enum([]int64{1, 0, -1})),
		validation.Parameter(&m.CreateTime, validation.Required()),
		validation.Parameter(&m.DeleteTime, validation.Required()),
		validation.Parameter(&m.LastUpdateTime, validation.Required()),
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
