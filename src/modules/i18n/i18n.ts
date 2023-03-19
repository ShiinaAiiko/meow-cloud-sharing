import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
	'zh-CN': {
		common: {
			appTitle: '喵云共享',
			language: '多语言',
			openDevtools: '开发者工具',
			quit: '退出',

			quitModalTitle: '退出提示',
			quitModalContent: '确定想退出主程序?',

			logout: '退出账号',
			logoutContent: '确定想退出账号吗',
			logoutSuccessfully: '成功退出账号',
			login: '登录',
			cancel: '取消',
			next: '下一步',
			add: '添加',
			create: '创建',
			rename: '重命名',
			copy: '复制',
			copySuccessfully: '复制成功！',

			saveAs: '另存为',
			newTab: '在新标签页中打开文件',
			moveTo: '移动到',
			copyTo: '复制到',
			download: '下载',
			share: '分享',
			restore: '恢复',
			delete: '删除',
			connecting: '连接',

			turnOff: '关掉',
			turnOn: '打开',
			moveToTrash: '移至垃圾箱',
			viewDetail: '查看详情',

			new: '创建',
			folder: '文件夹',
			upload: '上传',
			file: '文件',
		},
		myFilesPage: {
			pageTitle: '我的文件',
			newFolder: '新建文件夹',
			typeFolderName: '输入你的文件夹名称',
			name: '名称',
			fileName: '文件名',
			folderName: '文件夹名称',
			shortId: '短ID',
			type: '类型',
			width: '宽度',
			height: '身高',
			hash: '哈希值',
			lastModified: '最后修改时间',
			deletedTime: '删除时间',
			fileSize: '文件大小',
			downloads: '下载',
			downloadPermission: '下载权限',
			permissions: '权限',
			detail: '细节',
			unshare: '取消分享',
			allowSharing: '允许共享',
			statistics: '统计',
			password: '密码',
			deletePassword: '删除',
			passwordNotSet: '密码未设置',
			changePassword: '更改密码',
			setPassword: '设置密码',
			randomPassword: '随机密码',
			passwordCannotBeEmpty: '密码不能为空',
			passwordRule: '密码需要6位数字',
			incorrectPasswordReEnter: '密码错误,请重新输入',
			emptyRecycleBin: '清空回收站',
			restoreAllItems: '恢复所有项目',
			selectedItems: '已选择 {{count}} 项',
			copyHere: '复制这里',
			moveHere: '移动到这里',
			shareLink: '分享链接',
			copyShareLink: '复制分享链接',
			generalMeowLink: '生成喵喵链接',
			typeFileName: '输入你的文件名',
			lengthLimited1to50: '文本长度限制为 1 到 50 个字符',
		},
		recentPage: {
			pageTitle: '最近',
		},
		recyclebinPage: {
			pageTitle: '回收站',
		},
		downloadPage: {
			pageTitle: '下载',
			sharedAnEncryptedContent: '{{name}} 共享了一个加密的 {{type}}',
			getContent: '获取{{type}}',
			share404: '分享目前不存在，请检查链接',
		},
		modal: {},
		settings: {
			account: '帐号',
			title: '设置',
			general: '常规',
			notification: '通知',
			language: '多语言',
			appearance: '外表',

			uid: 'UID',
			username: '用户名',
			nickname: '昵称',
			bio: '介绍',
			link: '链接',

			startup: '启动',
			automaticallyStart: '自动启动喵言私语',

			light: '浅色模式',
			dark: '暗黑模式',
			system: '随系统变化',

			about: '关于',
		},
		languages: {
			'en-US': '英文',
			'zh-CN': '中文(简体)',
			'zh-TW': '中文(繁体)',
			system: '使用设备语言',
		},
	},
	'zh-TW': {
		common: {
			appTitle: '喵雲共享',
			language: '多語言',
			openDevtools: '開發者工具',
			quit: '退出',

			quitModalTitle: '退出提示',
			quitModalContent: '確定想退出主程序?',

			logout: '退出賬號',
			logoutContent: '確定想退出賬號嗎',
			logoutSuccessfully: '成功退出賬號',
			login: '登錄',
			cancel: '取消',
			next: '下一步',
			add: '添加',
			create: '創建',
			rename: '重命名',
			copy: '複製',
			copySuccessfully: '複製成功！ ',

			saveAs: '另存為',
			newTab: '在新標籤頁中打開文件',
			moveTo: '移動到',
			copyTo: '複製到',
			download: '下載',
			share: '分享',
			restore: '恢復',
			delete: '刪除',
			connecting: '連接',

			turnOff: '關掉',
			turnOn: '打開',
			moveToTrash: '移至垃圾箱',
			viewDetail: '查看詳情',

			new: '創建',
			folder: '文件夾',
			upload: '上傳',
			file: '文件',
		},
		myFilesPage: {
			pageTitle: '我的文件',
			newFolder: '新建文件夾',
			typeFolderName: '輸入你的文件夾名稱',
			name: '名稱',
			fileName: '文件名',
			folderName: '文件夾名稱',
			shortId: '短ID',
			type: '類型',
			width: '寬度',
			height: '身高',
			hash: '哈希值',
			lastModified: '最後修改時間',
			deletedTime: '刪除時間',
			fileSize: '文件大小',
			downloads: '下載',
			downloadPermission: '下載權限',
			permissions: '權限',
			detail: '細節',
			unshare: '取消分享',
			allowSharing: '允許共享',
			statistics: '統計',
			password: '密碼',
			deletePassword: '刪除',
			passwordNotSet: '密碼未設置',
			changePassword: '更改密碼',
			setPassword: '設置密碼',
			randomPassword: '隨機密碼',
			passwordCannotBeEmpty: '密碼不能為空',
			passwordRule: '密碼需要6位數字',
			incorrectPasswordReEnter: '密碼錯誤,請重新輸入',
			emptyRecycleBin: '清空回收站',
			restoreAllItems: '恢復所有項目',
			selectedItems: '已選擇 {{count}} 項',
			copyHere: '複製這裡',
			moveHere: '移動到這裡',
			shareLink: '分享鏈接',
			copyShareLink: '複製分享鏈接',
			generalMeowLink: '生成喵喵鏈接',
			typeFileName: '輸入你的文件名',
			lengthLimited1to50: '文本長度限制為 1 到 50 個字符',
		},
		recentPage: {
			pageTitle: '最近',
		},
		recyclebinPage: {
			pageTitle: '回收站',
		},
		downloadPage: {
			pageTitle: '下載',
			sharedAnEncryptedContent: '{{name}} 共享了一個加密的 {{type}}',
			getContent: '獲取{{type}}',
			share404: '分享目前不存在，請檢查鏈接',
		},
		modal: {},
		settings: {
			account: '帳號',
			title: '設置',
			general: '常規',
			notification: '通知',
			language: '多語言',
			appearance: '外表',

			uid: 'UID',
			username: '用戶名',
			nickname: '暱稱',
			bio: '介紹',
			link: '鏈接',

			startup: '啟動',
			automaticallyStart: '自動啟動喵言私語',

			light: '淺色模式',
			dark: '暗黑模式',
			system: '隨系統變化',

			about: '關於',
		},
		languages: {
			'en-US': '英文',
			'zh-CN': '中文(簡體)',
			'zh-TW': '中文(繁體)',
			system: '使用設備語言',
		},
	},
	'en-US': {
		common: {
			appTitle: 'Meow Cloud Sharing',
			language: 'Language',
			openDevtools: 'Open devtools',
			quit: 'Quit',

			quitModalTitle: 'Quit prompt',
			quitModalContent: 'Are you sure you want to exit the main program?',

			logout: 'Log out',
			logoutContent: 'Are you sure you want to log out?',
			logoutSuccessfully: 'Successfully logged out of the account',
			login: 'Log in',
			cancel: 'Cancel',
			next: 'Next',
			add: 'Add',
			create: 'Create',
			rename: 'Rename',
			copy: 'Copy',
			copySuccessfully: 'Copy successfully.',

			saveAs: 'Save as',
			newTab: 'Open file in new tab',
			moveTo: 'Move to',
			copyTo: 'Copy to',
			download: 'Download',
			share: 'Share',
			restore: 'Restore',
			delete: 'Delete',
			connecting: 'connecting',

			turnOff: 'Turn off',
			turnOn: 'Turn on',
			moveToTrash: 'Move to Trash',
			viewDetail: 'View Detail',

			new: 'New',
			folder: 'Folder',
			upload: 'Upload',
			file: 'File',
		},

		myFilesPage: {
			pageTitle: 'My Files',
			newFolder: 'New Folder',
			typeFolderName: 'Type in your folder name',
			name: 'Name',
			fileName: 'File Name',
			folderName: 'Folder Name',
			shortId: 'Short ID',
			type: 'Type',
			width: 'Width',
			height: 'Height',
			hash: 'Hash value',
			lastModified: 'Last Modified',
			deletedTime: 'Deleted Time',
			fileSize: 'File Size',
			downloads: 'Downloads',
			downloadPermission: 'Download permission',
			permissions: 'Permissions',
			detail: 'Detail',
			unshare: 'Unshare',
			allowSharing: 'Allow Sharing',
			statistics: 'Statistics',
			password: 'Password',
			deletePassword: 'Delete',
			passwordNotSet: 'Password not set',
			changePassword: 'Change Password',
			setPassword: 'Set Password',
			randomPassword: 'Random Password',
			passwordCannotBeEmpty: 'Password cannot be empty',
			passwordRule: 'Password requires 6 digits',
			incorrectPasswordReEnter: 'Incorrect password, please re-enter',
			emptyRecycleBin: 'Empty Recycle Bin',
			restoreAllItems: 'Restore All Items',
			selectedItems: 'Selected {{count}} items',
			copyHere: 'Copy Here',
			moveHere: 'Move Here',
			shareLink: 'Share Link',
			copyShareLink: 'Copy Share Link',
			generalMeowLink: 'Generate Meow Link',
			typeFileName: 'Type in your file name',
			lengthLimited1to50: 'Text length is limited from 1 to 50 characters',
		},
		recentPage: {
			pageTitle: 'Recent',
		},
		recyclebinPage: {
			pageTitle: 'Recycle Bin',
		},
		downloadPage: {
			pageTitle: 'Download',
			sharedAnEncryptedContent: '{{name}} shared an encrypted {{type}}',
			getContent: 'Get {{type}}',
			share404: 'Share does not exist currently, please check the link',
		},

		modal: {},
		settings: {
			title: 'Settings',
			account: 'Account',
			general: 'General',
			notification: 'Notification',
			language: 'Language',
			appearance: 'Appearance',

			uid: 'UID',
			username: 'Username',
			nickname: 'Nickname',
			bio: 'Bio',
			link: 'Link',
			nothingIsWritten: 'Nothing is written',

			startup: 'Startup',
			automaticallyStart: 'Automatically start Meow Whisper',

			light: 'Light',
			dark: 'Dark',
			system: 'Use system setting',

			about: 'About ',
		},
		languages: {
			'en-US': 'English',
			'zh-CN': 'Chinese(Simplified)',
			'zh-TW': 'Chinese(Traditional)',
			system: 'Use device language',
		},
	},
}

i18n
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		ns: ['common'],
		defaultNS: 'common',
		fallbackLng: 'zh-CN',
		lng: 'zh-CN',
		// fallbackLng: 'en-US',
		// lng: 'en-US',

		keySeparator: false, // we do not use keys in form messages.welcome

		interpolation: {
			escapeValue: false, // react already safes from xss
		},
	})

export default i18n
