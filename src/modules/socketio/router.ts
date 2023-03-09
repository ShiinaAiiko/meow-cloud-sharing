import store, {
	callSlice,
	configSlice,
	groupSlice,
	messagesSlice,
	methods,
	toolsSlice,
} from '../../store'
import { protoRoot, socketio } from '../../protos'
import socketApi from './api'
import md5 from 'blueimp-md5'
import nyanyalog from 'nyanyajs-log'
import { RouterType } from '../MeowWhisperCoreSDK/mwc-nsocketio'

import { RSA, DiffieHellman, deepCopy } from '@nyanyajs/utils'
import { room } from '../../protos/proto'
import { snackbar } from '@saki-ui/core'
import { callAlert, setCallAlert } from '../../store/call'
import { getDialogueInfo } from '../methods'
import MeowWhisperCoreSDK from '../MeowWhisperCoreSDK'

// import { e2eeDecryption } from './common'
// import { getDialogRoomUsers } from '../../store/modules/chat/methods'

export const createSocketioRouter = {
	createRouter() {
		const { mwc, api, config, messages } = store.getState()

		mwc.sdk?.nsocketio.on<RouterType['router-receiveMessage']>(
			'router-receiveMessage',
			async (v) => {
				console.log('router-receiveMessage', v)
				if (v?.code === 200) {
					const { mwc, messages, user, config } = store.getState()

					const m = v.data.message
					const roomId = v.data.message?.roomId
					if (!roomId) return

					// store.dispatch(
					// 	messagesSlice.actions.setChatDialogue({
					//     roomId,
					// 		showMessageContainer: false,
					// 	})
					// )

					const mv = messages.messagesMap[roomId]
					console.log('mv', mv, roomId, deepCopy(messages.messagesMap))

					if (!mv) {
						store.dispatch(
							messagesSlice.actions.initMessageMap({
								roomId,
								type: MeowWhisperCoreSDK.methods.getType(roomId) as any,
							})
						)
					}

					store.dispatch(
						messagesSlice.actions.setNewMessageStatus({
							roomId,
							newMessage: true,
						})
					)
					store.dispatch(
						messagesSlice.actions.setMessageMapList({
							roomId,
							list: (mv?.list || []).concat([
								{
									...v.data.message,
									status: 1,
								},
							]),
						})
					)
					await store.dispatch(
						methods.messages.setChatDialogue({
							roomId,
							type: MeowWhisperCoreSDK.methods.getType(m?.roomId || 'G') as any,
							id: m?.authorId || '',
							showMessageContainer: true,
							unreadMessageCount: -1,
							lastMessage: m,
							lastMessageId: m?.id,
							lastMessageTime: Math.floor(new Date().getTime() / 1000),
							sort: Math.floor(new Date().getTime() / 1000),
						})
					)
					// await store.dispatch(methods.messages.setActiveRoomIndex(0))

					// console.log("messages.activeRoomInfo?.roomId === roomId",messages.activeRoomInfo?.roomId === roomId)
					if (messages.activeRoomInfo?.roomId === roomId) {
						store.dispatch(
							methods.messages.readMessages({
								roomId,
							})
						)
					}

					// 让用户选择通知级别
					console.log(
						'notification',
						config.notification.leval === 1
							? true
							: config.notification.leval === 0
							? !config.inApp
							: false
					)
					if (
						config.notification.leval === 1
							? true
							: config.notification.leval === 0
							? !config.inApp
							: false
					) {
						const dialog = messages.recentChatDialogueList.filter(
							(v) => v.roomId === roomId
						)?.[0]
						const dialogInfo = getDialogueInfo(dialog)
						const userInfo = mwc.cache?.userInfo?.get(m?.authorId || '')
						// console.log(21312, m, userInfo)
						store.dispatch(
							methods.tools.sendNotification({
								title: dialogInfo.name,
								body:
									userInfo.userInfo?.nickname +
									':' +
									MeowWhisperCoreSDK.methods.getLastMessage(
										m,
										m?.authorId === user.userInfo.uid
									),
								icon: dialogInfo.avatar || '',
								sound:
									config.notification.sound >= 0
										? config.notification.sound === 0
											? !config.inApp
											: true
										: false,
							})
						)
					}
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-readAllMessages']>(
			'router-readAllMessages',
			(res) => {
				console.log('router-readAllMessages', res)
				if (res?.code === 200) {
					const { mwc, user, messages } = store.getState()
					const roomId = res.data.roomId || ''
					const mv = messages.messagesMap[roomId]

					const dialog = messages.recentChatDialogueList.filter((sv) => {
						return sv.roomId === roomId
					})?.[0]

					if (res.data.uid === user.userInfo.uid) {
						store.dispatch(
							methods.messages.setChatDialogue({
								...dialog,
								unreadMessageCount: 0,
								sort: -1,
							})
						)
					}
					store.dispatch(
						messagesSlice.actions.setMessageMapList({
							roomId: roomId,
							list: mv.list.map((v) => {
								return {
									...v,
									readUsers:
										v.authorId !== res.data.uid
											? v.readUsers
													?.filter((v) => {
														return v.uid !== res.data.uid || ''
													})
													?.concat([
														{
															uid: res.data.uid || '',
														},
													])
											: v.readUsers,
								}
							}),
						})
					)
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-startCallingMessage']>(
			'router-startCallingMessage',
			async (res) => {
				console.log('router-startCallingMessage', res)
				if (res?.code === 200) {
					const { mwc, messages } = store.getState()
					await store.dispatch(
						methods.call.startCalling({
							roomId: res.data.roomId || '',
							callToken: res.data.callToken || '',
							type: res.data.type as any,
							participants: res.data.participants || [],
							turnServer: res.data.turnServer || {},
						})
					)
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-hangupMessage']>(
			'router-hangupMessage',
			async (res) => {
				console.log('router-hangupMessage', res)
				if (res?.code === 200) {
					const { mwc, messages, user, call } = store.getState()

					const authorId =
						res.data?.participants?.filter((v) => {
							return v.caller
						})?.[0]?.uid || ''
					callAlert?.close()
					setCallAlert(undefined)
					call.sound.stop()
					if (authorId === user.userInfo.uid) {
						if (
							(res.data.status = 0) &&
							call.options.roomId !== res.data.roomId
						) {
							snackbar({
								message: '对方正在通话',
								autoHideDuration: 2000,
								vertical: 'top',
								horizontal: 'center',
								backgroundColor: 'var(--saki-default-color)',
								color: '#fff',
							}).open()
						}
					}
					store.dispatch(methods.call.hangup(false))
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-deleteMessages']>(
			'router-deleteMessages',
			async (res) => {
				console.log('router-deleteMessages', res)
				if (res?.code === 200) {
					const { mwc, messages, user, call } = store.getState()

					store.dispatch(
						methods.messages.deleteLocalMessages({
							roomId: res.data.roomId || '',
							messageIdList: res.data.messageIdList || [],
							uid: res.data.uid || '',
						})
					)
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-receiveEditMessage']>(
			'router-receiveEditMessage',
			async (res) => {
				console.log('router-receiveEditMessage', res)
				if (res?.code === 200) {
					const { mwc, messages, user, call } = store.getState()

					store.dispatch(
						messagesSlice.actions.setMessageItem({
							roomId: res.data.message?.roomId || '',
							messageId: res.data.message?.id || '',
							value: {
								...res.data.message,
								status: 1,
							},
						})
					)
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-updateContactStatus']>(
			'router-updateContactStatus',
			async (res) => {
				console.log('router-updateContactStatus', res)
				if (res?.code === 200) {
					const { mwc, messages, user } = store.getState()

					if (res.data.type === 'Add') {
						await store.dispatch(
							methods.contacts.updateListAfterAddCcontacts({
								uid: res.data.uid || '',
								roomId: res.data.roomId || '',
							})
						)
						return
					}
					if (res.data.type === 'Delete') {
						await store.dispatch(
							methods.contacts.updateListAfterDeleteCcontacts({
								uid: res.data.uid || '',
								roomId: res.data.roomId || '',
							})
						)
						return
					}
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-updateGroupStatus']>(
			'router-updateGroupStatus',
			async (res) => {
				console.log('router-updateGroupStatus', res)
				if (res?.code === 200) {
					const { mwc, messages, user, group, call } = store.getState()
					if (res.data.type === 'Disband' || res.data.type === 'Leave') {
						if (
							res.data.type === 'Leave' &&
							!res.data.uid?.includes(user.userInfo.uid)
						) {
							store.dispatch(
								methods.group.setGroupMembers({
									groupId: res.data.roomId || '',
									changeValue: -1,
								})
							)
							return
						}
						store.dispatch(
							groupSlice.actions.setGroupList(
								group.list.filter((v) => v.id !== res.data.roomId)
							)
						)
						store.dispatch(
							messagesSlice.actions.setRecentChatDialogueList(
								messages.recentChatDialogueList.filter(
									(v) => v.id !== res.data.roomId
								)
							)
						)
						store.dispatch(
							messagesSlice.actions.deleteMessageMap({
								roomId: res.data.roomId || '',
							})
						)
						store.dispatch(configSlice.actions.setModalGroupId(''))
						return
					}
					if (res.data.type === 'Join' || res.data.type === 'New') {
						if (res.data.type === 'Join') {
							if (!res.data.uid?.includes(user.userInfo.uid)) {
								store.dispatch(
									methods.group.setGroupMembers({
										groupId: res.data.roomId || '',
										changeValue: 1,
									})
								)
								return
							}
						}

						await store.dispatch(methods.group.getGroupList())
						if (res.data.type === 'New') {
							await store.dispatch(
								methods.messages.joinRoom([res.data.roomId || ''])
							)
						}
						store.dispatch(
							methods.messages.setChatDialogue({
								roomId: res.data.roomId || '',
								type: 'Group',
								id: res.data.roomId || '',
								showMessageContainer: true,
								unreadMessageCount: -2,
								sort: -1,
							})
						)
						return
					}
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-callReconnectMessages']>(
			'router-callReconnectMessages',
			async (res) => {
				console.log('router-callReconnectMessages', res)
				if (res?.code === 200) {
					const { mwc, messages, user, call } = store.getState()

					if (call.client) {
						// call.client.leave()
						call.signal?.close()

						setTimeout(() => {
							// 同一个roomId 重连次数过多就自动挂断
							if (call.status === -3 || call.status === -2) {
								return
							}
							store.dispatch(
								callSlice.actions.setReconnectionTime(
									Math.round(new Date().getTime() / 1000)
								)
							)
							store.dispatch(
								callSlice.actions.setCallTokenInfo({
									callToken: res.data.callToken as any,
									turnServer: res.data.turnServer as any,
								})
							)
							store.dispatch(
								callSlice.actions.setReconnectionCount(
									call.reconnectionCount + 1
								)
							)
							if (call.reconnectionCount + 1 < 100) {
								store.dispatch(methods.call.connect(true))
							} else {
								store.dispatch(methods.call.hangup(true))
							}
						}, 1000)
					}
				}
			}
		)

		mwc.sdk?.nsocketio.on<RouterType['router-updateGroupInfo']>(
			'router-updateGroupInfo',
			async (res) => {
				console.log('router-updateGroupInfo', res)
				if (res?.code === 200) {
					const { mwc, messages, user, call } = store.getState()

					store.dispatch(
						methods.group.updateGroupInfo({
							groupId: res?.data.groupId || '',
							avatar: res?.data.avatar || '',
							name: res?.data.name || '',
						})
					)
				}
			}
		)

		mwc.sdk?.nsocketio.on('router-error', (v) => {
			console.log('router-error', v)
		})
	},
}
export default createSocketioRouter
