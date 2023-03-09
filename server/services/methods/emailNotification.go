package methods

import (
	"github.com/cherrai/nyanyago-utils/narrays"
)

var (
// duration = int64(10 * 60)
)

func WatchEmailNotification() {
	// ntimer.SetTimeout(func() {
	// 	// SendEmailNotification()
	// 	// ntimer.SetInterval(func() {

	// 	// 	SendEmailNotification()
	// 	// }, conf.Config.MailMessageInterval*1000)
	// }, 1000)
}

// 以后再说
func SendEmailNotification() {
	log.Info("------SendEmailNotification------")

	// 获取所有需要获取的用户列表

	uids := []string{}

	getAllContactsInDB, err := contactDbx.GetAllContactsInDB()

	// log.Info("GetAllContactsInDB", getAllContactsInDB, err)
	if err == nil && len(getAllContactsInDB) > 0 {
		for _, v := range getAllContactsInDB {
			for _, sv := range v.Users {
				uids = append(uids, sv.Uid)
			}
		}
	}

	getGroupMembersInDB, err := groupDbx.GetGroupMembersInDB()

	// log.Info("GetGroupMembersInDB", getGroupMembersInDB, err)

	if err == nil && len(getGroupMembersInDB) > 0 {
		for _, v := range getGroupMembersInDB {
			uids = append(uids, v.AuthorId)
		}
	}

	for _, v := range narrays.Deduplication(uids) {
		log.Info(v)
		// conf.SSO.AppData.Get(key string, token string, deviceId string, userAgent *sso.UserAgent)
	}

	// 1、获取所有未读消息
	// getAllUnredMessages, err := messagesDbx.GetAllUnredMessages()

	// log.Info("getAllUnredMessages", getAllUnredMessages, err)
	// if err != nil {
	// 	return
	// }
	// 2、获取所有未读用户的信息

	// 3、获取sso appdata设置是否发送邮件通知

	// 3、对相关人发送消息
}
