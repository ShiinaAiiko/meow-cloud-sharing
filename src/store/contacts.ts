import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, {
	ActionParams,
	configSlice,
	messagesSlice,
	methods,
	RootState,
} from '.'
import { PARAMS, protoRoot } from '../protos'
import {
	WebStorage,
	SakiSSOClient,
	compareUnicodeOrder,
	getInitials,
} from '@nyanyajs/utils'
import { MeowWhisperCoreSDK } from '../modules/MeowWhisperCoreSDK'
import { meowWhisperCore, sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import { alert, snackbar } from '@saki-ui/core'

export const modeName = 'contacts'

// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined

export interface FriendItem extends protoRoot.contact.IContact {
	userInfo: protoRoot.user.ISimpleSSOUserInfo | null | undefined
}

const state: {
	list: FriendItem[]
	isInit: boolean
	defaultContact: FriendItem
} = {
	list: [],
	isInit: false,
	defaultContact: {
		userInfo: {
			uid: '------',
			nickname: '------',
		},
	},
}
export const contactsSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setIsInit: (state, params: ActionParams<typeof state['isInit']>) => {
			state.isInit = params.payload
		},
		setContacts: (state, params: ActionParams<typeof state['list']>) => {
			state.list = params.payload
		},
	},
})

export const contactsMethods = {
	getContactList: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getContactList', async (_, thunkAPI) => {
		const { mwc, user, contacts } = thunkAPI.getState()
		const getCoantacts = await mwc.sdk?.api.contact.getContactList()
		console.log('getContacts', user, getCoantacts)
		if (getCoantacts?.code === 200 && getCoantacts.data?.list?.length) {
			let list = getCoantacts.data.list.map((v) => {
				const u = v.users?.filter((v) => {
					// console.log(v.uid, user.userInfo.uid)
					return v.uid !== user.userInfo.uid
				})?.[0]?.userInfo
				console.log(u)
				return {
					...v,
					userInfo: u,
				}
			})
			list.sort((a, b) => {
				return compareUnicodeOrder(
					b.userInfo?.letter || '',
					a.userInfo?.letter || ''
				)
			})
			list.forEach((v) => {
				// console.log(v.userInfo?.uid || '', v)
				mwc.cache.userInfo?.set(v.userInfo?.uid || '', v)
			})
			thunkAPI.dispatch(contactsSlice.actions.setContacts(list))
		} else {
			thunkAPI.dispatch(contactsSlice.actions.setContacts([]))
		}
		thunkAPI.dispatch(contactsSlice.actions.setIsInit(true))
	}),
	updateListAfterDeleteCcontacts: createAsyncThunk<
		void,
		{
			uid: string
			roomId: string
		},
		{
			state: RootState
		}
	>(
		modeName + '/updateListAfterDeleteCcontacts',
		async ({ uid, roomId }, thunkAPI) => {
			const { mwc, user, contacts, messages } = thunkAPI.getState()

			if (!uid || !roomId) return

			thunkAPI.dispatch(
				contactsSlice.actions.setContacts(
					contacts.list.filter((v) => v.userInfo?.uid !== uid)
				)
			)
			thunkAPI.dispatch(
				messagesSlice.actions.setRecentChatDialogueList(
					messages.recentChatDialogueList.filter((v) => v.id !== uid)
				)
			)

			thunkAPI.dispatch(
				messagesSlice.actions.deleteMessageMap({
					roomId: roomId,
				})
			)
			thunkAPI.dispatch(configSlice.actions.setModalUserId(''))
		}
	),
	deleteContact: createAsyncThunk<
		void,
		{
			uid: string
		},
		{
			state: RootState
		}
	>(modeName + '/deleteContact', async ({ uid }, thunkAPI) => {
		alert({
			title: 'Delete',
			content: '确定删除此好友？',
			cancelText: 'Cancel',
			confirmText: 'Delete',
			onCancel() {},
			async onConfirm() {
				const { mwc, user, contacts, messages } = thunkAPI.getState()
				const res = await mwc.sdk?.api.contact.deleteContact({
					uid,
				})
				console.log(res, uid)
				let message = ''
				if (res?.code === 10105) {
					message = '已经不是好友了哦'
				} else if (res?.code === 200) {
					message = '删除成功！'

					await store.dispatch(
						methods.contacts.updateListAfterDeleteCcontacts({
							uid: uid || '',
							roomId: res.data.roomId || '',
						})
					)
				} else {
					message = '好友删除失败了，请重新尝试'
				}
				snackbar({
					message: message,
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			},
		}).open()
	}),
	getContactInfo: createAsyncThunk<
		Promise<FriendItem | undefined>,
		{
			userId: string
		},
		{
			state: RootState
		}
	>(modeName + '/getContactInfo', async ({ userId }, thunkAPI) => {
		const { mwc, user, contacts } = thunkAPI.getState()

		const res = await mwc.sdk?.api.contact.searchContact({
			userId,
		})
		// console.log(res, uid)
		if (res?.code === 200) {
			if (res.data.isFriend) {
				let cListU = contacts.list.filter((v) => {
					return v.userInfo?.uid === userId || v.userInfo?.username === userId
				})?.[0]
				return {
					...cListU,
					userInfo: res.data.userInfo,
				}
			}
			return {
				userInfo: res.data.userInfo,
			}
		} else {
			return undefined
		}
	}),
	updateListAfterAddCcontacts: createAsyncThunk<
		void,
		{
			uid: string
			roomId: string
		},
		{
			state: RootState
		}
	>(
		modeName + '/updateListAfterAddCcontacts',
		async ({ uid, roomId }, thunkAPI) => {
			const { mwc, user } = thunkAPI.getState()

			if (!uid || !roomId) return
			await store.dispatch(methods.messages.joinRoom([roomId]))

			await store.dispatch(methods.contacts.getContactList())
			const { contacts } = store.getState()
			contacts.list.some(async (v) => {
				if (v.userInfo?.uid === uid) {
					store.dispatch(
						methods.messages.setChatDialogue({
							roomId: v.id || '',
							type: 'Contact',
							id: v.userInfo?.uid || '',
							showMessageContainer: true,
							unreadMessageCount: -2,
							sort: -1,
						})
					)
					return true
				}
			})
		}
	),
	addContact: createAsyncThunk<
		string,
		{
			userId: string
			remark: string
		},
		{
			state: RootState
		}
	>(modeName + '/addContact', async ({ userId, remark }, thunkAPI) => {
		const { mwc, user, contacts } = thunkAPI.getState()

		const add = await mwc.sdk?.api.contact.addContact({
			userId,
			remark,
		})
		console.log(add)
		// Added
		let message = ''
		if (add?.code === 200) {
			message = '好友添加成功！'
			snackbar({
				message: message,
				horizontal: 'center',
				vertical: 'top',
				autoHideDuration: 2000,
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()

			await thunkAPI.dispatch(
				methods.contacts.updateListAfterAddCcontacts({
					uid: add.data.uid || '',
					roomId: add.data.roomId || '',
				})
			)
			return add.data.type === 'Added' ? add.data.roomId || '' : ''
		}
		return ''
	}),
	getUserCache: createAsyncThunk<
		void,
		string[],
		{
			state: RootState
		}
	>(modeName + '/getUserCache', async (uids, thunkAPI) => {
		const { mwc, user, contacts } = thunkAPI.getState()

		let list: string[] = []
		Array.from(new Set(uids)).forEach((v) => {
			if (!mwc.cache.userInfo.get(v)) {
				list = list.concat([v])
			}
		})
		console.log('uids', list)
		if (!list.length) return
		const res = await mwc.sdk?.api.contact.searchUserInfoList({
			uid: list,
		})
		console.log('getUser', res)
		if (res?.code === 200) {
			res.data.list?.forEach((v) => {
				mwc.cache.userInfo?.set(v.uid || '', {
					userInfo: v,
				})
			})
		}
	}),
}
