import React, { useEffect, useState } from 'react'
import {
	RouterProps,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './Base.scss'
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
// import { userAgent } from './userAgent'
import {
	userAgent,
	CipherSignature,
	Debounce,
	compareUnicodeOrder,
} from '@nyanyajs/utils'
import * as nyanyalog from 'nyanyajs-log'
import HeaderComponent from '../components/Header'
import UserInfoComponent from '../components/UserInfo'
import UserLoginComponent from '../components/UserLogin'
import CallComponent from '../components/Call'
import SettingsComponent from '../components/Settings'

import { storage } from '../store/storage'
import { bindEvent } from '@saki-ui/core'
import md5 from 'blueimp-md5'
import { sakiui } from '../config'
import { Query } from '../modules/methods'
// import parserFunc from 'ua-parser-js'

const BaseLayout = ({ children }: RouterProps) => {
	const [debounce] = useState(new Debounce())
	const { t, i18n } = useTranslation()
	// console.log('Index Layout')

	const dispatch = useDispatch<AppDispatch>()

	const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

	const appStatus = useSelector((state: RootState) => state.config.status)
	const mwc = useSelector((state: RootState) => state.mwc)
	const messages = useSelector((state: RootState) => state.messages)
	
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	const group = useSelector((state: RootState) => state.group)
	const user = useSelector((state: RootState) => state.user)
	const sso = useSelector((state: RootState) => state.sso)

	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	const [hideLoading, setHideLoading] = useState(false)
	const [loadProgressBar, setLoadProgressBar] = useState(false)
	const [progressBar, setProgressBar] = useState(0.01)

	useEffect(() => {
		// debounce.increase(async () => {
		// 	await dispatch(methods.tools.init()).unwrap()
		// 	await dispatch(methods.config.Init()).unwrap()
		// 	await dispatch(methods.user.Init()).unwrap()
		// 	dispatch(methods.mwc.Init()).unwrap()
		// 	await dispatch(methods.sso.Init()).unwrap()
		// 	await dispatch(methods.user.checkToken()).unwrap()
		// 	// dispatch(methods.appearance.Init()).unwrap()
		// 	// console.log('location', location)
		// 	// console.log('config.deviceType getDeviceType', config)
		// }, 0)

		// setTimeout(() => {
		// 	setOpenSettingModal(true)
		// }, 1000)
		// store.dispatch(storageSlice.actions.init())
	}, [])

	useEffect(() => {
		const init = async () => {
			if (user.isInit && user.isLogin) {
				await mwc.sdk?.encryption.init()
			}
		}
		init()
	}, [user.isInit, user.isLogin])

	return (
		<>
			<Helmet>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
			</Helmet>
			<div className='base-layout'>
				<HeaderComponent></HeaderComponent>
				<div className={'cl-main '}>{children}</div>
				<SettingsComponent></SettingsComponent>
				<UserLoginComponent></UserLoginComponent>
				<Login />
			</div>
		</>
	)
}

export default BaseLayout
