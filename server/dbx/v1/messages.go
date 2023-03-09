package dbxV1

import (
	"context"
	"errors"
	"time"

	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"github.com/cherrai/nyanyago-utils/narrays"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MessagesDbx struct {
}

func (d *MessagesDbx) SendMessage(message *models.Messages) (*models.Messages, error) {
	if err := message.Default(); err != nil {
		return nil, err
	}
	_, err := message.GetCollection().InsertOne(context.TODO(), message)
	if err != nil {
		return nil, err
	}
	return message, nil
}

func (d *MessagesDbx) GetAllUnredMessages() ([]*models.Messages, error) {
	m := new(models.Messages)

	params := []bson.M{
		{
			"$match": bson.M{
				"$or": []bson.M{
					{
						"readUsers": bson.M{
							"$size": 0,
						},
						// "deletedUsers.uid": bson.M{
						// 	"$nin": []string{authorId, "AllUser"},
						// },
						"status": bson.M{
							"$in": []int64{1},
						},
					},
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	log.Info("params", params)
	var results []*models.Messages
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

func (d *MessagesDbx) GetUnredMessages(roomIds []string, authorId string) ([]*models.Messages, error) {
	m := new(models.Messages)

	params := []bson.M{
		{
			"$match": bson.M{
				"$or": []bson.M{
					{
						"roomId": bson.M{
							"$in": roomIds,
						},
						"readUsers.uid": bson.M{
							"$nin": []string{authorId},
						},
						"deletedUsers.uid": bson.M{
							"$nin": []string{authorId, "AllUser"},
						},
						"status": bson.M{
							"$in": []int64{1},
						},
					},
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	// log.Info("params", params)
	var results []*models.Messages
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

func (d *MessagesDbx) GetMessageById(messgeIds []primitive.ObjectID) ([]*models.Messages, error) {
	m := new(models.Messages)

	// log.Info("messagesIds", messgeIds)
	params := []bson.M{
		{
			"$match": bson.M{
				"$or": []bson.M{
					{
						"_id": bson.M{
							"$in": messgeIds,
						},
						"status": bson.M{
							"$in": []int64{1},
						},
					},
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	log.Info("params", params)
	var results []*models.Messages
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

func (d *MessagesDbx) GetHistoricalMessages(
	roomId, authorId string,
	pageNum,
	pageSize,
	startTime,
	endTime int64) ([]bson.M, error) {
	m := new(models.Messages)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": []bson.M{
					{
						"roomId": roomId,
						"deletedUsers.uid": bson.M{
							"$nin": []string{authorId, "AllUser"},
						},
						"status": bson.M{
							"$in": []int64{1},
						},
					}, {
						"createTime": bson.M{
							"$gt": startTime,
						},
					}, {
						"createTime": bson.M{
							"$lt": endTime,
						},
					},
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": -1,
			},
		},
		{
			"$skip": pageSize * (pageNum - 1),
		},
		{
			"$limit": pageSize,
		}, {
			"$lookup": bson.M{
				"from":         "Messages",
				"localField":   "replyId",
				"foreignField": "_id",
				"as":           "replyMessage",
			},
		},
	}
	// log.Info("params", params)
	var results []bson.M
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

func (d *MessagesDbx) ReadAllMessages(
	roomId, authorId string) error {
	m := new(models.Messages)
	result, err := m.GetCollection().UpdateMany(context.TODO(),
		bson.M{
			"roomId": roomId,
			"authorId": bson.M{
				"$ne": authorId,
			},
			"readUsers.uid": bson.M{
				"$nin": []string{authorId},
			},
			"status": bson.M{
				"$in": []int64{1, 0},
			},
		}, bson.M{
			"$push": bson.M{
				"readUsers": bson.M{
					"uid": authorId,
				},
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

func (d *MessagesDbx) EditMessage(
	id primitive.ObjectID, roomId, authorId, message string,
) *models.Messages {
	m := new(models.Messages)
	t := time.Now().Unix()
	err := m.GetCollection().FindOneAndUpdate(context.TODO(),
		bson.M{
			"_id":      id,
			"roomId":   roomId,
			"authorId": authorId,
		}, bson.M{
			"$set": bson.M{
				"message":  message,
				"editTime": t,
			},
		}, options.FindOneAndUpdate().SetUpsert(false)).Decode(m)

	if err != nil {
		return nil
	}
	m.Message = message
	m.EditTime = t
	return m
}

func (d *MessagesDbx) DeleteMessages(
	roomId string, messageIdList []string, authorId string, isAuthor string, deleteUid string, expirationTime int64,
) error {
	m := new(models.Messages)
	filter := bson.M{
		"roomId": roomId,
		"deletedUsers.uid": bson.M{
			"$nin": []string{authorId, "AllUser"},
		},
		"status": bson.M{
			"$in": []int64{1, 0},
		},
	}
	if !narrays.Includes(messageIdList, "AllMessages") {
		list := []primitive.ObjectID{}
		for _, v := range messageIdList {
			id, _ := primitive.ObjectIDFromHex(v)
			list = append(list, id)
		}
		filter["_id"] = bson.M{
			"$in": list,
		}
	}
	if isAuthor == "true" {
		filter["authorId"] = authorId
	}
	if isAuthor == "false" {
		filter["authorId"] = bson.M{
			"$ne": authorId,
		}
	}
	update := bson.M{
		"uid":            deleteUid,
		"expirationTime": expirationTime,
	}

	log.Info(filter)
	log.Info(update)
	result, err := m.GetCollection().UpdateMany(context.TODO(),
		filter, bson.M{
			"$push": bson.M{
				"deletedUsers": update,
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return nil
	}
	if result.ModifiedCount == 0 {
		return errors.New("delete failed")
	}
	return nil
}
