import { protoRoot } from '../protos'
import store, { configSlice, methods } from '../store'
import qs from 'qs'
import axios from 'axios'
import { FileItem, FolderItem } from './saass'
import { alert, snackbar } from '@saki-ui/core'
import i18n from './i18n/i18n'
import { meowLinkApiUrl } from '../config'
import { ListItem } from '../store/folder'
const t = i18n.t

export const getDialogueInfo = (v: any) => {
	const { mwc } = store.getState()
	if (!v)
		return {
			avatar: '',
			name: '',
			bio: '',
		}
	if (v.type === 'Group') {
		const ginfo = mwc.cache.group.get(v.id || '')

		return {
			avatar: ginfo?.avatar || '',
			name: ginfo?.name || '',
			bio: '',
		}
	}
	const uinfo = mwc.cache.userInfo.get(v.id || '')

	return {
		avatar: uinfo?.userInfo?.avatar || '',
		name: uinfo?.userInfo?.nickname || '',
		bio: uinfo?.userInfo?.bio || '',
	}
}

export const Query = (
	url: string,
	query: {
		[k: string]: string
	},
	searchParams: URLSearchParams
) => {
	let obj: {
		[k: string]: string
	} = {}
	searchParams.forEach((v, k) => {
		obj[k] = v
	})
	let o = Object.assign(obj, query)
	let s = qs.stringify(
		Object.keys(o).reduce(
			(fin, cur) => (o[cur] !== '' ? { ...fin, [cur]: o[cur] } : fin),
			{}
		)
	)
	return url + (s ? '?' + s : '')
}

export const getUnix = () => {
	return Math.round(new Date().getTime() / 1000)
}

export const download = async (src: string, filename: string) => {
	const res = await axios.get(src, {
		responseType: 'blob',
	})
	var a = document.createElement('a')
	a.href = window.URL.createObjectURL(res.data)
	a.download = filename
	a.target = '_blank'
	URL.revokeObjectURL(src)
	a.click()
}

export const byteConvert = (bytes: number) => {
	if (isNaN(bytes)) {
		return ''
	}
	var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	var exp = Math.floor(Math.log(bytes) / Math.log(2))
	if (exp < 1) {
		exp = 0
	}
	var i = Math.floor(exp / 10)
	bytes = bytes / Math.pow(2, 10 * i)
	let bstr = bytes.toString()
	if (bstr.length > bytes.toFixed(2).toString().length) {
		bstr = bytes.toFixed(2)
	}
	return bstr + ' ' + symbols[i]
}

export interface LinkInfo {
	userToken: string
	user: number
	passwordToken: string
}

export const getLinkInfo = async (v: ListItem): Promise<LinkInfo> => {
	const { saass } = store.getState()

	let li: LinkInfo = {
		userToken: '',
		user: Math.round(new Date().getTime() / 1000) + 30 * 60,
		passwordToken: '',
	}
	// 获取用户token
	if (v.file?.availableRange.allowShare === -1) {
		li.userToken = await saass.sdk.getUserToken()
	}
	// 获取密码密钥
	if (v.file?.availableRange.password) {
		const res = await saass.sdk.getPasswordToken(
			v.file?.path,
			v.file?.fileName,
			li.user
		)
		li.passwordToken = res.passwordToken
	}

	// 获取Rootpath密钥
	return li
}

export const getLink = async (
	type: 'MeowLink' | 'ShortLink' | 'PathLink' | 'ShareLink',
	v: ListItem,
	linkInfo?: LinkInfo
) => {
	let url = ''
	try {
		if (!linkInfo) {
			linkInfo = await getLinkInfo(v)
		}
		switch (type) {
			case 'MeowLink':
				const res = await axios({
					method: 'GET',
					url: meowLinkApiUrl + '/api/v1/url/get',
					params: {
						url: await getLink('ShareLink', v, linkInfo),
					},
				})
				if (res.data?.code === 200) {
					url = res.data.data.shortUrl
				}
				break
			case 'ShortLink':
				if (v.file) {
					url = v.file?.urls.domainUrl + v.file?.urls.shortUrl
				}
				break
			case 'PathLink':
				if (v.file) {
					url = v.file?.urls.domainUrl + v.file?.urls.url
				}
				break
			case 'ShareLink':
				let pwd =
					v.file?.availableRange.password || v.folder?.availableRange.password
				url =
					window.location.origin +
					'/dl/' +
					(v.file?.shortId || v.folder?.shortId) +
					(pwd ? '?pwd=' + pwd : '')

				break

			default:
				break
		}
		if (type !== 'MeowLink' && type !== 'ShareLink') {
			if (url.indexOf('?') < 0) {
				url = url + '?'
			}
			if (linkInfo.userToken) {
				url = url + '&ut=' + linkInfo.userToken
			}
			if (linkInfo.passwordToken) {
				url = url + '&u=' + linkInfo.user + '&p=' + linkInfo.passwordToken
			}
		}

		console.log(url, v)

		return url
	} catch (error) {
		console.error(error)

		snackbar({
			message: '链接生成失败',
			autoHideDuration: 2000,
			vertical: 'top',
			horizontal: 'center',
			backgroundColor: 'var(--saki-default-color)',
			color: '#fff',
		}).open()
		return url
	}
}

export const PathJoin = (...elem: string[]) => {
	return elem.map((v) => (v === '/' ? '' : v)).join('/')
}

export const moveToTrash = ({
	folders,
	files,
}: {
	folders: FolderItem[]
	files: FileItem[]
}) => {
	let v = ''
	if (folders.length) {
		v += folders.length + '个文件夹'
		if (files.length) {
			v += '和'
		}
	}

	if (files.length) {
		v += files.length + '个文件'
	}
	alert({
		title: t('moveToTrash'),
		content: '确定将这' + v + '移入回收站吗？',
		cancelText: t('cancel', {
			ns: 'common',
		}),
		flexButton: true,
		confirmText: t('moveToTrash', {
			ns: 'common',
		}),
		async onConfirm() {
			console.log(files, folders)

			const promiseAll: Promise<any>[] = []

			let fipaths = {} as {
				[path: string]: FileItem[]
			}
			files.forEach((v) => {
				!fipaths[v.path] && (fipaths[v.path] = [])
				fipaths[v.path].push(v)
			})
			let fopaths = {} as {
				[path: string]: FolderItem[]
			}
			folders.forEach((v) => {
				!fopaths[v.path] && (fopaths[v.path] = [])
				fopaths[v.path].push(v)
			})

			Object.keys(fipaths).forEach((path) => {
				promiseAll.push(
					store.dispatch(
						methods.file.moveToTrash({
							path: path,
							fileNames: fipaths[path].map((v) => v.fileName),
						})
					)
				)
			})

			Object.keys(fopaths).forEach((path) => {
				promiseAll.push(
					store.dispatch(
						methods.folder.moveToTrash({
							parentPath: path,
							folderNames: fopaths[path].map((v) => v.folderName),
						})
					)
				)
			})

			console.log(fipaths, fopaths, promiseAll)
			await Promise.all(promiseAll)
			store.dispatch(configSlice.actions.setSelectedFileList([]))
		},
	}).open()
}

export const restore = ({
	folders,
	files,
}: {
	folders: FolderItem[]
	files: FileItem[]
}) => {
	let v = ''
	if (folders.length) {
		v += folders.length + '个文件夹'
		if (files.length) {
			v += '和'
		}
	}

	if (files.length) {
		v += files.length + '个文件'
	}
	alert({
		title: t('restore'),
		content: '确定将这' + v + '恢复吗？',
		cancelText: t('cancel', {
			ns: 'common',
		}),
		flexButton: true,
		confirmText: t('restore', {
			ns: 'common',
		}),
		async onConfirm() {
			console.log(files, folders)

			let fipaths = {} as {
				[path: string]: FileItem[]
			}
			files.forEach((v) => {
				!fipaths[v.path] && (fipaths[v.path] = [])
				fipaths[v.path].push(v)
			})
			let fopaths = {} as {
				[path: string]: FolderItem[]
			}
			folders.forEach((v) => {
				!fopaths[v.path] && (fopaths[v.path] = [])
				fopaths[v.path].push(v)
			})

			// 先检测文件夹或文件是否有重名内容
			const { saass } = store.getState()

			const fs: {
				path: string
				folderNames: {
					folderName: string
					id: string
				}[]
				fileNames: {
					fileName: string
					id: string
				}[]
			}[] = []
			Object.keys(fipaths).forEach((path) => {
				fs.push({
					path,
					folderNames: [],
					fileNames: fipaths[path].map((v) => {
						return {
							fileName: v.fileName,
							id: v.id,
						}
					}),
				})
			})
			Object.keys(fopaths).forEach((path) => {
				fs.push({
					path,
					fileNames: [],
					folderNames: fopaths[path].map((v) => {
						return {
							folderName: v.folderName,
							id: v.id,
						}
					}),
				})
			})

			const restoreFunc = async (list: typeof fs, index: number) => {
				const v = list[index]
				if (!v) {
					store.dispatch(configSlice.actions.setSelectedFileList([]))
					return
				}
				if (v.fileNames.length) {
					await store.dispatch(
						methods.file.restore({
							path: v.path,
							fileNames: v.fileNames,
						})
					)
				} else {
					await store.dispatch(
						methods.folder.restore({
							parentPath: v.path,
							folderNames: v.folderNames,
						})
					)
				}
				await restoreFunc(list, index + 1)
			}

			const processData = async (list: typeof fs, index: number) => {
				const v = list[index]
				if (!v) {
					store.dispatch(configSlice.actions.setSelectedFileList([]))
					return
				}
				let checkExists: string[] = []
				if (v.fileNames.length) {
					checkExists = await saass.sdk.checkFileExists(
						v.path,
						v.fileNames.map((v) => v.fileName)
					)
				} else {
					checkExists = await saass.sdk.checkFolderExists(
						v.path,
						v.folderNames.map((v) => v.folderName)
					)
				}
				console.log('checkExists', v, checkExists)

				if (checkExists.length) {
					alert({
						title: t('restore'),
						content:
							'目录“' +
							v.path +
							'” 已存在 ' +
							checkExists.map((v) => '“' + v + '”').join(',') +
							' ,确定要恢复吗？',
						cancelText: t('skip', {
							ns: 'common',
						}),
						flexButton: true,
						confirmText: t('replace', {
							ns: 'common',
						}),
						async onConfirm() {
							console.log('confirm')
							await restoreFunc(list, index)
						},
						async onCancel() {
							console.log('cancel')
							await processData(list, index + 1)
						},
					}).open()
				} else {
					restoreFunc(list, index)
				}
			}

			await processData(fs, 0)
		},
	}).open()
}

export const deleteFilesOrFolders = ({
	folders,
	files,
}: {
	folders: FolderItem[]
	files: FileItem[]
}) => {
	let v = ''
	if (folders.length) {
		v += folders.length + '个文件夹'
		if (files.length) {
			v += '和'
		}
	}

	if (files.length) {
		v += files.length + '个文件'
	}
	alert({
		title: t('delete'),
		content: '确定将这' + v + '彻底删除吗？',
		cancelText: t('cancel', {
			ns: 'common',
		}),
		flexButton: true,
		confirmText: t('delete', {
			ns: 'common',
		}),
		async onConfirm() {
			console.log(files, folders)

			const promiseAll: Promise<any>[] = []

			let fipaths = {} as {
				[path: string]: FileItem[]
			}
			files.forEach((v) => {
				!fipaths[v.path] && (fipaths[v.path] = [])
				fipaths[v.path].push(v)
			})
			let fopaths = {} as {
				[path: string]: FolderItem[]
			}
			folders.forEach((v) => {
				!fopaths[v.path] && (fopaths[v.path] = [])
				fopaths[v.path].push(v)
			})

			Object.keys(fipaths).forEach((path) => {
				promiseAll.push(
					store.dispatch(
						methods.file.delete({
							path: path,
							fileNames: fipaths[path].map((v) => {
								return {
									fileName: v.fileName,
									id: v.id,
								}
							}),
						})
					)
				)
			})

			Object.keys(fopaths).forEach((path) => {
				promiseAll.push(
					store.dispatch(
						methods.folder.delete({
							parentPath: path,
							folderNames: fopaths[path].map((v) => {
								return {
									folderName: v.folderName,
									id: v.id,
								}
							}),
						})
					)
				)
			})

			console.log(fipaths, fopaths, promiseAll)
			await Promise.all(promiseAll)
			store.dispatch(configSlice.actions.setSelectedFileList([]))
		},
	}).open()
}
