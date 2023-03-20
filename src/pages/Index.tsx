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
	folderSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import { DetailComponent } from '../components/Detail'
import FileListComponent from '../components/FileList'
import SelectFileListHeaderComponent from '../components/SelectFileListHeader'
import {
	byteConvert,
	download,
	getLink,
	Query,
} from '../modules/methods'
import moment from 'moment'
import { FolderItem } from '@nyanyajs/utils/dist/saass'

const IndexPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('myFilesPage')
	const dispatch = useDispatch<AppDispatch>()
	const config = useSelector((state: RootState) => state.config)
	const folder = useSelector((state: RootState) => state.folder)
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
			dispatch(
				configSlice.actions.setDirPath(
					['myFiles'].concat(
						parentPath.split('/').filter((v, i) => {
							return v
						})
					)
				)
			)

			if (parentPath === folder.parentPath) {
				return
			}
			dispatch(folderSlice.actions.setParentPath(parentPath))
		}
	}, [parentPath])

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
				<FileListComponent
					parentPath={parentPath}
					showFolderPath={false}
					showDeleteTime={false}
					showPermissions
				></FileListComponent>
			</div>
		</>
	)
}

export default IndexPage
