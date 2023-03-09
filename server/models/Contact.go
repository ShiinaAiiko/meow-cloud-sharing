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

type ContactPermissions struct {
	// 启用 只能单人模式
	E2Ee bool `bson:"e2ee" json:"e2ee,omitempty"`
}

type ContactUser struct {
	Uid string `bson:"uid" json:"uid,omitempty"`
	// Custom nickname
	// 针对个人 这就是对方设置的昵称，对方没有设置就显示自己的nickname
	Nickname string `bson:"nickname" json:"nickname,omitempty"`
	// 是否接受对方的消息
	ReceiveMessage bool `bson:"receiveMessage" json:"receiveMessage,omitempty"`
}

type Contact struct {
	Id string `bson:"_id" json:"id,omitempty"`
	// AppId
	AppId string `bson:"appId" json:"appId,omitempty"`

	Users []ContactUser `bson:"users" json:"users,omitempty"`

	Permissions ContactPermissions `bson:"permissions" json:"permissions,omitempty"`
	// Status:
	// 1 normal
	// 0 ban speech
	// -1 deleted
	Status      int64              `bson:"status" json:"status,omitempty"`
	CreateTime  int64              `bson:"createTime" json:"createTime,omitempty"`
	DeleteTime  int64              `bson:"deleteTime" json:"deleteTime,omitempty"`
	LastMessage primitive.ObjectID `bson:"lastMessage" json:"lastMessage,omitempty"`
	// LastSeenTime    int64              `bson:"lastSeenTime" json:"lastSeenTime,omitempty"`
	LastMessageTime int64 `bson:"lastMessageTime" json:"lastMessageTime,omitempty"`
}

func (m *Contact) GetCollectionName() string {
	return "Contact"
}

func (m *Contact) Default() error {
	if m.Id == "" {
		// 生成一个短一点的ID
		m.Id = "C" + shortuuid.New()
	}
	// if m.Id == primitive.NilObjectID {
	// 	m.Id = primitive.NewObjectID()
	// }
	if m.Status == 0 {
		m.Status = 1
	}
	unixTimeStamp := time.Now().Unix()
	if m.CreateTime == 0 {
		m.CreateTime = unixTimeStamp
	}
	if m.DeleteTime == 0 {
		m.DeleteTime = -1
	}
	if m.LastMessageTime == 0 {
		m.LastMessageTime = time.Now().Unix()
	}
	// if m.LastSeenTime == 0 {
	// 	m.LastSeenTime = -1
	// }

	if err := m.Validate(); err != nil {
		return errors.New(m.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (m *Contact) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *Contact) Validate() error {
	errStr := ""
	if m.Permissions != (ContactPermissions{}) {
		err := validation.ValidateStruct(
			&m.Permissions,
			validation.Parameter(&m.Permissions.E2Ee, validation.Type("bool"), validation.Required()),
		)
		if err != nil {
			errStr += err.Error()
		}
	}
	err := validation.ValidateStruct(
		m,
		validation.Parameter(&m.AppId, validation.Required()),
		validation.Parameter(&m.Users, validation.Required()),
		validation.Parameter(&m.Status, validation.Enum([]int64{1, 0, -1})),
		validation.Parameter(&m.CreateTime, validation.Required()),
		validation.Parameter(&m.DeleteTime, validation.Required()),
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
