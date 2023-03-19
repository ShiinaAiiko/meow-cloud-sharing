import React, { useEffect, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
} from '../store'
import './Navigator.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert } from '@saki-ui/core'
import { Debounce } from '@nyanyajs/utils'
import { sakisso } from '../config'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { storage } from '../store/storage'
import { Query } from '../modules/methods'

const NavigatorComponent = ({
	aside,
	onClose,
}: {
	aside: boolean
	onClose?: () => void
}) => {
	const [debounce] = useState(new Debounce())
	const { t, i18n } = useTranslation()
	const appStatus = useSelector((state: RootState) => state.config.status)
	const config = useSelector((state: RootState) => state.config)
	const sso = useSelector((state: RootState) => state.sso)

	const [noteContextMenuEl, setNoteContextMenuEl] = useState<any>()
	const [openDropDownMenu, setOpenDropDownMenu] = useState(false)
	const [openAddDropDownMenu, setOpenAddDropDownMenu] = useState(false)
	const [openSettingDropDownMenu, setOpenSettingDropDownMenu] = useState(false)
	const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)

	const [expand, setExpand] = useState(false)

	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	const dispatch = useDispatch<AppDispatch>()
	useEffect(() => {
		debounce.increase(async () => {
			setExpand((await storage.global.get('expand')) || false)
		}, 0)
	}, [])

	// setTimeout(() => {
	// 	store.dispatch(
	// 		configSlice.actions.setStatus({
	// 			type: 'loginModalStatus',
	// 			v: true,
	// 		})
	// 	)
	// }, 1000)
	return (
		<div className='navigator-component'>
			<saki-chat-layout-side-navigator
				ref={bindEvent({
					expandStatus: async (e) => {
						if (aside) {
							onClose?.()
						} else {
							setExpand(e.detail)
							await storage.global.set('expand', e.detail)
						}
					},
					change: async (e) => {
						console.log(e)
						onClose?.()
						if (e.detail.href === '/settings') {
							dispatch(configSlice.actions.setSettingVisible(true))
							return
						}
						location.pathname !== e.detail.href &&
							navigate?.(Query(e.detail.href, {}, searchParams))
					},
				})}
				forever-expand={aside}
				expand={aside ? true : expand}
			>
				<div slot='top'>
					<saki-chat-layout-side-navigator-menu-item
						margin='0 0 12px 0'
						active={location.pathname === '/'}
						icon-type={'FolderFill'}
						name={t('pageTitle', {
							ns: 'myFilesPage',
						}).toUpperCase()}
						count={config.count.messages}
						href='/'
					></saki-chat-layout-side-navigator-menu-item>
					<saki-chat-layout-side-navigator-menu-item
						margin='0 0 12px 0'
						active={location.pathname === '/recent'}
						icon-type={'TimeFill'}
						name={t('pageTitle', {
							ns: 'recentPage',
						}).toUpperCase()}
						count={config.count.contacts}
						href='/recent'
					></saki-chat-layout-side-navigator-menu-item>
					<saki-chat-layout-side-navigator-menu-item
						margin='0 0 12px 0'
						active={location.pathname === '/recyclebin'}
						// icon-type={'TrashFill'}
						name={t('pageTitle', {
							ns: 'recyclebinPage',
						}).toUpperCase()}
						count={config.count.notifications}
						href='/recyclebin'
					>
						<div slot='icon'>
							<saki-icon
								color={
									location.pathname === '/recyclebin'
										? 'var(--saki-default-color)'
										: '#999'
								}
								width={'20px'}
								height={'20px'}
								type={'TrashFill'}
							></saki-icon>
						</div>
					</saki-chat-layout-side-navigator-menu-item>
				</div>
				<div slot='bottom'>
					<saki-chat-layout-side-navigator-menu-item
						margin='12px 0 0 0'
						active={false}
						icon-type={'Settings'}
						icon-size='20px'
						name={t('title', {
							ns: 'settings',
						}).toUpperCase()}
						href='/settings'
					></saki-chat-layout-side-navigator-menu-item>
				</div>
			</saki-chat-layout-side-navigator>
		</div>
	)
}

export default NavigatorComponent
