import React, { useEffect, useRef, useState } from 'react'

import './SelectFileListHeader.scss'

import { RootState, AppDispatch, methods, configSlice } from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { R } from '../store/config'
import { meowLinkApiUrl } from '../config'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { FileItem, FolderItem } from '../modules/saass'
import { deleteFilesOrFolders, moveToTrash, restore } from '../modules/methods'

const SelectFileListHeaderComponent = () => {
	const { t, i18n } = useTranslation('messagesPage')
	const config = useSelector((state: RootState) => state.config)

	const dispatch = useDispatch<AppDispatch>()
	const location = useLocation()
	return (
		<div
			className={
				'select-file-list-header-component ' +
				(config.selectedFileList.length ? 'show' : 'hide')
			}
		>
			<div className='sflh-left'>
				{location.pathname === '/recyclebin' ? (
					<>
						<saki-button
							ref={bindEvent({
								tap: () => {
									deleteFilesOrFolders({
										files: config.selectedFileList
											.filter((v) => v.type === 'File' && v.file)
											.map((v) => {
												return v.file
											}) as FileItem[],
										folders: config.selectedFileList
											.filter((v) => v.type === 'Folder' && v.folder)
											.map((v) => {
												return v.folder
											}) as FolderItem[],
									})
								},
							})}
							type='Normal'
							border='1px solid #ddd'
							margin='0 6px 0 0'
							padding='6px 10px'
						>
							删除
						</saki-button>
						<saki-button
							ref={bindEvent({
								tap: () => {
									restore({
										files: config.selectedFileList
											.filter((v) => v.type === 'File' && v.file)
											.map((v) => {
												return v.file
											}) as FileItem[],
										folders: config.selectedFileList
											.filter((v) => v.type === 'Folder' && v.folder)
											.map((v) => {
												return v.folder
											}) as FolderItem[],
									})
								},
							})}
							type='Normal'
							border='1px solid #ddd'
							margin='0 6px 0 0'
							padding='6px 10px'
						>
							还原
						</saki-button>
					</>
				) : (
					<>
						<saki-button
							ref={bindEvent({
								tap: () => {
									dispatch(
										configSlice.actions.setModalCopyFiles({
											visible: true,
											path: '',
											type: 'MoveTo',
											files: config.selectedFileList
												.filter((v) => v.type === 'File' && v.file)
												.map((v) => {
													return v.file
												}) as FileItem[],
											folders: config.selectedFileList
												.filter((v) => v.type === 'Folder' && v.folder)
												.map((v) => {
													return v.folder
												}) as FolderItem[],
										})
									)
								},
							})}
							type='Normal'
							border='1px solid #ddd'
							margin='0 6px 0 0'
							padding='6px 10px'
						>
							移动到
						</saki-button>

						<saki-button
							ref={bindEvent({
								tap: () => {
									dispatch(
										configSlice.actions.setModalCopyFiles({
											visible: true,
											path: '',
											type: 'CopyTo',
											files: config.selectedFileList
												.filter((v) => v.type === 'File' && v.file)
												.map((v) => {
													return v.file
												}) as FileItem[],
											folders: config.selectedFileList
												.filter((v) => v.type === 'Folder' && v.folder)
												.map((v) => {
													return v.folder
												}) as FolderItem[],
										})
									)
								},
							})}
							type='Normal'
							border='1px solid #ddd'
							margin='0 6px 0 0'
							padding='6px 10px'
						>
							复制到
						</saki-button>
						<saki-button
							ref={bindEvent({
								tap: () => {
									moveToTrash({
										files: config.selectedFileList
											.filter((v) => v.type === 'File' && v.file)
											.map((v) => {
												return v.file
											}) as FileItem[],
										folders: config.selectedFileList
											.filter((v) => v.type === 'Folder' && v.folder)
											.map((v) => {
												return v.folder
											}) as FolderItem[],
									})
								},
							})}
							type='Normal'
							border='1px solid #ddd'
							margin='0 6px 0 0'
							padding='6px 10px'
						>
							移入回收站
						</saki-button>
					</>
				)}
			</div>
			<div className='sflh-right'>
				<saki-button
					ref={bindEvent({
						tap: () => {
							dispatch(configSlice.actions.setSelectedFileList([]))
						},
					})}
					type='Normal'
					border='1px solid #ddd'
					padding='6px 10px'
				>
					<saki-row align-items='center'>
						<saki-icon
							type='Close'
							width='14px'
							height='14px'
							margin='2px 6px 0 0'
						></saki-icon>
						<span>已选择 {config.selectedFileList.length} 项</span>
					</saki-row>
				</saki-button>
			</div>
		</div>
	)
}

export default SelectFileListHeaderComponent
