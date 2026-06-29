import { Op, fn, col, literal } from 'sequelize';
import { Order, OrderItem, MenuItem, Restaurant, RestaurantAddress } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Statuses that count as realized revenue (mirrors OrderService.getStats). 'cancelled' excluded.
const REVENUE_STATUSES = ['done', 'completed'];

// Parse an ISO date range into a Sequelize createdAt filter (null if neither bound is valid).
const parseRange = (dateFrom, dateTo) => {
  const range = {};
  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;
  if (from && !Number.isNaN(from.getTime())) range[Op.gte] = from;
  if (to && !Number.isNaN(to.getTime())) range[Op.lte] = to;
  return Object.getOwnPropertySymbols(range).length ? range : null;
};

const n = (v) => Number(v || 0);

class ReportsService {
  /**
   * Resolve which restaurants the caller may report on. A manager is scoped to the
   * restaurants they own (Restaurant.ownerId); admin may target any single restaurant.
   * Throws 403 if a manager asks for a restaurant they don't own.
   */
  static async resolveScope(auth, restaurantId) {
    const owned = await Restaurant.findAll({
      where: { ownerId: auth.userId },
      attributes: ['id', 'name', 'logo', 'photo'],
      order: [['name', 'ASC']],
    });
    const ownedIds = owned.map((r) => r.id);

    let ids = ownedIds;
    if (restaurantId) {
      const isAdmin = auth.role === 'admin';
      if (!isAdmin && !ownedIds.includes(restaurantId)) {
        throw new AppError(403, 'You do not manage this restaurant');
      }
      ids = [restaurantId];
    }
    return { owned, ownedIds, ids };
  }

  /** Restaurants owned by the manager — backs the restaurant switcher. */
  static async listRestaurants(auth) {
    const { owned } = await this.resolveScope(auth);
    return owned.map((r) => ({ id: r.id, name: r.name, logo: r.logo || r.photo || null }));
  }

  // Shared WHERE for a scope + date range. `revenueOnly` narrows to done/completed orders.
  static buildWhere(ids, dateFrom, dateTo, revenueOnly) {
    const where = { restaurantId: { [Op.in]: ids } };
    const range = parseRange(dateFrom, dateTo);
    if (range) where.createdAt = range;
    if (revenueOnly) where.status = { [Op.in]: REVENUE_STATUSES };
    return where;
  }

  /**
   * One-shot sales dashboard: KPIs + daily timeseries + breakdowns by branch /
   * pay method / order type. All figures are scoped to the manager's restaurant(s).
   */
  static async salesOverview({ auth, restaurantId, dateFrom, dateTo }) {
    const { ids } = await this.resolveScope(auth, restaurantId);
    const base = this.buildWhere(ids, dateFrom, dateTo, false);
    const revenue = this.buildWhere(ids, dateFrom, dateTo, true);

    const [revenueSum, ordersCount, completedCount, cancelledCount] = await Promise.all([
      Order.sum('price', { where: revenue }),
      Order.count({ where: base }),
      Order.count({ where: revenue }),
      Order.count({ where: { ...base, status: 'cancelled' } }),
    ]);
    const rev = n(revenueSum);

    // Daily revenue/orders (revenue-realized orders only).
    const tsRows = await Order.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'day'],
        [fn('SUM', col('price')), 'revenue'],
        [fn('COUNT', col('id')), 'orders'],
      ],
      where: revenue,
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Group helper: revenue + order count by a single column.
    const groupBy = (attr) =>
      Order.findAll({
        attributes: [attr, [fn('SUM', col('price')), 'revenue'], [fn('COUNT', col('id')), 'orders']],
        where: revenue,
        group: [attr],
        raw: true,
      });

    const [branchRows, payRows, typeRows] = await Promise.all([
      groupBy('branchId'),
      groupBy('payMethod'),
      groupBy('orderType'),
    ]);

    // Resolve branch names for the by-branch breakdown.
    const branchIds = branchRows.map((r) => r.branchId).filter(Boolean);
    const branches = branchIds.length
      ? await RestaurantAddress.findAll({ where: { id: branchIds }, attributes: ['id', 'name'] })
      : [];
    const branchName = Object.fromEntries(branches.map((b) => [b.id, b.name]));

    return {
      kpis: {
        revenue: rev,
        ordersCount,
        completedCount,
        cancelledCount,
        avgCheck: completedCount ? rev / completedCount : 0,
      },
      timeseries: tsRows.map((r) => ({ day: String(r.day), revenue: n(r.revenue), orders: n(r.orders) })),
      byBranch: branchRows.map((r) => ({
        key: r.branchId || 'none',
        label: r.branchId ? branchName[r.branchId] || 'Филиал' : 'Без филиала',
        revenue: n(r.revenue),
        orders: n(r.orders),
      })),
      byPayMethod: payRows.map((r) => ({ key: r.payMethod || '—', label: r.payMethod || '—', revenue: n(r.revenue), orders: n(r.orders) })),
      byOrderType: typeRows.map((r) => ({ key: r.orderType || '—', label: r.orderType || '—', revenue: n(r.revenue), orders: n(r.orders) })),
    };
  }

  /** Best-selling menu items by quantity within scope + range (revenue-realized orders). */
  static async topItems({ auth, restaurantId, dateFrom, dateTo, limit = 10 }) {
    const { ids } = await this.resolveScope(auth, restaurantId);
    const where = this.buildWhere(ids, dateFrom, dateTo, true);

    const rows = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        [fn('MAX', col('menuItem.name')), 'name'],
        [fn('SUM', col('OrderItem.quantity')), 'qty'],
        [fn('SUM', literal('`OrderItem`.`quantity` * `OrderItem`.`price`')), 'revenue'],
      ],
      include: [
        { model: Order, as: 'order', attributes: [], where, required: true },
        { model: MenuItem, as: 'menuItem', attributes: [], required: false },
      ],
      group: ['menuItemId'],
      order: [[literal('qty'), 'DESC']],
      limit: Number(limit) || 10,
      subQuery: false,
      raw: true,
    });

    return rows.map((r) => ({
      menuItemId: r.menuItemId,
      name: r.name || 'Удалённое блюдо',
      qty: n(r.qty),
      revenue: n(r.revenue),
    }));
  }

  /** Orders within scope + range as a CSV string (UTF-8 BOM for Excel). */
  static async ordersCsv({ auth, restaurantId, dateFrom, dateTo }) {
    const { ids } = await this.resolveScope(auth, restaurantId);
    const where = this.buildWhere(ids, dateFrom, dateTo, false);

    const orders = await Order.findAll({
      where,
      attributes: ['code', 'createdAt', 'status', 'payMethod', 'orderType', 'price'],
      include: [{ model: RestaurantAddress, as: 'branch', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Код', 'Дата', 'Статус', 'Оплата', 'Тип', 'Филиал', 'Сумма'];
    const lines = [header.join(',')];
    for (const o of orders) {
      lines.push(
        [
          esc(o.code),
          esc(o.createdAt?.toISOString?.() || o.createdAt),
          esc(o.status),
          esc(o.payMethod),
          esc(o.orderType),
          esc(o.branch?.name || ''),
          esc(n(o.price).toFixed(2)),
        ].join(','),
      );
    }
    return `﻿${lines.join('\r\n')}`;
  }
}

export default ReportsService;
