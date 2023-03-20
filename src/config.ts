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
let server = {
	url: '',
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
	github: typeof github
	server: typeof server
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

		staticPathDomain = configJson.staticPathDomain
		networkTestUrl = configJson.networkTestUrl
		sakiui = configJson.sakiui
		meowApps = configJson.meowApps
		github = configJson.github
		server = configJson.server
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
	github,
	server,
}
