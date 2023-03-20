import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, methods } from '.'
// import { WebStorage } from './ws'
import { NRequest, WebStorage } from '@nyanyajs/utils'
import { storage } from './storage'
import { getI18n } from 'react-i18next'

import { stringify } from 'querystring'
import axios from 'axios'
import { resolve } from 'path'
import { nanoid } from 'nanoid'
import { sakisso, version, origin } from '../config'
import { ListItem } from './folder'
import { FileItem, FolderItem } from '@nyanyajs/utils/dist/saass'

export const modeName = 'config'

export const R = new NRequest()

export let platform: 'Electron' | 'Web' =
	window &&
	window.process &&
	window.process.versions &&
	window.process.versions['electron']
		? 'Electron'
		: 'Web'

export let eventTarget = new EventTarget()

type DeviceType = 'Mobile' | 'Pad' | 'PC'
export let deviceType: DeviceType | undefined

let call: {
	type: 'Audio' | 'Video'
	uid: string
	roomId: string
	participatingUsers: string[]
	enable: boolean
	showModal: boolean
	showSmallWindow: boolean
} = {
	type: 'Audio',
	uid: '',
	participatingUsers: [],
	roomId: '',
	enable: false,
	showModal: false,
	showSmallWindow: false,
}

type Mode = 'dark' | 'light' | 'system'

let appearance: {
	mode: Mode
} = {
	mode: 'system',
}

let initialState = {
	logo256: (process.env.NODE_ENV === 'production' ? '/' : '/') + 'icons/256x256.png',
	layout: {
		backIcon: false,
		showCenter: false,
		centerTitle: {
			title: '',
			subtitle: '',
		},
	},
	saassConfig: {
		parameters: {
			imageResize: {
				normal: '?x-saass-process=image/resize,900,70',
				avatar: '?x-saass-process=image/resize,160,70',
				full: '?x-saass-process=image/resize,1920,70',
			},
		},
	},
	pageConfig: {
		disableChangeValue: false,
		settingPage: {
			visible: false,
			settingType: '',
		},
	},
	version: version,
	isDev: process.env.NODE_ENV === 'development',
	networkStatus: window.navigator.onLine,
	origin: origin,
	language: '',
	languages: ['system', 'zh-CN', 'zh-TW', 'en-US'],
	deviceType,
	sync: false,
	backup: {
		storagePath: '',
		backupAutomatically: false,
		automaticBackupFrequency: '-1',
		keepBackups: '-1',
		maximumStorageSpace: 512 * 1024 * 1024,
		lastBackupTime: 0,
	},
	platform,
	status: {
		noteInitStatus: false,
		sakiUIInitStatus: false,
		syncStatus: false,
		loginModalStatus: false,
	},
	sakisso,
	socketIoConfig: {
		// uri: 'http://192.168.0.103:15301',
		opt: {
			reconnectionDelay: 2000,
			reconnectionDelayMax: 5000,
			secure: false,
			autoConnect: true,
			rejectUnauthorized: false,
			transports: ['websocket'],
		},
	},
	general: {
		automaticallyStart: false,
		openLoginUserDropDownMenu: false,
	},
	appearance: appearance,
	encryptionConfiguration: {
		publicRsa: {
			publicKey: '',
		},
	},
	modal: {
		groupId: '',
		userId: '',
		// shareUrl: '',
		share: {
			name: '',
			meowUrl: '',
			v: undefined as ListItem | undefined,
		},
		previewFileUrls: [] as string[],
		fileDetailPath: '',
		fileDetailIndex: -1,
		fileDetailTabLabel: 'Detail' as 'Detail' | 'Statistics' | 'Permissions',
		copyFiles: {
			visible: false,
			path: '',
			type: 'CopyTo' as 'CopyTo' | 'MoveTo',
			folders: [] as FolderItem[],
			files: [] as FileItem[],
		},
	},
	selectedFileList: [] as ListItem[],
	dirPath: [] as string[],
	count: {
		messages: 0,
		contacts: 0,
		notifications: 0,
	},
	inApp: false,
	notification: {
		enable: false,
		// -1 关闭 0 离开后通知 1 实时通知
		leval: 0,
		// -1 关闭 0 离开后通知 1 实时通知
		sound: 0,
		callSound: true,
	},
	dev: {
		loading: false,
		log: false,
	},
	momentConfig: {
		'zh-CN': {
			fileTime: {
				sameDay: '[今天] HH:mm:ss',
				nextDay: '[明天] HH:mm:ss',
				nextWeek: 'dddd H:mm:ss',
				lastDay: '[昨天] HH:mm:ss',
				lastWeek: 'YY-MM-DD HH:mm:ss',
				sameElse: 'YYYY-MM-DD HH:mm:ss',
			},
		},
		'zh-TW': {
			fileTime: {
				sameDay: '[今天] HH:mm:ss',
				nextDay: '[明天] HH:mm:ss',
				nextWeek: 'dddd H:mm:ss',
				lastDay: '[昨天] HH:mm:ss',
				lastWeek: 'YY-MM-DD HH:mm:ss',
				sameElse: 'YYYY-MM-DD HH:mm:ss',
			},
		},
		'en-US': {
			fileTime: {
				sameDay: '[Today] HH:mm:ss',
				nextDay: '[Tomorrow] HH:mm:ss',
				nextWeek: 'dddd H:mm:ss',
				lastDay: '[Yesterday] HH:mm:ss',
				lastWeek: 'YY-MM-DD HH:mm:ss',
				sameElse: 'YYYY-MM-DD HH:mm:ss',
			},
		},
	},
	fileListSort: {
		name: 1,
		lastUpdateTime: 0,
		deleteTime: 0,
		size: 0,
	},
}

export const configSlice = createSlice({
	name: modeName,
	initialState: initialState,
	reducers: {
		setLanguage: (
			state,
			params: ActionParams<{
				language: string
			}>
		) => {
			state.language = params.payload.language
			// console.log('state.language', state.language)
			if (state.language === 'system') {
				const languages = ['zh-CN', 'zh-TW', 'en-US']
				if (languages.indexOf(navigator.language) >= 0) {
					getI18n().changeLanguage(navigator.language)
				} else {
					switch (navigator.language.substring(0, 2)) {
						case 'zh':
							getI18n().changeLanguage('zh-CN')
							break
						case 'en':
							getI18n().changeLanguage('en-US')
							break

						default:
							getI18n().changeLanguage('en-US')
							break
					}
				}
			} else {
				getI18n().changeLanguage(state.language)
			}
			storage.systemConfig.setSync('language', state.language)

			// state.lang = getI18n().language
			// api.updateSetting({
			// 	type: 'language',
			// })
		},
		setSync: (state, params: ActionParams<boolean>) => {
			state.sync = params.payload
			storage.systemConfig.setSync('sync', JSON.stringify(params.payload))
		},
		setSettingType: (state, params: ActionParams<string>) => {
			state.pageConfig.settingPage.settingType = params.payload
		},
		setSettingVisible: (state, params: ActionParams<boolean>) => {
			state.pageConfig.settingPage.visible = params.payload
		},
		setDisableChangeValue: (state, params: ActionParams<boolean>) => {
			state.pageConfig.disableChangeValue = params.payload
			params.payload &&
				setTimeout(() => {
					store.dispatch(configSlice.actions.setDisableChangeValue(false))
				}, 300)
		},

		setHeaderCenter: (state, params: ActionParams<boolean>) => {
			state.layout.showCenter = params.payload
			console.log('setHeaderCenter', state.layout.showCenter)
		},
		setHeaderCenterTitle: (
			state,
			params: ActionParams<{
				title: string
				subtitle: string
			}>
		) => {
			state.layout.centerTitle = params.payload
		},
		setDeviceType: (state, params: ActionParams<DeviceType>) => {
			state.deviceType = params.payload
		},
		setLayoutBackIcon: (state, params: ActionParams<boolean>) => {
			state.layout.backIcon = params.payload
		},

		setStatus: (
			state,
			params: ActionParams<{
				type:
					| 'noteInitStatus'
					| 'sakiUIInitStatus'
					| 'syncStatus'
					| 'loginModalStatus'
				v: boolean
			}>
		) => {
			state.status[params.payload.type] = params.payload.v
		},
		setBackup: (
			state: any,
			params: ActionParams<{
				type: keyof typeof initialState.backup
				v: any
			}>
		) => {
			state.backup[params.payload.type] = params.payload.v
			switch (params.payload.type) {
				case 'storagePath':
					storage.systemConfig.setSync('backupStoragePath', params.payload.v)
					break
				case 'backupAutomatically':
					storage.systemConfig.setSync(
						'backupAutomatically',
						JSON.stringify(params.payload.v)
					)
					break

				case 'keepBackups':
					storage.systemConfig.setSync('keepBackups', params.payload.v)
					break

				case 'automaticBackupFrequency':
					storage.systemConfig.setSync(
						'automaticBackupFrequency',
						params.payload.v
					)
					break

				default:
					break
			}
		},
		setAutomaticallyStart: (state, params: ActionParams<boolean>) => {
			state.general.automaticallyStart = params.payload

			setTimeout(async () => {
				await storage.global.set(
					'automaticallyStart',
					JSON.stringify(params.payload)
				)

				// api.updateSetting({
				// 	type: 'automaticallyStart',
				// })
				// console.log(
				// 	"await storage.global.get('automaticallyStart')",
				// 	await storage.global.get('automaticallyStart')
				// )
			})
		},
		setNetworkStatus: (state, params: ActionParams<boolean>) => {
			state.networkStatus = params.payload
		},
		setOpenLoginUserDropDownMenu: (state, params: ActionParams<boolean>) => {
			state.general.openLoginUserDropDownMenu = params.payload
		},
		setPublicRsaPbk: (state, params: ActionParams<string>) => {
			state.encryptionConfiguration.publicRsa.publicKey = params.payload
		},
		setModalGroupId: (
			state,
			params: ActionParams<typeof initialState['modal']['groupId']>
		) => {
			state.modal.groupId = params.payload
		},
		setModalUserId: (
			state,
			params: ActionParams<typeof initialState['modal']['userId']>
		) => {
			state.modal.userId = params.payload
		},
		setCount: (
			state,
			params: ActionParams<{
				type: keyof typeof initialState['count']
				value: number
			}>
		) => {
			state.count[params.payload.type] = params.payload.value
		},
		setInApp: (state, params: ActionParams<typeof initialState['inApp']>) => {
			state.inApp = params.payload
		},
		setNotificationEnable: (
			state,
			params: ActionParams<typeof initialState['notification']['enable']>
		) => {
			state.notification.enable = params.payload
		},
		setNotificationLeval: (
			state,
			params: ActionParams<typeof initialState['notification']['leval']>
		) => {
			state.notification.leval = params.payload
		},
		setNotificationSound: (
			state,
			params: ActionParams<typeof initialState['notification']['sound']>
		) => {
			state.notification.sound = params.payload
		},
		setNotificationCallSound: (
			state,
			params: ActionParams<typeof initialState['notification']['callSound']>
		) => {
			state.notification.callSound = params.payload
			storage.global.setSync(
				'notification-callSound',
				params.payload ? '1' : '0'
			)
		},
		setAppearanceMode: (
			state,
			params: ActionParams<typeof initialState['appearance']['mode']>
		) => {
			state.appearance.mode = params.payload
			document.body.classList.remove('system-mode', 'dark-mode', 'light-mode')
			document.body.classList.add(state.appearance.mode + '-mode')

			storage.global.setSync('appearance-mode', params.payload)
		},
		setDev: (state, params: ActionParams<typeof initialState['dev']>) => {
			state.dev = params.payload
		},
		setShareModal: (
			state,
			params: ActionParams<typeof initialState['modal']['share']>
		) => {
			state.modal.share = params.payload
		},
		setPreviewFileModal: (
			state,
			params: ActionParams<{
				previewFileUrls: string[]
			}>
		) => {
			state.modal.previewFileUrls = params.payload.previewFileUrls
		},
		setFileListSort: (
			state,
			params: ActionParams<typeof initialState['fileListSort']>
		) => {
			state.fileListSort = params.payload
			setTimeout(() => {
				const { folder } = store.getState()
				store.dispatch(
					methods.folder.setFileTreeList({
						path: folder.parentPath,
						list: folder.fileTree[folder.parentPath],
					})
				)
			})
		},
		setFileDetailIndex: (
			state,
			params: ActionParams<{
				fileDetailIndex: typeof initialState['modal']['fileDetailIndex']
				fileDetailPath?: typeof initialState['modal']['fileDetailPath']
				fileDetailTabLabel?: typeof initialState['modal']['fileDetailTabLabel']
			}>
		) => {
			state.modal.fileDetailIndex = params.payload.fileDetailIndex
			state.modal.fileDetailPath = params.payload.fileDetailPath || ''
			state.modal.fileDetailTabLabel =
				params.payload.fileDetailTabLabel || 'Detail'
		},
		setModalCopyFiles: (
			state,
			params: ActionParams<typeof initialState['modal']['copyFiles']>
		) => {
			state.modal.copyFiles = params.payload
		},
		setDirPath: (
			state,
			params: ActionParams<typeof initialState['dirPath']>
		) => {
			state.dirPath = params.payload
		},
		setSelectedFileList: (
			state,
			params: ActionParams<typeof initialState['selectedFileList']>
		) => {
			state.selectedFileList = params.payload
		},
	},
})

export const configMethods = {
	Init: createAsyncThunk(modeName + '/Init', async (_, thunkAPI) => {
		// 获取配置
		store.dispatch(methods.config.getDeviceType())
		store.dispatch(methods.config.initLanguage())

		const callSound = await storage.global.get('notification-callSound')
		thunkAPI.dispatch(
			configSlice.actions.setNotificationCallSound(
				callSound === '0' ? false : true
			)
		)
		thunkAPI.dispatch(
			configSlice.actions.setAppearanceMode(
				(await storage.global.get('appearance-mode')) || 'system'
			)
		)

		// console.log(
		// 	"await storage.global.get('automaticallyStart')",
		// 	storage,
		// 	await storage.global.get('automaticallyStart')
		// )
		thunkAPI.dispatch(
			configSlice.actions.setAutomaticallyStart(
				(await storage.global.get('automaticallyStart')) === 'true'
			)
		)

		// store.dispatch(methods.config.initAutoCloseWindowAfterCopy())
		// store.dispatch(methods.config.initSync())
		// store.dispatch(methods.config.initBackup())
	}),
	getDeviceType: createAsyncThunk(
		modeName + '/getDeviceType',
		(_, thunkAPI) => {
			// console.log(
			// 	'getDeviceType',
			// 	window.innerWidth,
			// 	window.innerHeight,
			// 	window.outerHeight
			// )

			if (window.innerWidth < 768) {
				thunkAPI.dispatch(configSlice.actions.setDeviceType('Mobile'))
				return
			}
			if (window.innerWidth < 1024 && window.innerWidth >= 768) {
				thunkAPI.dispatch(configSlice.actions.setDeviceType('Pad'))
				return
			}
			thunkAPI.dispatch(configSlice.actions.setDeviceType('PC'))
		}
	),
	initLanguage: createAsyncThunk(
		modeName + '/initLanguage',
		async (_, thunkAPI) => {
			thunkAPI.dispatch(
				configSlice.actions.setLanguage({
					language: (await storage.systemConfig.get('language')) || 'system',
				})
			)
		}
	),
}
