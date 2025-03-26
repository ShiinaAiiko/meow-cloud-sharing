import React, { useEffect, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './DirPath.scss'
import { Header, Settings, Login } from '../components'
import { useSelector, useStore, useDispatch } from 'react-redux'
import store, {
	RootState,
	userSlice,
	AppDispatch,
	methods,
	configSlice,
} from '../store'
import { useTranslation } from 'react-i18next'
import { bindEvent } from '@saki-ui/core'
import { github } from '../config'

const DirPathComponent = ({
	dirPath,
	onClick,
}: {
	dirPath: string[]
	onClick: (path: string, index: number) => void
}): JSX.Element => {
	const { t, i18n } = useTranslation()
	// console.log('Index Layout')
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])
	const config = useSelector((state: RootState) => state.config)
	const dispatch = useDispatch<AppDispatch>()
	return (
		<div className='dirPath-component'>
			<div className='ip-dirpath'>
				{dirPath.map((v, i) => {
					let startIndex = 2
					if (
						dirPath.length >= 3 &&
						i >= startIndex &&
						i < dirPath.length - 2
					) {
						return i === startIndex ? (
							<div key={i} className={'ip-d-item '}>
								<saki-button
									padding='4px 6px'
									border='none'
									border-radius='6px'
								>
									<span className='text-elipsis'>...</span>
								</saki-button>
								<saki-icon
									padding='0 4px'
									width='12px'
									height='12px'
									color='#999'
									type='Right'
								></saki-icon>
							</div>
						) : (
							''
						)
					}
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
										onClick(v, i)
									},
								})}
								padding='4px 6px'
								border='none'
								border-radius='6px'
							>
								<span
									className={i === dirPath.length - 1 ? '' : 'text-elipsis'}
								>
									{v === 'myFiles'
										? t('pageTitle', {
												ns: 'myFilesPage',
										  })
										: v === 'recent'
										? t('pageTitle', {
												ns: 'recentPage',
										  })
										: v === 'recyclebin'
										? t('pageTitle', {
												ns: 'recyclebinPage',
										  })
										: v === 'downloads'
										? t('pageTitle', {
												ns: 'downloadPage',
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
		</div>
	)
}

export default DirPathComponent
