package methods

import (
	"github.com/ShiinaAiiko/meow-cloud-sharing/server/protos"
	"github.com/cherrai/nyanyago-utils/nstrings"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/jinzhu/copier"
)

func FormatGroupMembers(gm *protos.GroupMembers, users []*sso.UserInfo) {
	for i, j := 0, len(users)-1; i <= j; i, j = i+1, j-1 {
		if FormatGroupMembersSimpleUserInfo(gm, users[i]) {
			break
		}
		if FormatGroupMembersSimpleUserInfo(gm, users[j]) {
			break
		}
	}
}

func FormatGroupMembersSimpleUserInfo(gm *protos.GroupMembers, user *sso.UserInfo) bool {
	if user.Uid == gm.AuthorId {
		sa := new(protos.SimpleSSOUserInfo)
		copier.Copy(sa, user)
		sa.Letter = nstrings.GetLetter(sa.Nickname)
		gm.UserInfo = sa
		return true
	}
	return false
}
