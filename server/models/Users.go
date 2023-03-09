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

type Users struct {
	Id       primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	AppId    string             `bson:"appId" json:"appId,omitempty"`
	Uid      string             `bson:"uid" json:"uid,omitempty"`
	Password string             `bson:"password" json:"password,omitempty"`
	Nickname string             `bson:"nickname" json:"nickname,omitempty"`
	Avatar   string             `bson:"avatar" json:"avatar,omitempty"`
	Bio      string             `bson:"bio" json:"bio,omitempty"`
	// Status:
	// 1 normal
	// 0 ban speech
	// -1 deleted
	Status     int64 `bson:"status" json:"status,omitempty"`
	CreateTime int64 `bson:"createTime" json:"createTime,omitempty"`
	DeleteTime int64 `bson:"deleteTime" json:"deleteTime,omitempty"`
}

func (m *Users) GetCollectionName() string {
	return "Users"
}

func (m *Users) Default() error {
	if m.Id == primitive.NilObjectID {
		m.Id = primitive.NewObjectID()
	}
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

	if err := m.Validate(); err != nil {
		return errors.New(m.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (m *Users) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *Users) Validate() error {
	errStr := ""
	err := validation.ValidateStruct(
		m,
		validation.Parameter(&m.AppId, validation.Required()),
		validation.Parameter(&m.Uid, validation.Required()),
		validation.Parameter(&m.Password, validation.Required()),
		validation.Parameter(&m.Nickname, validation.Required()),
		validation.Parameter(&m.Status, validation.Enum([]int64{1, 0, -1})),
		validation.Parameter(&m.CreateTime, validation.Required()),
		validation.Parameter(&m.DeleteTime, validation.Required()),
	)
	if err != nil {
		errStr += err.Error()
	}
	if errStr == "" {
		return nil
	}
	return errors.New(errStr)
}
