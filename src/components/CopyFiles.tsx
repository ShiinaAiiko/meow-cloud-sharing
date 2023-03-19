import React, { useEffect, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
	contactsSlice,
} from '../store'
import './CopyFiles.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { FileItem, FolderItem } from '../modules/saass'

const CopyFilesComponent = () => {
	const { t, i18n } = useTranslation('myFilesPage')
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const [userId, setUserId] = useState('')
	const [folderPath, setFolderPath] = useState('')
	const [folderPathIndex, setFolderPathIndex] = useState(1)
	const [loading, setLoading] = useState(false)
	const [loadData, setLoadData] = useState(false)
	const [exists, setExists] = useState(false)
	const [folderPathList, setFolderPathList] = useState([] as string[])

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const history = useNavigate()

	useEffect(() => {
		if (config.modal.copyFiles.visible) {
			setFolderPath('/')
			setLoading(false)
		} else {
			setFolderPath('')
			setLoading(false)
			setFolderPathList([])
			setFolderPathIndex(1)
		}
	}, [config.modal.copyFiles.visible])

	useEffect(() => {
		console.log(folderPath)
		folderPath && !folderPathList.includes(folderPath) && getList()
	}, [folderPath])

	const getList = async () => {
		setLoadData(false)
		await dispatch(
			methods.folder.getFileTreeList({
				folderPath,
			})
		)
		setLoadData(true)

		// setExists(folder.fileTree[folderPath])

		setFolderPathList(folderPathList.concat(folderPath))
	}

	const copyFiles = async () => {
		setLoading(true)
		const promiseAll: Promise<any>[] = []
		if (config.modal.copyFiles.files.length) {
			let paths = {} as {
				[path: string]: FileItem[]
			}
			config.modal.copyFiles.files.forEach((v) => {
				!paths[v.path] && (paths[v.path] = [])
				paths[v.path].push(v)
			})
			Object.keys(paths).forEach((path) => {
				if (config.modal.copyFiles.type == 'CopyTo') {
					promiseAll.push(
						dispatch(
							methods.file.copy({
								path: path,
								fileNames: paths[path].map((v) => v.fileName),
								newPath: folderPathList[folderPathIndex - 1],
							})
						)
					)
				}
				if (config.modal.copyFiles.type === 'MoveTo') {
					promiseAll.push(
						dispatch(
							methods.file.move({
								path: path,
								fileNames: paths[path].map((v) => v.fileName),
								newPath: folderPathList[folderPathIndex - 1],
							})
						)
					)
				}
			})
		}
		if (config.modal.copyFiles.folders.length) {
			let paths = {} as {
				[path: string]: FolderItem[]
			}
			config.modal.copyFiles.folders.forEach((v) => {
				!paths[v.path] && (paths[v.path] = [])
				paths[v.path].push(v)
			})

			Object.keys(paths).forEach((path) => {
				if (config.modal.copyFiles.type == 'CopyTo') {
					promiseAll.push(
						dispatch(
							methods.folder.copy({
								parentPath: path,
								folderNames: paths[path].map((v) => v.folderName),
								newParentPath: folderPathList[folderPathIndex - 1],
							})
						)
					)
				}
				if (config.modal.copyFiles.type === 'MoveTo') {
					promiseAll.push(
						dispatch(
							methods.folder.move({
								parentPath: path,
								folderNames: paths[path].map((v) => v.folderName),
								newParentPath: folderPathList[folderPathIndex - 1],
							})
						)
					)
				}
			})
		}

		await Promise.all(promiseAll)

		setLoading(false)

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
	}

	return (
		<saki-modal
			visible={config.modal.copyFiles.visible}
			width='100%'
			height='100%'
			max-width={config.deviceType === 'Mobile' ? '100%' : '380px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '480px'}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: (e) => {
					dispatch(
						configSlice.actions.setModalCopyFiles({
							visible: false,
							path: '',
							type: 'CopyTo',
							folders: [],
							files: [],
						})
					)
				},
			})}
		>
			<saki-modal-header
				ref={bindEvent({
					close: () => {
						dispatch(
							configSlice.actions.setModalCopyFiles({
								visible: false,
								path: '',
								type: 'CopyTo',
								folders: [],
								files: [],
							})
						)
					},
					back: () => {
						setFolderPath(
							folderPathIndex === 1 ? '/' : folderPathList[folderPathIndex - 2]
						)
						setFolderPathIndex(folderPathIndex - 1)
					},
				})}
				close-icon={folderPath === '/'}
				back-icon={folderPath !== '/'}
				title={folderPath === '/' ? '我的文件' : folderPath}
			></saki-modal-header>
			<div className={'copy-files-component '}>
				<div className='cfc-folders'>
					<saki-scroll-view mode='Auto'>
						<div>
							{folder.fileTree[folderPath]?.map((v, i) => {
								return (
									<saki-button
										ref={bindEvent({
											doubletap: () => {
												if (
													v.type === 'Folder' &&
													!(
														v.folder?.path === folderPath &&
														config.modal.copyFiles.folders.filter(
															(sv) => sv.folderName === v.folder?.folderName
														).length
													)
												) {
													let p =
														(v.folder?.path === '/'
															? '/'
															: v.folder?.path + '/') + v.folder?.folderName

													console.log(p)
													setFolderPath(p)
													setFolderPathIndex(folderPathIndex + 1)
												}
											},
										})}
										padding='0'
										border='none'
										border-radius='0px'
										width='100%'
										key={i}
									>
										<div
											onClick={() => {
												console.log('sa')
											}}
											key={i}
											className='cfc-f-item'
										>
											<div className='cfc-f-i-icon'>
												{v.type === 'Folder' ? (
													<saki-icon color='#666' type='FolderFill'></saki-icon>
												) : (
													<saki-icon
														color='var(--saki-default-color)'
														type='File'
													></saki-icon>
												)}
											</div>
											<div
												className={
													'cfc-f-i-name text-elipsis ' +
													(v.type === 'File' ||
													(v.folder?.path === folderPath &&
														config.modal.copyFiles.folders.filter(
															(sv) => sv.folderName === v.folder?.folderName
														).length)
														? 'disable '
														: '')
												}
											>
												{v.file?.fileName || v.folder?.folderName || ''}
											</div>
										</div>
									</saki-button>
								)
							})}
						</div>
					</saki-scroll-view>
				</div>

				<div className='cfc-buttons'>
					<saki-button
						ref={bindEvent({
							tap: () => {
								dispatch(
									configSlice.actions.setModalCopyFiles({
										visible: false,
										path: '',
										type: config.modal.copyFiles.type,
										files: [],
										folders: [],
									})
								)
							},
						})}
						padding='6px 18px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
					>
						{t('cancel', {
							ns: 'common',
						})}
					</saki-button>
					<saki-button
						ref={bindEvent({
							tap: () => {
								if (loading || loadData === false) return

								const fil = folder.fileTree[folderPath].filter((v) => {
									let flag = false
									config.modal.copyFiles.files.some((sv) => {
										if (sv.fileName === v.file?.fileName) {
											flag = true
											return true
										}
									})
									return flag
								})
								const fol = folder.fileTree[folderPath].filter((v) => {
									let flag = false
									config.modal.copyFiles.folders.some((sv) => {
										if (sv.folderName === v.folder?.folderName) {
											flag = true
											return true
										}
									})
									return flag
								})
								console.log(fil, fol)
								if (fil.length || fol.length) {
									console.log('存在')
									alert({
										title: 'Replace Files',
										content:
											'The destination already has files or folders named ' +
											fil.map((v) => '"' + v.file?.fileName + '"').join(' ') +
											' ' +
											fol
												.map((v) => '"' + v.folder?.folderName + '"')
												.join(' ') +
											'.',
										cancelText: t('cancel', {
											ns: 'common',
										}),
										confirmText: t('replace', {
											ns: 'common',
										}),
										async onConfirm() {
											copyFiles()
										},
									}).open()
								} else {
									copyFiles()
								}
							},
						})}
						padding='6px 18px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
						loading={loading}
						disabled={
							config.modal.copyFiles.path ===
							folderPathList[folderPathIndex - 1]
						}
					>
						{config.modal.copyFiles.type === 'CopyTo'
							? 'Copy Here'
							: 'Move Here'}
					</saki-button>
				</div>
			</div>
		</saki-modal>
	)
}

export default CopyFilesComponent
