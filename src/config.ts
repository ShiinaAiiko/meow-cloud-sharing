import { baselog } from 'nyanyajs-log'
import * as Ion from 'ion-sdk-js/lib/connector'
// import { config } from 'process'
baselog.Info('Env:', process.env.NODE_ENV)

let baseUrl = ''
let version = ''
let sakisso = {
	appId: '',
	clientUrl: '',
	serverUrl: '',
}
let meowLinkApiUrl = ''
let serverApi = {
	apiUrl: '',
}
let nsocketio = {
	url: '',
}
let staticPathDomain = ''
let networkTestUrl = ''
let github = ''

let sakiui = {
	url: '',
	jsurl: '',
	esmjsurl: '',
}
let meowApps = {
	jsurl: '',
	esmjsurl: '',
}
let meowWhisperCore = {
	appId: '',
	appKey: '',
	url: '',
	rsa: {
		publicKeyStaticUrl: '',
	},
	nsocketio: {
		url: '',
	},
	webrtc: {
		url: '',
	},
}

let origin = window.location.origin

if (origin === 'file://') {
	origin = window.location.href.split('build/')[0] + 'build'
}

// console.log('origin', origin)

interface Config {
	baseUrl: typeof baseUrl
	version: typeof version
	sakisso: typeof sakisso
	meowLinkApiUrl: typeof meowLinkApiUrl
	// serverApi: typeof serverApi
	// nsocketio: typeof nsocketio
	staticPathDomain: typeof staticPathDomain
	networkTestUrl: typeof networkTestUrl
	sakiui: typeof sakiui
	meowApps: typeof meowApps
	meowWhisperCore: typeof meowWhisperCore
	github: typeof github
}
// import configJson from './config.test.json'
try {
	let configJson: Config = require('./config.temp.json')
	let pkg = require('../package.json')
	// console.log('configJson', configJson)
	if (configJson) {
		version = pkg.version
		baseUrl = configJson.baseUrl
		sakisso = configJson.sakisso
		meowLinkApiUrl = configJson.meowLinkApiUrl

		// serverApi = configJson.serverApi
		// nsocketio = configJson.nsocketio
		staticPathDomain = configJson.staticPathDomain
		networkTestUrl = configJson.networkTestUrl || configJson.meowWhisperCore.url
		sakiui = configJson.sakiui
		meowApps = configJson.meowApps
		meowWhisperCore = configJson.meowWhisperCore
		github = configJson.github
	}
} catch (error) {
	console.log('未添加配置文件.')
	console.log(error)
}
export {
	baseUrl,
	version,
	// serverApi,
	sakiui,
	staticPathDomain,
	networkTestUrl,
	sakisso,
	// nsocketio,
	origin,
	meowLinkApiUrl,
	meowApps,
	meowWhisperCore,
	github,
}
