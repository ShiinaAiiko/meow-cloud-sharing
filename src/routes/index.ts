import ChatPage from '../pages/Index'
import ContactsPage from '../pages/Contacts'
import NotificationsPage from '../pages/Notifications'
import SettingsPage from '../pages/Settings'
import InvitePage from '../pages/Invite'
// import Child from '../pages/child'
// import Login from '../pages/login'
// import Community from '../pages/community'
// import Search from '../pages/search'

import ChatLayout from '../layouts/Chat'
import BaseLayout from '../layouts/Base'
import { Routers } from '../modules/renderRoutes'

// 最多只能四级嵌套路由
// 一般父级为模板路由
const routes: Routers[] = [
	// {
	// 	path: '/login',
	// 	title: '登录',
	// 	exact: true,
	// 	layout: SubframeLayout,
	// 	component: UserLoginPage,
	// },
	{
		path: '/index',
		title: '首页',
		exact: true,
		layout: ChatLayout,
		component: ChatPage,
		redirect: '/',
	},
	{
		path: '/chat',
		title: '首页',
		exact: true,
		layout: ChatLayout,
		component: ChatPage,
		redirect: '/',
	},
	{
		path: '/',
		title: '聊天',
		exact: true,
		layout: ChatLayout,
		component: ChatPage,
		// redirect: '/index',
	},
	// {
	// 	path: '/chat',
	// 	title: '聊天',
	// 	exact: true,
	// 	layout: ChatLayout,
	// 	component: ChatPage,
	// 	// redirect: '/index',
	// },
	{
		path: '/contacts',
		title: '联系人',
		exact: true,
		layout: ChatLayout,
		component: ContactsPage,
		// redirect: '/index',
	},
	{
		path: '/notifications',
		title: '通知',
		exact: true,
		layout: ChatLayout,
		component: NotificationsPage,
		// redirect: '/index',
	},
	{
		path: '/settings',
		title: '设置',
		exact: true,
		layout: ChatLayout,
		component: SettingsPage,
		// redirect: '/index',
	},
	{
		path: '/invite/:id',
		title: '通知',
		exact: true,
		layout: BaseLayout,
		component: InvitePage,
		// redirect: '/index',
	},
]

export default routes
