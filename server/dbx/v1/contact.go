package dbxV1

import (
	"context"
	"errors"
	"time"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ContactDbx struct {
}

func (d *ContactDbx) AddContact(appId string, userIds []string) (*models.Contact, error) {
	users := []models.ContactUser{}
	for _, v := range userIds {
		users = append(users, models.ContactUser{
			Uid:            v,
			ReceiveMessage: true,
		})
	}
	m := models.Contact{
		AppId:  appId,
		Users:  users,
		Status: 1,
	}

	getContact := d.GetContact(appId, userIds, []int64{1, 0, -1}, "")
	// log.Info("getContact", getContact)
	if getContact != nil {
		result, err := m.GetCollection().UpdateOne(context.TODO(),
			bson.M{
				"$and": []bson.M{
					{
						"_id": getContact.Id,
					},
				},
			}, bson.M{
				"$set": bson.M{
					"status":     1,
					"deleteTime": -1,
				},
			}, options.Update().SetUpsert(false))

		if err != nil || result.ModifiedCount == 0 {
			return nil, err
		}
		getContact.Status = 1
		getContact.DeleteTime = -1
		return getContact, nil
	}

	if err := m.Default(); err != nil {
		return nil, err
	}
	_, err := m.GetCollection().InsertOne(context.TODO(), m)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (d *ContactDbx) DeleteContact(appId string, userIds []string) error {
	m := new(models.Contact)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"appId": appId,
			"$and": []bson.M{
				{
					"users.uid": userIds[0],
				}, {
					"users.uid": userIds[1],
				},
			},
			"status": bson.M{
				"$in": []int64{1, 0},
			},
		}, bson.M{
			"$set": bson.M{
				"status":     -1,
				"deleteTime": time.Now().Unix(),
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("delete failed")
	}
	return nil
}

func (d *ContactDbx) UpdateContactChatStatus(roomId string, messageId primitive.ObjectID) error {
	m := new(models.Contact)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"_id": roomId,
		}, bson.M{
			"$set": bson.M{
				"lastMessage":     messageId,
				"lastMessageTime": time.Now().Unix(),
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("update failed")
	}
	return nil
}

func (d *ContactDbx) GetContact(appId string, userIds []string, status []int64, roomId string) *models.Contact {
	m := new(models.Contact)

	userIdsFilter := []bson.M{}
	for _, v := range userIds {
		userIdsFilter = append(userIdsFilter, bson.M{
			"users.uid": v,
		})
	}
	filter := bson.M{
		"appId": appId,
		"$and":  userIdsFilter,
		"status": bson.M{
			"$in": status,
		},
	}
	if roomId != "" {
		filter["_id"] = roomId
	}
	err := m.GetCollection().FindOne(context.TODO(), filter).Decode(m)
	if err != nil {
		return nil
	}
	return m
}

func (d *ContactDbx) GetAllContact(appId string, authorId string, chatTimeRange []int64) ([]*models.Contact, error) {
	m := new(models.Contact)

	match := []bson.M{
		{
			"appId": appId,
		},
		{
			"users.uid": authorId,
		},
		{
			"status": bson.M{
				"$in": []int64{1, 0},
			},
		},
		// 未来限制日期
	}

	// log.Info("len(chatTimeRange) == 2", chatTimeRange, len(chatTimeRange) == 2)
	if len(chatTimeRange) == 2 {
		match = append(match, bson.M{
			"lastMessageTime": bson.M{
				"$gt": chatTimeRange[0],
			},
		})
		if chatTimeRange[1] != 0 {
			match = append(match, bson.M{
				"lastMessageTime": bson.M{
					"$lte": chatTimeRange[1],
				},
			})
		}
	}
	log.Info("match", match)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": match,
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	var results []*models.Contact
	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil {
		// log.Error(err)
		return nil, err
	}
	// log.Info(*results[0])
	return results, nil
}

func (d *ContactDbx) GetAllContactsInDB() ([]*models.Contact, error) {
	m := new(models.Contact)

	match := []bson.M{
		{
			"status": bson.M{
				"$in": []int64{1, 0},
			},
		},
		// 未来限制日期
	}

	// log.Info("len(chatTimeRange) == 2", chatTimeRange, len(chatTimeRange) == 2)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": match,
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	var results []*models.Contact
	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil {
		// log.Error(err)
		return nil, err
	}
	// log.Info(*results[0])
	return results, nil
}
