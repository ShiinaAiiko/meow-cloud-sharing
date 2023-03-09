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

type GroupDbx struct {
}

func (d *GroupDbx) NewGroup(
	appId string,
	authorId string,
	name string,
	avatar string,
) (*models.Group, error) {
	m := models.Group{
		AppId:    appId,
		AuthorId: authorId,
		Name:     name,
		Avatar:   avatar,
		Permissions: &models.GroupPermissions{
			MaximumMembers:            200000,
			AllowMembersJoin:          true,
			AllowMembersChat:          true,
			JoinWithoutAuthentication: true,
			AdministratorList:         []*models.GroupPermissionsAdministratorList{},
		},
		Status: 1,
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

func (d *GroupDbx) JoinGroupMembers(appId, groupId, authorId string) error {
	m := models.GroupMembers{
		AppId:    appId,
		GroupId:  groupId,
		AuthorId: authorId,
		Permissions: &models.GroupMembersPermissions{
			ReceiveMessage: true,
		},
		Status: 1,
	}
	getM := d.GetGroupMember(appId, groupId, authorId, []int64{1, -1})
	if getM != nil {
		if getM.Status == -1 {
			result, err := m.GetCollection().UpdateOne(context.TODO(),
				bson.M{
					"appId":    appId,
					"groupId":  groupId,
					"authorId": authorId,
				}, bson.M{
					"$set": bson.M{
						"status": 1,
					},
					"$push": bson.M{
						"joinHistory": bson.M{
							"joinTime": time.Now().Unix(),
						},
					},
				}, options.Update().SetUpsert(false))

			if err != nil {
				return err
			}
			if result.ModifiedCount == 0 {
				return errors.New("add failed")
			}
			return nil
		}
		return nil
	}
	if err := m.Default(); err != nil {
		return err
	}
	_, err := m.GetCollection().InsertOne(context.TODO(), m)
	if err != nil {
		return err
	}
	return nil
}

func (d *GroupDbx) GetGroupMember(appId, groupId, authorId string, status []int64) *models.GroupMembers {
	m := new(models.GroupMembers)

	filter := bson.M{
		"appId":    appId,
		"groupId":  groupId,
		"authorId": authorId,
		"status": bson.M{
			"$in": status,
		},
	}
	err := m.GetCollection().FindOne(context.TODO(), filter).Decode(m)
	if err != nil {
		return nil
	}
	return m
}

type JoinedGroupItem struct {
	Id              string                             `bson:"_id" json:"_id,omitempty"`
	AuthorId        string                             `bson:"authorId" json:"authorId,omitempty"`
	Nickname        string                             `bson:"nickname" json:"nickname,omitempty"`
	Permissions     *models.GroupMembersPermissions    `bson:"permissions" json:"permissions"`
	JoinHistory     []*models.GroupMembersJoinHistory  `bson:"joinHistory" json:"joinHistory,omitempty"`
	LeaveHistory    []*models.GroupMembersLeaveHistory `bson:"leaveHistory" json:"leaveHistory,omitempty"`
	CreateTime      int64                              `bson:"createTime" json:"createTime,omitempty"`
	LastSeenTime    int64                              `bson:"lastSeenTime" json:"lastSeenTime,omitempty"`
	LastMessage     primitive.ObjectID                 `bson:"lastMessage" json:"lastMessage,omitempty"`
	LastMessageTime int64                              `bson:"lastMessageTime" json:"lastMessageTime,omitempty"`

	Group []*models.Group `bson:"group" json:"group,omitempty"`
}

func (d *GroupDbx) GetAllJoinedGroups(appId string, authorId string) ([]*JoinedGroupItem, error) {
	m := new(models.GroupMembers)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": []bson.M{
					{
						"appId": appId,
					},
					{
						"authorId": authorId,
					},
					{
						"status": bson.M{
							"$in": []int64{1, 0},
						},
					},
					// 未来限制日期
				},
				// and groupId
			},
		}, {
			"$lookup": bson.M{
				"from":         "Group",
				"localField":   "groupId",
				"foreignField": "_id",
				"as":           "group",
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	var results []*JoinedGroupItem

	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil {
		// log.Error(err)
		return nil, err
	}

	return results, nil
}

func (d *GroupDbx) GetGroup(appId string, groupId string) (*models.Group, error) {
	m := new(models.Group)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": []bson.M{
					{
						"appId": appId,
					},
					{
						"_id": groupId,
					},
					{
						"status": bson.M{
							"$in": []int64{1, 0},
						},
					},
					// 未来限制日期
				},
				// and groupId
			},
		},
	}
	var results []*models.Group

	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil || len(results) == 0 {
		// log.Error(err)
		return nil, err
	}

	return results[0], nil
}

func (d *GroupDbx) GetNumberOfGroupMembers(appId string, groupId string) int64 {
	m := new(models.GroupMembers)

	// log.Info(appId, groupId)
	params := bson.M{
		"$and": []bson.M{
			{
				"appId": appId,
			},
			{
				"groupId": groupId,
			},
			{
				"status": bson.M{
					"$in": []int64{1, 0},
				},
			},
			// 未来限制日期
		},
		// and groupId
	}
	opts, err := m.GetCollection().CountDocuments(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return 0
	}
	return opts
}

func (d *GroupDbx) GetGroupMembers(appId string, groupId string) ([]*models.GroupMembers, error) {
	m := new(models.GroupMembers)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": []bson.M{
					{
						"appId": appId,
					},
					{
						"groupId": groupId,
					},
					{
						"status": bson.M{
							"$in": []int64{1, 0},
						},
					},
					// 未来限制日期
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	var results []*models.GroupMembers

	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil {
		// log.Error(err)
		return nil, err
	}

	return results, nil
}

func (d *GroupDbx) LeaveGroup(appId, groupId, authorId string) error {
	m := new(models.GroupMembers)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"appId":    appId,
			"groupId":  groupId,
			"authorId": authorId,
		}, bson.M{
			"$set": bson.M{
				"status": -1,
			},
			"$push": bson.M{
				"leaveHistory": bson.M{
					"leaveTime": time.Now().Unix(),
				},
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("leave failed")
	}
	return nil
}

func (d *GroupDbx) DisbandGroup(appId, groupId, authorId string) error {
	m := new(models.Group)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"appId":    appId,
			"_id":      groupId,
			"authorId": authorId,
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
		return errors.New("disband failed")
	}
	return nil
}

func (d *GroupDbx) UpdateGroupInfo(appId, groupId, name, avatar string) error {
	m := new(models.Group)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"appId": appId,
			"_id":   groupId,
		}, bson.M{
			"$set": bson.M{
				"name":           name,
				"avatar":         avatar,
				"lastUpdateTime": time.Now().Unix(),
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

func (d *GroupDbx) AllMembersLeaveGroup(appId, groupId string) error {
	m := new(models.GroupMembers)
	result, err := m.GetCollection().UpdateMany(context.TODO(),
		bson.M{
			"appId":   appId,
			"groupId": groupId,
		}, bson.M{
			"$set": bson.M{
				"status": -1,
			},
			"$push": bson.M{
				"leaveHistory": bson.M{
					"leaveTime": time.Now().Unix(),
				},
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("leave failed")
	}
	return nil
}

func (d *GroupDbx) UpdateGroupChatStatus(roomId string, messageId primitive.ObjectID) error {
	m := new(models.Group)
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

func (d *GroupDbx) UpdateGroupMemberChatStatus(roomId string, messageId primitive.ObjectID) error {
	m := new(models.GroupMembers)
	result, err := m.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"groupId": roomId,
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

func (d *GroupDbx) GetGroupMembersInDB() ([]*models.GroupMembers, error) {
	m := new(models.GroupMembers)

	params := []bson.M{
		{
			"$match": bson.M{
				"$and": []bson.M{
					{
						"status": bson.M{
							"$in": []int64{1, 0},
						},
					},
					// 未来限制日期
				},
				// and groupId
			},
		}, {
			"$sort": bson.M{
				"createTime": 1,
			},
		},
	}
	var results []*models.GroupMembers

	opts, err := m.GetCollection().Aggregate(context.TODO(), params)
	if err != nil {
		// log.Error(err)
		return nil, err
	}
	if err = opts.All(context.TODO(), &results); err != nil {
		// log.Error(err)
		return nil, err
	}

	return results, nil
}
