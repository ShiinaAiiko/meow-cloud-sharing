import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, {
	ActionParams,
	callSlice,
	configSlice,
	contactsSlice,
	methods,
	RootState,
} from '.'
import { PARAMS, protoRoot } from '../protos'
import {
	WebStorage,
	SakiSSOClient,
	compareUnicodeOrder,
	getInitials,
	Debounce,
	deepCopy,
	SAaSS,
	file,
	images,
	RunQueue,
} from '@nyanyajs/utils'
import { MeowWhisperCoreSDK } from '../modules/MeowWhisperCoreSDK'
import { meowWhisperCore, sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import { alert, progressBar, snackbar } from '@saki-ui/core'
import { room } from '../protos/proto'
import { fileQueue } from './file'

export const modeName = 'messages'
export const messageQueue = new RunQueue()

// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined

export interface ChatDialogueItem extends protoRoot.message.IChatDialogue {
	roomId: string
	id: string
	unreadMessageCount: number
	type: 'Group' | 'Contact'
	showMessageContainer: boolean
	typingMessage?: string

	lastSeenTime?: number
	sort: number

	lastUpdateTime?: number

	// activeRoomInfo用
	members?: number
}

export interface MessageItem extends protoRoot.message.IMessages {
	status: number
	editing?: boolean
}

export interface MessagesMap {
	list: MessageItem[]
	newMessage: boolean
	status: 'loading' | 'loaded' | 'noMore'
	pageNum: number
	pageSize: number
	type: 'Group' | 'Contact'
}
let pageSize = 20

const state: {
	recentChatDialogueList: ChatDialogueItem[]
	deleteDialogIds: string[]
	activeRoomIndex: number
	activeRoomInfo?: ChatDialogueItem
	getMessageStatus: 'GetSuccess' | 'Getting' | 'Waiting'
	messagesMap: {
		[roomId: string]: MessagesMap
	}
	deleteMessage: {
		roomId: string
		list: string[]
	}
	isInitChatDialogue: boolean
} = {
	recentChatDialogueList: [],
	deleteDialogIds: [],
	activeRoomIndex: -1,
	getMessageStatus: 'Waiting',
	messagesMap: {},
	deleteMessage: {
		roomId: '',
		list: [],
	},
	isInitChatDialogue: false,
}
export const messagesSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setIsInitChatDialogue: (
			state,
			params: ActionParams<typeof state['isInitChatDialogue']>
		) => {
			state.isInitChatDialogue = params.payload
		},
		setRecentChatDialogueList: (
			state,
			params: ActionParams<typeof state['recentChatDialogueList']>
		) => {
			state.recentChatDialogueList = params.payload

			state.recentChatDialogueList.sort((a, b) => {
				return b.sort - a.sort
			})
			console.log(state.recentChatDialogueList)
		},
		setDeleteDialogIds: (
			state,
			params: ActionParams<typeof state['deleteDialogIds']>
		) => {
			state.deleteDialogIds = params.payload
		},
		setActiveRoomIndex: (
			state,
			params: ActionParams<typeof state['activeRoomIndex']>
		) => {
			state.activeRoomIndex = params.payload
			if (params.payload === -1) {
				return
			}
			state.recentChatDialogueList[state.activeRoomIndex].showMessageContainer =
				true
		},
		setActiveRoomInfo: (
			state,
			params: ActionParams<typeof state['activeRoomInfo']>
		) => {
			state.activeRoomInfo = params.payload
		},
		setGetMessageStatus: (
			state,
			params: ActionParams<typeof state['getMessageStatus']>
		) => {
			state.getMessageStatus = params.payload
		},
		setDeleteMessage: (
			state,
			params: ActionParams<typeof state['deleteMessage']>
		) => {
			state.deleteMessage = params.payload
		},

		initMessageMap: (
			state,
			params: ActionParams<{
				roomId: string
				type: 'Group' | 'Contact'
			}>
		) => {
			const { roomId, type } = params.payload
			state.messagesMap[roomId] = {
				list: [],
				newMessage: false,
				status: 'loaded',
				pageNum: 1,
				pageSize: pageSize,
				type,
			}
		},
		deleteMessageMap: (
			state,
			params: ActionParams<{
				roomId: string
			}>
		) => {
			const { roomId } = params.payload
			delete state.messagesMap[roomId]
		},
		setMessageMapStatus: (
			state,
			params: ActionParams<{
				roomId: string
				value: typeof state['messagesMap']['status']['status']
			}>
		) => {
			const { roomId, value } = params.payload
			state.messagesMap[roomId].status = value
		},
		setNewMessageStatus: (
			state,
			params: ActionParams<{
				roomId: string
				newMessage: boolean
			}>
		) => {
			const { roomId, newMessage } = params.payload
			const v = state.messagesMap[roomId]
			v.newMessage = newMessage
		},
		setMessageMapList: (
			state,
			params: ActionParams<{
				roomId: string
				list: MessageItem[]
				pageNum?: number
			}>
		) => {
			const { roomId, list, pageNum } = params.payload
			const v = state.messagesMap[roomId]
			pageNum && (v.pageNum = pageNum)
			v.list = list
		},
		setMessageItem: (
			state,
			params: ActionParams<{
				roomId: string
				messageId: string
				value: MessageItem
			}>
		) => {
			const { roomId, messageId, value } = params.payload
			const mv = state.messagesMap[roomId]
			mv.list.some((v, i) => {
				// console.log(v.id, messageId, value)
				if (v.id === messageId) {
					mv.list[i] = {
						...value,
					}
					return true
				}
			})
			state.recentChatDialogueList.some((v) => {
				if (v.lastMessageId === messageId) {
					v.lastMessage = {
						...v.lastMessage,
						...value,
					}
					return true
				}
			})
			// console.log(deepCopy(mv.list))
		},
		setDraft: (
			state,
			params: ActionParams<{
				roomId: string
				message: string
			}>
		) => {
			state.recentChatDialogueList.some((v, i) => {
				if (v.roomId === params.payload.roomId) {
					// console.log(deepCopy(v))
					state.recentChatDialogueList[i].typingMessage = params.payload.message
					return true
				}
			})
			// state.recentChatDialogueList[params.payload.index].typingMessage =
			// 	params.payload.message
			// state.activeRoomInfo = params.payload
		},
	},
})

export const messagesMethods = {
	init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/init', async (_, thunkAPI) => {
		const { mwc, contacts, group, user } = thunkAPI.getState()

		// setDeleteDialogIds

		thunkAPI.dispatch(
			messagesSlice.actions.setDeleteDialogIds(
				(await storage.global.get('deleteDialogIds')) || []
			)
		)
	}),
	initRooms: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/init', async (_, thunkAPI) => {
		const { mwc, contacts, group, user } = thunkAPI.getState()

		thunkAPI.dispatch(messagesSlice.actions.setGetMessageStatus('Getting'))
		await thunkAPI.dispatch(
			methods.messages.joinRoom(
				contacts.list
					.map((v) => {
						return v.id || ''
					})
					.concat(
						group.list.map((v) => {
							return v.id || ''
						})
					)
			)
		)
		await thunkAPI.dispatch(methods.messages.getAllUnreadMessage())
		// 更新群组和联系人缓存

		thunkAPI.dispatch(messagesSlice.actions.setGetMessageStatus('GetSuccess'))
	}),
	joinRoom: createAsyncThunk<
		void,
		string[],
		{
			state: RootState
		}
	>(modeName + '/joinRoom', async (roomIds, thunkAPI) => {
		const { mwc, contacts, group } = thunkAPI.getState()
		console.log('JoinRoom', contacts, group, roomIds)
		if (!roomIds.length) return
		const res = await mwc.sdk?.api.message.joinRoom({
			roomIds: roomIds,
		})
		console.log('JoinRoom', res)
	}),
	setChatDialogue: createAsyncThunk<
		void,
		ChatDialogueItem,
		{
			state: RootState
		}
	>(modeName + '/setChatDialogue', async (dialog, thunkAPI) => {
		const { mwc, group, user, messages } = thunkAPI.getState()

		await thunkAPI.dispatch(
			methods.messages.showDialog({
				roomId: dialog.roomId,
			})
		)

		let ai = -1

		messages.recentChatDialogueList.some((v, i) => {
			if (v.roomId === dialog.roomId) {
				ai = i
				return true
			}
		})
		console.log(
			'setChatDialogue',
			dialog.roomId,
			dialog,
			messages.recentChatDialogueList,
			ai
		)
		if (ai === -1) {
			dialog.unreadMessageCount = 0
			dialog.sort = Math.floor(new Date().getTime() / 1000)
			thunkAPI.dispatch(
				messagesSlice.actions.setRecentChatDialogueList(
					[dialog].concat(messages.recentChatDialogueList)
				)
			)

			thunkAPI.dispatch(methods.messages.setActiveRoomIndex(0))
		} else {
			thunkAPI.dispatch(
				messagesSlice.actions.setRecentChatDialogueList(
					messages.recentChatDialogueList.map((v) => {
						if (v.roomId === dialog.roomId) {
							let t = {
								...v,
								...dialog,
								unreadMessageCount:
									dialog.unreadMessageCount === -1
										? v.unreadMessageCount + 1
										: dialog.unreadMessageCount === -2
										? v.unreadMessageCount
										: dialog.unreadMessageCount,

								sort: dialog.sort === -1 ? v.sort : dialog.sort,
							}
							// if (v.roomId === messages.activeRoomInfo?.roomId) {
							// 	t.unreadMessageCount = 0
							// }
							t.id = v.id
							console.log(deepCopy(t), deepCopy(dialog))
							return t
						}
						return v
					})
				)
			)
		}
	}),

	getRecentChatDialogueList: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getRecentChatDialogueList', async (_, thunkAPI) => {
		const { mwc, group, user, messages } = thunkAPI.getState()
		const res = await mwc.sdk?.api.message.getRecentChatDialogueList()
		console.log('getRecentChatDialogueList res', res)
		if (res?.code === 200) {
			const { messages } = thunkAPI.getState()
			let list: ChatDialogueItem[] = [...messages.recentChatDialogueList]
			res.data?.list?.forEach((v) => {
				let obj: any = {}

				let index = -1
				list.some((sv, si) => {
					if (sv.id === v.id) {
						index = si
						return true
					}
				})

				let b = list[index]?.showMessageContainer || false
				if (!b) {
					b = window.location.search.indexOf(v.roomId || '') >= 0
				}
				if (v.type === 'Group') {
					obj = {
						...v,
						id: v.id || '',
						type: 'Group',
						showMessageContainer: b,
						roomId: v.roomId || '',
						unreadMessageCount: Number(v.unreadMessageCount) || 0,
						sort: Number(v.lastMessageTime) || 0,
					}
				} else {
					obj = {
						...v,
						id: v.id || '',
						type: 'Contact',
						showMessageContainer: b,
						roomId: v.roomId || '',
						unreadMessageCount: Number(v.unreadMessageCount) || 0,
						sort: Number(v.lastMessageTime) || 0,
					}
				}

				if (index === -1) {
					list = [obj].concat(list)
				} else {
					list[index] = {
						...list[index],
						...obj,
					}
				}
			})

			// l?.forEach((v) => {
			// })
			thunkAPI.dispatch(messagesSlice.actions.setRecentChatDialogueList(list))

			// thunkAPI.dispatch(methods.messages.setActiveRoomIndex(0))
		} else {
			thunkAPI.dispatch(
				messagesSlice.actions.setRecentChatDialogueList(
					messages.recentChatDialogueList
				)
			)
		}
		thunkAPI.dispatch(messagesSlice.actions.setIsInitChatDialogue(true))
	}),
	showDialog: createAsyncThunk<
		void,
		{ roomId: string },
		{
			state: RootState
		}
	>(modeName + '/showDialog', async ({ roomId }, thunkAPI) => {
		const { mwc, group, messages } = thunkAPI.getState()
		console.log('roomId', roomId)
		let list = messages.deleteDialogIds.filter((v) => {
			return v !== roomId
		})
		thunkAPI.dispatch(messagesSlice.actions.setDeleteDialogIds(list))
		await storage.global.set('deleteDialogIds', list)
	}),
	hideDialog: createAsyncThunk<
		void,
		{ roomId: string },
		{
			state: RootState
		}
	>(modeName + '/hideDialog', async ({ roomId }, thunkAPI) => {
		const { mwc, group, messages } = thunkAPI.getState()
		console.log('roomId', roomId)
		let list = messages.deleteDialogIds.concat(roomId)
		thunkAPI.dispatch(
			messagesSlice.actions.setDeleteDialogIds(
				messages.deleteDialogIds.concat(roomId)
			)
		)
		await storage.global.set('deleteDialogIds', list)
	}),
	setActiveRoomIndex: createAsyncThunk<
		void,
		number,
		{
			state: RootState
		}
	>(modeName + '/setActiveRoomIndex', async (index, thunkAPI) => {
		const { mwc, group, messages } = thunkAPI.getState()
		const activeRoomIndex = index
		console.log(index)
		if (activeRoomIndex === -1) {
			thunkAPI.dispatch(messagesSlice.actions.setActiveRoomIndex(-1))
			thunkAPI.dispatch(messagesSlice.actions.setActiveRoomInfo(undefined))
			return
		}
		const activeRoomInfo: ChatDialogueItem = {
			...messages.recentChatDialogueList[activeRoomIndex],
		}
		if (activeRoomInfo.type === 'Contact') {
			const uinfo = mwc.cache.userInfo.get(activeRoomInfo.id || '')
			activeRoomInfo.lastSeenTime = Number(uinfo.userInfo?.lastSeenTime) || -1
		}
		if (activeRoomInfo.type === 'Group') {
			const ginfo = mwc.cache.group.get(activeRoomInfo.id || '')
			activeRoomInfo.members = Number(ginfo.members) || 0
		}
		console.log(
			'messages.recentChatDialogueList',
			messages.recentChatDialogueList,
			activeRoomInfo,
			activeRoomIndex
		)
		thunkAPI.dispatch(messagesSlice.actions.setActiveRoomIndex(activeRoomIndex))
		thunkAPI.dispatch(messagesSlice.actions.setActiveRoomInfo(activeRoomInfo))
	}),

	sendFileMessage: createAsyncThunk<
		void,
		{ roomId: string; type: 'Image' | 'Video' | 'File' },
		{
			state: RootState
		}
	>(modeName + '/sendFileMessage', async ({ roomId, type }, thunkAPI) => {
		console.log('sendFileMessage', roomId, type)
		const { uploadFile, getHash } = SAaSS

		let input = document.createElement('input')
		input.type = 'file'
		input.multiple = true
		switch (type) {
			case 'Image':
				// 目前暂时仅支持PNG和JPG
				input.accept = 'image/bmp,image/jpeg,image/png'
				break
			case 'Video':
				input.accept = 'video/*'
				break
			// case 'File':
			// 	imgInput.accept = '*'
			// 	break

			default:
				break
		}
		let index = 0
		const up = async (files: FileList, index: number) => {
			try {
				if (index >= files.length) {
					return
				}
				const tempfile = files[index]
				let file: File | undefined
				let src = ''

				switch (type) {
					case 'Image':
						if (
							!(tempfile.type && input.accept,
							input.accept.includes(tempfile.type))
						) {
							snackbar({
								message: '选择的文件格式错误',
								autoHideDuration: 2000,
								vertical: 'top',
								horizontal: 'center',
								backgroundColor: 'var(--saki-default-color)',
								color: '#fff',
							}).open()
							return
						}

						const resizeData = await images.resize(tempfile, {
							maxPixel: 1280,
							quality: 0.7,
						})
						if (!resizeData) return

						file = resizeData.file
						src = resizeData.dataURL

						const mid = await thunkAPI
							.dispatch(
								methods.messages.sendMessage({
									roomId: roomId,
									storeOnlyLocally: true,
									image: {
										url: src,
										width: resizeData.width,
										height: resizeData.height,
										type: 'image/jpeg',
									},
								})
							)
							.unwrap()
						fileQueue.increase(() => {
							return new Promise(async (res) => {
								console.log('uploadFileMessage', file)
								if (!file) {
									console.log('file does not exist')
									return
								}

								// const url = await thunkAPI
								// 	.dispatch(
								// 		methods.file.uploadFile({
								// 			file,
								// 		})
								// 	)
								// 	.unwrap()

								// thunkAPI.dispatch(
								// 	methods.messages.resendMessageToServer({
								// 		messageId: mid,
								// 		roomId: roomId,
								// 		storeOnlyLocally: true,
								// 		message: {
								// 			image: {
								// 				url: url,
								// 				width: resizeData.width,
								// 				height: resizeData.height,
								// 				type: 'image/jpeg',
								// 			},
								// 		},
								// 	})
								// )
								res()
							})
						}, 'uploadFileMessage')
						up(files, index + 1)
						break
					// case 'Video':
					// 	break
					// case 'File':
					// 	break

					default:
						console.log('暂时不支持')
						break
				}
				if (file) {
				}

				// const res = await upload(resizeData.file)
				// console.log('resizeData', res)
				// if (res) {
				// 	console.log(res)

				// 	fileProgressBar.setProgress({
				// 		progress: index + 1 / files.length,
				// 		tipText: 'Uploading',
				// 		onAnimationEnd() {
				// 			fileProgressBar.close()
				// 		},
				// 	})

				// 	index++

				// 	richtextEl?.insetNode({
				// 		type: type,
				// 		src: res + config.saassConfig.parameters.imageResize.normal,
				// 	})
				// 	up(files, index)
				// }
			} catch (error) {
				// fileProgressBar.setProgress({
				// 	progress: 1,
				// 	tipText: 'Upload failed',
				// 	onAnimationEnd() {
				// 		fileProgressBar.close()
				// 	},
				// })
			}
		}
		input.oninput = async (e) => {
			console.log(input?.files)
			if (input?.files?.length) {
				index = 0
				up(input?.files, index)
			}
		}
		input.click()
	}),
	resendMessageToServer: createAsyncThunk<
		void,
		{
			messageId: string
			roomId: string
			message: protoRoot.message.SendMessage.IRequest
			// 只发送到本地，暂不上传到网络
			// storeOnlyServer?: boolean
			storeOnlyLocally?: boolean
			onMessageSentSuccessfully?: () => void
		},
		{
			state: RootState
		}
	>(
		modeName + '/resendMessageToServer',
		async (
			{
				roomId,
				messageId,
				message,
				storeOnlyLocally,
				onMessageSentSuccessfully,
			},
			thunkAPI
		) => {
			const { mwc, user, group, messages } = thunkAPI.getState()

			const type = MeowWhisperCoreSDK.methods.getType(roomId)
			if (mwc.nsocketioStatus !== 'connected') {
				console.log('连接失败')
				return
			}
			if (!message?.call && !message?.image) {
				if (!message?.message) {
					console.log('未输入信息')
					return
				}
			}

			console.log('resendMessageToServer', messageId, type, message)

			const v = messages.messagesMap[roomId]
			let m = v.list.filter((v) => v.id === messageId)?.[0]
			m = {
				...m,
				...message,
			}

			thunkAPI.dispatch(
				messagesSlice.actions.setMessageItem({
					roomId,
					messageId: messageId,
					value: {
						...m,
						status: 0,
					},
				})
			)

			let params: protoRoot.message.SendMessage.IRequest = {
				roomId,
				type,
				authorId: user.userInfo.uid,
				...message,
			}
			const res = await mwc.sdk?.api.message.sendMessage(params)
			console.log('sendMessage', params, res)
			if (res?.code === 200 && res?.data?.message) {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageItem({
						roomId,
						messageId: messageId,
						value: {
							...res.data.message,
							status: 1,
						},
					})
				)

				await thunkAPI.dispatch(
					methods.messages.setChatDialogue({
						roomId,
						type: type as any,
						id: '-1',
						showMessageContainer: true,
						unreadMessageCount: -2,
						lastMessage: res.data.message,
						lastMessageId: res.data.message?.id,
						lastMessageTime: Math.floor(new Date().getTime() / 1000),
						sort: Math.floor(new Date().getTime() / 1000),
					})
				)
			} else {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageItem({
						roomId,
						messageId: messageId,
						value: {
							...m,
							status: -1,
						},
					})
				)
			}
			onMessageSentSuccessfully?.()
			await thunkAPI.dispatch(methods.messages.setActiveRoomIndex(0))
		}
	),
	sendMessage: createAsyncThunk<
		string,
		{
			roomId: string
			message?: string
			replyId?: string
			replyMessage?: protoRoot.message.IMessages
			call?: protoRoot.message.IMessagesCall
			image?: protoRoot.message.IMessagesImage
			// 只发送到本地，暂不上传到网络
			// storeOnlyServer?: boolean
			storeOnlyLocally?: boolean
			onMessageSentSuccessfully?: () => void
		},
		{
			state: RootState
		}
	>(
		modeName + '/sendMessage',
		async (
			{
				message,
				roomId,
				replyId,
				replyMessage,
				call,
				image,
				storeOnlyLocally,
				onMessageSentSuccessfully,
			},
			thunkAPI
		) => {
			const { mwc, user, group } = thunkAPI.getState()

			const type = MeowWhisperCoreSDK.methods.getType(roomId)

			if (!thunkAPI.getState().messages.messagesMap[roomId]) {
				thunkAPI.dispatch(
					messagesSlice.actions.initMessageMap({
						roomId,
						type: type as any,
					})
				)
			}
			const { messages } = thunkAPI.getState()

			if (mwc.nsocketioStatus !== 'connected') {
				console.log('连接失败')
				return ''
			}
			if (!call && !image) {
				if (!message) {
					console.log('未输入信息')

					// thunkAPI.dispatch(
					// 	methods.tools.sendNotification({
					// 		title: 'dialogInfo.name',
					// 		body: '21321312',
					// 	})
					// )
					return ''
				}
			}

			let mid = md5(user.userInfo.uid + message + new Date().getTime() + roomId)
			const v = messages.messagesMap[roomId]
			console.log('sendMessage', type, message, v)

			let m: MessageItem = {
				id: mid,
				authorId: user.userInfo.uid,
				message: message,
				replyId,
				replyMessage,
				call: call ? call : {},
				image: image ? image : {},
				createTime: Math.floor(new Date().getTime() / 1000),
				status: 0,
			}

			thunkAPI.dispatch(
				messagesSlice.actions.setMessageMapList({
					roomId,
					list: v.list.concat([m]),
				})
			)

			await thunkAPI.dispatch(
				methods.messages.setChatDialogue({
					roomId,
					type: type as any,
					id: '-1',
					showMessageContainer: true,
					unreadMessageCount: -2,
					lastMessage: m,
					lastMessageTime: Math.floor(new Date().getTime() / 1000),
					sort: Math.floor(new Date().getTime() / 1000),
				})
			)

			onMessageSentSuccessfully?.()
			await thunkAPI.dispatch(methods.messages.setActiveRoomIndex(0))

			if (!storeOnlyLocally) {
				let params: protoRoot.message.SendMessage.IRequest = {
					roomId,
					type,
					authorId: user.userInfo.uid,
					message,
					replyId,
					call: call ? call : {},
					image: image ? image : {},
				}
				const res = await mwc.sdk?.api.message.sendMessage(params)
				console.log(
					'sendMessage',
					{
						roomId,
						type,
						authorId: user.userInfo.uid,
						message,
					},
					res
				)
				if (res && res?.code === 200 && res?.data?.message) {
					thunkAPI.dispatch(
						messagesSlice.actions.setMessageItem({
							roomId,
							messageId: mid,
							value: {
								...res.data.message,
								status: 1,
							},
						})
					)
					await thunkAPI.dispatch(
						methods.messages.setChatDialogue({
							roomId,
							type: type as any,
							id: '-1',
							showMessageContainer: true,
							unreadMessageCount: -2,
							lastMessage: res.data.message,
							lastMessageId: res.data.message?.id,
							lastMessageTime: Math.floor(new Date().getTime() / 1000),
							sort: Math.floor(new Date().getTime() / 1000),
						})
					)
					return res.data.message.id || ''
				} else {
					thunkAPI.dispatch(
						messagesSlice.actions.setMessageItem({
							roomId,
							messageId: mid,
							value: {
								...m,
								status: -1,
							},
						})
					)
				}
			}
			return mid
		}
	),
	// 预留
	getAllUnreadMessage: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getAllUnreadMessage', async (_, thunkAPI) => {
		const { mwc, user, group, messages } = thunkAPI.getState()

		console.log('开始获取消息 getAllUnreadMessage')
		// 暂时不需要获取离线消息，暂时全在线
	}),
	getMessages: createAsyncThunk<
		void,
		{
			roomId: string
		},
		{
			state: RootState
		}
	>(modeName + '/getMessages', async ({ roomId }, thunkAPI) => {
		const { mwc, user, group, messages } = thunkAPI.getState()

		const mv = messages.messagesMap[roomId]

		console.log('开始获取消息 getMessage', roomId, mv.status)
		if (mv.status !== 'loaded') {
			return
		}

		thunkAPI.dispatch(
			messagesSlice.actions.setMessageMapStatus({
				roomId,
				value: 'loading',
			})
		)

		console.log('真正的开始获取', roomId, mv.status)
		// 暂时不需要获取离线消息，暂时全在线
		// 有离线之后则是从上次的开始
		const res = await mwc.sdk?.api.message.getHistoricalMessages({
			roomId,
			pageNum: 1,
			pageSize: mv.pageSize,
			type: mv.type,
			timeRange: {
				start: 1540947600,
				end:
					mv.list.length === 0
						? Math.floor(new Date().getTime() / 1000)
						: Number(mv.list[0].createTime) || 0,
			},
		})
		console.log('真正的开始获取2', roomId, res, {
			roomId,
			pageNum: 1,
			pageSize: mv.pageSize,
			type: mv.type,
			timeRange: {
				start: 1540947600,
				end:
					mv.list.length === 0
						? Math.floor(new Date().getTime() / 1000)
						: Number(mv.list[0].createTime) || 0,
			},
		})
		if (res?.code === 200) {
			thunkAPI.dispatch(
				methods.contacts.getUserCache(
					res?.data?.list?.map((v) => {
						return v.authorId || ''
					}) || []
				)
			)
			thunkAPI.dispatch(
				messagesSlice.actions.setMessageMapList({
					roomId,
					list: (
						res?.data?.list?.map((v) => {
							return {
								...v,
								status: 1,
							}
						}) || []
					).concat(mv.list),
					pageNum: mv.pageNum + 1,
				})
			)
			if (res.data?.list?.length) {
				thunkAPI.dispatch(
					methods.messages.readMessages({
						roomId,
					})
				)
			}
			if (res.data.total === mv.pageSize) {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageMapStatus({
						roomId,
						value: 'loaded',
					})
				)
			} else {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageMapStatus({
						roomId,
						value: 'noMore',
					})
				)
			}
		} else {
			thunkAPI.dispatch(
				messagesSlice.actions.setMessageMapStatus({
					roomId,
					value: 'loaded',
				})
			)
		}

		// thunkAPI.dispatch(messagesSlice.actions.setGetMessageStatus('GetSuccess'))
	}),
	readMessages: createAsyncThunk<
		void,
		{
			roomId: string
		},
		{
			state: RootState
		}
	>(modeName + '/readMessages', async ({ roomId }, thunkAPI) => {
		const { mwc, user, group, messages } = thunkAPI.getState()

		const mv = messages.messagesMap[roomId]
		const dialog = messages.recentChatDialogueList.filter((v) => {
			return v.roomId === roomId
		})?.[0]

		// console.log(
		// 	'开始阅读消息 readMessages',
		// 	dialog?.unreadMessageCount,
		// 	roomId,
		// 	mv.status
		// )
		if (!dialog?.unreadMessageCount) return

		thunkAPI.dispatch(
			methods.messages.setChatDialogue({
				...dialog,
				unreadMessageCount: 0,
				sort: -1,
			})
		)

		const res = await mwc.sdk?.api.message.readAllMessages({
			roomId,
		})
		console.log(res)
		if (res?.code === 200) {
			thunkAPI.dispatch(
				messagesSlice.actions.setMessageMapList({
					roomId: res.data.roomId || '',
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

		// thunkAPI.dispatch(messagesSlice.actions.setGetMessageStatus('GetSuccess'))
	}),
	editMessage: createAsyncThunk<
		void,
		{
			roomId: string
			messageId: string
			message: string
			onMessageSentSuccessfully?: () => void
		},
		{
			state: RootState
		}
	>(
		modeName + '/editMessage',
		async (
			{ roomId, message, messageId, onMessageSentSuccessfully },
			thunkAPI
		) => {
			const { mwc, user, group, messages } = thunkAPI.getState()

			if (!message) {
				console.log('未输入信息')

				return
			}

			const mv = messages.messagesMap[roomId]
			const dialog = messages.recentChatDialogueList.filter((v) => {
				return v.roomId === roomId
			})?.[0]
			mv.list.some((v) => {
				if (v.id === messageId) {
					thunkAPI.dispatch(
						messagesSlice.actions.setMessageItem({
							roomId,
							messageId: messageId,
							value: {
								...v,
								message,
								status: 0,
								editing: true,
							},
						})
					)
					return true
				}
			})
			onMessageSentSuccessfully?.()

			const res = await mwc.sdk?.api.message.editMessage({
				roomId,
				messageId,
				authorId: user.userInfo.uid,
				message,
			})
			console.log(res)
			if (res?.code === 200 && res?.data?.message) {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageItem({
						roomId,
						messageId: messageId,
						value: {
							...res.data.message,
							status: 1,
						},
					})
				)
			}
			thunkAPI.dispatch(messagesSlice.actions.setGetMessageStatus('GetSuccess'))
		}
	),
	clearHistory: createAsyncThunk<
		void,
		{ roomId: string },
		{
			state: RootState
		}
	>(modeName + '/clearHistory', async ({ roomId }, thunkAPI) => {
		// alert({
		// 	title: 'Clear chat history',
		// 	content: 'Are you sure you want to delete all messages in the chat?',
		// 	cancelText: 'Cancel',
		// 	confirmText: 'Clear',
		// 	onCancel() {},
		// 	async onConfirm() {
		// 	},
		// }).open()

		// const { mwc, group, messages } = thunkAPI.getState()
		// const mv = messages.messagesMap[roomId]
		// const dialog = messages.recentChatDialogueList.filter((v) => {
		// 	return v.roomId === roomId
		// })?.[0]
		// console.log('clearHistory roomId', roomId, mv, dialog)

		// if (!dialog) return
		// thunkAPI.dispatch(
		// 	messagesSlice.actions.deleteMessageMap({
		// 		roomId,
		// 	})
		// )
		// thunkAPI.dispatch(
		// 	messagesSlice.actions.initMessageMap({
		// 		roomId,
		// 		type: dialog.type,
		// 	})
		// )

		thunkAPI.dispatch(
			messagesSlice.actions.setDeleteMessage({
				roomId,
				list: ['AllMessages'],
			})
		)
	}),
	forwardMessages: createAsyncThunk<
		void,
		{
			ids: string[]
			messageList: MessageItem[]
		},
		{
			state: RootState
		}
	>(modeName + '/forwardMessages', async ({ ids, messageList }, thunkAPI) => {
		const { mwc, group, messages } = thunkAPI.getState()

		console.log('forwardMessages', ids, messageList)
		ids.forEach((v) => {
			messages.recentChatDialogueList.some((sv) => {
				if (v === sv.id) {
					messageList.forEach((ssv) => {
						messageQueue.increase(async () => {
							console.log(sv.roomId, ssv)
							await thunkAPI.dispatch(
								methods.messages.sendMessage({
									roomId: sv.roomId,
									message: ssv?.message || '',
									call: ssv?.call || {},
									image: ssv?.image || {},
								})
							)
						}, 'forwardMessages')
					})
					return true
				}
			})
		})
	}),

	deleteMessages: createAsyncThunk<
		void,
		{
			roomId: string
			deleteAll: boolean
			messageIdList: string[]
			type: 'AllUser' | 'MySelf'
			expirationTime: number
		},
		{
			state: RootState
		}
	>(
		modeName + '/deleteMessages',
		async (
			{ roomId, deleteAll, messageIdList, type, expirationTime },
			thunkAPI
		) => {
			console.log('deleteMessages', messageIdList)
			const { mwc, group, messages, user } = thunkAPI.getState()
			const mv = messages.messagesMap[roomId]
			const dialog = messages.recentChatDialogueList.filter((v) => {
				return v.roomId === roomId
			})?.[0]
			console.log(mv, dialog, {
				roomId,
				messageIdList,
				type,
				expirationTime,
			})

			messageIdList = deleteAll ? ['AllMessages'] : messageIdList

			if (!messageIdList.length) {
				return
			}
			const res = await mwc.sdk?.api.message.deleteMessages({
				roomId,
				messageIdList,
				type,
				expirationTime,
			})
			console.log('deleteMessages', res)
			if (res?.code === 200) {
				thunkAPI.dispatch(
					methods.messages.deleteLocalMessages({
						roomId: roomId || '',
						messageIdList: messageIdList || [],
						uid: user.userInfo.uid || '',
					})
				)
			}
		}
	),

	deleteLocalMessages: createAsyncThunk<
		void,
		{
			roomId: string
			messageIdList: string[]
			uid: string
		},
		{
			state: RootState
		}
	>(
		modeName + '/deleteLocalMessages',
		async ({ roomId, messageIdList, uid }, thunkAPI) => {
			console.log('deleteMessages', messageIdList)
			const { mwc, group, messages, user } = thunkAPI.getState()
			const mv = messages.messagesMap[roomId]

			if (messageIdList.includes('AllMessages')) {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageMapList({
						roomId,
						list:
							uid === user.userInfo.uid
								? []
								: mv.list.filter((v) => {
										return v.authorId !== uid
								  }),
					})
				)
			} else {
				thunkAPI.dispatch(
					messagesSlice.actions.setMessageMapList({
						roomId,
						list: mv.list.filter((v) => {
							return uid === user.userInfo.uid
								? !messageIdList.includes(v?.id || '')
								: !(v.authorId === uid && messageIdList.includes(v?.id || ''))
						}),
					})
				)
			}
		}
	),
}
