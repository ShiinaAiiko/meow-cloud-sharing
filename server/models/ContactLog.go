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

type ContactLog struct {
	Id primitive.ObjectID `bson:"_id" json:"id"`
	// User UID
	AuthorId string `bson:"authorId" json:"authorId"`
	// ContactId
	ContactId string `bson:"contactId" json:"contactId"`
	// GroupId
	GroupId string `bson:"groupId" json:"groupId"`
	// Type Contact/Group
	Type string `bson:"type" json:"type"`
	// Remark
	Remark string `bson:"remark" json:"remark"`
	// Status:
	// 0 wait, 1 agree, -1 disagree
	// 	使用tag json:"-"
	// 或者结构体字段首字母小写
	Status int64 `bson:"status" json:"status"`
	// DeleteStatus:
	// 1 normal, 0 hide, -1 delete
	DeleteStatus int64 `bson:"deleteStatus" json:"deleteStatus"`
	// Unix timestamp
	AgreeTime int64 `bson:"agreeTime" json:"agreeTime"`
	// Unix timestamp
	DisagreeTime int64 `bson:"disagreeTime" json:"disagreeTime"`
	// CreateTime Unix timestamp
	CreateTime int64 `bson:"createTime" json:"createTime"`
	// LastUpdateTime Unix timestamp
	LastUpdateTime int64 `bson:"lastUpdateTime" json:"lastUpdateTime"`
}

func (m *ContactLog) GetCollectionName() string {
	return "ContactLog"
}

func (m *ContactLog) Default() error {
	// strId := bson.NewObjectId().Hex()
	// fmt.Println(strId)
	// 初始化
	if m.Id == primitive.NilObjectID {
		m.Id = primitive.NewObjectID()
	}
	if m.Status == 0 {
		m.Status = 0
	}
	if m.DeleteStatus == 0 {
		m.DeleteStatus = 1
	}
	unixTimeStamp := time.Now().Unix()
	if m.CreateTime == 0 {
		m.CreateTime = unixTimeStamp
	}
	if m.LastUpdateTime == 0 {
		m.LastUpdateTime = unixTimeStamp
	}

	// if f.AuthorReadTime == 0 {
	// 	f.AuthorReadTime = -1
	// }

	if err := m.Validate(); err != nil {
		return errors.New(m.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}
func (m *ContactLog) GetCollection() *mongo.Collection {
	// return mongodb.GetMongoCollection("FriendsLog")
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, m.GetCollectionName())
}

func (m *ContactLog) Validate() error {
	return validation.ValidateStruct(
		m,
		validation.Parameter(&m.AuthorId, validation.Required()),
		validation.Parameter(&m.ContactId, validation.Required()),
		validation.Parameter(&m.GroupId, validation.Required()),
		validation.Parameter(&m.Remark, validation.Required(), validation.Length(1, 100)),
		validation.Parameter(&m.Status, validation.Enum([]int64{0, 1, -1})),
		validation.Parameter(&m.DeleteStatus, validation.Enum([]int64{0, 1, -1})),
		validation.Parameter(&m.CreateTime, validation.Required()),
	)
}
