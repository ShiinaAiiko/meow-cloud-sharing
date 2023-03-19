import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, configSlice, methods, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import { WebStorage, SakiSSOClient, SAaSS, RunQueue } from '@nyanyajs/utils'
import { MeowWhisperCoreSDK } from '../modules/MeowWhisperCoreSDK'
import { meowWhisperCore, sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import { snackbar } from '@saki-ui/core'
import { FriendItem } from './contacts'
import createSocketioRouter from '../modules/socketio/router'
import { GroupCache } from './group'
import { t } from 'i18next'
import { api } from '../modules/electron/api'

export const modeName = 'tools'
// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined
const state: {} = {}
export const toolsSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {},
})

export const toolsMethods = {
	init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/init', async (_, thunkAPI) => {
		const { mwc, contacts, group, user, config } = thunkAPI.getState()

		if (config.notification.leval >= 0) {
			Notification.requestPermission(function (status) {
				console.log('Notification', status) // 仅当值为 "granted" 时显示通知
				if (status === 'denied') {
					thunkAPI.dispatch(configSlice.actions.setNotificationEnable(false))
					snackbar({
						message: '您需要开启通知权限',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
					return
				}
				thunkAPI.dispatch(configSlice.actions.setNotificationEnable(true))

				// thunkAPI.dispatch(
				// 	toolsMethods.sendNotification({
				// 		title: '新消息',
				// 		body: '啦啦啦啦',
				// 	})
				// )
			})
		}
	}),
	// 让用户选择通知级别
	// 一直通知
	// 离开应用后通知
	// 永不通知
	sendNotification: createAsyncThunk<
		void,
		{
			title: string
			body: string
			icon?: string
			sound?: boolean
			timeout?: number
		},
		{
			state: RootState
		}
	>(
		modeName + '/sendNotification',
		async ({ title, body, icon, sound, timeout }, thunkAPI) => {
			const { mwc, contacts, config, group, user } = thunkAPI.getState()

			console.log('发送通知')
			const n = new Notification(title, {
				body: body,
				icon: icon || config.logo256,
				timestamp: 2,
			})

			if (sound) {
				console.log('发送声音消息')
			}
			n.onclick = () => {
				console.log('点击了通知')
				api.showWindow()
			}
			if (timeout !== 0) {
				setTimeout(() => {
					n.close()
				}, timeout || 5000)
			}
		}
	),
	developing: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Developing', async (_, thunkAPI) => {
		snackbar({
			message: '该功能暂未开放',
			autoHideDuration: 2000,
			vertical: 'top',
			horizontal: 'center',
			backgroundColor: 'var(--saki-default-color)',
			color: '#fff',
		}).open()
	}),
	copy: createAsyncThunk<
		void,
		{
			content: string
		},
		{
			state: RootState
		}
	>(modeName + '/copy', async ({ content }, thunkAPI) => {
		window.navigator.clipboard.writeText(content)
		snackbar({
			message: t('copySuccessfully', {
				ns: 'common',
			}),
			autoHideDuration: 2000,
			vertical: 'top',
			horizontal: 'center',
			backgroundColor: 'var(--saki-default-color)',
			color: '#fff',
		}).open()
	}),
}
