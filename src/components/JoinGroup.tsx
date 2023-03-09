import React, { useEffect, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
} from '../store'
import './JoinGroup.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'

const JoinGroupComponent = ({
	visible,
	onChange,
}: {
	visible: boolean
	onChange: (visible: boolean) => void
}) => {
	const { t, i18n } = useTranslation('modal')
	const config = useSelector((state: RootState) => state.config)
	const mwc = useSelector((state: RootState) => state.mwc)
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const [groupId, setGroupId] = useState('')

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const history = useNavigate()

	useEffect(() => {
		setGroupId('')
	}, [visible])
	const searchGroup = async () => {
		const getGroup = await mwc.sdk?.api.group.getGroupInfo({
			groupId,
		})
		console.log(getGroup)
		if (getGroup?.code === 200) {
			// 预留 检测是否需要校验，需要则出输入备注的弹框
			if (
				await dispatch(
					methods.group.joinGroup({
						groupId,
						uid: [user.userInfo.uid],
						remark: '',
					})
				).unwrap()
			) {
				onChange(false)
			}
			return
		}
	}

	return (
		<saki-modal
			visible={visible}
			width='100%'
			height='100%'
			max-width={config.deviceType === 'Mobile' ? '100%' : '420px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '180px'}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: (e) => {
					onChange?.(false)
				},
			})}
		>
			<saki-modal-header
				ref={bindEvent({
					close: () => {
						onChange?.(false)
					},
				})}
				close-icon
				title={t('joinGroup', {
					ns: 'contactsPage',
				})}
			></saki-modal-header>
			<div className={'join-group-component ' + config.deviceType}>
				<div className='jgd-input'>
					<saki-input
						type='Text'
						height='56px'
						placeholder={t('groupId')}
						placeholder-animation='MoveUp'
						value={groupId}
						ref={bindEvent({
							changevalue: (e) => {
								setGroupId(e.detail)
							},
						})}
					></saki-input>
				</div>

				<div className='jgd-buttons'>
					<saki-button
						ref={bindEvent({
							tap: () => {
								searchGroup()
							},
						})}
						padding='6px 18px'
						margin='0 0 0 10px'
						font-size='14px'
						type='Primary'
					>
						{t('join', {
							ns: 'common',
						})}
					</saki-button>
				</div>
			</div>
		</saki-modal>
	)
}

export default JoinGroupComponent
