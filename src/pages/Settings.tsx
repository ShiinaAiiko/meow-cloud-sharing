import React, { useEffect, useState } from 'react'
import { RouterProps, useNavigate } from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Recent'
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

const SettingsPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('SettingsPage')
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
  const history = useNavigate()

	return (
		<>
			<Helmet>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
			</Helmet>
			<div className={'settings-page ' + config.deviceType}>
				<saki-page-header
					ref={bindEvent({
						back: () => {
							history?.(-1)
						},
					})}
					padding='0 10px'
					left
					center
					right
					back-icon
					title-font-size='22px'
					title='Settings'
				>
					<div slot='right'></div>
				</saki-page-header>
				<>Settings page</>
			</div>
		</>
	)
}

export default SettingsPage
