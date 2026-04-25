export const ORDER_STATUS_FLOW = {
  pending: ['accepted'],
  accepted: ['cooking'],
  cooking: ['ready'],
  ready: ['delivering'],
  delivering: ['completed'],
  completed: [],
};

export const canTransitionOrderStatus = (currentStatus, nextStatus) =>
  ORDER_STATUS_FLOW[currentStatus]?.includes(nextStatus) ?? false;
