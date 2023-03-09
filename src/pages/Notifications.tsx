import React, { useEffect, useState } from 'react'
import { RouterProps } from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Contacts.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'

const NotificationsPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('NotificationsPage')
	const dispatch = useDispatch<AppDispatch>()
	const config = useSelector((state: RootState) => state.config)
	const user = useSelector((state: RootState) => state.user)
	const [openLoginUserDropDownMenu, setOpenLoginUserDropDownMenu] =
		useState(false)
	const [openRegisterUserDropDownMenu, setOpenRegisterUserDropDownMenu] =
		useState(false)

	const [uid, setUid] = useState('')
	const [uidError, setUidError] = useState('')

	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')

	return (
		<>
			<Helmet>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
			</Helmet>
			<div className={'chat-page ' + config.deviceType}>
				<>Notifications page</>
			</div>
		</>
	)
}

export default NotificationsPage
