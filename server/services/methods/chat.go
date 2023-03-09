package methods

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/models"
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetType(id string) string {
	t := id[0:1]
	switch t {
	case "G":
		return "Group"

	default:
		return "Contact"
	}
}

func IsMemberOfRoom(appId, roomId, uid string) int64 {
	// 判断是否在此room内
	t := GetType(roomId)
	if t == "Contact" {
		isMember := contactDbx.GetContact(appId, []string{
			uid,
		}, []int64{1, 0}, roomId)
		if isMember == nil {
			return 10105
		}
	}
	if t == "Group" {
		isMember := groupDbx.GetGroupMember(appId, roomId, uid, []int64{1, 0})
		if isMember == nil {
			return 10305
		}
	}
	return 200
}

func FormatMessages(messages []*models.Messages) (list []*protos.Messages) {
	ids := []primitive.ObjectID{}
	for _, v := range messages {
		if v.ReplyId != primitive.NilObjectID {
			ids = append(ids, v.ReplyId)
		}
	}
	getMessages, err := messagesDbx.GetMessageById(ids)
	if err != nil {
		return
	}

	for _, v := range messages {
		pm := new(protos.Messages)
		copier.Copy(pm, v)
		pm.Id = v.Id.Hex()
		pm.ReplyId = v.ReplyId.Hex()

		for _, sv := range getMessages {
			if sv.Id == v.ReplyId {
				rm := new(protos.Messages)
				copier.Copy(rm, sv)
				rm.Id = sv.Id.Hex()
				rm.ReplyId = sv.ReplyId.Hex()
				pm.ReplyMessage = rm
				break
			}
		}
		list = append(list, pm)

	}
	return
}
