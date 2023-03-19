import React, { useEffect, useRef, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
	contactsSlice,
	folderSlice,
} from '../store'
import './FileList.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { Debounce } from '@nyanyajs/utils'
import { DetailComponent } from '../components/Detail'
import {
	byteConvert,
	deleteFilesOrFolders,
	download,
	getLink,
	moveToTrash,
	Query,
	restore,
} from '../modules/methods'
import moment from 'moment'
import { FileItem, FolderItem } from '../modules/saass'

const FileListComponent = ({
	parentPath,
	showFolderPath = false,
	showDeleteTime = false,
	showPermissions = false,
}: {
	parentPath: string
	showFolderPath: boolean
	showDeleteTime: boolean
	showPermissions: boolean
}) => {
	const { t, i18n } = useTranslation('myFilesPage')
	const dispatch = useDispatch<AppDispatch>()
	const [debounce] = useState(new Debounce())
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)
	const contextMenuEl = useRef<any>()
	const [contextMenuIndex, setContextMenuIndex] = useState(-1)

	const [loadStatus, setLoadStatus] = useState('noMore')
	// const [parentPath, setParentPath] = useState('')

	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

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
			dispatch(
				configSlice.actions.setFileListSort({
					...config.fileListSort,
					size: 0,
					name: !(parentPath === 'recent') ? 1 : 0,
					lastUpdateTime: parentPath === 'recent' ? -1 : 0,
					deleteTime: parentPath === 'recyclebin' ? -1 : 0,
				})
			)
			debounce.increase(async () => {
				getData()
			}, 50)
		}
	}, [parentPath])

	const getData = async () => {
		if (loadStatus === 'loading') return
		setLoadStatus('loading')
		console.log('parentPath', parentPath)
		dispatch(folderSlice.actions.setParentPath(parentPath))

		dispatch(configSlice.actions.setSelectedFileList([]))
		dispatch(
			configSlice.actions.setModalCopyFiles({
				visible: false,
				path: '',
				type: config.modal.copyFiles.type,
				folders: [],
				files: [],
			})
		)
		if (parentPath === 'recent') {
			await dispatch(methods.folder.getRecentFiles())
		} else if (parentPath === 'recyclebin') {
			await dispatch(methods.folder.getRecyclebinFiles())
		} else {
			await dispatch(
				methods.folder.getFileTreeList({
					folderPath: parentPath,
				})
			)
		}
		console.log(32131)
		// await Promise.all([
		// 	dispatch(methods.folder.GetFoldersInTheParentPath({ parentPath })),
		// 	dispatch(
		// 		methods.file.GetFilesInTheParentPath({
		// 			parentPath,
		// 		})
		// 	),
		// ])
		setLoadStatus('noMore')
	}

	return (
		<div className='file-list-page'>
			<div
				className={
					'ip-main ' +
					(config.modal.fileDetailIndex >= 0 && config.deviceType !== 'Mobile'
						? 'showDetail '
						: '')
				}
			>
				<div className='ip-table filelist-table'>
					<saki-checkbox
						ref={bindEvent({
							selectvalue: (e) => {
								// console.log(e)
								dispatch(
									configSlice.actions.setSelectedFileList(
										folder.fileTree?.[parentPath]?.filter((v) => {
											return (e.detail.values as string[]).includes(
												v.path +
													'-' +
													v.type +
													'-' +
													(v.file?.id || v.folder?.id)
											)
										})
									)
								)
							},
						})}
						value={config.selectedFileList
							.map((v) => {
								return (
									v.path + '-' + v.type + '-' + (v.file?.id || v.folder?.id)
								)
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
										<saki-table-header-item width={'auto'} height='36px'>
											<div className='ip-th-item'>
												<span>
													{t('name', {
														ns: 'myFilesPage',
													})}
												</span>

												<saki-button
													ref={bindEvent({
														tap: () => {
															dispatch(
																configSlice.actions.setFileListSort({
																	name:
																		config.fileListSort.name !== -1 ? -1 : 1,
																	lastUpdateTime: 0,
																	size: 0,
																	deleteTime: 0,
																})
															)
														},
													})}
													margin='0 0 0 4px'
													width='30px'
													height='30px'
													type='CircleIconGrayHover'
												>
													<saki-icon
														type={
															config.fileListSort.name === -1
																? 'ArrowTop'
																: 'ArrowBottom'
														}
														width='12px'
														height='12px'
														color='#999'
													/>
												</saki-button>
											</div>
										</saki-table-header-item>

										{showFolderPath ? (
											<saki-table-header-item width={'auto'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('folder', {
															ns: 'common',
														})}
													</span>
												</div>
											</saki-table-header-item>
										) : (
											''
										)}
										{config.deviceType === 'Pad' ||
										config.deviceType === 'PC' ? (
											<saki-table-header-item width={'140px'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('lastModified', {
															ns: 'myFilesPage',
														})}
													</span>
													<saki-button
														ref={bindEvent({
															tap: () => {
																dispatch(
																	configSlice.actions.setFileListSort({
																		lastUpdateTime:
																			config.fileListSort.lastUpdateTime !== -1
																				? -1
																				: 1,
																		name: 0,
																		size: 0,
																		deleteTime: 0,
																	})
																)
															},
														})}
														margin='0 0 0 4px'
														width='30px'
														height='30px'
														type='CircleIconGrayHover'
													>
														<saki-icon
															type={
																config.fileListSort.lastUpdateTime === -1
																	? 'ArrowTop'
																	: 'ArrowBottom'
															}
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
										{showDeleteTime ? (
											<saki-table-header-item width={'140px'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('deletedTime', {
															ns: 'myFilesPage',
														})}
													</span>
												</div>
												<saki-button
													ref={bindEvent({
														tap: () => {
															dispatch(
																configSlice.actions.setFileListSort({
																	deleteTime:
																		config.fileListSort.deleteTime !== -1
																			? -1
																			: 1,
																	name: 0,
																	size: 0,
																	lastUpdateTime: 0,
																})
															)
														},
													})}
													margin='0 0 0 4px'
													width='30px'
													height='30px'
													type='CircleIconGrayHover'
												>
													<saki-icon
														type={
															config.fileListSort.lastUpdateTime === -1
																? 'ArrowTop'
																: 'ArrowBottom'
														}
														width='12px'
														height='12px'
														color='#999'
													/>
												</saki-button>
											</saki-table-header-item>
										) : (
											''
										)}
										{config.deviceType !== 'Mobile' ? (
											<saki-table-header-item width={'100px'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('fileSize', {
															ns: 'myFilesPage',
														})}
													</span>

													<saki-button
														ref={bindEvent({
															tap: () => {
																dispatch(
																	configSlice.actions.setFileListSort({
																		...config.fileListSort,
																		size:
																			config.fileListSort.size !== -1 ? -1 : 1,
																		name: 0,
																		lastUpdateTime: 0,
																	})
																)
															},
														})}
														margin='0 0 0 4px'
														width='30px'
														height='30px'
														type='CircleIconGrayHover'
													>
														<saki-icon
															type={
																config.fileListSort.size === -1
																	? 'ArrowTop'
																	: 'ArrowBottom'
															}
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
											<saki-table-header-item width={'80px'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('downloads', {
															ns: 'myFilesPage',
														})}
													</span>
												</div>
											</saki-table-header-item>
										) : (
											''
										)}
										{showPermissions ? (
											<saki-table-header-item width={'80px'} height='36px'>
												<div className='ip-th-item'>
													<span>
														{t('permissions', {
															ns: 'myFilesPage',
														})}
													</span>
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
										{
											// ?.concat(folder.fileTree?.[parentPath] || [])
											folder.fileTree?.[parentPath]?.map((v, i) => {
												return (
													<saki-checkbox-item
														only-icon-clickable
														border-bottom='1px solid #eee'
														padding='0 0 0 10px'
														margin='0px'
														background-color=''
														background-hover-color='#eee'
														background-active-color='#ddd'
														value={
															v.path +
															'-' +
															v.type +
															'-' +
															(v.file?.id || v.folder?.id)
														}
														key={i}
													>
														<saki-table-column
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
																	onClick={() => {
																		if (parentPath === 'recyclebin') return

																		if (v.type === 'Folder') {
																			navigate?.(
																				Query(
																					location.pathname,
																					{
																						p:
																							(v.folder?.path === '/'
																								? '/'
																								: v.folder?.path + '/') +
																							v.folder?.folderName,
																					},
																					searchParams
																				)
																			)
																			return
																		}
																		if (v.type === 'File' && v.file) {
																			// dispatch(
																			// 	configSlice.actions.setPreviewFileModal({
																			// 		previewFileUrls: [
																			// 			v.file?.urls.domainUrl +
																			// 				v.file?.urls.url,
																			// 		],
																			// 	})
																			// )

																			dispatch(
																				configSlice.actions.setFileDetailIndex({
																					fileDetailIndex: i,
																					fileDetailPath: parentPath,
																				})
																			)
																		}
																		return
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
															{showFolderPath ? (
																<saki-table-column-item
																	width={'auto'}
																	height='30px'
																>
																	<div className='ip-tc-item'>
																		<span
																			style={{
																				color: '#666',
																			}}
																			className='item-name h text-two-elipsis'
																		>
																			{v.folder?.path || v.file?.path || ''}
																		</span>
																	</div>
																</saki-table-column-item>
															) : (
																''
															)}
															{config.deviceType === 'Pad' ||
															config.deviceType === 'PC' ? (
																<saki-table-column-item
																	width={'140px'}
																	height='30px'
																>
																	<div className='ip-tc-item'>
																		<span className='item-name lc'>
																			{moment(
																				(v.folder?.lastUpdateTime ||
																					v.file?.lastUpdateTime ||
																					0) * 1000
																			).calendar(
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
															{showDeleteTime ? (
																<saki-table-column-item
																	width={'140px'}
																	height='30px'
																>
																	<div className='ip-tc-item'>
																		<span className='item-name lc'>
																			{moment(
																				(v.folder?.lastUpdateTime ||
																					v.file?.deleteTime ||
																					0) * 1000
																			).calendar(
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
																		<span className='item-name lc'>
																			{!v?.file?.fileInfo.size
																				? ''
																				: byteConvert(
																						v?.file?.fileInfo.size || 0
																				  )}
																		</span>
																	</div>
																</saki-table-column-item>
															) : (
																''
															)}
															{config.deviceType !== 'Mobile' ? (
																<saki-table-column-item
																	width={'80px'}
																	height='30px'
																>
																	<div className='ip-tc-item'>
																		<span className='item-name lc text-elipsis'>
																			{!v?.file?.usage.visitCount
																				? ''
																				: v?.file?.usage.visitCount}
																		</span>
																	</div>
																</saki-table-column-item>
															) : (
																''
															)}
															{showPermissions ? (
																<saki-table-column-item
																	width={'80px'}
																	height='30px'
																>
																	<div className='ip-tc-item'>
																		{(v.file?.availableRange?.allowShare ||
																			v.folder?.availableRange?.allowShare ||
																			-1) === 1 ? (
																			<saki-icon
																				color='#999'
																				margin='0 6px 0 0'
																				type='ShareFill'
																			></saki-icon>
																		) : (
																			''
																		)}
																		{v.file?.availableRange?.password ||
																		v.folder?.availableRange?.password ? (
																			<saki-icon
																				color='#999'
																				type='PasswordFill'
																			></saki-icon>
																		) : (
																			''
																		)}
																	</div>
																</saki-table-column-item>
															) : (
																''
															)}
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
											margin='20px 0 30px'
											type={loadStatus}
										></saki-scroll-loading>
									</div>
								</saki-scroll-view>
							</div>
						</saki-table>
					</saki-checkbox>
				</div>
				<div className='ip-detail'>
					<DetailComponent></DetailComponent>
				</div>
			</div>

			<saki-context-menu
				ref={bindEvent(
					{
						selectvalue: async (e) => {
							console.log(e)
							let v = folder.fileTree[parentPath][contextMenuIndex]
							switch (e.detail.value) {
								case 'Rename':
									v.folder &&
										dispatch(
											methods.folder.rename({
												parentPath: v.folder?.path,
												folderName: v.folder?.folderName,
											})
										)
									v.file &&
										dispatch(
											methods.file.rename({
												path: v.file?.path,
												fileName: v.file?.fileName,
											})
										)
									break
								case 'Restore':
									v.folder &&
										restore({
											files: [],
											folders: [v.folder] as FolderItem[],
										})
									v.file &&
										restore({
											files: [v.file] as FileItem[],
											folders: [],
										})
									break
								case 'Delete':
									v.folder &&
										deleteFilesOrFolders({
											files: [],
											folders: [v.folder] as FolderItem[],
										})
									v.file &&
										deleteFilesOrFolders({
											files: [v.file] as FileItem[],
											folders: [],
										})
									break
								case 'MoveToTrash':
									v.folder &&
										moveToTrash({
											files: [],
											folders: [v.folder],
										})
									v.file &&
										moveToTrash({
											files: [v.file],
											folders: [],
										})
									break
								case 'Share':
									if (
										(v.file?.availableRange.allowShare ||
											v.folder?.availableRange.allowShare) === 1
									) {
										dispatch(
											configSlice.actions.setShareModal({
												v,
												meowUrl: '',
												name:
													t('pageTitle', {
														ns: 'myFilesPage',
													}) +
													(parentPath === '/' ? '/' : parentPath + '/') +
													(v.file?.fileName || v.folder?.folderName || ''),
											})
										)
									} else {
										snackbar({
											message: '还未开启共享，请先设置共享权限',
											autoHideDuration: 2000,
											vertical: 'top',
											horizontal: 'center',
											backgroundColor: 'var(--saki-default-color)',
											color: '#fff',
										}).open()
										dispatch(
											configSlice.actions.setFileDetailIndex({
												fileDetailIndex: contextMenuIndex,
												fileDetailPath: parentPath,
												fileDetailTabLabel: 'Permissions',
											})
										)
									}

									break
								case 'Download':
									if (v.file) {
										download(await getLink('PathLink', v), v.file?.fileName)
									}
									break
								case 'Preview':
									if (v.file) {
										// dispatch(
										// 	configSlice.actions.setPreviewFileModal({
										// 		previewFileUrls: [
										// 			v.file?.urls.domainUrl + v.file?.urls.url,
										// 		],
										// 	})
										// )
										window.open(await getLink('PathLink', v))
									}
									break
								case 'Detail':
									dispatch(
										configSlice.actions.setFileDetailIndex({
											fileDetailIndex: contextMenuIndex,
											fileDetailPath: parentPath,
										})
									)
									break
								case 'MoveTo':
									if (v.type === 'File' && v.file) {
										dispatch(
											configSlice.actions.setModalCopyFiles({
												visible: true,
												path: v.file.path,
												type: 'MoveTo',
												files: [v.file],
												folders: [],
											})
										)
									}
									if (v.type === 'Folder' && v.folder) {
										dispatch(
											configSlice.actions.setModalCopyFiles({
												visible: true,
												path: v.folder.path,
												type: 'MoveTo',
												files: [],
												folders: [v.folder],
											})
										)
									}
									break
								case 'CopyTo':
									if (v.type === 'File' && v.file) {
										dispatch(
											configSlice.actions.setModalCopyFiles({
												visible: true,
												path: v.file.path,
												type: 'CopyTo',
												files: [v.file],
												folders: [],
											})
										)
									}
									if (v.type === 'Folder' && v.folder) {
										dispatch(
											configSlice.actions.setModalCopyFiles({
												visible: true,
												path: v.folder.path,
												type: 'CopyTo',
												files: [],
												folders: [v.folder],
											})
										)
									}
									break
								case 'Restore':
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
						parentPath === 'recyclebin' ||
						folder.fileTree[parentPath]?.[contextMenuIndex]?.type === 'Folder'
					}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('newTab', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='Download'
					hide={
						parentPath === 'recyclebin' ||
						folder.fileTree[parentPath]?.[contextMenuIndex]?.type === 'Folder'
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
				<saki-context-menu-item
					value='Share'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('share', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='MoveTo'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('moveTo', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='CopyTo'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('copyTo', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='Restore'
					hide={parentPath !== 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('restore', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='Delete'
					hide={parentPath !== 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('delete', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='MoveToTrash'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('moveToTrash', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='Rename'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('rename', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
				<saki-context-menu-item
					value='Detail'
					hide={parentPath === 'recyclebin'}
				>
					<div
						style={{
							fontSize: '13px',
						}}
					>
						{t('viewDetail', {
							ns: 'common',
						})}
					</div>
				</saki-context-menu-item>
			</saki-context-menu>
		</div>
	)
}

export default FileListComponent
