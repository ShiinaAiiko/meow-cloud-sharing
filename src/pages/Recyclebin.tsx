import React, { useEffect, useRef, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useSearchParams,
} from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Recent.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	messagesSlice,
	folderSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import { contact } from '../protos/proto'
import MessageContainerComponent from '../components/MessageContainer'
import DeleteMessagesComponent from '../components/DeleteMessages'
import FileListComponent from '../components/FileList'
import { DetailComponent } from '../components/Detail'
import SelectFileListHeaderComponent from '../components/SelectFileListHeader'
import {
	byteConvert,
	download,
	getDialogueInfo,
	getLink,
	Query,
} from '../modules/methods'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'
import moment from 'moment'
import { FolderItem } from '../modules/saass'

const RecyclebinPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('recyclebinPage')
	const dispatch = useDispatch<AppDispatch>()
	const config = useSelector((state: RootState) => state.config)

	const parentPath: string = 'recyclebin'

	useEffect(() => {
		dispatch(configSlice.actions.setDirPath(['recyclebin']))
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
			<div className={'recyclebin-page ' + config.deviceType}>
				<FileListComponent
					parentPath={parentPath}
          showFolderPath
          showDeleteTime
					showPermissions={false}
				></FileListComponent>
			</div>
		</>
	)
}

export default RecyclebinPage
