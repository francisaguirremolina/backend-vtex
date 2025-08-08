import httpStatus from 'http-status';
import { OcaStatuses } from '../interfaces';
import { orderStatuses } from '../config/orders';
import ApiError from '../lib/ApiError';

function getInfoStatusByOcaStatus(id: string) {
	const isValid = orderStatuses[id as OcaStatuses];
	if (!isValid) throw new ApiError(httpStatus.BAD_REQUEST, `Invalid Oca Status - ${id}`);
	return isValid;
}

function getInfoStatus(id: string) {
	const { code, description } = getInfoStatusByOcaStatus(id);
	return {
		id,
		code,
		description
	};
}

function getPendingInfo() {
	return getInfoStatus(OcaStatuses.PENDING);
}
function getCanceledInfo() {
	return getInfoStatus(OcaStatuses.CANCELED);
}

function getCreatedInfo() {
	return getInfoStatus(OcaStatuses.CREATED);
}

function getNotDeliveryInfo() {
	return getInfoStatus(OcaStatuses.NOT_DELIVERED);
}

export { getInfoStatus, getPendingInfo, getCanceledInfo, getCreatedInfo, getNotDeliveryInfo };
