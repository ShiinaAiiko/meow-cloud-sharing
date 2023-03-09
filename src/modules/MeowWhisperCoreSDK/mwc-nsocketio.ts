import axios from 'axios'
import * as nyanyalog from 'nyanyajs-log'
import protoRoot from '../../protos/proto'
import { Buffer } from 'buffer'
import md5 from 'blueimp-md5'
import {
	AES,
	RSA,
	userAgent,
	validation,
	NEventListener,
	compareUnicodeOrder,
} from '@nyanyajs/utils'
// import { NEventListener } from './neventListener'
import { NRequest, ResponseData } from '@nyanyajs/utils/dist/nrequest'
import { NSocketIoClient } from '@nyanyajs/utils/dist/nsocketio'
// import { NSocketIoClient } from './nsocketio'
import Long from 'long'
import { UserAgent } from '@nyanyajs/utils/dist/userAgent'
import { MeowWhisperCoreSDK } from './mwc-sdk'
import { apiVersion, eventName, namespace } from './api'

let RequestType = protoRoot.base.RequestType
let ResponseType = protoRoot.base.ResponseType
let ResponseEncryptDataType = protoRoot.base.ResponseEncryptDataType
let RequestEncryptDataType = protoRoot.base.RequestEncryptDataType

const { ParamsEncode, ResponseDecode } = NRequest.protobuf
const P = ParamsEncode
const R = ResponseDecode

export interface MSCnsocketioOption {
	sdk: MeowWhisperCoreSDK
}
type Status = 'connected' | 'connecting' | 'disconnect' | 'notConnected'
type RouterEventName =
	| 'router-receiveMessage'
	| 'router-readAllMessages'
	| 'router-startCallingMessage'
	| 'router-hangupMessage'
	| 'router-deleteMessages'
	| 'router-receiveEditMessage'
	| 'router-updateContactStatus'
	| 'router-updateGroupStatus'
	| 'router-callReconnectMessages'
	| 'router-updateGroupInfo'
	| 'router-error'

export type RouterType = {
	'router-receiveMessage': ResponseData<protoRoot.message.SendMessage.IResponse>
	'router-readAllMessages': ResponseData<protoRoot.message.ReadAllMessages.IResponse>
	'router-startCallingMessage': ResponseData<protoRoot.message.StartCalling.IResponse>
	'router-hangupMessage': ResponseData<protoRoot.message.Hangup.IResponse>
	'router-deleteMessages': ResponseData<protoRoot.message.DeleteMessages.IResponse>
	'router-receiveEditMessage': ResponseData<protoRoot.message.EditMessage.IResponse>
	'router-updateContactStatus': ResponseData<protoRoot.contact.UpdateContactStatus.IResponse>
	'router-updateGroupStatus': ResponseData<protoRoot.group.UpdateGroupStatus.IResponse>
	'router-callReconnectMessages': ResponseData<protoRoot.message.CallReconnect.IResponse>
	'router-updateGroupInfo': ResponseData<protoRoot.group.UpdateGroupInfo.IResponse>
}

export class MSCnsocketio extends NEventListener<Status | RouterEventName> {
	status: Status = 'notConnected'
	// onConnect?: () => void
	// onDisconnect?: () => void
	// onConnecting?: () => void
	sdk: MeowWhisperCoreSDK
	client?: NSocketIoClient
	namespace = namespace
	eventName = eventName
	// listener = new NEventListener<Status>()
	constructor(options: MSCnsocketioOption) {
		super()
		console.log('MSCnsocketio', options)
		this.sdk = options.sdk
	}
	private initMiddleware() {
		this.client?.use.request((config) => {
			// console.log('request', config)
			let data: protoRoot.base.IRequestEncryptDataType = {}

			// 发送请求也需要序列号
			// 当没有远程publicKey的时候也要加密
			if (this.sdk.encryptionApi) {
				// console.log(!store.state.encryption.client?.aes.key)
				// 没有完成加密
				// const aesKey = store.state.storage.ws.getSync('ec-aesKey')
				// const userKey = store.state.storage.ws.getSync('ec-userKey')

				const { aesKey, userKey } = this.sdk.encryption.getAesKeySync()
				console.log('MSCnsocketio', aesKey, userKey, !aesKey || !userKey)
				if (!aesKey || !userKey) {
					if (this.sdk.userInfo.token) {
						this.sdk.encryption.init()
					}
					// 1、获取并加密临时TempAESKey
					const aesKey = md5(
						Math.random().toString() +
							Math.random().toString() +
							Math.random().toString() +
							new Date().toString()
					)
					// console.log('aesKey', aesKey)
					const aesKeyEnStr = RSA.encrypt(this.sdk.publicRsa.publicKey, aesKey)
					// console.log('aesKeyEnStr', aesKeyEnStr)
					// console.log(config.data)
					const dataEnStr = AES.encrypt(config.data, aesKey)
					// console.log(config.data.data.length)
					// console.log(config.data.token.length)
					// console.log(dataEnStr.value.length)
					// console.log(aesKeyEnStr.length)
					data.data = dataEnStr.value
					data.tempAesKey = aesKeyEnStr
					// console.log(config.data)
				} else {
					const enData = AES.encrypt(config.data, aesKey)

					data.data = enData.value
					data.key = userKey
					// console.log(data, config.data, aesKey, userKey)
				}
			}
			config.data = {
				data: Buffer.from(
					RequestEncryptDataType.encode(
						RequestEncryptDataType.create(data)
					).finish() as any,
					'base64'
				).toString('base64'),
			}
			return config
		})
		this.client?.use.response((response) => {
			return this.useResponse(response)
		})
	}
	private useResponse(response: { data: any; requestId: string }) {
		if (this.sdk.encryptionApi) {
			console.log(response)
			let data = ResponseEncryptDataType.decode(
				// Buffer.from(response.data.protobuf, 'utf-8')
				new Uint8Array(Buffer.from(response.data, 'base64'))
			)

			// const aesKey = store.state.storage.ws.getSync('ec-aesKey')

			const { aesKey, userKey } = this.sdk.encryption.getAesKeySync()

			// console.log(data)
			// 用户无AESKEY，所以返临时key
			if (!data.key) {
				data.key = aesKey
			}
			const deData = AES.decrypt(data.data, data.key, data.key)
			// console.log(
			// 	deData,
			// 	data.data.length,
			// 	data.key,
			// 	aesKey,
			// 	userKey,
			// 	this.sdk.userInfo
			// )
			response.data = {
				...JSON.parse(deData || '{}'),
			}
		} else {
			let data = ResponseType.decode(
				// Buffer.from(response.data.protobuf, 'utf-8')
				new Uint8Array(Buffer.from(response.data.protobuf, 'base64'))
			)
			response.data = {
				...data,
			}
		}
		console.log('response', response)

		// delete response.data.protobuf

		return response
	}
	setStatus(s: Status) {
		if (this.status !== s) {
			this.status = s
			this.dispatch(s)
			// this.dispatchEvent(new Event(s))
		}
	}
	async connect() {
		if (this.status === 'connecting' && this.client) return
		this.setStatus('connecting')
		const query = await this.getQuery()
		if (typeof query === 'string') {
			return query
		}
		this.client = new NSocketIoClient({
			uri: this.sdk.socketIoConfig.uri,
			opts: {
				...this.sdk.socketIoConfig.opts,
				query: await this.getQuery(),
				reconnectionDelay: 6000,
			},
			heartbeatInterval: 0,
		})
		console.log('MSCnsocketio connect')
		console.log(
			this.sdk.userInfo,
			P<protoRoot.base.IRequestType>(
				{
					token: this.sdk.userInfo.token,
					deviceId: this.sdk.userInfo.deviceId,
					userAgent: this.sdk.userInfo.userAgent,
					appId: this.sdk.appId,
				},
				protoRoot.base.RequestType
			)
		)

		this.initMiddleware()
		this.client.on('connected', () => {
			this.setStatus('connected')
		})
		this.client.on('connecting', () => {
			this.setStatus('connecting')
		})
		this.client.on('disconnect', () => {
			this.setStatus('disconnect')
		})

		this.client.socket(this.namespace.v1.base)
		this.client.socket(this.namespace.v1.chat)
		// this.client.socket(this.namespace.Room)

		this.createRouter()
	}
	async getQuery() {
		if (this.sdk.encryptionApi) {
			if (this.sdk.encryption.status !== 'success') {
				await this.sdk.encryption.init()
			}
		}
		const { aesKey, userKey } = await this.sdk.encryption.getAesKey()
		console.log(aesKey, userKey, this.sdk.encryption.status)
		if (!aesKey || !userKey || this.sdk.encryption.status !== 'success') {
			console.error('Encryption key not fetched.')
			return 'Encryption key not fetched.'
		}

		const verr = validation.Validate(
			this.sdk.userInfo,
			validation.Parameter('token', validation.Required()),
			validation.Parameter('deviceId', validation.Required()),
			validation.Parameter('userAgent', validation.Required())
		)
		if (verr) {
			console.error(verr)
			return verr
		}
		return {
			data: AES.encrypt(
				P<protoRoot.base.IRequestType>(
					{
						token: this.sdk.userInfo.token,
						deviceId: this.sdk.userInfo.deviceId,
						userAgent: this.sdk.userInfo.userAgent,
						appId: this.sdk.appId,
					},
					protoRoot.base.RequestType
				),
				aesKey
			).value,
			key: userKey,
		}
	}
	disconnect() {
		if (this.status !== 'connected') return
		console.log('MSCnsocketio disconnect')
		this.setStatus('disconnect')
		this.client?.close()
		this.client = undefined
	}
	createRouter() {
		console.log('createRouter')
		if (!this.client) return
		// const state = store.state
		// // console.log(deepCopy(client), namespace, namespace.base)
		this.client
			?.routerGroup(this.namespace[apiVersion].base)
			.router({
				eventName: this.eventName.v1.routeEventName.error,
				func: (response) => {
					console.log('Socket.io Error', response)
					this.dispatch('router-error', response.data)
					switch (response.data.code) {
						case 10009:
							// store.state.event.eventTarget.dispatchEvent(
							// 	new Event('initEncryption')
							// )
							this.sdk.encryption.clear().then(async () => {
								if (this.client?.manager?.opts.query) {
									const query = await this.getQuery()
									if (typeof query === 'string') {
										return query
									}
									this.client.manager.opts.query = query
								}
							})

							break
						case 10004:
							// store.state.event.eventTarget.dispatchEvent(new Event('initLogin'))
							break

						default:
							break
					}
				},
			})
			.router({
				eventName: this.eventName.v1.routeEventName.otherDeviceOnline,
				func: (response) => {
					console.log('otherDeviceOnline', response)
				},
			})
			.router({
				eventName: this.eventName.v1.routeEventName.otherDeviceOffline,
				func: (response) => {
					console.log('otherDeviceOffline', response)
				},
			})
			.router({
				eventName: this.eventName.v1.routeEventName.forceOffline,
				func: (response) => {
					console.log('forceOffline', response)
				},
			})

		this.client
			?.routerGroup(this.namespace[apiVersion].chat)
			.router({
				eventName: this.eventName[apiVersion].routeEventName['receiveMessage'],
				func: (response) => {
					this.dispatch(
						'router-receiveMessage',
						R<protoRoot.message.SendMessage.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.SendMessage.Response
						)
					)
				},
			})
			.router({
				eventName: this.eventName[apiVersion].routeEventName['readAllMessages'],
				func: (response) => {
					this.dispatch(
						'router-readAllMessages',
						R<protoRoot.message.ReadAllMessages.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.ReadAllMessages.Response
						)
					)
				},
			})
			.router({
				eventName:
					this.eventName[apiVersion].routeEventName['startCallingMessage'],
				func: (response) => {
					this.dispatch(
						'router-startCallingMessage',
						R<protoRoot.message.StartCalling.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.StartCalling.Response
						)
					)
				},
			})
			.router({
				eventName: this.eventName[apiVersion].routeEventName['hangupMessage'],
				func: (response) => {
					this.dispatch(
						'router-hangupMessage',
						R<protoRoot.message.Hangup.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.Hangup.Response
						)
					)
				},
			})
			.router({
				eventName: this.eventName[apiVersion].routeEventName['deleteMessages'],
				func: (response) => {
					this.dispatch(
						'router-deleteMessages',
						R<protoRoot.message.DeleteMessages.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.DeleteMessages.Response
						)
					)
				},
			})
			.router({
				eventName:
					this.eventName[apiVersion].routeEventName['receiveEditMessage'],
				func: (response) => {
					this.dispatch(
						'router-receiveEditMessage',
						R<protoRoot.message.EditMessage.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.EditMessage.Response
						)
					)
				},
			})
			.router({
				eventName:
					this.eventName[apiVersion].routeEventName['updateContactStatus'],
				func: (response) => {
					this.dispatch(
						'router-updateContactStatus',
						R<protoRoot.contact.UpdateContactStatus.IResponse>(
							this.useResponse(response) as any,
							protoRoot.contact.UpdateContactStatus.Response
						)
					)
				},
			})
			.router({
				eventName:
					this.eventName[apiVersion].routeEventName['updateGroupStatus'],
				func: (response) => {
					this.dispatch(
						'router-updateGroupStatus',
						R<protoRoot.group.UpdateGroupStatus.IResponse>(
							this.useResponse(response) as any,
							protoRoot.group.UpdateGroupStatus.Response
						)
					)
				},
			})
			.router({
				eventName:
					this.eventName[apiVersion].routeEventName['callReconnectMessages'],
				func: (response) => {
					this.dispatch(
						'router-callReconnectMessages',
						R<protoRoot.message.CallReconnect.IResponse>(
							this.useResponse(response) as any,
							protoRoot.message.CallReconnect.Response
						)
					)
				},
			})
			.router({
				eventName: this.eventName[apiVersion].routeEventName['updateGroupInfo'],
				func: (response) => {
					this.dispatch(
						'router-updateGroupInfo',
						R<protoRoot.group.UpdateGroupInfo.IResponse>(
							this.useResponse(response) as any,
							protoRoot.group.UpdateGroupInfo.Response
						)
					)
				},
			})
	}
}
