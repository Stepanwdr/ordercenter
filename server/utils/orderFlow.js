export const ORDER_STATUS_FLOW = {
  pending: ['accepted', 'enRoute'],
  accepted: ['cooking','enRoute'],
  cooking: ['ready','enRoute'],
  ready: ['delivering'],
  delivering: ['completed'],
  enRoute: ['completed'],
  completed: ['enRoute'],
};

export const canTransitionOrderStatus = (currentStatus, nextStatus) =>
  ORDER_STATUS_FLOW[currentStatus]?.includes(nextStatus) ?? false;

export const statusFieldMap = {
  atRestaurant: 'courierRestaurantAt',
  pickedUp: 'courierPickedUpAt',
  enRoute: 'courierInRouteAt',
  delivered: 'courierDeliveredAt',
};
