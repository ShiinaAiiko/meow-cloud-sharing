import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import exp from 'constants'
// import thunk from 'redux-thunk'
import { useDispatch } from 'react-redux'
import { storageMethods, storageSlice } from './storage'
import { configMethods, configSlice } from './config'
import { userMethods, userSlice } from './user'
import { apiMethods, apiSlice } from './api'
import { ssoMethods, ssoSlice } from './sso'
import { encryptionMethods, encryptionSlice } from './encryption'
import { mwcMethods, mwcSlice } from './mwc'
import { contactsMethods, contactsSlice } from './contacts'
import { groupMethods, groupSlice } from './group'
import { messagesMethods, messagesSlice } from './messages'
import { callMethods, callSlice } from './call'
import { fileMethods, fileSlice } from './file'
import { toolsMethods, toolsSlice } from './tools'
import { emojiMethods, emojiSlice } from './emoji'
import { folderMethods, folderSlice } from './folder'
import { saassMethods, saassSlice } from './saass'

export interface ActionParams<T = any> {
	type: string
	payload: T
}

const rootReducer = combineReducers({
	storage: storageSlice.reducer,
	config: configSlice.reducer,
	user: userSlice.reducer,
	api: apiSlice.reducer,
	sso: ssoSlice.reducer,
	mwc: mwcSlice.reducer,
	encryption: encryptionSlice.reducer,
	contacts: contactsSlice.reducer,
	group: groupSlice.reducer,
	messages: messagesSlice.reducer,
	call: callSlice.reducer,
	file: fileSlice.reducer,
	tools: toolsSlice.reducer,
	emoji: emojiSlice.reducer,
	folder: folderSlice.reducer,
	saass: saassSlice.reducer,
})

const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
})

export {
	userSlice,
	storageSlice,
	configSlice,
	ssoSlice,
	mwcSlice,
	encryptionSlice,
	contactsSlice,
	groupSlice,
	messagesSlice,
	callSlice,
	fileSlice,
	toolsSlice,
	emojiSlice,
	folderSlice,
	saassSlice,
}
export const methods = {
	storage: storageMethods,
	config: configMethods,
	user: userMethods,
	api: apiMethods,
	sso: ssoMethods,
	mwc: mwcMethods,
	encryption: encryptionMethods,
	contacts: contactsMethods,
	group: groupMethods,
	messages: messagesMethods,
	call: callMethods,
	file: fileMethods,
	tools: toolsMethods,
	emoji: emojiMethods,
	folder: folderMethods,
	saass: saassMethods,
}

// console.log(store.getState())

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default store
