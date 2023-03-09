import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, methods, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import { WebStorage, SakiSSOClient } from '@nyanyajs/utils'
import { MeowWhisperCoreSDK } from '../modules/MeowWhisperCoreSDK'
import { meowWhisperCore, sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import { alert, prompt, snackbar } from '@saki-ui/core'
import { FriendItem } from './contacts'
import createSocketioRouter from '../modules/socketio/router'
import { GroupCache } from './group'
import { getI18n } from 'react-i18next'
import i18n from '../modules/i18n/i18n'
import { api, FolderItem } from '../modules/saass'

export const modeName = 'folder'

let enErrorAlert: ReturnType<typeof alert> | undefined

// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined
const state: {
	parentPath: string
	list: {
		type: 'Folder' | 'File'
		folder: FolderItem
	}[]
} = {
	parentPath: '/',
	list: [],
}
export const folderSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setParentPath: (state, params: ActionParams<string>) => {
			state.parentPath = params.payload
		},
		setList: (state, params: ActionParams<typeof state['list']>) => {
			state.list = params.payload
		},
	},
})

export const folderMethods = {
	Init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Init', (_, thunkAPI) => {
		const { config, mwc } = thunkAPI.getState()
	}),
	GetFilesorFoldersInTheParentPath: createAsyncThunk<
		void,
		{ parentPath: string },
		{
			state: RootState
		}
	>(
		modeName + '/GetFilesorFoldersInTheParentPath',
		async ({ parentPath }, thunkAPI) => {
			const { config, mwc, saass, folder } = thunkAPI.getState()

			let l: typeof state['list'] = []
			thunkAPI.dispatch(folderSlice.actions.setList(l))
			const getFolderList = await saass.sdk.getFolderList(parentPath)
			console.log('getFolderList', getFolderList)
			l = l.concat(
				getFolderList.map((v) => {
					// console.log(
					// 	v.parentPath
					// 		.split('/')
					// 		.filter((_, i) => {
					// 			return i > 1
					// 		})
					// 		.join('/')
					// )
					return {
						type: 'Folder',
						folder: {
							...v,
							parentPath: parentPath,
						},
					}
				})
			)
			console.log('getFolderList', l)
			thunkAPI.dispatch(folderSlice.actions.setList(l))
		}
	),
	newFolder: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/newFolder', async (_, thunkAPI) => {
		const { config, mwc, saass, folder } = thunkAPI.getState()
		console.log('newFolder')
		const t = i18n.t
		let v = ''
		prompt({
			title: '新建文件夹',
			value: v,
			placeholder: '输入你的文件夹名称',
			cancelText: t('cancel', {
				ns: 'common',
			}),
			confirmText: t('next', {
				ns: 'common',
			}),
			onChange(value) {
				// console.log(value, /^[\S]\x20{1,50}$/.test(value.trim()))
				if (!/^[\s*\S+?]{1,50}$/.test(value.trim())) {
					return t('lengthLimited1to50', {
						ns: 'prompt',
					})
				}
				v = value.trim()
				return ''
			},
			async onConfirm() {
				const res = await saass.sdk.newFolder(v, folder.parentPath)
				console.log(res)
				if (res.code === 200) {
					thunkAPI.dispatch(
						methods.folder.GetFilesorFoldersInTheParentPath({
							parentPath: folder.parentPath,
						})
					)
				} else {
					snackbar({
						message: '文件夹创建失败',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
				}
			},
		}).open()
	}),
	rename: createAsyncThunk<
		void,
		{
			id: string
			folderName: string
		},
		{
			state: RootState
		}
	>(modeName + '/rename', async ({ id, folderName }, thunkAPI) => {
		const { config, mwc, saass } = thunkAPI.getState()
		console.log('rename', id, folderName)
		const t = i18n.t
		let v = folderName
		prompt({
			title: '重命名',
			value: v,
			placeholder: '输入你的文件夹名称',
			cancelText: t('cancel', {
				ns: 'common',
			}),
			confirmText: t('next', {
				ns: 'common',
			}),
			onChange(value) {
				// console.log(value, /^[\S]\x20{1,50}$/.test(value.trim()))
				if (!/^[\s*\S+?]{1,50}$/.test(value.trim())) {
					return t('lengthLimited1to50', {
						ns: 'prompt',
					})
				}
				v = value.trim()
				return ''
			},
			async onConfirm() {
				if (v === folderName) {
					return
				}
				const res = await saass.sdk.renameFolder(id, v)
				console.log(res, v)
				if (res.code === 200) {
					const { folder } = thunkAPI.getState()
					thunkAPI.dispatch(
						folderSlice.actions.setList(
							folder.list.map((sv) => {
								if (sv.folder?.id === id) {
									return {
										...sv,
										folder: {
											...sv.folder,
											folderName: v,
										},
									}
								}
								return sv
							})
						)
					)
				} else {
					snackbar({
						message: '文件夹重命名失败',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
				}
			},
		}).open()
	}),

	delete: createAsyncThunk<
		void,
		{
			ids: string[]
		},
		{
			state: RootState
		}
	>(modeName + '/rename', async ({ ids }, thunkAPI) => {
		const { config, mwc, saass } = thunkAPI.getState()
		const t = i18n.t

		alert({
			title: '删除文件夹',
			content: '文件夹下的所有文件也将会被删除，确认删除此文件夹吗？',
			cancelText: t('cancel', {
				ns: 'common',
			}),
			confirmText: t('moveToTrash', {
				ns: 'common',
			}),
			async onConfirm() {
				const res = await saass.sdk.deleteFolder(ids)
				console.log(res)
				if (res.code === 200) {
					const { folder } = thunkAPI.getState()
					thunkAPI.dispatch(
						folderSlice.actions.setList(
							folder.list.filter((sv) => {
								return !ids.includes(sv.folder?.id)
							})
						)
					)
				} else {
					snackbar({
						message: '文件夹删除失败',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
				}
			},
		}).open()
	}),
}
