import React, { useEffect, useRef, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useSearchParams,
} from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Index.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	messagesSlice,
	folderSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import { contact } from '../protos/proto'
import MessageContainerComponent from '../components/MessageContainer'
import DeleteMessagesComponent from '../components/DeleteMessages'
import { getDialogueInfo, Query } from '../modules/methods'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'
import moment from 'moment'
import { FolderItem } from '../modules/saass'

const IndexPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('messagesPage')
	const dispatch = useDispatch<AppDispatch>()
	const [debounce] = useState(new Debounce())
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)

	const contextMenuEl = useRef<any>()
	const [contextMenuIndex, setContextMenuIndex] = useState(-1)

	const [dirPath, setDirPath] = useState(
		'/我的文件/A/Documents'.split('/').filter((v) => {
			return v
		})
	)

	const [loadStatus, setLoadStatus] = useState('noMore')

	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	const parentPath = searchParams.get('p') || ''

	useEffect(() => {
		if (!parentPath) {
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
			debounce.increase(async () => {
				getData()
			}, 50)
		}
	}, [parentPath])

	const getData = async () => {
		if (loadStatus === 'loading') return
		setLoadStatus('loading')
		dispatch(folderSlice.actions.setParentPath(parentPath))
		setDirPath(
			['myFiles'].concat(
				parentPath.split('/').filter((v, i) => {
					return v
				})
			)
		)

		await dispatch(
			methods.folder.GetFilesorFoldersInTheParentPath({ parentPath })
		)
		setLoadStatus('noMore')
	}

	return (
		<>
			<Helmet>
				<title>
					{t('pageTitle') +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Helmet>
			<div className={'index-page ' + config.deviceType}>
				<div className='ip-header'>
					<div className='ip-dirpath'>
						{dirPath.map((v, i) => {
							return (
								<div
									key={i}
									className={
										'ip-d-item ' + (i === dirPath.length - 1 ? 'active' : '')
									}
								>
									<saki-button
										ref={bindEvent({
											tap: () => {
												console.log(
													dirPath,
													i,
													'/' +
														dirPath
															.filter((v) => {
																return v !== 'myFiles'
															})
															.join('/')
												)
												if (v === 'myFiles') {
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
																	dirPath
																		.filter((sv, si) => {
																			return sv !== 'myFiles' && si <= i
																		})
																		.join('/'),
															},
															searchParams
														)
													)
												}
											},
										})}
										padding='4px 6px'
										border='none'
										border-radius='6px'
									>
										<span>
											{v === 'myFiles'
												? t('myFiles', {
														ns: 'myFilesPage',
												  })
												: v}
										</span>
									</saki-button>
									{i !== dirPath.length - 1 ? (
										<saki-icon
											padding='0 4px'
											width='12px'
											height='12px'
											color='#999'
											type='Right'
										></saki-icon>
									) : (
										''
									)}
								</div>
							)
						})}
					</div>
					<div className='ip-more'>
						<saki-button
							ref={bindEvent({
								tap: (e) => {
									console.log(e)
									getData()
								},
							})}
							loading={loadStatus === 'loading'}
							type='CircleIconGrayHover'
						>
							<saki-icon color='#666' type='Fresh'></saki-icon>
						</saki-button>
					</div>
				</div>
				<saki-checkbox
					ref={bindEvent({
						selectvalue: (e) => {
							console.log(e)
						},
					})}
					value={[].join(',')}
					type='Checkbox'
					flex-direction='Column'
				>
					<saki-table>
						<div slot='header'>
							<saki-checkbox-item
								border-bottom='1px solid #eee'
								only-icon-clickable
								padding='0 0 0 10px'
								margin='0px'
								value={'SelectAll'}
							>
								<saki-table-header padding='0 0 0 10px'>
									<saki-table-header-item
										width={'26px'}
										height='36px'
									></saki-table-header-item>
									<saki-table-header-item width={'auto'} height='36px'>
										<div className='ip-th-item'>
											<span>名称</span>

											<saki-button
												ref={bindEvent({
													tap: () => {
														// sendMessage()
													},
												})}
												margin='0 0 0 4px'
												width='30px'
												height='30px'
												type='CircleIconGrayHover'
											>
												<saki-icon
													type='ArrowTop'
													width='12px'
													height='12px'
													color='#999'
												/>
											</saki-button>
										</div>
									</saki-table-header-item>
									{config.deviceType === 'PC' ? (
										<saki-table-header-item width={'140px'} height='36px'>
											<div className='ip-th-item'>
												<span>修改时间</span>
												<saki-button
													ref={bindEvent({
														tap: () => {
															// sendMessage()
															console.log('修改时间')
														},
													})}
													margin='0 0 0 4px'
													width='30px'
													height='30px'
													type='CircleIconGrayHover'
												>
													<saki-icon
														type='ArrowBottom'
														width='12px'
														height='12px'
														color='#999'
													/>
												</saki-button>
											</div>
										</saki-table-header-item>
									) : (
										''
									)}
									{config.deviceType !== 'Mobile' ? (
										<saki-table-header-item width={'100px'} height='36px'>
											<div className='ip-th-item'>
												<span>文件大小</span>

												<saki-button
													ref={bindEvent({
														tap: () => {
															// sendMessage()
														},
													})}
													margin='0 0 0 4px'
													width='30px'
													height='30px'
													type='CircleIconGrayHover'
												>
													<saki-icon
														type='ArrowBottom'
														width='12px'
														height='12px'
														color='#999'
													/>
												</saki-button>
											</div>
										</saki-table-header-item>
									) : (
										''
									)}
								</saki-table-header>
							</saki-checkbox-item>
						</div>
						<div slot='main'>
							<saki-scroll-view mode='Auto'>
								<div>
									{folder.list.map((v, i) => {
										return (
											<saki-checkbox-item
												only-icon-clickable
												border-bottom='1px solid #eee'
												padding='0 0 0 10px'
												margin='0px'
												value={i}
												key={i}
											>
												<saki-table-column
													onContextMenu={(e: any) => {
														console.log(e)
														e.preventDefault()
														const em = e as MouseEvent
														contextMenuEl.current?.show({
															x: em.clientX,
															y: em.clientY,
														})
														setContextMenuIndex(i)
													}}
													padding='0 0 0 10px'
												>
													<saki-table-column-item width={'26px'} height='30px'>
														<div className='ip-tc-item'>
															<span className='item-icon'>
																{v.type === 'Folder' ? (
																	<saki-icon
																		color='#666'
																		type='FolderFill'
																	></saki-icon>
																) : (
																	<saki-icon
																		color='var(--saki-default-color)'
																		padding='0 10px 0 0'
																		type='File'
																	></saki-icon>
																)}
															</span>
														</div>
													</saki-table-column-item>
													<saki-table-column-item width={'auto'} height='30px'>
														<div
															onClick={(e) => {
																console.log(2121212121212121)
																e.preventDefault()
																if (v.type === 'Folder') {
																	navigate?.(
																		Query(
																			location.pathname,
																			{
																				p:
																					v.folder.parentPath +
																					'/' +
																					v.folder.folderName,
																			},
																			searchParams
																		)
																	)
																	return
																}
															}}
															className='ip-tc-item'
														>
															<span className='item-name text-two-elipsis'>
																{v.folder.folderName}
															</span>
														</div>
													</saki-table-column-item>
													{config.deviceType === 'PC' ? (
														<saki-table-column-item
															width={'140px'}
															height='30px'
														>
															<div className='ip-tc-item'>
																<span className='item-name lc'>
																	{moment(v.folder.createTime * 1000).calendar(
																		(config?.momentConfig as any)?.[
																			i18n.language
																		]?.['fileTime']
																	)}
																</span>
															</div>
														</saki-table-column-item>
													) : (
														''
													)}
													{config.deviceType !== 'Mobile' ? (
														<saki-table-column-item
															width={'100px'}
															height='30px'
														>
															<div className='ip-tc-item'>
																<span className='item-name lc'></span>
															</div>
														</saki-table-column-item>
													) : (
														''
													)}
												</saki-table-column>
											</saki-checkbox-item>
										)
									})}
									<saki-scroll-loading
										ref={bindEvent({
											tap: () => {
												getData()
											},
										})}
										language={i18n.language}
										margin='20px 0 30px'
										type={loadStatus}
									></saki-scroll-loading>
								</div>
							</saki-scroll-view>
						</div>
					</saki-table>
				</saki-checkbox>

				<saki-context-menu
					ref={bindEvent(
						{
							selectvalue: (e) => {
								console.log(e)
								let v = folder.list[contextMenuIndex]
								switch (e.detail.value) {
									case 'Rename':
										dispatch(
											methods.folder.rename({
												id: v.folder.id,
												folderName: v.folder.folderName,
											})
										)
										break
									case 'Delete':
										dispatch(
											methods.folder.delete({
												ids: [v.folder.id],
											})
										)
										break

									default:
										break
								}
							},
							close: () => {
								setTimeout(() => {
									setContextMenuIndex(-1)
								}, 300)
								// chatDialogList.dialogContextMenuIndex = -1
							},
						},
						(e) => {
							contextMenuEl.current = e
						}
					)}
				>
					<saki-context-menu-item
						value='Download'
						hide={folder.list[contextMenuIndex]?.type === 'Folder'}
					>
						<div
							style={{
								fontSize: '13px',
							}}
						>
							下载
						</div>
					</saki-context-menu-item>
					<saki-context-menu-item
						value='Share'
						hide={folder.list[contextMenuIndex]?.type === 'Folder'}
					>
						<div
							style={{
								fontSize: '13px',
							}}
						>
							分享
						</div>
					</saki-context-menu-item>
					<saki-context-menu-item value='Rename'>
						<div
							style={{
								fontSize: '13px',
							}}
						>
							重命名
						</div>
					</saki-context-menu-item>
					<saki-context-menu-item value='Delete'>
						<div
							style={{
								color: '#fa2337',
								fontSize: '13px',
							}}
						>
							删除
						</div>
					</saki-context-menu-item>
				</saki-context-menu>
			</div>
		</>
	)
}

export default IndexPage
