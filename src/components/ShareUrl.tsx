import React, { useEffect, useRef, useState } from 'react'

import './ShareUrl.scss'

import { RootState, AppDispatch, methods, configSlice } from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { R } from '../store/config'
import { meowLinkApiUrl } from '../config'
import axios from 'axios'
import { getLink, getLinkInfo, LinkInfo, PathJoin } from '../modules/methods'
import { useLocation, useSearchParams } from 'react-router-dom'

const PreviewFileComponent = () => {
	const { t, i18n } = useTranslation('messagesPage')
	const config = useSelector((state: RootState) => state.config)
	const [shareUrl, setShareUrl] = useState('')
	const [lf, setLf] = useState<LinkInfo>()

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		const init = async () => {
			const v = config.modal.share.v
			if (!v) return
			const res = await getLinkInfo(v)
			// console.log('getLinkInfo', res)
			setLf(res)
			setShareUrl(await getLink('ShareLink', v, res))
			// console.log(await getLink('MeowLink', file, res))
			// console.log(await getLink('EncryptLink', file, res))
			// console.log(await getLink('PathLink', file, res))
		}
		init()
	}, [config.modal.share.v])
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
			visible={!!config.modal.share.v}
			width='100%'
			max-width={'420px'}
			mask
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: () => {
					dispatch(
						configSlice.actions.setShareModal({
							meowUrl: '',
							name: '',
							v: undefined,
						})
					)
				},
			})}
		>
			<saki-modal-header
				ref={bindEvent({
					close: () => {
						dispatch(
							configSlice.actions.setShareModal({
								meowUrl: '',
								name: '',
								v: undefined,
							})
						)
					},
				})}
				close-icon
				title={'分享链接'}
			></saki-modal-header>
			<div className='share-modal'>
				<saki-title level='5' color='default' margin='0 0 10px 0'>
					{t('share', {
						ns: 'common',
					})}{' '}
					“{config.modal.share.name}”
				</saki-title>
				<saki-input
					padding='10px 14px'
					margin='0 0 10px 0'
					border='1px solid var(--saki-default-color)'
					border-radius='10px'
					value={
						shareUrl ||
						config.modal.share.meowUrl ||
						PathJoin(
							config.modal.share.v?.file?.path || '',
							config.modal.share.v?.file?.fileName ||
								config.modal.share.v?.folder?.folderName ||
								''
						)
					}
				></saki-input>
				<div className='sm-buttons'>
					<saki-button
						ref={bindEvent({
							tap: async () => {
								const v = config.modal.share.v
								if (!v) return
								const url = await getLink('MeowLink', v, lf)
								setShareUrl(url)
								copyUrl(url)
							},
						})}
						padding='6px 10px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
					>
						生成喵链接
					</saki-button>
					{/* <saki-button
						ref={bindEvent({
							tap: async () => {
								const file = config.modal.share.file
								if (!file) return
								const url = await getLink('PathLink', file, lf)
								setShareUrl(url)
								copyUrl(url)
							},
						})}
						padding='6px 10px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
					>
						复制下载链接
					</saki-button> */}
					<saki-button
						ref={bindEvent({
							tap: async () => {
								const v = config.modal.share.v
								if (!v) return

								const url = await getLink('ShareLink', v, lf)
								setShareUrl(url)
								copyUrl(url)
							},
						})}
						padding='6px 10px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
					>
						复制分享链接
					</saki-button>
				</div>
			</div>
		</saki-modal>
	)
}

export default PreviewFileComponent
