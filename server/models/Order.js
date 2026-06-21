import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';
import {OrderPaymentMethod, OrderStatus, courierStatuses} from "../utils/validators.js";

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM(...OrderStatus),
      allowNull: false,
      defaultValue: 'pending',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Kitchen dispatch state (filled by the order dispatcher / channel adapter).
    //   pending  : created, not yet handed to a channel
    //   sent     : delivered to the channel (queued on tablet / posted to iiko)
    //   accepted : kitchen acknowledged (tablet ack / iiko webhook)
    //   failed   : adapter errored — needs retry/attention
    dispatchStatus: {
      type: DataTypes.ENUM('pending', 'sent', 'accepted', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    // External order id in the POS system (iiko delivery id, r_keeper id). Null for 'client'.
    externalId: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    dispatchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Retry bookkeeping for failed dispatches (iiko/r_keeper). The retry worker
    // only picks 'failed' orders whose nextDispatchAt is due and attempts < cap.
    dispatchAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nextDispatchAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    deliveryAddress: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    entrance: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    floor: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    domofon: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    apartment: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    addressComment: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    courierName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    orderType: {
      type: DataTypes.ENUM('dine_in','takeaway','delivery'),
      allowNull: true,
    },
    courierId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    courierStatus: {
      type: DataTypes.ENUM(courierStatuses),
      allowNull: true,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Which branch (RestaurantAddress / филиал) fulfills this order. Kitchen dispatch
    // keys on this. Nullable for back-compat with orders created before branches existed.
    branchId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    payMethod: {
      type: DataTypes.ENUM(...OrderPaymentMethod),
      allowNull: true,
    },
    code:{
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    prepTime: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    paid:{
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    city:{
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    street:{
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    building:{
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lat:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    long:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration:{
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    courierRestaurantAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courierInRouteAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courierPickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courierDeliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt:{
      type: DataTypes.DATE,
    }
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    indexes: [
      { fields: ['status'] },
      { fields: ['operator_id'] },
      { fields: ['courier_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Order;
