import MyFilesPage from '../pages/Index'
import RecentPage from '../pages/Recent'
import RecyclebinPage from '../pages/Recyclebin'
import DownloadPage from '../pages/Download'

import ChatLayout from '../layouts/Chat'
import BaseLayout from '../layouts/Base'
import { Routers } from '../modules/renderRoutes'

// 最多只能四级嵌套路由
// 一般父级为模板路由
const routes: Routers[] = [
	{
		path: '/index',
		title: '首页',
		exact: true,
		layout: ChatLayout,
		component: MyFilesPage,
		redirect: '/',
	},
	{
		path: '/',
		title: '首页',
		exact: true,
		layout: ChatLayout,
		component: MyFilesPage,
		// redirect: '/index',
	},
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
]

export default routes
