import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, methods, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import { WebStorage, SakiSSOClient, NEventListener } from '@nyanyajs/utils'
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
import { api } from '../modules/http/api'
import { SAaSS } from '../modules/saass'

export const modeName = 'saass'

let enErrorAlert: ReturnType<typeof alert> | undefined

// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined
const state: {
	sdk: SAaSS
	nEventListener: NEventListener
} = {
	sdk: new SAaSS({}),
	nEventListener: new NEventListener(),
}

state.sdk.on('AppTokenInvalid', () => {
	// console.log('AppTokenInvalid')
	store.dispatch(saassMethods.getAppToken())
})

export const saassSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
	},
})

export const saassMethods = {
	Init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Init', (_, thunkAPI) => {
		const { config, mwc } = thunkAPI.getState()
		thunkAPI.dispatch(saassMethods.getAppToken())
	}),
	getAppToken: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getAppToken', async (_, thunkAPI) => {
		const { config, mwc, saass } = thunkAPI.getState()

		console.log('getAppToken')

		const res = await api.v1.getAppToken({})
		console.log('getAppToken', res)
		if (res.code === 200) {
			saass.sdk.setAppToken(
				res.data.baseUrl || '',
				res.data.appToken || '',
				Number(res.data.deadline)
			)
		}
	}),
}
