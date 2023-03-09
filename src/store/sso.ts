import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import { SakiSSOClient } from '@nyanyajs/utils'

import { sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'

export const modeName = 'sso'

export let client: SakiSSOClient | undefined

const state: {
	client?: SakiSSOClient
	status: 'connecting' | 'success' | 'fail' | 'notConnected'
	// appToken: string
} = {
	status: 'notConnected',
	// appToken: '',
}
export const ssoSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setClient: (state, params: ActionParams<typeof state['client']>) => {
			state.client = params.payload
		},
		setStatus: (state, params: ActionParams<typeof state['status']>) => {
			state.status = params.payload
		},
		// setAppToken: (state, params: ActionParams<typeof state['appToken']>) => {
		// 	state.appToken = params.payload
		// },
	},
})

export const ssoMethods = {
	Init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Init', async (_, thunkAPI) => {
		console.log('初始化sso')
		client = new SakiSSOClient({
			appId: sakisso.appId,
			clientUrl: sakisso.clientUrl,
			serverUrl: sakisso.serverUrl,
			userAgent,
		})
		console.log('sakisso', client)

		thunkAPI.dispatch(ssoSlice.actions.setClient(client))
		// await thunkAPI.dispatch(ssoMethods.InitAppToken())
	}),
	// 打开SSO登录注册的时候，获取不到UID的话。可以在sso即将发请求前向上获取后再发请求

	// InitAppToken: createAsyncThunk<
	// 	void,
	// 	void,
	// 	{
	// 		state: RootState
	// 	}
	// >(modeName + '/InitAppToken', async (_, thunkAPI) => {
	// 	console.log('InitAppToken')
	// 	// 向后端发请求
	// 	const appToken = await storage.global.get('appToken')
	// 	// console.log("appToken",appToken)
	// 	if (!appToken) {
	// 		await thunkAPI.dispatch(ssoMethods.GetAppToken())
	// 	} else {
	// 		thunkAPI.dispatch(ssoSlice.actions.setAppToken(appToken))
	// 		await thunkAPI.dispatch(ssoMethods.VerifyAppToken())
	// 	}
	// }),
	// VerifyAppToken: createAsyncThunk<
	// 	void,
	// 	void,
	// 	{
	// 		state: RootState
	// 	}
	// >(modeName + '/VerifyAppToken', async (_, thunkAPI) => {
	// 	const { sso, user } = thunkAPI.getState()

	// 	const t = await sso.client?.anonymousUser.verifyAppToken(sso.appToken)
	// 	// console.log('VerifyAppToken', t)
	// 	if (t) {
	// 		await storage.global.set('appToken', t)
	// 		thunkAPI.dispatch(ssoSlice.actions.setAppToken(t))
	// 	} else {
	// 		await thunkAPI.dispatch(ssoMethods.ClearAppToken())
	// 	}
	// }),
	// GetAppToken: createAsyncThunk<
	// 	string,
	// 	void,
	// 	{
	// 		state: RootState
	// 	}
	// >(modeName + '/GetAppToken', async (_, thunkAPI) => {
	// 	const { sso, user, mwc } = thunkAPI.getState()
	// 	// 向后端发请求
	// 	const t = await mwc.sdk?.api.createSSOAppToken()
	// 	if (t) {
	// 		await storage.global.set('appToken', t)
	// 		thunkAPI.dispatch(ssoSlice.actions.setAppToken(t))
	// 		console.log(21321321)
	// 	} else {
	// 		await thunkAPI.dispatch(ssoMethods.ClearAppToken())
	// 	}
	// 	return ''
	// }),
	// ClearAppToken: createAsyncThunk<
	// 	void,
	// 	void,
	// 	{
	// 		state: RootState
	// 	}
	// >(modeName + '/ClearAppToken', async (_, thunkAPI) => {
	// 	await storage.global.delete('appToken')
	// 	thunkAPI.dispatch(ssoSlice.actions.setAppToken(''))
	// }),
}
