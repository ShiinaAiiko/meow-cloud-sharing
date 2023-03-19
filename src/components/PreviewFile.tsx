import React, { useEffect, useRef, useState } from 'react'

import './PreviewFile.scss'

import { RootState, AppDispatch, methods, configSlice } from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { R } from '../store/config'
import { meowLinkApiUrl } from '../config'
import axios from 'axios'

const PreviewFileComponent = () => {
	const { t, i18n } = useTranslation('messagesPage')
	const config = useSelector((state: RootState) => state.config)

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
	return (
		<saki-modal
			visible={!!config.modal.previewFileUrls.length}
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
						configSlice.actions.setPreviewFileModal({
							previewFileUrls: [],
						})
					)
				},
			})}
		>
			<saki-modal-header
				ref={bindEvent({
					close: () => {
						dispatch(
							configSlice.actions.setPreviewFileModal({
								previewFileUrls: [],
							})
						)
					},
				})}
				close-icon
				title={'预览文件'}
			></saki-modal-header>
			<div className='preview-modal'>
				{config.modal.previewFileUrls.length ? (
					<iframe src={config.modal.previewFileUrls?.[0] || ''}></iframe>
				) : (
					''
				)}
			</div>
		</saki-modal>
	)
}

export default PreviewFileComponent
