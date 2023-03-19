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
			delete: '删除',
			deleteThisCategory: '删除此类别？',
			deleteThisPage: '删除此页面？',
			deleteThisNote: '删除此笔记？',
			renameThisNote: '为此笔记重命名',

			notebookName: '笔记名称',
			notebookNameNil: '笔记名称不能为空',
			copySuccessfully: '复制成功到剪贴板',

			goToLogin: '请前往登陆帐号',

			profile: '个人资料',
			editProfile: '编辑个人资料',
			categories: '分类',
			pages: '页面',
			notes: '笔记',

			saveAs: '另存',
			download: '下载',
			connecting: '正在连接',

			turnOff: '关闭',
			turnOn: '开启',
			turnOffSync: '关闭同步',
			turnOnSync: '开启同步',
			turnedOnTip: '此笔记将同步到云端',
			turnedOffTip: '即将关闭此笔记的同步功能',

			importNotes: '导入笔记',
			noteAlreadyExistsOverwrite: '这个笔记已经存在，你要覆盖它吗？',

			// new
			sendMessage: '发送消息',
			share: '分享',
			nothingIsWritten: '什么都没写',
			disband: '解散',
			leave: '离开',
			join: '加入',
			search: '搜索',
			back: '返回',

			photo: '照片',
			video: '视频',
			file: '文件',

			pin: '收藏',
			addSticker: '添加到自定义表情',
			select: '选择',
			reply: '回复',
			forward: '转发',
			edit: '编辑',

			moveToTrash: '移入回收站',
		},
		myFilesPage: {
			pageTitle: '我的文件',
		},
		recentPage: {
			pageTitle: '最近',
		},
		recyclebinPage: {
			pageTitle: '回收站',
		},
		downloadPage: {
			pageTitle: '下载',
		},
		messagesPage: {
			pageTitle: '消息',
			loadingChatData: '加载聊天数据',
			introduction: '喵言私语，享受自由的乐趣',
			viewGroupInfo: '查看群组信息',
			viewProfile: '查看个人资料',
			clearHistory: '清除历史记录',
			hideConversation: '隐藏对话',
			closePage: '关闭此页面',

			writeMmessage: '输入消息',
			customStickers: '自定义表情',
			emoji: '表情',
			recentlyUsed: '最近使用',
		},
		contactsPage: {
			pageTitle: '联系人',
			groups: '群组',
			addContact: '添加联系人',
			joinGroup: '加入群组',
			newGroup: '创建新的群组',
			deleteContact: '删除联系人',
			disbandGroup: '解散群组',
			leaveGroup: '删除群组',
			addMembers: '添加成员',
			groupName: '群组名称',
		},
		modal: {
			// userinfo modal
			userInfo: '用户资料',
			info: '资料',
			uid: 'UID',
			bio: '介绍',
			settings: '设置',

			// groupinfo
			groupInfo: '群组资料',
			members: '成员',
			groupId: '群组ID',

			// add Contact
			findPeople: '寻找朋友',

			// join Group
		},
		call: {
			awaitingResponse: '等待响应...',
			hangingUp: '挂断中...',
			audio: '语音',
			video: '视频',
			screenShare: '屏幕共享',
		},
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

			call: '通话',
			callNotificationSound: '来电提示音',

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

			logout: '登出',
			logoutContent: '你確定要退出嗎？',
			logoutSuccessfully: '成功退出賬戶',
			login: '登錄',
			cancel: '取消',
			next: '下一步',
			add: '添加',
			create: '創建',
			rename: '改名',
			copy: '复制',
			delete: '刪除',
			deleteThisCategory: '刪除此類別？',
			deleteThisPage: '删除此頁面？',
			deleteThisNote: '删除此笔记？',
			renameThisNote: '为此笔记重命名',

			notebookName: '筆記名稱',
			notebookNameNil: '筆記名稱不能為空',
			copySuccessfully: '已成功複製到剪貼板',

			goToLogin: '請前往登陸帳號',

			profile: '個人資料',
			editProfile: '編輯個人資料',
			categories: '類別',
			pages: '頁面',
			notes: '筆記',

			saveAs: '另存',
			download: '下載',
			connecting: '正在連接',

			turnOff: '關閉',
			turnOn: '開啟',
			turnOffSync: '關閉同步',
			turnOnSync: '開啟同步',
			turnedOnTip: '此筆記將同步到雲端',
			turnedOffTip: '即將關閉此筆記的同步功能',

			importNotes: '導入筆記',
			noteAlreadyExistsOverwrite: '這個筆記已經存在，你要覆蓋它嗎？',

			//new
			sendMessage: '發送消息',
			share: '分享',
			nothingIsWritten: '什麼都沒寫',
			disband: '解散',
			leave: '離開',
			join: '加入',
			search: '搜索',
			back: '返回',

			photo: '照片',
			video: '視頻',
			file: '文件',

			pin: '收藏',
			addSticker: '添加到自定義表情',
			select: '選擇',
			reply: '回复',
			forward: '轉發',
			edit: '編輯',

			moveToTrash: '移入回收站',
		},
		myFilesPage: {
			pageTitle: '我的文件',
		},
		recentPage: {
			pageTitle: '最近',
		},
		recyclebinPage: {
			pageTitle: '回收站',
		},
		downloadPage: {
			pageTitle: '下載',
		},
		messagesPage: {
			pageTitle: '消息',
			loadingChatData: '加載聊天數據',
			introduction: '喵言私語，享受自由的樂趣',

			viewGroupInfo: '查看群組信息',
			viewProfile: '查看個人資料',
			clearHistory: '清除歷史記錄',
			hideConversation: '隱藏對話',
			closePage: '關閉此頁面',

			writeMmessage: '輸入消息',
			customStickers: '自定義表情',
			emoji: '表情',
			recentlyUsed: '最近使用',
		},
		contactsPage: {
			pageTitle: '聯繫人',
			groups: '群組',
			addContact: '添加聯繫人',
			joinGroup: '加入群組',
			newGroup: '建立新群组',
			deleteContact: '刪除聯繫人',
			disbandGroup: '解散群組',
			leaveGroup: '刪除群組',
			addMembers: '添加成員',
			groupName: '群組名稱',
		},
		modal: {
			// userinfo modal
			userInfo: '用戶資料',
			info: '資料',
			uid: 'UID',
			bio: '介紹',
			settings: '設置',

			// groupinfo
			groupInfo: '群組資料',
			members: '成員',
			groupId: '群組ID',

			// add Contact
			findPeople: '尋找朋友',

			// join Group
		},
		call: {
			awaitingResponse: '等待響應...',
			hangingUp: '掛斷中...',
			audio: '語音',
			video: '視頻',
			screenShare: '屏幕共享',
		},
		settings: {
			title: '設置',
			account: '帳戶',
			general: '一般',
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

			call: '通話',
			callNotificationSound: '來電提示音',

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
			delete: 'Delete',
			deleteThisCategory: 'Delete this category?',
			deleteThisPage: 'Delete this page?',
			deleteThisNote: 'Delete this note?',
			renameThisNote: 'Rename this note?',

			notebookName: 'Notebook name',
			notebookNameNil: 'Notebook name cannot be empty',
			copySuccessfully: 'Successfully copied to clipboard!',

			goToLogin: 'Please go to login account',

			profile: 'Profile',
			editProfile: 'Edit Profile',
			categories: 'CATEGORIES',
			pages: 'PAGES',
			notes: 'NOTES',

			saveAs: 'Save as',
			download: 'Download',
			connecting: 'connecting',

			turnOff: 'Turn off',
			turnOn: 'Turn on',
			turnOffSync: 'Turn off sync',
			turnOnSync: 'Turn on sync',
			turnedOnTip: 'This note will sync to the cloud.',
			turnedOffTip: 'Sync will be turned off for this note soon.',

			importNotes: 'Import notes',
			noteAlreadyExistsOverwrite:
				'This note already exists, do you want to overwrite it?',

			// new
			sendMessage: 'Send Message',
			share: 'Share',
			nothingIsWritten: 'Nothing is written',
			disband: 'Disband',
			leave: 'Leave',
			join: 'Join',
			search: 'Search',
			back: 'Back',

			photo: 'Photo',
			video: 'Video',
			file: 'File',

			pin: 'Pin',
			addSticker: 'Add to Custom Stickers',
			select: 'Select',
			reply: 'Reply',
			forward: 'Forward',
			edit: 'Edit',

			moveToTrash: 'Move to Trash',
		},

		myFilesPage: {
			pageTitle: 'My Files',
		},
		recentPage: {
			pageTitle: 'Recent',
		},
		recyclebinPage: {
			pageTitle: 'Recycle Bin',
		},
		downloadPage: {
			pageTitle: 'Download',
		},

		messagesPage: {
			pageTitle: 'Messages',
			loadingChatData: 'Loading chat data',
			introduction: 'Meow Whisper',
			viewGroupInfo: 'View group info',
			viewProfile: 'View profile',
			clearHistory: 'Clear history',
			hideConversation: 'Hide conversation',
			closePage: 'Close this page',

			writeMmessage: 'Write a message',
			customStickers: 'Custom Stickers',
			emoji: 'Emoji',
			recentlyUsed: 'Recently Used',
		},

		contactsPage: {
			pageTitle: 'Contacts',
			groups: 'Groups',
			addContact: 'Add Contact',
			joinGroup: 'Join Group',
			newGroup: 'New Group',
			deleteContact: 'Delete Contact',
			disbandGroup: 'Disband Group',
			leaveGroup: 'Leave Group',
			addMembers: 'Add Members',
			groupName: 'Group name',
		},
		modal: {
			// userinfo modal
			userInfo: 'User Info',
			info: 'Info',
			uid: 'UID',
			bio: 'Bio',
			settings: 'Settings',

			// groupinfo
			groupInfo: 'Group Info',
			members: 'Members',
			groupId: 'Group ID',

			// add Contact
			findPeople: 'Find people',

			// join Group
		},
		call: {
			awaitingResponse: 'Awaiting response...',
			hangingUp: 'Hanging up...',
			audio: 'Audio',
			video: 'Video',
			screenShare: 'Screen share',
		},

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

			startup: 'Startup',
			automaticallyStart: 'Automatically start Meow Whisper',

			light: 'Light',
			dark: 'Dark',
			system: 'Use system setting',

			call: 'Call',
			callNotificationSound: 'Call notification sound',

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
