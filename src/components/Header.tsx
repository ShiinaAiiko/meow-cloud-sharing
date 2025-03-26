import React, { useEffect, useState } from 'react'


import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
} from '../store'
import './Header.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar,bindEvent  } from '@saki-ui/core'
import { eventTarget } from '../store/config'

const HeaderComponent = () => {
	const { t, i18n } = useTranslation('index-header')
	const config = useSelector((state: RootState) => state.config)

	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const [noteContextMenuEl, setNoteContextMenuEl] = useState<any>()
	const [openDropDownMenu, setOpenDropDownMenu] = useState(false)
	const [openAddDropDownMenu, setOpenAddDropDownMenu] = useState(false)
	const [openSettingDropDownMenu, setOpenSettingDropDownMenu] = useState(false)
	const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)
	const [showBackIcon, setShowBackIcon] = useState(false)

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const history = useNavigate()

	useEffect(() => {
		// console.log(
		// 	'location',
		// 	location.pathname === '/m' || location.pathname === '/m/p'
		// )
		if (location.pathname === '/m' || location.pathname === '/m/p') {
			// dispatch(configSlice.actions.setHeaderCenter(false))
		} else {
			// dispatch(configSlice.actions.setHeaderCenter(true))
		}
		// if (location.pathname === '/') {
		// 	dispatch(configSlice.actions.setHeaderCenter(true))
		// }
		if (
			location.pathname === '/m/n' ||
			location.pathname === '/m/c' ||
			location.pathname === '/m/p'
		) {
			setShowBackIcon(true)
		} else {
			setShowBackIcon(false)
		}
	}, [location])

	return (
		<div className='header-component'>
			<div className='qv-h-left'>
				<saki-transition
					animation-duration={500}
					class-name='header-left'
					in={!showBackIcon}
				>
					<div className='logo text-elipsis'>
						{showBackIcon ? (
							''
						) : (
							<div
								className='logo-info'
								title={t('appTitle', {
									ns: 'common',
								})}
							>
								<img src={config.logo256} alt='' />
								<a href='/' className='copytext text-elipsis'>
									{t('appTitle', {
										ns: 'common',
									})}
								</a>
							</div>
						)}
					</div>
				</saki-transition>
			</div>

			<div className='qv-h-right'>
				<div
					style={{
						margin: '0 4px 0 4px',
					}}
				>
					<meow-apps-dropdown
						ref={bindEvent({
							openUrl: (e) => {
								switch (config.platform) {
									case 'Electron':
										const { shell } = window.require('electron')
										shell.openExternal(e.detail)
										break
									case 'Web':
										window.open(e.detail, '_blank')
										break

									default:
										break
								}
							},
						})}
						disable-open-web-page
						language={i18n.language}
					/>
				</div>

				<saki-dropdown
					// style={{
					// 	display: user.isLogin ? 'block' : 'none',
					// }}
					visible={openUserDropDownMenu}
					floating-direction='Left'
					ref={bindEvent({
						close: (e) => {
							setOpenUserDropDownMenu(false)
						},
					})}
				>
					<saki-button
						ref={bindEvent({
							tap: () => {
								setOpenUserDropDownMenu(true)
							},
						})}
						type='CircleIconGrayHover'
						margin='0 0 0 6px'
					>
						<saki-avatar
							className='qv-h-r-u-avatar'
							width='30px'
							height='30px'
							border-radius='50%'
              default-icon={'UserLine'}
							nickname={user.userInfo?.nickname?.toUpperCase()}
							src={user.userInfo.avatar || ''}
							alt=''
						/>
					</saki-button>
					<div
						onClick={() => {
							setOpenUserDropDownMenu(true)
							// onSettings?.('Account')
							// setOpenUserDropDownMenu(!openUserDropDownMenu)
						}}
						className='qv-h-r-user'
					></div>
					<div slot='main'>
						<saki-menu
							ref={bindEvent({
								selectvalue: async (e) => {
									console.log(e.detail.value)
									switch (e.detail.value) {
										case 'Settings':
											// history?.('/settings')

											dispatch(configSlice.actions.setSettingVisible(true))
											break
										case 'Logout':
											dispatch(methods.user.logout())
											break

										case 'OpenDevTools':
											// api.openDevTools()
											break
										case 'Login':
											dispatch(
												configSlice.actions.setStatus({
													type: 'loginModalStatus',
													v: true,
												})
											)
											break

										default:
											break
									}
									setOpenUserDropDownMenu(false)
								},
							})}
						>
							{!user.isLogin ? (
								<saki-menu-item
									width='150px'
									padding='10px 18px'
									value={'Login'}
								>
									<div className='qv-h-r-u-item'>
										<saki-icon
											color='#666'
											type='User'
											margin='3px 6px 0 0'
										></saki-icon>
										<span>
											{t('login', {
												ns: 'common',
											})}
										</span>
									</div>
								</saki-menu-item>
							) : (
								''
							)}
							<saki-menu-item
								width='150px'
								padding='10px 18px'
								value={'Settings'}
							>
								<div className='qv-h-r-u-item'>
									<saki-icon
										color='#666'
										type='Settings'
										margin='3px 6px 0 0'
									></saki-icon>
									<span>
										{t('title', {
											ns: 'settings',
										})}
									</span>
								</div>
							</saki-menu-item>
							{config.platform === 'Electron' ? (
								<>
									<saki-menu-item padding='10px 18px' value={'OpenDevTools'}>
										<div className='qv-h-r-u-item'>
											<svg
												className='icon'
												viewBox='0 0 1025 1024'
												version='1.1'
												xmlns='http://www.w3.org/2000/svg'
												p-id='7990'
											>
												<path
													d='M293.0688 755.2c-12.0832 0-24.2688-4.2496-33.9968-12.9024L0 512l273.4592-243.0976C294.5536 250.2144 326.912 252.0064 345.7024 273.152c18.7904 21.1456 16.896 53.504-4.2496 72.2944L154.112 512l172.9536 153.7024c21.1456 18.7904 23.04 51.1488 4.2496 72.2944C321.2288 749.4144 307.1488 755.2 293.0688 755.2zM751.0528 755.0976 1024.512 512l-259.072-230.2976c-21.1456-18.7904-53.504-16.896-72.2432 4.2496-18.7904 21.1456-16.896 53.504 4.2496 72.2944L870.4 512l-187.3408 166.5024c-21.1456 18.7904-23.04 51.1488-4.2496 72.2944C688.896 762.2144 702.976 768 717.056 768 729.1392 768 741.3248 763.7504 751.0528 755.0976zM511.5392 827.648l102.4-614.4c4.6592-27.904-14.1824-54.272-42.0864-58.9312-28.0064-4.7104-54.3232 14.1824-58.88 42.0864l-102.4 614.4c-4.6592 27.904 14.1824 54.272 42.0864 58.9312C455.5264 870.1952 458.2912 870.4 461.1072 870.4 485.6832 870.4 507.392 852.6336 511.5392 827.648z'
													p-id='7991'
												></path>
											</svg>
											<span>
												{t('openDevtools', {
													ns: 'common',
												})}
											</span>
										</div>
									</saki-menu-item>
								</>
							) : (
								''
							)}
							{user.isLogin ? (
								<saki-menu-item
									width='150px'
									padding='10px 18px'
									value={'Logout'}
								>
									<div className='qv-h-r-u-item'>
										<svg
											className='icon'
											viewBox='0 0 1024 1024'
											version='1.1'
											xmlns='http://www.w3.org/2000/svg'
											p-id='3480'
										>
											<path
												d='M835.669333 554.666667h-473.173333A42.453333 42.453333 0 0 1 320 512a42.666667 42.666667 0 0 1 42.474667-42.666667h473.173333l-161.813333-161.834666a42.666667 42.666667 0 0 1 60.330666-60.330667l234.666667 234.666667a42.666667 42.666667 0 0 1 0 60.330666l-234.666667 234.666667a42.666667 42.666667 0 0 1-60.330666-60.330667L835.669333 554.666667zM554.666667 42.666667a42.666667 42.666667 0 1 1 0 85.333333H149.525333C137.578667 128 128 137.578667 128 149.482667v725.034666C128 886.4 137.6 896 149.525333 896H554.666667a42.666667 42.666667 0 1 1 0 85.333333H149.525333A106.816 106.816 0 0 1 42.666667 874.517333V149.482667A106.773333 106.773333 0 0 1 149.525333 42.666667H554.666667z'
												fill=''
												p-id='3481'
											></path>
										</svg>
										<span>
											{t('logout', {
												ns: 'common',
											})}
										</span>
									</div>
								</saki-menu-item>
							) : (
								''
							)}
						</saki-menu>
					</div>
				</saki-dropdown>
			</div>
		</div>
	)
}

export default HeaderComponent
