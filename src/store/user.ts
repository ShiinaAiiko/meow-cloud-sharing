import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, {
	ActionParams,
	methods,
	storageSlice,
	RootState,
} from '.'
import { UserAgent } from '@nyanyajs/utils/dist/userAgent'
import nyanyajs from '@nyanyajs/utils'

// import { WebStorage } from './ws'
import { storage } from './storage'
import { getI18n } from 'react-i18next'

import { stringify } from 'querystring'
import { resolve } from 'path'
import { nanoid } from 'nanoid'
import { client } from './sso'
import { defaultValue, UserInfo } from '@nyanyajs/utils/dist/sakisso'
import { t } from 'i18next'
import { alert, snackbar } from '@saki-ui/core'

export const modeName = 'user'

export let userInfo = defaultValue.userInfo
export let userAgent = nyanyajs.userAgent(window.navigator.userAgent)
export const userSlice = createSlice({
	name: modeName,
	initialState: {
		userAgent: {
			...userAgent,
		},
		token: '',
		deviceId: '',
		userInfo,
		isLogin: false,
    isInit: false,
	},
	reducers: {
		setInit: (state, params: ActionParams<boolean>) => {
			state.isInit = params.payload
		},
		setIsLogin: (state, params: ActionParams<boolean>) => {
			state.isLogin = params.payload
		},
		login: (
			state,
			params: ActionParams<{
				token: string
				deviceId: string
				userInfo: UserInfo
			}>
		) => {
			const { token, deviceId, userInfo } = params.payload
			state.token = token || ''
			state.deviceId = deviceId || ''
			state.userInfo = userInfo || Object.assign({}, userInfo)
		},
		logout: (state, _) => {
			storage.global.delete('token')
			storage.global.delete('deviceId')
			storage.global.delete('userInfo')
			state.token = ''
			state.deviceId = ''
			state.userInfo = Object.assign({}, userInfo)
			state.isLogin = false
			console.log('useruseruser', state)
			setTimeout(() => {
				store.dispatch(storageSlice.actions.init(''))
			})
		},
	},
})

export const userMethods = {
	Init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Init', async (_, thunkAPI) => {
		// 获取配置
		// console.log(await storage.config.get('language'))
		// thunkAPI.dispatch(userSlice.actions.setInit(false))
		const { user, config, sso } = thunkAPI.getState()
		const token = await storage.global.get('token')
		const deviceId = await storage.global.get('deviceId')
		const userInfo = await storage.global.get('userInfo')
		if (token) {
			await thunkAPI.dispatch(
				userMethods.login({
					token: token,
					deviceId: deviceId,
					userInfo: userInfo,
					type: 'LoggedIn',
				})
			)
			// 改到布局文件里
			// await thunkAPI
			// 	.dispatch(
			// 		methods.user.checkToken({
			// 			appToken: sso.appToken,
			// 			token,
			// 			deviceId,
			// 		})
			// 	)
			// 	.unwrap()
		} else {
			thunkAPI.dispatch(userSlice.actions.logout({}))
		}
		thunkAPI.dispatch(userSlice.actions.setInit(true))
	}),
	checkToken: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/checkToken', async (_, thunkAPI) => {
		try {
			console.log('校验token是否有效')
			const { user, config, sso } = thunkAPI.getState()
			console.log(user, sso)
			if (!user.token || !user.deviceId) {
				thunkAPI.dispatch(userSlice.actions.logout({}))
				return
			}
			const res = await client?.checkToken({
				token: user.token,
				deviceId: user.deviceId,
				userAgent: user.userAgent,
			})
			console.log('res checkToken', res)
			if (res) {
				console.log('登陆成功')
				await thunkAPI.dispatch(
					userMethods.login({
						token: res.token,
						deviceId: res.deviceId,
						userInfo: res.userInfo,
						type: 'LoggedIn',
					})
				)
				thunkAPI.dispatch(userSlice.actions.setIsLogin(true))
				// await thunkAPI.dispatch(methods.sso.GetAppToken())
				// await thunkAPI.dispatch(methods.user.checkToken()).unwrap()
			} else {
				thunkAPI.dispatch(userSlice.actions.logout({}))
				thunkAPI.dispatch(userSlice.actions.setIsLogin(false))
			}
		} catch (error) {}
	}),

	logout: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/logout', async (_, thunkAPI) => {
		alert({
			title: t('logout', {
				ns: 'common',
			}),
			content: t('logoutContent', {
				ns: 'common',
			}),
			cancelText: t('cancel', {
				ns: 'common',
			}),
			confirmText: t('logout', {
				ns: 'common',
			}),
			onCancel() {},
			async onConfirm() {
				thunkAPI.dispatch(userSlice.actions.logout({}))
				snackbar({
					message: t('logoutSuccessfully', {
						ns: 'common',
					}),
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			},
		}).open()
	}),
	login: createAsyncThunk<
		void,
		{
			token: string
			deviceId: string
			userInfo: UserInfo
			type: 'NewLogin' | 'LoggedIn'
		},
		{
			state: RootState
		}
	>(modeName + '/login', async (params, thunkAPI) => {
		const { token, deviceId, type, userInfo } = params

		if (token) {
			thunkAPI.dispatch(
				userSlice.actions.login({
					token: token || '',
					deviceId: deviceId || '',
					userInfo: userInfo || Object.assign({}, userInfo),
				})
			)

			storage.global.setSync('token', token)
			storage.global.setSync('deviceId', deviceId)
			storage.global.setSync('userInfo', userInfo)


			if (type === 'NewLogin') {
				// await mwc.sdk?.encryption.init()
				thunkAPI.dispatch(userSlice.actions.setIsLogin(true))
				// thunkAPI.dispatch(methods.sso.GetAppToken())
			}
			thunkAPI.dispatch(storageSlice.actions.init(userInfo.uid))
		}
	}),
}
