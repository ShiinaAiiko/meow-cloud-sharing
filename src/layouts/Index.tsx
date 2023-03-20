import React, { useEffect, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './Index.scss'
import { Header, Settings, Login } from '../components'
import { useSelector, useStore, useDispatch } from 'react-redux'
import store, {
	RootState,
	userSlice,
	AppDispatch,
	methods,
	configSlice,
} from '../store'
import { getI18n, useTranslation } from 'react-i18next'
// import { userAgent } from './userAgent'
import {
	userAgent,
	CipherSignature,
	Debounce,
	compareUnicodeOrder,
} from '@nyanyajs/utils'
import * as nyanyalog from 'nyanyajs-log'
import HeaderComponent from '../components/Header'
import FooterComponent from '../components/Footer'
import SettingsComponent from '../components/Settings'
import NavigatorComponent from '../components/Navigator'
import ShareUrlComponent from '../components/ShareUrl'
import PreviewFileComponent from '../components/PreviewFile'
import CopyFilesComponent from '../components/CopyFiles'
import SelectFileListHeaderComponent from '../components/SelectFileListHeader'
import DirPathComponent from '../components/DirPath'

import { DetailModalComponent } from '../components/Detail'
import { storage } from '../store/storage'
import { bindEvent } from '@saki-ui/core'
import md5 from 'blueimp-md5'
import { sakiui, staticPathDomain } from '../config'
import { deleteFilesOrFolders, Query, restore } from '../modules/methods'
import { FileItem, FolderItem } from '@nyanyajs/utils/dist/saass'
// import parserFunc from 'ua-parser-js'

const IndexLayout = ({ children }: RouterProps) => {
	const [debounce] = useState(new Debounce())
	const { t, i18n } = useTranslation()
	// console.log('Index Layout')

	const dispatch = useDispatch<AppDispatch>()

	const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

	const appStatus = useSelector((state: RootState) => state.config.status)
	const folder = useSelector((state: RootState) => state.folder)

	const config = useSelector((state: RootState) => state.config)
	const user = useSelector((state: RootState) => state.user)
	const saass = useSelector((state: RootState) => state.saass)

	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	const [hideLoading, setHideLoading] = useState(false)
	const [loadProgressBar, setLoadProgressBar] = useState(false)
	const [progressBar, setProgressBar] = useState(0.01)

	const [showNavigator, setShowNavigator] = useState(false)

	const [openNewDropDownMenu, setOpenNewDropDownMenu] = useState(false)
	const [openUploadDropDownMenu, setOpenUploadDropDownMenu] = useState(false)

	const parentPath = searchParams.get('p') || ''

	const downloadPage = location.pathname.indexOf('/dl') === 0

	useEffect(() => {
		const init = async () => {
			downloadPage && saass.sdk.setBaseUrl(staticPathDomain)
			if (user.isInit && user.isLogin) {
				// console.log('ossssss', user.userAgent)
				// console.log('user.isInit && user.isLogin')
				// console.log(mwc.sdk)
				// await mwc.sdk?.encryption.init()
				// await dispatch(methods.encryption.Init())
				// dispatch(methods.nsocketio.Init()).unwrap()
				// await mwc.sdk?.nsocketio.connect()
				// await dispatch(methods.messages.init())
				await dispatch(methods.saass.Init())
			} else {
				// mwc.sdk?.nsocketio.disconnect()
				// dispatch(methods.nsocketio.Close()).unwrap()
			}
		}
		init()
	}, [user.isInit, user.isLogin])

	useEffect(() => {
		if (
			appStatus.sakiUIInitStatus &&
			// appStatus.noteInitStatus &&
			loadProgressBar
		) {
			if (downloadPage) {
				progressBar < 1 &&
					setTimeout(() => {
						console.log('progressBar', progressBar)
						setProgressBar(1)
					}, 500)
				return
			}
			if (user.isInit) {
				console.log('progressBar', progressBar)
				progressBar < 1 &&
					setTimeout(() => {
						console.log('progressBar', progressBar)
						setProgressBar(1)
					}, 500)
				return
			}
		}
		// console.log("progressBar",progressBar)
	}, [
		user.isInit,
		// appStatus.noteInitStatus,
		// appStatus.syncStatus,
		loadProgressBar,
		appStatus.sakiUIInitStatus,
	])

	useEffect(() => {
		dispatch(
			configSlice.actions.setDev({
				loading: searchParams.get('loading') !== '0',
				log: searchParams.get('log') === '1',
			})
		)
		if (location.pathname !== '/') {
			dispatch(
				configSlice.actions.setFileDetailIndex({
					fileDetailIndex: -1,
				})
			)
		}
	}, [location.pathname, location.search])

	const [vConsole, setVConsole] = useState()
	useEffect(() => {
		if (config.dev.log && !vConsole) {
			let script = document.createElement('script')
			// script.src = "//cdn.jsdelivr.net/npm/eruda"
			script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js'
			document.head.appendChild(script)
			script.onload = function () {
				const v = new (window as any).VConsole()
				setVConsole(v)
			}
		}
	}, [config.dev.log])

	return (
		<>
			<Helmet>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
			</Helmet>
			<div className='chat-layout'>
				{/* <saki-base-style /> */}
				<saki-init
					ref={bindEvent({
						mounted(e) {
							console.log('mounted', e)
							store.dispatch(
								configSlice.actions.setStatus({
									type: 'sakiUIInitStatus',
									v: true,
								})
							)
							store.dispatch(methods.config.getDeviceType())
							// setProgressBar(progressBar + 0.2 >= 1 ? 1 : progressBar + 0.2)
							// setProgressBar(.6)
						},
					})}
				></saki-init>

				{config.dev.loading ? (
					<div
						onTransitionEnd={() => {
							console.log('onTransitionEnd')
							// setHideLoading(true)
						}}
						className={
							'il-loading active ' +
							// (!(appStatus.noteInitStatus && appStatus.sakiUIInitStatus)
							// 	? 'active '
							// 	: '') +
							(hideLoading ? 'hide' : '')
						}
					>
						{/* <div className='loading-animation'></div>
				<div className='loading-name'>
					{t('appTitle', {
						ns: 'common',
					})}
				</div> */}
						<div className='loading-logo'>
							<img src={config.logo256} alt='' />
						</div>
						{/* <div>progressBar, {progressBar}</div> */}
						<div className='loading-progress-bar'>
							<saki-linear-progress-bar
								ref={bindEvent({
									loaded: () => {
										console.log('progress-bar', progressBar)
										setProgressBar(0)
										setTimeout(() => {
											progressBar < 1 &&
												setProgressBar(
													progressBar + 0.2 >= 1 ? 1 : progressBar + 0.2
												)
										}, 0)
										setLoadProgressBar(true)
									},
									transitionEnd: (e: CustomEvent) => {
										console.log('progress-bar', e)
										if (e.detail === 1) {
											const el: HTMLDivElement | null =
												document.querySelector('.il-loading')
											if (el) {
												const animation = el.animate(
													[
														{
															opacity: 1,
														},
														{
															opacity: 0,
														},
													],
													{
														duration: 500,
														iterations: 1,
													}
												)
												animation.onfinish = () => {
													el.style.display = 'none'
													setHideLoading(true)
												}
											}
										}
									},
								})}
								max-width='280px'
								transition='width 1s'
								width='100%'
								height='10px'
								progress={progressBar}
								border-radius='5px'
							></saki-linear-progress-bar>
						</div>
					</div>
				) : (
					''
				)}
				<>
					<HeaderComponent></HeaderComponent>
					{/* {config.deviceType === 'Mobile' ? (
						<HeaderComponent></HeaderComponent>
					) : (
						''
					)} */}
					<saki-aside-modal
						ref={bindEvent({
							close: () => {
								setShowNavigator(false)
							},
						})}
						vertical='Top'
						horizontal='Left'
						mask
						mask-closable
						visible={showNavigator}
						height='100%'
						border-radius='0px 10px 10px 0px'
					>
						<NavigatorComponent
							onClose={() => {
								setShowNavigator(false)
							}}
							aside={true}
						/>
					</saki-aside-modal>
					<div
						style={{
							height: 'calc(100% - 50px)',
						}}
						className={'cl-main '}
					>
						{!user.isLogin && !downloadPage ? (
							user.token ? (
								<div className='cl-m-connecting'>
									<saki-animation-loading
										type='rotateEaseInOut'
										width='20px'
										height='20px'
										border='3px'
										border-color='var(--default-color)'
									/>
									<span
										style={{
											color: '#555',
											margin: '0 0 4px 0',
										}}
									>
										{t('connecting', {
											ns: 'common',
										})}
									</span>
								</div>
							) : (
								<div className='cl-m-m-login'>
									<saki-button
										ref={bindEvent({
											tap: () => {
												// dispatch(
												// 	configSlice.actions.setOpenLoginUserDropDownMenu(true)
												// )
												dispatch(
													configSlice.actions.setStatus({
														type: 'loginModalStatus',
														v: true,
													})
												)
											},
										})}
										padding='8px 18px'
										type='Primary'
									>
										{t('login', {
											ns: 'common',
										})}
									</saki-button>
								</div>
							)
						) : (
							<saki-chat-layout
								bottom-navigator={false}
								device-type={config.deviceType}
							>
								{location.pathname === '/' ||
								location.pathname === '/recent' ||
								location.pathname === '/recyclebin' ? (
									<div className='cl-side-navigator' slot='side-navigator'>
										<NavigatorComponent aside={false} />
									</div>
								) : (
									''
								)}
								<div className='cl-m-main'>
									{location.pathname.indexOf('/dl') !== 0 ? (
										<div className={'cl-m-header ' + config.deviceType}>
											<div className='cl-m-h-left'>
												{config.deviceType === 'Mobile' &&
												(location.pathname === '/' ||
													location.pathname === '/recent' ||
													location.pathname === '/recyclebin') ? (
													<saki-button
														ref={bindEvent({
															tap: () => {
																setShowNavigator(true)
															},
														})}
														width='40px'
														height='40px'
														margin='0 0px 0 0'
														type='CircleIconGrayHover'
													>
														<saki-icon color='#999' type='Menu'></saki-icon>
													</saki-button>
												) : (
													''
												)}
												{location.pathname === '/' ||
												location.pathname === '/recent' ||
												location.pathname === '/recyclebin' ? (
													<DirPathComponent
														dirPath={config.dirPath}
														onClick={(path,index) => {
															if (
																path === 'myFiles' ||
																path === 'recent' ||
																path === 'recyclebin'
															) {
																navigate?.(
																	Query(
																		location.pathname,
																		{
																			p: '/',
																		},
																		searchParams
																	)
																)
															} else {
																navigate?.(
																	Query(
																		location.pathname,
																		{
																			p:
																				'/' +
																				config.dirPath
																					.filter((sv, si) => {
																						return (
																							sv !== 'myFiles' &&
																							sv !== 'recent' &&
																							sv !== 'recyclebin' &&
																							si <= index
																						)
																					})
																					.join('/'),
																		},
																		searchParams
																	)
																)
															}
														}}
													></DirPathComponent>
												) : (
													''
												)}
											</div>
											<div className='cl-m-h-right'>
												{location.pathname === '/' ? (
													<>
														<saki-dropdown
															visible={openNewDropDownMenu}
															floating-direction='Left'
															ref={bindEvent({
																close: (e) => {
																	setOpenNewDropDownMenu(false)
																},
															})}
														>
															<saki-button
																ref={bindEvent({
																	tap: () => {
																		setOpenNewDropDownMenu(true)
																	},
																})}
																padding='6px 18px'
																type='Primary'
															>
																<span className='text-elipsis'>
																	{t('new', {
																		ns: 'common',
																	})}
																</span>
																<saki-icon
																	width='12px'
																	height='12px'
																	color='#fff'
																	margin='2px 0 0 6px'
																	type='Bottom'
																></saki-icon>
															</saki-button>
															<div slot='main'>
																<saki-menu
																	ref={bindEvent({
																		selectvalue: async (e) => {
																			switch (e.detail.value) {
																				case 'Folder':
																					dispatch(methods.folder.newFolder())
																					break

																				default:
																					break
																			}
																			setOpenNewDropDownMenu(false)
																		},
																	})}
																>
																	<saki-menu-item
																		width='150px'
																		padding='10px 18px'
																		value={'Folder'}
																	>
																		<div className='qv-h-r-u-item'>
																			<span>
																				{t('folder', {
																					ns: 'common',
																				})}
																			</span>
																		</div>
																	</saki-menu-item>
																</saki-menu>
															</div>
														</saki-dropdown>
														<saki-dropdown
															visible={openUploadDropDownMenu}
															floating-direction='Left'
															ref={bindEvent({
																close: (e) => {
																	setOpenUploadDropDownMenu(false)
																},
															})}
														>
															<saki-button
																ref={bindEvent({
																	tap: () => {
																		setOpenUploadDropDownMenu(true)
																	},
																})}
																border='none'
																margin='0 0 0 10px'
																padding='6px 18px'
																type='Normal'
															>
																<span>
																	{t('upload', {
																		ns: 'common',
																	})}
																</span>
																<saki-icon
																	width='12px'
																	height='12px'
																	color='#666'
																	margin='2px 0 0 6px'
																	type='Bottom'
																></saki-icon>
															</saki-button>
															<div slot='main'>
																<saki-menu
																	ref={bindEvent({
																		selectvalue: async (e) => {
																			switch (e.detail.value) {
																				case 'File':
																					dispatch(
																						methods.file.uploadFile({
																							parentPath,
																						})
																					)
																					break

																				default:
																					break
																			}
																			setOpenUploadDropDownMenu(false)
																		},
																	})}
																>
																	<saki-menu-item
																		width='150px'
																		padding='10px 18px'
																		value={'File'}
																	>
																		<div className='qv-h-r-u-item'>
																			<span>
																				{t('file', {
																					ns: 'common',
																				})}
																			</span>
																		</div>
																	</saki-menu-item>
																</saki-menu>
															</div>
														</saki-dropdown>
													</>
												) : (
													''
												)}
												{location.pathname === '/recyclebin' ? (
													<>
														<saki-button
															ref={bindEvent({
																tap: () => {
																	deleteFilesOrFolders({
																		files: folder.fileTree?.['recyclebin']
																			.filter((v) => v.file)
																			.map((v) => v.file) as FileItem[],
																		folders: folder.fileTree?.['recyclebin']
																			.filter((v) => v.folder)
																			.map((v) => v.folder) as FolderItem[],
																	})
																},
															})}
															padding='6px 18px'
															margin='0 6px 0 0'
															type='Primary'
														>
															<span className='text-elipsis'>
																{t('emptyRecycleBin', {
																	ns: 'myFilesPage',
																})}
															</span>
														</saki-button>
														<saki-button
															ref={bindEvent({
																tap: () => {
																	restore({
																		files: folder.fileTree?.['recyclebin']
																			.filter((v) => v.file)
																			.map((v) => v.file) as FileItem[],
																		folders: folder.fileTree?.['recyclebin']
																			.filter((v) => v.folder)
																			.map((v) => v.folder) as FolderItem[],
																	})
																},
															})}
															padding='6px 18px'
															type='Primary'
														>
															<span className='text-elipsis'>
																{t('restoreAllItems', {
																	ns: 'myFilesPage',
																})}
															</span>
														</saki-button>
													</>
												) : (
													''
												)}
											</div>
											<SelectFileListHeaderComponent></SelectFileListHeaderComponent>
										</div>
									) : (
										''
									)}
									<div className='cl-m-m-main'>{children}</div>
								</div>
							</saki-chat-layout>
						)}
					</div>
					<SettingsComponent></SettingsComponent>
					<ShareUrlComponent></ShareUrlComponent>
					<PreviewFileComponent></PreviewFileComponent>
					<DetailModalComponent></DetailModalComponent>
					<CopyFilesComponent></CopyFilesComponent>
					<Login />
				</>
			</div>
		</>
	)
}

export default IndexLayout
