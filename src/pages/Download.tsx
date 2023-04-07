import React, { useEffect, useRef, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Download.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	folderSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import FooterComponent from '../components/Footer'
import DirPathComponent from '../components/DirPath'
import {
	byteConvert,
	download,
	getLink,
	PathJoin,
	Query,
} from '../modules/methods'
import moment from 'moment'
import {
	AccessToken,
	FileItem,
	FolderItem,
	SType,
} from '@nyanyajs/utils/dist/saass'
import { ListItem } from '../store/folder'
import { api } from '../modules/http/api'
import { protoRoot } from '../protos'

const DownloadPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('downloadPage')
	const dispatch = useDispatch<AppDispatch>()
	const [debounce] = useState(new Debounce())
	const config = useSelector((state: RootState) => state.config)
	const saass = useSelector((state: RootState) => state.saass)
	const folder = useSelector((state: RootState) => state.folder)
	const params = useParams()
	const [searchParams] = useSearchParams()
	const contextMenuEl = useRef<any>()
	const [contextMenuIndex, setContextMenuIndex] = useState(-1)

	const [inputPassword, setInputPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [selectContents, setSelectContents] = useState<ListItem[]>([])
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [path, setPath] = useState('')
	const [dirPath, setDirPath] = useState([] as string[])
	const [type, setType] = useState<SType>()
	const [accessToken, setAccessToken] = useState<{
		[id: string]: AccessToken
	}>({})
	const [user, setUser] = useState<protoRoot.user.SSOUserInfo>()

	const navigate = useNavigate()
	const location = useLocation()

	useEffect(() => {
		setType(saass.sdk.getType(params.id || ''))
		// setPath('downloads')
	}, [params.id])
	useEffect(() => {
		if (path) {
			setDirPath(
				path.split('/').filter((v, i) => {
					return v
				})
			)
		}
		debounce.increase(() => {
			type && path && getData()
		}, 50)
	}, [type, path])

	useEffect(() => {
		if (!name || !searchParams.get('p')) {
			setPath('downloads')
			navigate?.(
				Query(
					location.pathname,
					{
						p: 'downloads',
					},
					searchParams
				)
			)
		} else {
			setPath(searchParams.get('p') || 'downloads')
		}
	}, [searchParams.get('p')])

	const getData = async () => {
		setLoading(true)
		if (!params.id) return
		console.log('pathpath', path)
		setSelectContents([])
		switch (type) {
			case 'File':
				const fires = await saass.sdk.getFileByShortId(
					params.id,
					password,
					Math.round(new Date().getTime() / 1000) + 30 * 60
				)
				console.log('getFileByShortId', fires)
				if (fires.code === 10023) {
					setPassword(searchParams.get('pwd') || '')
					setInputPassword(true)
				}
				if (fires.code === 200) {
					setInputPassword(false)
				}
				if (fires.code === 200 || (fires.code === 10023 && fires.data)) {
					getUser(fires.data?.availableRange?.authorId || '')
					setName(fires.data?.fileName || '')

					setSelectContents([
						{
							type: 'File',
							path: '',
							file: fires.data,
						},
					])
					dispatch(
						folderSlice.actions.setFileTreeList({
							path: path,
							list: [
								{
									type: 'File',
									path: '',
									file: fires.data,
								},
							],
						})
					)
				}
				break

			case 'Folder':
				if (path === 'downloads') {
					const fores = await saass.sdk.getFolderByShortId(
						params.id,
						password,
						Math.round(new Date().getTime() / 1000) + 30 * 60
					)
					console.log('getFolderByShortId', fores)

					if (fores.code === 10023) {
						setPassword(searchParams.get('pwd') || '')
						setInputPassword(true)
					}
					if (fores.code === 200) {
						setInputPassword(false)
					}
					if (fores.code === 200 || (fores.code === 10023 && fores.data)) {
						getUser(fores.data?.availableRange.authorId || '')
						setName(fores.data?.folderName || '')
						fores.data?.accessToken &&
							setAccessToken({
								...accessToken,
								...Object.fromEntries([
									[fores.data?.id || '', fores.data?.accessToken],
								]),
							})

						dispatch(
							folderSlice.actions.setFileTreeList({
								path: path,
								list: [
									{
										type: 'Folder',
										path: '',
										folder: fores.data,
									},
								],
							})
						)
					}
				} else {
					const paths = path.split('/')
					const v = folder.fileTree[
						paths.filter((_, i) => i !== paths.length - 1).join('/')
					]?.filter(
						(v) =>
							v.type === 'Folder' &&
							v.folder?.folderName === paths[paths.length - 1]
					)?.[0]

					console.log(
						paths,
						v,
						paths.filter((_, i) => i !== paths.length - 1).join('/'),
						paths[paths.length - 1]
					)

					if (!v?.folder || !v.folder?.accessToken) return

					if (
						Number(v.folder?.accessToken.user) <=
						Math.round(new Date().getTime() / 1000)
					) {
						path === 'downloads'
							? getData()
							: navigate?.(
									Query(
										location.pathname,
										{
											p: 'downloads',
										},
										searchParams
									)
							  )
						return
					}

					let l = [] as ListItem[]
					const fores = await saass.sdk.getFolderListWithShortId(
						v.folder?.shortId,
						v.folder?.accessToken,
						Math.round(new Date().getTime() / 1000) + 30 * 60
					)

					if (fores.length) {
						l = l.concat(
							fores.map((v) => {
								return {
									type: 'Folder',
									path: '',
									folder: v,
								}
							})
						)
						dispatch(
							folderSlice.actions.setFileTreeList({
								path: path,
								list: l,
							})
						)
					}

					const fires = await saass.sdk.getFileListWithShortId(
						v.folder?.shortId,
						v.folder?.accessToken,
						Math.round(new Date().getTime() / 1000) + 100 * 60
					)
					console.log('getFileListWithShortId', fires)

					if (fires.length) {
						l = l.concat(
							fires.map((v) => {
								return {
									type: 'File',
									path: '',
									file: v,
								}
							})
						)
						dispatch(
							folderSlice.actions.setFileTreeList({
								path: path,
								list: l,
							})
						)
					}
					console.log('l', l)
				}
				break

			default:
				break
		}
		setLoading(false)
		// setPassword('082108')
	}

	const getUser = async (uid: string) => {
		const getUsers = await api.v1.gerUsers({
			uids: [uid],
		})
		console.log('getUsers', getUsers, 1, uid)
		if (getUsers.code === 200 && getUsers.data?.total && getUsers.data?.list) {
			setUser(getUsers.data?.list?.[0] as any)
		}
	}
	const share = () => {
		copyUrl(
			window.location.origin +
				Query(
					location.pathname,
					{
						p: '',
					},
					searchParams
				)
		)
	}
	const copyUrl = (url: string) => {
		dispatch(
			methods.tools.copy({
				content: url,
			})
		)

		const el = document.body.querySelector('.share-modal saki-input')
		if (el) {
			let range = document.createRange()
			range.selectNodeContents(el)
			let selection = window.getSelection()
			selection?.removeAllRanges()
			selection?.addRange(range)
			// console.log(range)
		}
	}

	const downloadFiles = (values: ListItem[] = []) => {
		values.forEach((v) => {
			console.log(v)
			if (!v.file) return
			download(v.file.urls.domainUrl + v.file.urls.shortUrl, v.file?.fileName)
		})
	}

	const downloadNum = selectContents.filter((v) => v.file).length
	return (
		<>
			<Helmet>
				<title>
					{(!loading && name ? name + ' - ' : '') +
						t('pageTitle') +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Helmet>
			<saki-scroll-view mode='Auto'>
				<div className={'download-page ' + config.deviceType}>
					<div className='dp-wrap'>
						{/* <div className='dp-logo'>
					<saki-avatar
						width='50px'
						height='50px'
						nickname={'MCS'}
						src={'http://192.168.1.104:16101/icons/256x256.png'}
					></saki-avatar>
					<span>
						{t('appTitle', {
							ns: 'common',
						})}
					</span>
				</div> */}
						{inputPassword ? (
							<div className='dp-input-password'>
								<div className='dp-ip-i-name'>
									<saki-avatar
										border-radius='50%'
										width='30px'
										height='30px'
										margin='0 6px 0 0'
										nickname={user?.nickname || ''}
										src={user?.avatar || ''}
									></saki-avatar>
									<span>
										{(inputPassword
											? t('sharedAnEncryptedContent', {
													ns: 'downloadPage',
											  })
											: t('sharedContent', {
													ns: 'downloadPage',
											  })
										)
											.replace('{{name}}', user?.nickname || '')
											.replace(
												'{{type}}',
												type === 'File'
													? t('file', {
															ns: 'common',
													  })
													: t('folder', {
															ns: 'common',
													  })
											)}
									</span>
								</div>
								{/* <div className='csc-m-i-desc'>
										<span>{desc}</span>
									</div> */}
								<div className='dp-ip-i-input'>
									<saki-input
										ref={bindEvent({
											changevalue: (e) => {
												setPassword(e.detail)
											},
										})}
										placeholder={t('password', {
											ns: 'myFilesPage',
										})}
										border='2px solid var(--saki-default-color)'
										padding='10px 14px'
										height='40px'
										width='200px'
										value={password}
										max-width='100px'
										border-radius='6px 0 0 6px'
									></saki-input>
									<saki-button
										ref={bindEvent({
											tap: () => {
												console.log('输入', password)
												getData()
											},
										})}
										height='40px'
										border-radius='0 6px 6px 0'
										padding='0 10px'
										type='Primary'
										font-weight='700'
										loading={loading}
									>
										{t('getContent', {
											ns: 'downloadPage',
										}).replace(
											'{{type}}',
											type === 'File'
												? t('file', {
														ns: 'common',
												  })
												: t('folder', {
														ns: 'common',
												  })
										)}
									</saki-button>
								</div>
							</div>
						) : loading === false && !folder.fileTree['downloads']?.length ? (
							<div className='dp-404'>
								{t('share404', {
									ns: 'downloadPage',
								})}
							</div>
						) : (
							<div className='dp-main'>
								<div className={'dp-m-header ' + config.deviceType}>
									<div className='dp-m-name'>
										<saki-avatar
											border-radius='50%'
											width='30px'
											height='30px'
											margin='0 6px 0 0'
											nickname={user?.nickname || ''}
											src={user?.avatar || ''}
										></saki-avatar>
										<span>
											{(inputPassword
												? t('sharedAnEncryptedContent', {
														ns: 'downloadPage',
												  })
												: t('sharedContent', {
														ns: 'downloadPage',
												  })
											)
												.replace('{{name}}', user?.nickname || '')
												.replace(
													'{{type}}',
													type === 'File'
														? t('file', {
																ns: 'common',
														  })
														: t('folder', {
																ns: 'common',
														  })
												)}
										</span>
									</div>
									{config.deviceType !== 'Mobile' || true ? (
										<div className='dp-m-buttons'>
											<saki-button
												ref={bindEvent({
													tap: () => {
														share()
													},
												})}
												border-radius='20px'
												padding='10px 30px'
												border='2px solid var(--saki-default-color)'
												margin='0 10px 0 0'
												type='Normal'
												font-weight='700'
												loading={loading}
											>
												<span
													style={{
														whiteSpace: 'nowrap',
														color: 'var(--saki-default-color)',
													}}
												>
													{t('share', {
														ns: 'common',
													})}
												</span>
											</saki-button>
											<saki-button
												ref={bindEvent({
													tap: () => {
														// type === 'File' &&
														// 	downloadFiles(folder.fileTree[path])

														downloadNum &&
															downloadFiles(
																selectContents.filter((v) => v.file)
															)
													},
												})}
												border-radius='20px'
												padding='10px 30px'
												type='Primary'
												font-weight='700'
												loading={loading}
												disabled={downloadNum === 0}
											>
												<span
													style={{
														whiteSpace: 'nowrap',
													}}
												>
													{t('download', {
														ns: 'common',
													})}{' '}
													{downloadNum ? '(' + downloadNum + ')' : ''}
												</span>
											</saki-button>
										</div>
									) : (
										''
									)}
								</div>
								{type === 'Folder' ? (
									<div className='dp-dirpath'>
										<DirPathComponent
											dirPath={dirPath}
											onClick={(path, index) => {
												if (path === 'downloads') {
													navigate?.(
														Query(
															location.pathname,
															{
																p: 'downloads',
															},
															searchParams
														)
													)
												} else {
													navigate?.(
														Query(
															location.pathname,
															{
																p: dirPath
																	.filter((sv, si) => {
																		return si <= index
																	})
																	.join('/'),
															},
															searchParams
														)
													)
												}
											}}
										></DirPathComponent>
									</div>
								) : (
									''
								)}
								<div className='filelist-table'>
									<saki-checkbox
										ref={bindEvent({
											selectvalue: (e) => {
												console.log(e)
												setSelectContents(
													folder.fileTree[path]?.filter((v) => {
														return e.detail.values.includes(
															v.file?.id || v.folder?.id
														)
													})
												)
											},
										})}
										value={selectContents
											.map((v) => {
												return v.file?.id || v.folder?.id
											})
											.join(',')}
										type='Checkbox'
										flex-direction='Column'
									>
										{/* {config.selectedFileList
							.map((v) => {
								return (
									v.path + '-' + v.type + '-' + (v.file?.id || v.folder?.id)
								)
							})
							.join(',')} */}
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
														<saki-table-header-item
															width={'auto'}
															height='36px'
														>
															<div className='ip-th-item'>
																<span>
																	{t('name', {
																		ns: 'myFilesPage',
																	})}
																</span>
															</div>
														</saki-table-header-item>

														<saki-table-header-item
															width={'80px'}
															height='36px'
														>
															<div className='ip-th-item'>
																<span>
																	{t('fileSize', {
																		ns: 'myFilesPage',
																	})}
																</span>
															</div>
														</saki-table-header-item>
													</saki-table-header>
												</saki-checkbox-item>
											</div>
											<div slot='main'>
												{
													//
													folder.fileTree[path]
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														// ?.concat(folder.fileTree?.[path] || [])
														?.map((v, i) => {
															const key = v.file?.id || v.folder?.id
															return (
																<saki-checkbox-item
																	only-icon-clickable
																	padding='0 0 0 10px'
																	margin='0px'
																	background-color=''
																	background-hover-color='#eee'
																	background-active-color='#e2e2e2'
																	value={key}
																	key={i}
																>
																	<saki-table-column
																		onClick={(e: any) => {
																			e.stopPropagation()

																			if (
																				selectContents.filter(
																					(sv) =>
																						key ===
																						(sv.file?.id || sv.folder?.id)
																				).length
																			) {
																				setSelectContents(
																					selectContents?.filter((sv) => {
																						return (
																							key !==
																							(sv.file?.id || sv.folder?.id)
																						)
																					})
																				)
																			} else {
																				setSelectContents(
																					selectContents.concat(v)
																				)
																			}
																		}}
																		onContextMenu={(e: any) => {
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
																		<saki-table-column-item
																			width={'26px'}
																			height='30px'
																		>
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
																		<saki-table-column-item
																			width={'auto'}
																			height='30px'
																		>
																			<div
																				onClick={(e) => {
																					console.log(34343)
																					e.stopPropagation()
																					if (v.folder) {
																						navigate?.(
																							Query(
																								location.pathname,
																								{
																									p: PathJoin(
																										path,
																										v.folder.folderName
																									),
																								},
																								searchParams
																							)
																						)
																					}
																				}}
																				className='ip-tc-item'
																			>
																				<span className='item-name h text-two-elipsis'>
																					{v.folder?.folderName ||
																						v.file?.fileName ||
																						''}
																				</span>
																			</div>
																		</saki-table-column-item>

																		<saki-table-column-item
																			width={'80px'}
																			height='30px'
																		>
																			<div className='ip-tc-item'>
																				<span className='item-name lc'>
																					{!v?.file?.fileInfo?.size
																						? ''
																						: byteConvert(
																								v?.file?.fileInfo?.size || 0
																						  )}
																				</span>
																			</div>
																		</saki-table-column-item>
																	</saki-table-column>
																</saki-checkbox-item>
															)
														})
												}
												<saki-scroll-loading
													ref={bindEvent({
														tap: () => {
															getData()
														},
													})}
													language={i18n.language}
													margin='10px 0 10px'
													type={loading ? 'loading' : 'noMore'}
												></saki-scroll-loading>
											</div>
										</saki-table>
									</saki-checkbox>
								</div>

								<saki-context-menu
									ref={bindEvent(
										{
											selectvalue: async (e) => {
												let v = folder.fileTree[path]?.[contextMenuIndex]

												switch (e.detail.value) {
													case 'Preview':
														if (v.file) {
															window.open(
																v.file.urls.domainUrl + v.file?.urls.url
															)
														}
														break
													case 'Download':
														if (v.file) {
															console.log('下载')
															downloadFiles([v])
															// download(
															// 	await getLink('PathLink', v.file),
															// 	v.file?.fileName
															// )
														}
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
										value='Preview'
										hide={
											folder.fileTree[path]?.[contextMenuIndex]?.type ===
											'Folder'
										}
									>
										<div
											style={{
												fontSize: '13px',
											}}
										>
											{t('newTabPreviewFile', {
												ns: 'common',
											})}
										</div>
									</saki-context-menu-item>
									<saki-context-menu-item
										value='Download'
										hide={
											folder.fileTree[path]?.[contextMenuIndex]?.type ===
											'Folder'
										}
									>
										<div
											style={{
												fontSize: '13px',
											}}
										>
											{t('download', {
												ns: 'common',
											})}
										</div>
									</saki-context-menu-item>
								</saki-context-menu>
							</div>
						)}
					</div>
					<div className='dp-footer'>
						<FooterComponent></FooterComponent>
					</div>
				</div>
			</saki-scroll-view>
		</>
	)
}

export default DownloadPage
