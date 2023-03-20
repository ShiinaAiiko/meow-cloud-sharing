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
	folderSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import FileListComponent from '../components/FileList'
import { DetailComponent } from '../components/Detail'
import SelectFileListHeaderComponent from '../components/SelectFileListHeader'
import {
	byteConvert,
	download,
	getLink,
	Query,
} from '../modules/methods'
import moment from 'moment'
import { FolderItem } from '@nyanyajs/utils/dist/saass'

const RecentPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('recentPage')
	const dispatch = useDispatch<AppDispatch>()
	const [debounce] = useState(new Debounce())
	const config = useSelector((state: RootState) => state.config)

	const parentPath: string = 'recent'

	useEffect(() => {
		dispatch(configSlice.actions.setDirPath(['recent']))
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
			<div className={'recent-page ' + config.deviceType}>
				<FileListComponent
					parentPath={parentPath}
					showDeleteTime={false}
					showFolderPath
          showPermissions
				></FileListComponent>
			</div>
		</>
	)
}

export default RecentPage
