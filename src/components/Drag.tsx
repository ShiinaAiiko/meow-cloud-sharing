import React, { useEffect, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useSearchParams,
} from 'react-router-dom'
import './Drag.scss'
import { Header, Settings, Login } from '../components'

import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'

import { api } from '../modules/http/api'

import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	storageSlice,
	configSlice,
} from '../store'
import { alert, snackbar } from '@saki-ui/core'
import { useDispatch, useSelector } from 'react-redux'

const debounce = new Debounce()
let timer: NodeJS.Timeout
const DragComponent = () => {
	const folder = useSelector((state: RootState) => state.folder)
	const { t, i18n } = useTranslation()
	const dispatch = useDispatch<AppDispatch>()
	const [showModal, setShowModal] = useState(false)
	const [searchParams] = useSearchParams()
	const parentPath = searchParams.get('p') || ''
	const createDragEvent = () => {
		const el = document.body
		console.log('el', el)
		if (!el) return

		const msg = snackbar({
			message: t('draggingFiles', {
				ns: 'myFilesPage',
			}),
			vertical: 'top',
			horizontal: 'center',
			backgroundColor: 'var(--saki-default-color)',
			color: '#fff',
		})
		el.addEventListener('dragover', (e) => {
			e.stopPropagation()
			e.preventDefault()
			timer && clearTimeout(timer)
			msg.open()
			// setShowModal(true)
		})
		el.addEventListener('dragleave', (e) => {
			e.stopPropagation()
			e.preventDefault()
			msg.close()
		})
		el.addEventListener('drop', (e: any) => {
			e.stopPropagation()
			e.preventDefault()
			msg.close()
			// setShowModal(false)
			// const ele: HTMLDivElement = e.target
			// console.log('ele', ele, e.dataTransfer.items)
			// if (ele?.classList.contains('drag-main')) {
			if (e.dataTransfer.items) {
				let items = new Array(...e.dataTransfer.items)
				// console.log(items)
				const files: File[] = []
				for (let index = 0; index < items.length; index++) {
					let e = items[index]
					let item = null
					if (e.webkitGetAsEntry) {
						item = e.webkitGetAsEntry()
					} else if (e.getAsEntry) {
						item = e.getAsEntry()
					} else {
						console.error('浏览器不支持拖拽上传')
						return
					}
					// console.log('itemitem', item)
					if (item.isFile) {
						item.file((file: File) => {
							// console.log(file)
							files.push(file)
							files.length &&
								files.length === items.length &&
								dispatch(
									methods.file.uploadFile({
										parentPath,
										files,
									})
								)
						})
					}
				}
			}
			// }
		})
	}
	useEffect(() => {
		debounce.increase(() => {
			createDragEvent()
		}, 50)
	}, [])

	return (
		<></>
		// <saki-modal
		// 	width='100%'
		// 	height='100%'
		// 	max-width='300px'
		// 	max-height='200px'
		// 	visible={showModal}
		// >
		// 	<div className='drag-component'>
		// 		<div data-methods='drag' className='drag-main'>
		// 			拖拽区域
		// 		</div>
		// 	</div>
		// </saki-modal>
	)
}

export default DragComponent
