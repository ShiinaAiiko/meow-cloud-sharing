import React, { useEffect, useState } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
} from '../store'
import './Detail.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, bindEvent } from '@saki-ui/core'
import { sakisso } from '../config'
import { byteConvert } from '../modules/methods'
import moment from 'moment'

export const DetailComponent = () => {
	const { t, i18n } = useTranslation('myFilesPage')
	const appStatus = useSelector((state: RootState) => state.config.status)
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)
	const sso = useSelector((state: RootState) => state.sso)

	const [noteContextMenuEl, setNoteContextMenuEl] = useState<any>()
	const [openDropDownMenu, setOpenDropDownMenu] = useState(false)
	const [openAddDropDownMenu, setOpenAddDropDownMenu] = useState(false)
	const [openSettingDropDownMenu, setOpenSettingDropDownMenu] = useState(false)
	const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)

	const [openShareDropDownMenu, setOpenShareDropDownMenu] = useState(false)

	const dispatch = useDispatch<AppDispatch>()
	useEffect(() => {}, [])

	const v =
		folder.fileTree[config.modal.fileDetailPath]?.[config.modal.fileDetailIndex]

	return (
		<div
			style={{
				width: config.deviceType === 'Mobile' ? '100%' : '300px',
			}}
			className='detail-component'
		>
			<saki-modal-header
				ref={bindEvent({
					close: () => {
						dispatch(
							configSlice.actions.setFileDetailIndex({
								fileDetailIndex: -1,
							})
						)
					},
				})}
				closeIcon
				title={v?.folder?.folderName || v?.file?.fileName || ''}
			/>

			<div className='dc-main'>
				<saki-tabs
					type='Flex'
					// header-background-color='rgb(245, 245, 245)'
					// header-max-width='740px'
					// header-border-bottom='none'
					full
					disable-more-button
					header-padding='0 10px'
					active-tab-label={config.modal.fileDetailTabLabel}
					ref={bindEvent({
						tap: (e) => {
							console.log('tap', e)
							// setOpenDropDownMenu(false)
						},
					})}
				>
					<saki-tabs-item font-size='14px' label='Detail' name={t('detail')}>
						<saki-scroll-view mode='Auto'>
							<div>
								{v?.type === 'File' ? (
									<>
										<saki-title margin='10px 0 6px' level='5' color='default'>
											{t('fileName')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.file?.fileName || ''}</span>
										</div>
										<saki-title margin='10px 0 6px' level='5' color='default'>
											{t('shortId')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.file?.shortId || ''}</span>
										</div>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('type')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.file?.fileInfo?.type || ''}</span>
										</div>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('fileSize')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{byteConvert(v?.file?.fileInfo?.size || 0)}</span>
										</div>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('lastModified')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>
												{moment((v.file?.lastUpdateTime || 0) * 1000).calendar(
													(config?.momentConfig as any)?.[i18n.language]?.[
														'fileTime'
													]
												)}
											</span>
										</div>
										{v.file?.fileInfo.width ? (
											<>
												<saki-title
													margin='18px 0 6px'
													level='5'
													color='default'
												>
													{t('width')}
												</saki-title>
												<div className='dc-m-d-item'>
													<span>{v?.file?.fileInfo?.width || ''}</span>
												</div>
												<saki-title
													margin='18px 0 6px'
													level='5'
													color='default'
												>
													{t('height')}
												</saki-title>
												<div className='dc-m-d-item'>
													<span>{v?.file?.fileInfo?.height || ''}</span>
												</div>
											</>
										) : (
											''
										)}
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('hash')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.file?.fileInfo?.hash || ''}</span>
										</div>
									</>
								) : (
									''
								)}
								{v?.type === 'Folder' ? (
									<>
										<saki-title margin='10px 0 6px' level='5' color='default'>
											{t('folderName')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.folder?.folderName || ''}</span>
										</div>
										<saki-title margin='10px 0 6px' level='5' color='default'>
											{t('shortId')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.folder?.shortId || ''}</span>
										</div>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('lastModified')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>
												{moment(
													(v?.folder?.lastUpdateTime || 0) * 1000
												).calendar(
													(config?.momentConfig as any)?.[i18n.language]?.[
														'fileTime'
													]
												)}
											</span>
										</div>
									</>
								) : (
									''
								)}
							</div>
						</saki-scroll-view>
					</saki-tabs-item>
					<saki-tabs-item
						font-size='14px'
						label='Statistics'
						name={t('statistics')}
					>
						<saki-scroll-view mode='Auto'>
							<div>
								{v?.type === 'File' ? (
									<>
										<saki-title margin='10px 0 6px' level='5' color='default'>
											{t('downloads')}
										</saki-title>
										<div className='dc-m-d-item'>
											<span>{v?.file?.usage.visitCount || ''}</span>
										</div>
									</>
								) : (
									''
								)}
							</div>
						</saki-scroll-view>
					</saki-tabs-item>
					<saki-tabs-item
						font-size='14px'
						label='Permissions'
						name={t('permissions')}
					>
						<saki-scroll-view mode='Auto'>
							<div>
								{v?.type === 'File' || v?.type === 'Folder' ? (
									<>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('share', {
												ns: 'common',
											})}
										</saki-title>
										<div className='dc-m-p-item'>
											<span>
												{t('downloadPermission', {
													ns: 'myFilesPage',
												})}
											</span>
											<saki-dropdown
												visible={openShareDropDownMenu}
												floating-direction='Left'
												ref={bindEvent({
													close: (e) => {
														setOpenShareDropDownMenu(false)
													},
												})}
											>
												<saki-button
													ref={bindEvent({
														tap: () => {
															setOpenShareDropDownMenu(true)
														},
													})}
													padding='6px 0px'
													border='none'
													type='Normal'
												>
													<span>
														{(v.file?.availableRange.allowShare ||
															v.folder?.availableRange.allowShare ||
															-1) === -1
															? t('unshare')
															: t('allowSharing')}
													</span>
													<saki-icon
														width='12px'
														height='12px'
														color='#999'
														margin='2px 0 0 6px'
														type='Bottom'
													></saki-icon>
												</saki-button>
												<div slot='main'>
													<saki-menu
														ref={bindEvent({
															selectvalue: async (e) => {
																if (v.type === 'Folder') {
																	dispatch(
																		methods.folder.setFolderSharing({
																			path: folder.parentPath,
																			folderNames: [v.folder?.folderName || ''],
																			status: Number(e.detail.value),
																		})
																	)
																} else {
																	dispatch(
																		methods.file.setFileSharing({
																			path: folder.parentPath,
																			fileNames: [v.file?.fileName || ''],
																			status: Number(e.detail.value),
																		})
																	)
																}
																setOpenShareDropDownMenu(false)
															},
														})}
													>
														<saki-menu-item
															width='150px'
															padding='10px 18px'
															value={1}
														>
															<div className='qv-h-r-u-item'>
																<span>{t('allowSharing')}</span>
															</div>
														</saki-menu-item>
														<saki-menu-item
															width='150px'
															padding='10px 18px'
															value={-1}
														>
															<div className='qv-h-r-u-item'>
																<span>{t('unshare')}</span>
															</div>
														</saki-menu-item>
													</saki-menu>
												</div>
											</saki-dropdown>
										</div>
									</>
								) : (
									''
								)}
								{v?.type === 'File' || v?.type === 'Folder' ? (
									<>
										<saki-title margin='18px 0 6px' level='5' color='default'>
											{t('password')}
										</saki-title>
										<div className='dc-m-p-item'>
											<span>
												{v.file?.availableRange.password ||
													v.folder?.availableRange.password ||
													t('passwordNotSet')}
											</span>

											<saki-row>
												{v.file?.availableRange.password ||
												v.folder?.availableRange.password ? (
													<saki-button
														ref={bindEvent({
															tap: () => {
																if (v.type === 'Folder') {
																	dispatch(
																		methods.folder.clearFolderPassword({
																			path: folder.parentPath,
																			folderName: v.folder?.folderName || '',
																		})
																	)
																} else {
																	dispatch(
																		methods.file.clearFilePassword({
																			path: folder.parentPath,
																			fileName: v.file?.fileName || '',
																		})
																	)
																}
															},
														})}
														padding='6px 4px'
														margin='0 6px 0 0'
														border='none'
														type='Normal'
													>
														<span>{t('deletePassword')}</span>
													</saki-button>
												) : (
													''
												)}
												<saki-button
													ref={bindEvent({
														tap: () => {
															if (v.type === 'Folder') {
																dispatch(
																	methods.folder.setFolderPassword({
																		path: folder.parentPath,
																		folderName: v.folder?.folderName || '',
																	})
																)
															} else {
																dispatch(
																	methods.file.setFilePassword({
																		path: folder.parentPath,
																		fileName: v.file?.fileName || '',
																	})
																)
															}
														},
													})}
													padding='6px 10px'
													type='Primary'
												>
													<span>
														{v.file?.availableRange.password
															? t('changePassword')
															: t('setPassword')}
													</span>
												</saki-button>
											</saki-row>
										</div>
									</>
								) : (
									''
								)}
							</div>
						</saki-scroll-view>
					</saki-tabs-item>
				</saki-tabs>
			</div>
		</div>
	)
}

export const DetailModalComponent = () => {
	const { t, i18n } = useTranslation('myFilesPage')
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)

	const dispatch = useDispatch<AppDispatch>()
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
	const v =
		folder.fileTree[config.modal.fileDetailPath]?.[config.modal.fileDetailIndex]

	return (
		<saki-modal
			visible={
				config.deviceType === 'Mobile' && config.modal.fileDetailIndex >= 0
			}
			width='100%'
			height='100%'
			max-width={config.deviceType === 'Mobile' ? '100%' : '780px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '620px'}
			mask
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: () => {
					dispatch(
						configSlice.actions.setFileDetailIndex({
							fileDetailIndex: -1,
						})
					)
				},
			})}
		>
			<div>
				<DetailComponent></DetailComponent>
			</div>
		</saki-modal>
	)
}
