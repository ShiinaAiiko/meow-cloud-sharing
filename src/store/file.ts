import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, {
	ActionParams,
	configSlice,
	folderSlice,
	methods,
	RootState,
} from '.'
import { PARAMS, protoRoot } from '../protos'
import {
	WebStorage,
	SakiSSOClient,
	SAaSS,
	RunQueue,
	Debounce,
} from '@nyanyajs/utils'
import { sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'
import i18n from '../modules/i18n/i18n'

import {
	snackbar,
	prompt,
	alert,
	multiplePrompts,
	progressBar,
} from '@saki-ui/core'
import { PathJoin } from '../modules/methods'

export const modeName = 'file'
// export let meowWhisperCoreSDK: MeowWhisperCoreSDK | undefined
const state: {} = {}
export const fileSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {},
})

export const fileQueue = new RunQueue()

export const debounce = new Debounce()

export const fileMethods = {
	uploadFile: createAsyncThunk<
		void,
		{
			parentPath: string
			files?: File[]
		},
		{
			state: RootState
		}
	>(modeName + '/uploadFile', ({ parentPath, files }, thunkAPI) => {
		return new Promise(async (resolve, reject) => {
			const { config, saass } = thunkAPI.getState()
			console.log('------uploadFile------', parentPath)
			const t = i18n.t

			let pb: ReturnType<typeof progressBar>
			let fileName = ''
			let filesLength = 0
			let uploadedNum = 0
			let filesList: File[] = []
			const setPb = (progress: number, onAnimationEnd?: () => void) => {
				pb?.setProgress({
					progress: progress || 0,
					tipText: `(${uploadedNum}/${filesLength}) ${fileName}`,
					onAnimationEnd,
				})
			}
			const uploaded = async (url: string) => {
				console.log(url)
				const { folder } = thunkAPI.getState()
				uploadedNum++
				setPb(1, () => {
					if (uploadedNum === filesLength) {
						setTimeout(() => {
							pb.close()
						}, 1000)
						return
					}
					fileName = '正在加载'
					setPb(0, () => {
						up(filesList[uploadedNum])
					})
				})
				if (url) {
					snackbar({
						message: `${fileName} ${t('uploadedSucceeded', {
							ns: 'myFilesPage',
						})}`,
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
					debounce.increase(async () => {
						await thunkAPI.dispatch(
							methods.folder.getFileTreeList({
								folderPath: parentPath,
							})
						)
					}, 300)
				}
				// 未来可以优化成单独为此内容添加
				// thunkAPI.dispatch(
				// 	methods.folder.setList(
				// 		folder.list.filter((v) => {
				// 			return v.type === 'Folder'
				// 		})
				// 	)
				// )
				// await thunkAPI.dispatch(
				// 	methods.file.GetFilesInTheParentPath({
				// 		parentPath,
				// 	})
				// )
			}
			const up = async (files: File) => {
				try {
					// if (index >= files.length) {
					// 	return
					// }
					let file = files
					let src = ''

					if (file) {
						let reader = new FileReader()
						reader.onload = async (e) => {
							// let tSize = file.size
							// let cSize = 0
							fileName = file.name

							// const timer = setInterval(() => {
							// 	// progress += 0.01
							// 	cSize += file.size / 6
							// 	setPb(cSize / tSize)
							// 	if (cSize >= tSize) {
							// 		uploaded('/')
							// 		clearInterval(timer)
							// 	}
							// }, 1000)
							try {
								if (!e.target?.result || !file) return
								const hash = saass.sdk.getHash(e.target.result)

								const fileSuffix = file.name.substring(
									file.name.lastIndexOf('.') + 1
								)
								console.log({
									folderPath: parentPath,
									fileName: file.name,
									fileInfo: {
										name: file.name,
										size: file.size,
										type: file.type || fileSuffix || 'file',
										fileSuffix: fileSuffix ? '.' + fileSuffix : '',
										lastModified: file.lastModified,
										hash: hash,
									},
									fileConflict: 'Replace',
									allowShare: -1,
								})
								const res = await saass.sdk.createChunkUpload({
									folderPath: parentPath,
									fileName: file.name,
									chunkSize: 5242880,
									fileInfo: {
										name: file.name,
										size: file.size,
										type: file.type || fileSuffix || 'file',
										fileSuffix: fileSuffix ? '.' + fileSuffix : '',
										lastModified: file.lastModified,
										hash: hash,
									},
									fileConflict: 'Replace',
									allowShare: -1,
								})
								console.log('res', res)
								if (res) {
									//         apiUrl: "http://192.168.0.106:16100/api/v1/chunkupload/upload"
									// chunkSize: 262144
									// token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaWxlSW5mbyI6eyJBcHBJZCI6IjFlODE2OTE0LTY0ZDItNDc3YS04ZTM1LTQyN2Q5NDdlY2Y1MCIsIk5hbWUiOiJQbmdJdGVtXzEyMTExMDgucG5nIiwiRW5jcnlwdGlvbk5hbWUiOiI4NmZlYmJhNTdiY2NkOGExODNhMTkyZWM2OTRmNzUzNSIsIlBhdGgiOiIvRjA5MzVFNENENTkyMEFBNkM3Qzk5NkE1RUU1M0E3MEYvZmlsZXMvIiwiVGVtcEZvbGRlclBhdGgiOiIuL3N0YXRpYy9jaHVjay8wMzJhYzZhMjQ2ZWI3ZTUxZTM3Mzc3YzNhYmE4YjM2NzE1NGZiMTUxMDFhOTI3NzY2NDA0MDRlMDlhZjkwMGJkLyIsIlRlbXBDaHVja0ZvbGRlclBhdGgiOiIuL3N0YXRpYy9jaHVjay8wMzJhYzZhMjQ2ZWI3ZTUxZTM3Mzc3YzNhYmE4YjM2NzE1NGZiMTUxMDFhOTI3NzY2NDA0MDRlMDlhZjkwMGJkLy9jaHVjay8iLCJDaHVua1NpemUiOjEzMTA3MiwiQ3JlYXRlVGltZSI6MTY1OTg5NDkwNCwiRXhwaXJhdGlvblRpbWUiOi0xLCJWaXNpdENvdW50IjotMSwiRmlsZUluZm8iOnsiTmFtZSI6IlBuZ0l0ZW1fMTIxMTEwOCIsIlNpemUiOjExMjAyLCJUeXBlIjoiaW1hZ2UvcG5nIiwiU3VmZml4IjoiLnBuZyIsIkxhc3RNb2RpZmllZCI6MTY1OTgxMzE3NjY0MSwiSGFzaCI6IjAzMmFjNmEyNDZlYjdlNTFlMzczNzdjM2FiYThiMzY3MTU0ZmIxNTEwMWE5Mjc3NjY0MDQwNGUwOWFmOTAwYmQifSwiRmlsZUNvbmZsaWN0IjoiUmVwbGFjZSJ9LCJleHAiOjE2NTk5ODEzMDQsImlzcyI6InNhYXNzIn0.nfwmBNpJAMCK31U_vG4dL3mRvkhKb7EnaAqji29X9Hw"
									// uploadedOffset: []
									// urls: Urls
									// domainUrl: "http://192.168.0.106:16100"
									// encryptionUrl: "/s/86febba57bccd8a183a192ec694f7535"
									// url: "/s/F0935E4CD5920AA6C7
									const data = res
									console.log(data)
									if (data.token) {
										saass.sdk.uploadFile({
											file: file,
											url: data.urls.uploadUrl,
											token: data.token,
											chunkSize: data.chunkSize,
											uploadedOffset: data.uploadedOffset || [],
											uploadedTotalSize: data.uploadedTotalSize || 0,

											async onprogress(options) {
												setPb(options.uploadedSize / options.totalSize)
												console.log(
													'onprogressoptions',
													options,
													(window.navigator as any)['connection'].downlink
												)
												// await store.state.storage.staticFileWS.getAndSet(
												// 	upload.data.urls?.encryptionUrl || '',
												// 	async (v) => {
												// 		return {
												// 			...v,
												// 			fileDataUrl: result || '',
												// 			uploadedSize: options.uploadedSize,
												// 			totalSize: options.totalSize,
												// 		}
												// 	}
												// )
											},
											async onsuccess(options) {
												console.log(options)
												uploaded(data.urls?.domainUrl + options.shortUrl)

												// resolve(data.urls?.domainUrl + options.encryptionUrl)
												// await store.state.storage.staticFileWS?.getAndSet(
												// 	upload.data.urls?.encryptionUrl || '',
												// 	async (v) => {
												// 		return {
												// 			...v,
												// 			fileDataUrl: result || '',
												// 			encryptionUrl: options.encryptionUrl,
												// 			url: options.url,
												// 			uploadedSize: file.size,
												// 			totalSize: file.size,
												// 		}
												// 	}
												// )
												// store.dispatch('chat/sendMessageWidthSecretChatApi', {
												// 	messageId,
												// 	dialogId,
												// })
											},
											onerror(err) {
												console.log('error', err)
												err &&
													snackbar({
														message: '文件上传失败',
														autoHideDuration: 2000,
														vertical: 'top',
														horizontal: 'center',
														backgroundColor: 'var(--saki-default-color)',
														color: '#fff',
													}).open()
												uploaded('')
												// store.dispatch('chat/failedToSendMessage', {
												// 	messageId,
												// 	dialogId,
												// })
											},
										})
									} else {
										uploaded(data.urls.domainUrl + data.urls.shortUrl)
									}
								}
							} catch (error) {
								console.log(error)
								snackbar({
									message: '文件上传失败',
									autoHideDuration: 2000,
									vertical: 'top',
									horizontal: 'center',
									backgroundColor: 'var(--saki-default-color)',
									color: '#fff',
								}).open()
								uploaded('')
							}
						}
						reader.readAsArrayBuffer(file)
					}

					// const res = await upload(resizeData.file)
					// console.log('resizeData', res)
					// if (res) {
					// 	console.log(res)

					// 	fileProgressBar.setProgress({
					// 		progress: index + 1 / files.length,
					// 		tipText: 'Uploading',
					// 		onAnimationEnd() {
					// 			fileProgressBar.close()
					// 		},
					// 	})

					// 	index++

					// 	richtextEl?.insetNode({
					// 		type: type,
					// 		src: res + config.saassConfig.parameters.imageResize.normal,
					// 	})
					// 	up(files, index)
					// }
				} catch (error) {
					// fileProgressBar.setProgress({
					// 	progress: 1,
					// 	tipText: 'Upload failed',
					// 	onAnimationEnd() {
					// 		fileProgressBar.close()
					// 	},
					// })
				}
			}
			if (files?.length) {
				pb = progressBar({
					width: '100%',
					maxWidth: '300px',
				})
				pb.open()
				filesLength = files.length
				filesList = [...files]
				// for (let i = 0; i < files.length; i++) {
				// 	// up(files[i])
				// 	tSize += files[i].size
				// }
				fileName = '正在加载'
				setPb(0)
				up(files[0])
			} else {
				let input = document.createElement('input')
				input.type = 'file'
				input.multiple = true
				input.accept = '*'
				let index = 0
				input.oninput = async (e) => {
					console.log(input?.files)
					if (input?.files?.length) {
						pb = progressBar({
							width: '100%',
							maxWidth: '300px',
						})
						pb.open()
						index = 0
						// up(input?.files, index)
						filesLength = input?.files.length
						for (let i = 0; i < input?.files.length; i++) {
							filesList.push(input?.files[i])
							// tSize += input?.files[i].size
							// up(input?.files[i])
						}
						fileName = '正在加载'
						setPb(0)
						up(input?.files[0])
					}
				}
				input.click()
			}
		})
	}),
	rename: createAsyncThunk<
		void,
		{
			path: string
			fileName: string
		},
		{
			state: RootState
		}
	>(modeName + '/rename', async ({ path, fileName }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		const t = i18n.t
		let v = fileName
		prompt({
			title: t('rename', {
				ns: 'common',
			}),
			value: v,
			placeholder: t('typeFileName', {
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
				if (v === fileName) {
					return
				}
				const res = await saass.sdk.renameFile(path, fileName, v)
				if (res.code === 200) {
					thunkAPI.dispatch(
						methods.folder.setFileTreeList({
							path: path,
							list: thunkAPI.getState().folder.fileTree[path].map((sv) => {
								if (sv.file?.path === path && sv.file?.fileName === fileName) {
									return {
										...sv,
										file: {
											...sv.file,
											fileName: v,
										},
									}
								}
								return sv
							}),
						})
					)
				} else {
					snackbar({
						message: '文件重命名失败',
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
		{
			path: string
			fileNames: string[]
		},
		{
			state: RootState
		}
	>(modeName + '/moveToTrash', async ({ path, fileNames }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()

		const res = await saass.sdk.moveFilesToTrash(path, fileNames)
		console.log(res)
		if (res.code === 200) {
			thunkAPI.dispatch(
				methods.folder.setFileTreeList({
					path: path,
					list: thunkAPI.getState().folder.fileTree[path].filter((v) => {
						let flag = false

						v.type === 'File' &&
							fileNames.some((sv) => {
								if (sv === v.file?.fileName) {
									flag = true
									return true
								}
							})
						return v.type === 'Folder' || (!flag && v.file?.path === path)
					}),
				})
			)
		} else {
			snackbar({
				message: '文件移入回收站失败',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
	}),

	restore: createAsyncThunk<
		void,
		{
			path: string
			fileNames: {
				fileName: string
				id: string
			}[]
		},
		{
			state: RootState
		}
	>(modeName + '/restore', async ({ path, fileNames }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()

		let fns = fileNames.map((v) => v.fileName)
		const res = await saass.sdk.restoreFile(path, fns)
		console.log(res)
		if (res.code === 200) {
			thunkAPI.dispatch(
				methods.folder.setFileTreeList({
					path: 'recyclebin',
					list: thunkAPI
						.getState()
						.folder.fileTree['recyclebin'].filter((v) => {
							let flag = false

							v.type === 'File' &&
								fileNames.some((sv) => {
									if (sv.fileName === v.file?.fileName && sv.id === v.file.id) {
										flag = true
										return true
									}
								})
							return v.type === 'Folder' || !flag
						}),
				})
			)
		} else {
			snackbar({
				message: '文件恢复失败',
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
			path: string
			fileNames: {
				fileName: string
				id: string
			}[]
		},
		{
			state: RootState
		}
	>(modeName + '/delete', async ({ path, fileNames }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()

		let fns = fileNames.map((v) => v.fileName)
		const res = await saass.sdk.deleteFiles(path, fns)
		console.log(res)
		if (res.code === 200) {
			thunkAPI.dispatch(
				methods.folder.setFileTreeList({
					path: 'recyclebin',
					list: thunkAPI
						.getState()
						.folder.fileTree['recyclebin'].filter((v) => {
							let flag = false

							v.type === 'File' &&
								fileNames.some((sv) => {
									if (sv.fileName === v.file?.fileName && sv.id === v.file.id) {
										flag = true
										return true
									}
								})
							return v.type === 'Folder' || !flag
						}),
				})
			)
		} else {
			snackbar({
				message: '文件删除失败',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
	}),

	setFileSharing: createAsyncThunk<
		void,
		{
			path: string
			fileNames: string[]
			status: number
		},
		{
			state: RootState
		}
	>(
		modeName + '/setFileSharing',
		async ({ path, fileNames, status }, thunkAPI) => {
			const { config, saass } = thunkAPI.getState()
			const t = i18n.t

			const res = await saass.sdk.setFileSharing(path, fileNames, status as any)
			console.log(res)
			if (res.code === 200) {
				const { folder } = thunkAPI.getState()
				thunkAPI.dispatch(
					folderSlice.actions.setFileTreeList({
						path,
						list: folder.fileTree[path]?.map((v) => {
							if (
								v.type === 'File' &&
								v.file?.path === path &&
								fileNames.includes(v.file.fileName)
							) {
								return {
									...v,
									file: {
										...v.file,
										availableRange: {
											...v.file.availableRange,
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

	setFilePassword: createAsyncThunk<
		void,
		{
			path: string
			fileName: string
		},
		{
			state: RootState
		}
	>(modeName + '/setFilePassword', async ({ path, fileName }, thunkAPI) => {
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

						const res = await saass.sdk.setFilePassword(
							path,
							fileName,
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
											v.type === 'File' &&
											v.file?.path === path &&
											v.file?.fileName === fileName
										) {
											return {
												...v,
												file: {
													...v.file,
													availableRange: {
														...v.file.availableRange,
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

	clearFilePassword: createAsyncThunk<
		void,
		{
			path: string
			fileName: string
		},
		{
			state: RootState
		}
	>(modeName + '/clearFilePassword', async ({ path, fileName }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		const t = i18n.t

		const res = await saass.sdk.setFilePassword(path, fileName, 'noPassword')
		console.log(res)
		if (res.code === 200) {
			const { folder } = thunkAPI.getState()

			thunkAPI.dispatch(
				folderSlice.actions.setFileTreeList({
					path,
					list: folder.fileTree[path]?.map((v) => {
						if (
							v.type === 'File' &&
							v.file?.path === path &&
							v.file?.fileName === fileName
						) {
							return {
								...v,
								file: {
									...v.file,
									availableRange: {
										...v.file.availableRange,
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
	}),

	copy: createAsyncThunk<
		void,
		{
			path: string
			fileNames: string[]
			newPath: string
		},
		{
			state: RootState
		}
	>(modeName + '/copy', async ({ path, fileNames, newPath }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		const t = i18n.t
		if (path === newPath) {
			return
		}
		console.log(path, fileNames, newPath)
		const res = await saass.sdk.copyFile(path, fileNames, newPath)
		console.log(res)
		if (res.code === 200) {
			// const { folder } = thunkAPI.getState()

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
				message: '复制失败',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
	}),

	move: createAsyncThunk<
		void,
		{
			path: string
			fileNames: string[]
			newPath: string
		},
		{
			state: RootState
		}
	>(modeName + '/move', async ({ path, fileNames, newPath }, thunkAPI) => {
		const { config, saass } = thunkAPI.getState()
		const t = i18n.t
		if (path === newPath) {
			return
		}
		console.log(path, fileNames, newPath)
		const res = await saass.sdk.moveFile(path, fileNames, newPath)
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
					path: path,
					list: thunkAPI.getState().folder.fileTree[path].filter((v) => {
						let flag = false

						v.type === 'File' &&
							fileNames.some((sv) => {
								if (sv === v.file?.fileName) {
									flag = true
									return true
								}
							})
						return v.type === 'Folder' || (!flag && v.file?.path === path)
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
	}),
}
