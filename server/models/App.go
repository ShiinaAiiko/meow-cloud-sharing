package models

import (
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/meow-cloud-sharing/server/config"
	mongodb "github.com/ShiinaAiiko/meow-cloud-sharing/server/db/mongo"

	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type App struct {
	Id     primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	AppId  string             `bson:"appId" json:"appId,omitempty"`
	AppKey string             `bson:"appKey" json:"appKey,omitempty"`
	Name   string             `bson:"name" json:"name,omitempty"`
	Avatar string             `bson:"avatar" json:"avatar,omitempty"`
	// Status:
	// 1 normal
	// 0 disable
	// -1 deleted
	Status     int64 `bson:"status" json:"status,omitempty"`
	CreateTime int64 `bson:"createTime" json:"createTime,omitempty"`
	DeleteTime int64 `bson:"deleteTime" json:"deleteTime,omitempty"`
}

func (m *App) GetCollectionName() string {
	return "App"
}

func (m *App) Default() error {
	if m.Id == primitive.NilObjectID {
		m.Id = primitive.NewObjectID()
	}
	if m.AppId == "" {
		m.AppId = uuid.New().String()
	}
	if m.AppKey == "" {
		m.AppKey = uuid.New().String()
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

func (m *App) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *App) Validate() error {
	errStr := ""
	err := validation.ValidateStruct(
		m,
		validation.Parameter(&m.AppId, validation.Required()),
		validation.Parameter(&m.AppKey, validation.Required()),
		validation.Parameter(&m.Name, validation.Required()),
		// validation.Parameter(&m.Avatar, validation.Required()),
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
