import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, configSlice, methods, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import { WebStorage, SakiSSOClient, compareUnicodeOrder } from '@nyanyajs/utils'
import {   sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import { alert, multiplePrompts, prompt, snackbar } from '@saki-ui/core'
import { getI18n } from 'react-i18next'
import i18n from '../modules/i18n/i18n'
import { FileItem, FolderItem } from '@nyanyajs/utils/dist/saass'

import { PathJoin } from '../modules/methods'

export const modeName = 'folder'

export interface ListItem {
	type: 'Folder' | 'File'
	path: string
	folder?: FolderItem
	file?: FileItem
}
// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined
const state: {
	parentPath: string
	fileTree: {
		[path: string]: ListItem[]
	}
} = {
	parentPath: '',
	fileTree: {},
}
export const folderSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setParentPath: (state, params: ActionParams<string>) => {
			state.parentPath = params.payload
		},
		setFileTreeList: (
			state,
			params: ActionParams<{
				path: string
				list: ListItem[]
			}>
		) => {
			state.fileTree[params.payload.path] = params.payload.list
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
		const { config } = thunkAPI.getState()
	}),
	setFileTreeList: createAsyncThunk<
		void,
		{
			path: string
			list: ListItem[]
		},
		{
			state: RootState
		}
	>(modeName + '/setFileTreeList', ({ path, list }, thunkAPI) => {
		const { config } = thunkAPI.getState()
		if (config.fileListSort.name !== 0) {
			list = [...list].sort((a, b) => {
				return config.fileListSort.name >= 0
					? compareUnicodeOrder(
							b.folder?.folderName || b.file?.fileName || '',
							a.folder?.folderName || a.file?.fileName || ''
					  )
					: compareUnicodeOrder(
							a.folder?.folderName || a.file?.fileName || '',
							b.folder?.folderName || b.file?.fileName || ''
					  )
			})
		}
		if (config.fileListSort.lastUpdateTime !== 0) {
			list = [...list].sort((a, b) => {
				let at = a.folder?.lastUpdateTime || a.file?.lastUpdateTime || 0
				let bt = b.folder?.lastUpdateTime || b.file?.lastUpdateTime || 0
				return config.fileListSort.lastUpdateTime >= 0 ? at - bt : bt - at
			})
		}
		// console.log(
		// 	'config.fileListSort.deleteTime',
		// 	config.fileListSort.deleteTime,
		// 	list
		// )
		if (config.fileListSort.deleteTime !== 0) {
			list = [...list].sort((a, b) => {
				let at = a.folder?.deleteTime || a.file?.deleteTime || 0
				let bt = b.folder?.deleteTime || b.file?.deleteTime || 0
				// console.log(a, b)
				return config.fileListSort.deleteTime >= 0 ? at - bt : bt - at
			})
		}
		if (config.fileListSort.size !== 0) {
			list = list
				.filter((v) => {
					return v.type === 'Folder'
				})
				.concat(
					list
						.filter((v) => {
							return v.type === 'File'
						})
						.sort((a, b) => {
							let at = a.folder?.lastUpdateTime || a.file?.fileInfo.size || 1
							let bt = b.folder?.lastUpdateTime || b.file?.fileInfo.size || 1
							return config.fileListSort.size >= 0 ? at - bt : bt - at
						})
				)

			thunkAPI.dispatch(
				folderSlice.actions.setFileTreeList({
					path,
					list,
				})
			)
			return
		}
		list = list
			.filter((v) => {
				return v.type === 'Folder'
			})
			.concat(
				list.filter((v) => {
					return v.type === 'File'
				})
			)
		thunkAPI.dispatch(
			folderSlice.actions.setFileTreeList({
				path,
				list,
			})
		)
	}),
	getFileTreeList: createAsyncThunk<
		void,
		{ folderPath: string },
		{
			state: RootState
		}
	>(modeName + '/getFileTreeList', async ({ folderPath }, thunkAPI) => {
		const { saass } = thunkAPI.getState()

		// thunkAPI.dispatch(
		// 	methods.folder.setList(folder.list.filter((v) => v.type !== 'Folder'))
		// )

		const { folder } = thunkAPI.getState()
		const res = await Promise.all([
			new Promise(async (res) => {
				res({
					type: 'File',
					list: await saass.sdk.getFileList(folderPath),
				})
			}),
			new Promise(async (res) => {
				res({
					type: 'Folder',
					list: await saass.sdk.getFolderList(folderPath),
				})
			}),
		])
		let l = [] as ListItem[]
		if (res.length) {
			res.forEach((item: any) => {
				l = l.concat(
					item.list.map((v: any): ListItem => {
						if (item.type === 'File') {
							return {
								type: item.type as any,
								path: PathJoin(v.path, v.folderName || v.fileName),
								file: {
									...v,
								},
							}
						}
						return {
							type: item.type as any,
							path: PathJoin(v.path, v.folderName || v.fileName),
							folder: {
								...v,
							},
						}
					})
				)
			})
		}
		console.log('resresres', l)
		thunkAPI.dispatch(
			folderMethods.setFileTreeList({ path: folderPath, list: l })
		)
	}),
	getRecentFiles: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getRecentFiles', async (_, thunkAPI) => {
		const { saass } = thunkAPI.getState()
		const res = await saass.sdk.getRecentFiles('/', 1, 20)
		console.log('getRecentFiles', res)
		if (res.length) {
			const l = res.map((v): ListItem => {
				return {
					type: 'File',
					path: PathJoin(v.path, v.fileName),
					file: {
						...v,
					},
				}
			})
			l.sort((a, b) => {
				return (b.file?.lastUpdateTime || 0) - (a.file?.lastUpdateTime || 0)
			})
			thunkAPI.dispatch(
				folderSlice.actions.setFileTreeList({
					path: 'recent',
					list: l,
				})
			)
		}
	}),
	getRecyclebinFiles: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/getRecyclebinFiles', async (_, thunkAPI) => {
		const { saass } = thunkAPI.getState()
		try {
			let l = [] as ListItem[]
			const getFileData = async (pageNum: number) => {
				const getRecyclebinFiles = await saass.sdk.getRecyclebinFiles(
					'/',
					pageNum,
					20
				)
				console.log('GetRecyclebinFiles', getRecyclebinFiles)

				l = l.concat(
					getRecyclebinFiles?.map((v): ListItem => {
						return {
							type: 'File',
							path: PathJoin(v.path, v.fileName),
							file: {
								...v,
							},
						}
					}) || []
				)
				if (getRecyclebinFiles.length === 20) {
					await getFileData(pageNum + 1)
				}
			}
			await getFileData(1)

			const getFolderData = async (pageNum: number) => {
				const getRecyclebinFolderList = await saass.sdk.getRecyclebinFolderList(
					'/',
					pageNum,
					20
				)
				console.log('getRecyclebinFolderList', getRecyclebinFolderList)
				l = l.concat(
					getRecyclebinFolderList?.map((v): ListItem => {
						return {
							type: 'Folder',
							path: PathJoin(v.path, v.folderName),
							folder: {
								...v,
							},
						}
					}) || []
				)
				if (getRecyclebinFolderList.length === 20) {
					await getFolderData(pageNum + 1)
				}
			}
			await getFolderData(1)
			thunkAPI.dispatch(
				folderMethods.setFileTreeList({
					path: 'recyclebin',
					list: l,
				})
			)
		} catch (error) {
			console.error(error)
		}
	}),
	newFolder: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/newFolder', async (_, thunkAPI) => {
		const { config, saass, folder } = thunkAPI.getState()
		console.log('newFolder')
		const t = i18n.t
		let v = ''
		prompt({
			title: t('newFolder', {
				ns: 'myFilesPage',
			}),
			value: v,
			placeholder: t('typeFolderName', {
				ns: 'myFilesPage',
			}),
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
						ns: 'myFilesPage',
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
						methods.folder.getFileTreeList({
							folderPath: folder.parentPath,
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
			parentPath: string
			folderName: string
		},
		{
			state: RootState
		}
	>(modeName + '/rename', async ({ parentPath, folderName }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		console.log('rename', parentPath, folderName)
		const t = i18n.t
		let v = folderName
		prompt({
			title: t('rename', {
				ns: 'common',
			}),
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
						ns: 'myFilesPage',
					})
				}
				v = value.trim()
				return ''
			},
			async onConfirm() {
				if (v === folderName) {
					return
				}
				const res = await saass.sdk.renameFolder(parentPath, folderName, v)
				console.log(res, v)
				if (res.code === 200) {
					const { folder } = thunkAPI.getState()
					thunkAPI.dispatch(
						methods.folder.setFileTreeList({
							path: parentPath,
							list: folder.fileTree[parentPath].map((sv) => {
								if (
									sv.folder?.path === parentPath &&
									sv.folder?.folderName === folderName
								) {
									return {
										...sv,
										folder: {
											...sv.folder,
											folderName: v,
										},
									}
								}
								return sv
							}),
						})
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

	moveToTrash: createAsyncThunk<
		void,
		{ parentPath: string; folderNames: string[] },
		{
			state: RootState
		}
	>(
		modeName + '/moveToTrash',
		async ({ parentPath, folderNames }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()

			const res = await saass.sdk.moveFoldersToTrash(parentPath, folderNames)
			console.log(res)
			if (res.code === 200) {
				const { folder } = thunkAPI.getState()
				thunkAPI.dispatch(
					methods.folder.setFileTreeList({
						path: parentPath,
						list: folder.fileTree[parentPath].filter((sv) => {
							return sv.type === 'Folder'
								? sv.folder?.path === parentPath &&
										!folderNames.includes(sv.folder.folderName)
								: true
						}),
					})
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
		}
	),

	restore: createAsyncThunk<
		void,
		{
			parentPath: string
			folderNames: {
				folderName: string
				id: string
			}[]
		},
		{
			state: RootState
		}
	>(modeName + '/restore', async ({ parentPath, folderNames }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()

		let fons = folderNames.map((v) => v.folderName)
		const res = await saass.sdk.restoreFolder(parentPath, fons)
		console.log(res)
		if (res.code === 200) {
			const { folder } = thunkAPI.getState()
			thunkAPI.dispatch(
				methods.folder.setFileTreeList({
					path: 'recyclebin',
					list: folder.fileTree['recyclebin'].filter((v) => {
						let flag = false

						v.type === 'Folder' &&
							folderNames.some((sv) => {
								if (
									sv.folderName === v.folder?.folderName &&
									sv.id === v.folder.id
								) {
									flag = true
									return true
								}
							})
						return v.type === 'File' || !flag
					}),
				})
			)
		} else {
			snackbar({
				message: '文件夹恢复失败',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
	}),

	delete: createAsyncThunk<
		void,
		{
			parentPath: string
			folderNames: {
				folderName: string
				id: string
			}[]
		},
		{
			state: RootState
		}
	>(modeName + '/delete', async ({ parentPath, folderNames }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()

		let fons = folderNames.map((v) => v.folderName)
		const res = await saass.sdk.deleteFolders(parentPath, fons)
		console.log(res)
		if (res.code === 200) {
			const { folder } = thunkAPI.getState()
			thunkAPI.dispatch(
				methods.folder.setFileTreeList({
					path: 'recyclebin',
					list: folder.fileTree['recyclebin'].filter((v) => {
						let flag = false

						v.type === 'Folder' &&
							folderNames.some((sv) => {
								if (
									sv.folderName === v.folder?.folderName &&
									sv.id === v.folder.id
								) {
									flag = true
									return true
								}
							})
						return v.type === 'File' || !flag
					}),
				})
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
	}),

	setFolderSharing: createAsyncThunk<
		void,
		{
			path: string
			folderNames: string[]
			status: number
		},
		{
			state: RootState
		}
	>(
		modeName + '/setFolderSharing',
		async ({ path, folderNames, status }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()
			const t = i18n.t

			const res = await saass.sdk.setFolderSharing(
				path,
				folderNames,
				status as any
			)
			console.log(res)
			if (res.code === 200) {
				const { folder } = thunkAPI.getState()
				thunkAPI.dispatch(
					folderSlice.actions.setFileTreeList({
						path,
						list: folder.fileTree[path]?.map((v) => {
							if (
								v.type === 'Folder' &&
								v.folder?.path === path &&
								folderNames.includes(v.folder?.folderName || '')
							) {
								return {
									...v,
									folder: {
										...v.folder,
										availableRange: {
											...v.folder.availableRange,
											allowShare: status as any,
										},
									},
								}
							}
							return v
						}),
					})
				)
			} else {
				snackbar({
					message: '分享权限设置失败',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			}
		}
	),

	setFolderPassword: createAsyncThunk<
		void,
		{
			path: string
			folderName: string
		},
		{
			state: RootState
		}
	>(modeName + '/setFolderPassword', async ({ path, folderName }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		const t = i18n.t
		let password = md5(String(new Date().getTime())).substring(0, 6)

		const mp1 = multiplePrompts({
			title: t('setPassword', {
				ns: 'myFilesPage',
			}),
			multipleInputs: [
				{
					label: 'password',
					value: password,
					placeholder: t('password', {
						ns: 'myFilesPage',
					}),
					maxLength: 6,
					type: 'Text',
					onChange(value) {
						if (!value) {
							mp1.setInput({
								label: 'password',
								type: 'error',
								v: t('passwordCannotBeEmpty', {
									ns: 'myFilesPage',
								}),
							})
							return
						}

						if (!/^[a-zA-Z0-9_]{0,}$/.test(value.trim())) {
							mp1.setInput({
								label: 'password',
								type: 'error',
								v: t('passwordRule', {
									ns: 'myFilesPage',
								}),
							})
							return
						}
						if (!/^[\s*\S+?]{6,6}$/.test(value.trim())) {
							mp1.setInput({
								label: 'password',
								type: 'error',
								v: t('passwordRule', {
									ns: 'myFilesPage',
								}),
							})
							return
						}
						password = value.trim()
						mp1.setInput({
							label: 'password',
							type: 'error',
							v: '',
						})
						return
					},
				},
			],
			closeIcon: true,
			flexButton: true,
			buttons: [
				{
					label: 'randomPassword',
					text: t('randomPassword', {
						ns: 'myFilesPage',
					}),
					type: 'Normal',
					async onTap() {
						mp1.setInput({
							label: 'password',
							type: 'value',
							v: md5(String(new Date().getTime())).substring(0, 6),
						})
					},
				},
				{
					label: 'Next',
					text: t('next', {
						ns: 'common',
					}),
					type: 'Primary',
					async onTap() {
						if (!password) {
							mp1.setInput({
								label: 'password',
								type: 'error',
								v: t('passwordCannotBeEmpty', {
									ns: 'myFilesPage',
								}),
							})
							return
						}
						mp1.setButton({
							label: 'Next',
							type: 'loading',
							v: true,
						})
						mp1.setButton({
							label: 'Next',
							type: 'disable',
							v: true,
						})

						const res = await saass.sdk.setFolderPassword(
							path,
							folderName,
							password
						)
						console.log(res)
						if (res.code === 200) {
							const { folder } = thunkAPI.getState()
							thunkAPI.dispatch(
								folderSlice.actions.setFileTreeList({
									path,
									list: folder.fileTree[path]?.map((v) => {
										if (
											v.type === 'Folder' &&
											v.folder?.path === path &&
											v.folder?.folderName === folderName
										) {
											return {
												...v,
												folder: {
													...v.folder,
													availableRange: {
														...v.folder.availableRange,
														password: password,
													},
												},
											}
										}
										return v
									}),
								})
							)
							mp1.close()
						} else {
							mp1.setInput({
								label: 'password',
								type: 'error',
								v: t('incorrectPasswordReEnter', {
									ns: 'myFilesPage',
								}),
							})
						}
						mp1.setButton({
							label: 'Next',
							type: 'disable',
							v: false,
						})
						mp1.setButton({
							label: 'Next',
							type: 'loading',
							v: false,
						})
					},
				},
			],
		})
		mp1.open()
	}),

	clearFolderPassword: createAsyncThunk<
		void,
		{
			path: string
			folderName: string
		},
		{
			state: RootState
		}
	>(
		modeName + '/clearFolderPassword',
		async ({ path, folderName }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()
			const t = i18n.t

			const res = await saass.sdk.setFolderPassword(
				path,
				folderName,
				'noPassword'
			)
			console.log(res)
			if (res.code === 200) {
				const { folder } = thunkAPI.getState()

				thunkAPI.dispatch(
					folderSlice.actions.setFileTreeList({
						path,
						list: folder.fileTree[path]?.map((v) => {
							if (
								v.type === 'Folder' &&
								v.folder?.path === path &&
								v.folder?.folderName === folderName
							) {
								return {
									...v,
									folder: {
										...v.folder,
										availableRange: {
											...v.folder.availableRange,
											password: '',
										},
									},
								}
							}
							return v
						}),
					})
				)
			} else {
				snackbar({
					message: '密码清除失败',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			}
		}
	),

	copy: createAsyncThunk<
		void,
		{ parentPath: string; folderNames: string[]; newParentPath: string },
		{
			state: RootState
		}
	>(
		modeName + '/copy',
		async ({ parentPath, folderNames, newParentPath }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()
			const t = i18n.t
			if (parentPath === newParentPath) {
				return
			}
			const res = await saass.sdk.copyFolder(
				parentPath,
				folderNames,
				newParentPath
			)
			console.log(res)
			if (res.code === 200) {
				snackbar({
					message: '复制成功！',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			} else {
				snackbar({
					message: '复制成功！',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			}
		}
	),
	move: createAsyncThunk<
		void,
		{ parentPath: string; folderNames: string[]; newParentPath: string },
		{
			state: RootState
		}
	>(
		modeName + '/move',
		async ({ parentPath, folderNames, newParentPath }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()
			const t = i18n.t
			if (parentPath === newParentPath) {
				return
			}
			const res = await saass.sdk.moveFolder(
				parentPath,
				folderNames,
				newParentPath
			)
			console.log(res)
			if (res.code === 200) {
				snackbar({
					message: '移动成功！',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
				thunkAPI.dispatch(
					methods.folder.setFileTreeList({
						path: parentPath,
						list: thunkAPI
							.getState()
							.folder.fileTree[parentPath].filter((v) => {
								let flag = false

								v.type === 'Folder' &&
									folderNames.some((sv) => {
										if (sv === v.folder?.folderName) {
											flag = true
											return true
										}
									})
								return (
									v.type === 'File' || (!flag && v.folder?.path === parentPath)
								)
							}),
					})
				)
			} else {
				snackbar({
					message: '移动失败',
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			}
		}
	),
}
