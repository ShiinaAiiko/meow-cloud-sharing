import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import {
	WebStorage,
	SakiSSOClient,
	Encryption,
	dhkea,
	RSA,
	AES,
	DiffieHellman,
} from '@nyanyajs/utils'
import { MeowWhisperCoreSDK } from '../modules/MeowWhisperCoreSDK'
import { meowWhisperCore, sakisso } from '../config'
import { userAgent } from './user'
import { storage } from './storage'

export const modeName = 'encryption'

const state: {
	status: 'getting' | 'success' | 'fail'
} = {
	status: 'fail',
}
export const encryptionSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setStatus: (state, params: ActionParams<typeof state['status']>) => {
			state.status = params.payload
		},
	},
})

export const setStatus = (s: typeof state['status']) => {
	store.dispatch(encryptionSlice.actions.setStatus(s))
}

export const encryptionMethods = {
	Init: createAsyncThunk<
		void,
		void,
		{
			state: RootState
		}
	>(modeName + '/Init', async (_, thunkAPI) => {
		const { encryption, config } = thunkAPI.getState()
		const e = encryption
		if (e.status === 'getting') return

		setStatus('getting')

		console.log('正在进行加密通讯')
		console.time('加密通讯成功！')

		let getKey = await thunkAPI
			.dispatch(encryptionMethods.GetAesKey({}))
			.unwrap()

		console.log('getKey', getKey)

		if (getKey.aesKey && getKey.userKey) {
			console.timeEnd('加密通讯成功！')
			setStatus('success')
			return
		}

		// 1、获取或生成本地RSA证书
		let localRsaKey = await storage.global.getAndSet(
			'localRsaKey',
			async (v) => {
				if (!v?.privateKey || !v?.sign || !v?.sign) {
					const rk = await RSA.getRsaKey()
					return {
						privateKey: rk.privateKey,
						publicKey: rk.publicKey,
						sign: RSA.getSign(rk.privateKey, rk.publicKey),
					}
				}
				return v
			}
		)
		console.log('localRsaKey', localRsaKey)
		let serverRSAPBK = config.encryptionConfiguration.publicRsa.publicKey
		const enURILocalRSAPBK = encodeURIComponent(localRsaKey.publicKey)

		// 为公钥加签
		const rsaSign = localRsaKey.sign
		// console.log('本地RSA', rsaSign, rsaKey.publicKey)
		// console.log(RSA.verifySign(rsaKey.publicKey, rsaKey.publicKey, rsaSign))
		// console.log('远端RSA publicKey', api.RSA.publicKey)

		// 2、 生成DH秘钥
		const dhA = new dhkea.DHKea({
			bitLen: 1024,
		})

		// console.log('dhA.publicKey.toString()', dhA.publicKey.toString())

		// 2、利用DHPublicKey生成个临时AES秘钥
		const tempAesKey = md5(dhA.publicKey.toString())
		// console.log('tempAesKey', tempAesKey)

		// 用服务端公钥将临时AES秘钥加密
		const tempAesKeyEnStr = RSA.encrypt(serverRSAPBK, tempAesKey)
		// console.log('tempAesKeyEnStr', tempAesKeyEnStr)

		// 用临时AES秘钥为公钥签名加密
		const rsaSignEnStr = AES.encrypt(rsaSign, tempAesKey)
		// console.log('rsaSignEnStr', rsaSignEnStr.value)
		// console.log('rsaSign', rsaSign)

		// console.log('clientRSAPublicKey', clientRSAPublicKey)
		// console.log(decodeURIComponent(clientRSAPublicKey))
		// 用临时AES秘钥为Local RSA PublicKey加密
		const rsaPublicKeyEnStr = AES.encrypt(enURILocalRSAPBK, tempAesKey)
		// console.log('rsaPublicKeyEnStr', rsaPublicKeyEnStr.value)

		// 用临时AES秘钥为DH Public Key加密
		const dhPublicKeyEnStr = AES.encrypt(dhA.publicKey.toString(), tempAesKey)
		// console.log('dhPublicKeyEnStr', dhPublicKeyEnStr.value)

		// console.log("prime",dhA)
		// const dhB = new dhkea.DHKea({
		// 	bitLen: 1024,
		// })
		// const signA = dhA.getSharedKey(dhB.publicKey)
		// const signB = dhB.getSharedKey(dhA.publicKey)
		// console.log(signA)
		// console.log(signB)
		// console.log(signA === signB)
		const {
			GetRsaPublicKeyType,
			GetAesKeyType,
			PostClientRsaPublicKeAndGenerateDhKeyType,
		} = protoRoot.encryption

		// const sendPublicKey = await v1.SendClientRSAPublicKeyAndDhPublicKey({
		// 	tempAESKey: tempAesKeyEnStr,
		// 	RSASign: rsaSignEnStr.value,
		// 	RSAPublicKey: rsaPublicKeyEnStr.value,
		// 	DHPublicKey: dhPublicKeyEnStr.value,
		// })
		// // console.log('sendPublicKey', sendPublicKey)
		// if (sendPublicKey.code === 200) {
		// 	// const rsaSignDeStr = AES.decrypt(
		// 	// 	sendPublicKey.data.RSASign || '',
		// 	// 	tempAesKey,
		// 	// 	''
		// 	// )
		// 	// // console.log('sendPublicKey.data.RSASign', sendPublicKey.data.RSASign)
		// 	// // console.log('pi.RSA.publicKey', api, rsaSignDeStr)
		// 	// // console.log(RSA.getSign(api.RSA.privateKey, 'a'))
		// 	// // console.log(
		// 	// // 	RSA.verifySign(
		// 	// // 		RSA.getSign(api.RSA.privateKey, "a"),
		// 	// // 		api.RSA.publicKey,
		// 	// // 		rsaSignDeStr
		// 	// // 	)
		// 	// // )

		// 	// if (RSA.verifySign(rsaKey.publicKey, api.RSA.publicKey, rsaSignDeStr)) {
		// 	// 	const dhPublicKeyDeStr = AES.decrypt(
		// 	// 		sendPublicKey.data.DHPublicKey || '',
		// 	// 		tempAesKey,
		// 	// 		''
		// 	// 	)
		// 	// 	const userAESKeyDeStr = AES.decrypt(
		// 	// 		sendPublicKey.data.userAESKey || '',
		// 	// 		tempAesKey,
		// 	// 		''
		// 	// 	)
		// 	// 	if (!userAESKeyDeStr || !dhPublicKeyDeStr) {
		// 	// 		console.log('加密通讯签名失败')
		// 	// 		store.commit('encryption/setIsCertified', 'fail')
		// 	// 		return
		// 	// 	}
		// 	// 	const key = dhA.getSharedKey(BigInt(dhPublicKeyDeStr))
		// 	// 	// console.log(key.toString())
		// 	// 	console.log(md5(key.toString()).toUpperCase(), userAESKeyDeStr)

		// 	// 	await store.state.storage.ws.set(
		// 	// 		'ec-aesKey',
		// 	// 		md5(key.toString()).toUpperCase()
		// 	// 	)
		// 	// 	await store.state.storage.ws.set('ec-userKey', userAESKeyDeStr)

		// 	// 	console.timeEnd('加密通讯成功！')
		// 	// 	store.commit('encryption/setIsCertified', 'success')
		// 	// 	// store.state.storage.ws.set('ec-userKey')
		// 	// } else {
		// 	// 	console.log('加密通讯签名失败')
		// 	// 	store.commit('encryption/setIsCertified', 'fail')
		// 	// }
		// } else {
		//   console.log('加密通讯签名失败')
		//   setStatus("fail")
		// }
	}),

	GetAesKey: createAsyncThunk<
		{
			aesKey: string
			userKey: string
		},
		{
			type?: 'Init'
		},
		{
			state: RootState
		}
	>(modeName + '/GetAesKey', async ({ type }, thunkAPI) => {
		console.log('检查是否有效')
		const { encryption } = thunkAPI.getState()
		const e = encryption
		const aesKey = await storage.global.get('ec-aesKey')
		const userKey = await storage.global.get('ec-userKey')
		const deadline = await storage.global.get('ec-deadline')
		if (
			!aesKey ||
			!userKey ||
			deadline <= Math.floor(new Date().getTime() / 1000)
		) {
			if (type === 'Init') {
				await thunkAPI.dispatch(encryptionMethods.Init())
				if (e.status === 'success') {
					const aesKey = await storage.global.get('ec-aesKey')
					const userKey = await storage.global.get('ec-userKey')
					return {
						aesKey,
						userKey,
					}
				}
			}
			return {
				aesKey: '',
				userKey: '',
			}
		}
		return {
			aesKey,
			userKey,
		}
	}),
}
