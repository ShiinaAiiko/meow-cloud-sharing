import axios from 'axios'
import { consumers } from 'stream'
import { NEventListener, NRequest, Wait } from '@nyanyajs/utils'
const CryptoJS = require('crypto-js')

export const getHash = (result: string | ArrayBuffer) => {
	const r: any = result
	const wordArray = CryptoJS.lib.WordArray.create(r)
	const hash = CryptoJS.SHA256(wordArray).toString()
	return hash
}
export interface FolderItem {
	id: string
	folderName: string
	parentPath: string
	status: number
	createTime: number
	lastUpdateTime: number
}
export interface ChunkUploadTokenInfo {
	token: string
	uploadedOffset: number[]
	uploadedTotalSize: number
	chunkSize: number
	urls: {
		domainUrl: string
		uploadUrl: string
		encryptionUrl: string
		url: string
	}
}

export class SAaSS extends NEventListener {
	private baseUrl: string = ''
	private appToken: string = ''
	private wait = new Wait()
	private R = new NRequest()

	constructor({ baseUrl }: { baseUrl?: string }) {
		super()
		baseUrl && (this.baseUrl = baseUrl)
	}
	private apiUrls = {
		v1: {
			versionPrefix: '/api/v1',
			createChunkupload: '/chunkupload/create',
			newFolder: '/folder/new',
			renameFolder: '/folder/rename',
			deleteFolder: '/folder/delete',
			getFolderList: '/folder/list/get',
		},
	}
	setAppToken(baseUrl: string, token: string) {
		this.baseUrl = baseUrl
		this.appToken = token
		this.wait.dispatch()
	}
	async getFolderList(parentPath: string): Promise<FolderItem[]> {
		// 未来支持联级创建
		await this.wait.waiting()
		const res = await this.R.request({
			method: 'GET',
			url:
				this.baseUrl +
				this.apiUrls.v1.versionPrefix +
				this.apiUrls.v1.getFolderList,
			data: {
				appToken: this.appToken,
				parentPath,
			},
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
		if (res.data.code === 200) {
			return res.data?.data?.list.map((v: any): FolderItem => {
				return {
					id: v.id,
					folderName: v.folderName,
					parentPath: v.parentPath,
					status: v.status,
					createTime: v.createTime,
					lastUpdateTime: v.lastUpdateTime,
				}
			})
		}
		return []
	}
	async newFolder(folderName: string, parentPath: string) {
		// 未来支持联级创建
		await this.wait.waiting()

		return (
			await this.R.request({
				method: 'POST',
				url:
					this.baseUrl +
					this.apiUrls.v1.versionPrefix +
					this.apiUrls.v1.newFolder,
				data: {
					appToken: this.appToken,
					parentPath,
					folderName,
				},
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data
	}
	async renameFolder(id: string, folderName: string) {
		// 未来支持联级创建
		await this.wait.waiting()

		return (
			await this.R.request({
				method: 'POST',
				url:
					this.baseUrl +
					this.apiUrls.v1.versionPrefix +
					this.apiUrls.v1.renameFolder,
				data: {
					appToken: this.appToken,
					id,
					folderName,
				},
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data
	}
	async deleteFolder(ids: string[]) {
		// 未来支持联级创建
		await this.wait.waiting()

		return (
			await this.R.request({
				method: 'POST',
				url:
					this.baseUrl +
					this.apiUrls.v1.versionPrefix +
					this.apiUrls.v1.deleteFolder,
				data: {
					appToken: this.appToken,
					ids,
				},
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data
	}
	uploadFile(options: {
		file: File
		url: string
		token: string
		chunkSize: number
		uploadedOffset: number[]
		onprogress: (options: { uploadedSize: number; totalSize: number }) => void
		onsuccess: (options: { encryptionUrl: string; url: string }) => void
		onerror: (err: string) => void
	}) {
		console.log('options', options)

		let offset = 0
		let chunkSize = options.chunkSize

		const reader = new FileReader()
		reader.onload = async (e) => {
			if (!e.target?.result) return

			const result: any = e.target?.result
			const hash = CryptoJS.SHA256(
				CryptoJS.lib.WordArray.create(result)
			).toString()
			const blob = new File(
				[e.target.result],
				encodeURIComponent(
					JSON.stringify({
						offset: offset.toString(),
						hash: hash,
						// 有问题
						final: e.total + offset === options.file.size ? 'ok' : 'no',
					})
				)
			)
			const res = await api.uploadFile(
				options.url,
				options.token,
				blob,
				(progress) => {
					options.onprogress({
						uploadedSize: offset + e.total * (progress / 100),
						totalSize: options.file.size,
					})
				}
			)
			if (res.data.code === 200) {
				// options.onprogress({
				// 	uploadedSize: e.total + offset,
				// 	totalSize: options.file.size,
				// })
				if (e.total + offset === options.file.size) {
					options.onsuccess({
						encryptionUrl: res.data.data.encryptionUrl,
						url: res.data.data.url,
					})
					return
				}
				offset = offset + chunkSize
				reader.readAsArrayBuffer(options.file.slice(offset, offset + chunkSize))
			} else {
				options.onerror(res.data.error || res.data.msg)
			}
		}

		reader.readAsArrayBuffer(options.file.slice(offset, offset + chunkSize))
	}
	getHash(result: string | ArrayBuffer) {
		const r: any = result
		const wordArray = CryptoJS.lib.WordArray.create(r)
		const hash = CryptoJS.SHA256(wordArray).toString()
		return hash
	}
	async createChunkUpload({
		folderPath,
		fileName,
		// chunkSize,
		visitCount = -1,
		password = '',
		expirationTime = -1,
		fileInfo,
		fileConflict,
	}: {
		// 在服务端需要自动加上rootPath,参考folder
		folderPath: string
		fileName: string
		// chunkSize: number
		visitCount?: number
		password?: string
		// -1
		expirationTime?: number
		fileInfo: {
			name: string
			size: number
			type: string
			fileSuffix: string
			lastModified: number
			hash: string
		}
		fileConflict: 'Replace' | 'Skip'
	}): Promise<ChunkUploadTokenInfo | undefined> {
		// 未来支持联级创建
		await this.wait.waiting()

		let chunkSize = 256 * 1024
		const res = (
			await this.R.request({
				method: 'POST',
				url:
					this.baseUrl +
					this.apiUrls.v1.versionPrefix +
					this.apiUrls.v1.createChunkupload,
				data: {
					appToken: this.appToken,
					path: folderPath,
					fileName: fileName,
					chunkSize: chunkSize,
					visitCount: visitCount,
					password: password,
					expirationTime: expirationTime,
					// "type":           options.Type,
					fileInfo: fileInfo,
					fileConflict: fileConflict,
				},
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data
		if (res.code === 200) {
			return {
				...res.data,
				chunkSize: chunkSize,
				urls: {
					...res.data.urls,
					uploadUrl: res.data.urls.domainUrl + '/api/v1/chunkupload/upload',
				},
			}
		}
		return undefined
	}
}

export const api = {
	async uploadFile(
		apiUrl: string,
		token: string,
		blob: File,
		onUploadProgress: (progress: number) => void
	) {
		let formData = new FormData()
		formData.append('files', blob)
		return await axios.post(apiUrl + '?token=' + token, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: (e) => {
				if (e.lengthComputable) {
					onUploadProgress(((e.loaded / e.total) * 100) | 0)
				}
			},
		})
	},
}

// api.uploadFile(options.url, options.token)
// options.onprogress({
// 	uploadedSize: 3000,
// 	totalSize: options.file.size,
// })
// options.onsuccess({
// 	encryptionUrl: '',
// 	url: '',
// })
// options.onerror()
export default {
	getHash,
	api,
	SAaSS,
}
