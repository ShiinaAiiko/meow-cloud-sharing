import ChatPage from '../pages/Index'
import RecentPage from '../pages/Recent'
import RecyclebinPage from '../pages/Recyclebin'
import SettingsPage from '../pages/Settings'
import InvitePage from '../pages/Index'
import DownloadPage from '../pages/Download'
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
		path: '/recent',
		title: '最近',
		exact: true,
		layout: ChatLayout,
		component: RecentPage,
		// redirect: '/index',
	},
	{
		path: '/dl/:id',
		title: '下载',
		exact: true,
		layout: ChatLayout,
		component: DownloadPage,
		// redirect: '/index',
	},
	{
		path: '/recyclebin',
		title: '回收站',
		exact: true,
		layout: ChatLayout,
		component: RecyclebinPage,
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
