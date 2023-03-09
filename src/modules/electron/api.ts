import qs from 'qs'


const query = qs.parse(
	window.location.search.substring(1, window.location.search.length) ||
		window.location.hash?.split('?')?.[1]
)
const { ipcRenderer } = window?.require?.('electron') || {}
export const PARAMS = (eventName: string, data?: any): any => {
	const route: any = query.route?.toString() || ''
	console.log('electronapi', route, query)
	return {
		eventName,
		route: route,
		data: data,
		requestTime: Math.floor(new Date().getTime() / 1000),
	}
}
export const api = {
	openDevTools() {
		ipcRenderer?.send?.('openDevTools', PARAMS('openDevTools'))
	},
	getMode() {
		ipcRenderer?.send?.('getMode', PARAMS('getMode'))
	},
	showNotification(params: {
		title: string
		content: string
		timeout: number
	}) {
		ipcRenderer?.send?.(
			'showNotification',
			PARAMS('showNotification', {
				title: params.title,
				content: params.content,
				timeout: params.timeout,
			})
		)
	},
	setMode(mode: 'system' | 'dark' | 'light') {
		ipcRenderer?.send?.(
			'setMode',
			PARAMS('getMode', {
				mode,
			})
		)
	},
	openMainProgram() {
		ipcRenderer?.send?.('openMainProgram', PARAMS('openMainProgram', {}))
	},
	showWindow() {
		ipcRenderer?.send?.('showWindow', PARAMS('showWindow', {}))
	},
	hideWindow() {
		ipcRenderer?.send?.('hideWindow', PARAMS('hideWindow', {}))
	},
	updateData() {
		ipcRenderer?.send?.('updateData', PARAMS('updateData', {}))
	},
	updateProfile() {
		ipcRenderer?.send?.('updateProfile', PARAMS('updateProfile', {}))
	},
	updateSetting({ type }: { type: string }) {
		ipcRenderer?.send?.(
			'updateSetting',
			PARAMS('updateSetting', {
				type,
			})
		)
	},
	saveAs(
		fileName: string,
		file: string,
		options: {
			extensions: string[]
		}
	) {
		ipcRenderer?.send?.(
			'saveAs',
			PARAMS('saveAs', {
				fileName,
				file,
				options,
			})
		)
	},
	openFolder(lastFolderPath: string, type: 'BackupPath') {
		ipcRenderer?.send?.(
			'openFolder',
			PARAMS('openFolder', {
				lastFolderPath,
				type,
			})
		)
	},
	backup(backupNow: boolean = false) {
		ipcRenderer?.send?.(
			'backup',
			PARAMS('backup', {
				backupNow,
			})
		)
	},
}

export default {
	api,
}
