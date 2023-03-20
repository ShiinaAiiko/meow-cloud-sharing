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
}
