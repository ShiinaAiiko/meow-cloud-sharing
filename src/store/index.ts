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
import { fileMethods, fileSlice } from './file'
import { toolsMethods, toolsSlice } from './tools'
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
	file: fileSlice.reducer,
	tools: toolsSlice.reducer,
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
	fileSlice,
	toolsSlice,
	folderSlice,
	saassSlice,
}
export const methods = {
	storage: storageMethods,
	config: configMethods,
	user: userMethods,
	api: apiMethods,
	sso: ssoMethods,
	file: fileMethods,
	tools: toolsMethods,
	folder: folderMethods,
	saass: saassMethods,
}

// console.log(store.getState())

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default store
