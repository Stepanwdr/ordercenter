import { Op, fn, col, literal } from 'sequelize';
import ExcelJS from 'exceljs';
import { Order, OrderItem, MenuItem, Menu, Category, Restaurant, RestaurantAddress } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Statuses that count as realized revenue (mirrors OrderService.getStats). 'cancelled' excluded.
const REVENUE_STATUSES = ['done', 'completed'];

// Human-readable Russian labels for the raw enum values stored on orders.
const STATUS_LABELS = {
  pending: 'Ожидает', accepted: 'Принят', cooking: 'Готовится', ready: 'Готов',
  delivering: 'Доставка', enRoute: 'В пути', done: 'Завершён', completed: 'Завершён',
  cancelled: 'Отменён', canceled: 'Отменён',
};
const TYPE_LABELS = {
  delivery: 'Доставка', pickup: 'Самовывоз', dinein: 'В зале', hall: 'В зале', takeaway: 'Навынос',
};
const PAY_LABELS = {
  cash: 'Наличные', card: 'Карта', online: 'Онлайн', transfer: 'Перевод', terminal: 'Терминал',
};
const label = (map, v) => (v == null || v === '' ? '' : map[v] || map[String(v).toLowerCase()] || String(v));

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

  /** Paginated orders list for the manager's restaurant(s) — for the Orders page. */
  static async listOrders({ auth, restaurantId, dateFrom, dateTo, status, page = 1, limit = 20 }) {
    const { ids } = await this.resolveScope(auth, restaurantId);
    const where = this.buildWhere(ids, dateFrom, dateTo, false);
    if (status && status !== 'all') where.status = status;

    const p = Math.max(1, Number(page) || 1);
    const lim = Math.min(100, Math.max(1, Number(limit) || 20));
    const { count, rows } = await Order.findAndCountAll({
      where,
      attributes: [
        'id', 'code', 'status', 'price', 'orderType', 'payMethod', 'paid',
        'createdAt', 'completedAt', 'customerName', 'customerPhone', 'deliveryAddress', 'courierName',
      ],
      include: [{ model: RestaurantAddress, as: 'branch', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      offset: (p - 1) * lim,
      limit: lim,
      distinct: true,
    });
    return {
      data: rows,
      meta: { total: count, page: p, limit: lim, totalPages: Math.max(1, Math.ceil(count / lim)) },
    };
  }

  /** Menu of the manager's restaurant(s): menus → items (with category), for the Menu page. */
  static async menu({ auth, restaurantId }) {
    const { ids } = await this.resolveScope(auth, restaurantId);
    if (!ids.length) return [];
    const menus = await Menu.findAll({
      where: { restaurantId: { [Op.in]: ids } },
      attributes: ['id', 'name', 'restaurantId'],
      include: [
        {
          model: MenuItem,
          as: 'items',
          attributes: ['id', 'name', 'price', 'description', 'image', 'categoryId'],
          include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        },
      ],
      order: [['name', 'ASC']],
    });
    return menus.map((m) => ({
      id: m.id,
      name: m.name,
      items: (m.items || []).map((it) => ({
        id: it.id,
        name: it.name,
        price: Number(it.price ?? 0),
        description: it.description || null,
        image: it.image || null,
        category: it.category?.name || null,
      })),
    }));
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
  /**
   * Build a formatted Excel (.xlsx) orders report for the period: styled header,
   * translated labels, real Date/number cells, autofilter, freeze + totals row.
   * Returns { buffer, filename }.
   */
  static async ordersXlsx({ auth, restaurantId, dateFrom, dateTo }) {
    const { ids, owned } = await this.resolveScope(auth, restaurantId);
    const where = this.buildWhere(ids, dateFrom, dateTo, false);

    const orders = await Order.findAll({
      where,
      attributes: [
        'code', 'createdAt', 'status', 'customerName', 'customerPhone',
        'deliveryAddress', 'courierName', 'payMethod', 'paid', 'orderType', 'price',
      ],
      include: [{ model: RestaurantAddress, as: 'branch', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Delivery Department';
    const ws = wb.addWorksheet('Заказы', {
      views: [{ state: 'frozen', ySplit: 1 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const columns = [
      { header: '№', key: 'idx', width: 6 },
      { header: 'Код', key: 'code', width: 22 },
      { header: 'Дата', key: 'date', width: 18, style: { numFmt: 'dd.mm.yyyy hh:mm' } },
      { header: 'Статус', key: 'status', width: 14 },
      { header: 'Клиент', key: 'customer', width: 20 },
      { header: 'Телефон', key: 'phone', width: 16 },
      { header: 'Адрес', key: 'address', width: 34 },
      { header: 'Филиал', key: 'branch', width: 18 },
      { header: 'Курьер', key: 'courier', width: 18 },
      { header: 'Оплата', key: 'pay', width: 14 },
      { header: 'Тип', key: 'type', width: 14 },
      { header: 'Сумма', key: 'price', width: 14, style: { numFmt: '#,##0.00' } },
    ];
    ws.columns = columns;

    // Header row styling.
    const head = ws.getRow(1);
    head.height = 22;
    head.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B52' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF1F2637' } } };
    });

    let total = 0;
    orders.forEach((o, i) => {
      const price = n(o.price);
      total += price;
      const row = ws.addRow({
        idx: i + 1,
        code: o.code || '',
        date: o.createdAt ? new Date(o.createdAt) : null,
        status: label(STATUS_LABELS, o.status),
        customer: o.customerName || '',
        phone: o.customerPhone || '',
        address: o.deliveryAddress || '',
        branch: o.branch?.name || '',
        courier: o.courierName || '',
        pay: `${label(PAY_LABELS, o.payMethod)}${o.paid ? ' ✓' : ''}`.trim(),
        type: label(TYPE_LABELS, o.orderType),
        price,
      });
      // Zebra striping for readability.
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6FA' } };
        });
      }
      row.getCell('price').alignment = { horizontal: 'right' };
      row.getCell('idx').alignment = { horizontal: 'center' };
    });

    // Totals row.
    const totalRow = ws.addRow({ address: 'Итого', pay: `Заказов: ${orders.length}`, price: total });
    totalRow.font = { bold: true };
    totalRow.getCell('price').numFmt = '#,##0.00';
    totalRow.getCell('price').alignment = { horizontal: 'right' };
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin', color: { argb: 'FF9AA6BF' } } };
    });

    ws.autoFilter = { from: 'A1', to: `L${orders.length + 1}` };

    const scopeName = restaurantId
      ? (owned.find((r) => r.id === restaurantId)?.name || '')
      : (owned.length === 1 ? owned[0].name : '');
    const slug = (scopeName || 'orders').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'orders';
    const stamp = new Date().toISOString().slice(0, 10);

    const buffer = await wb.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), filename: `report-${slug}-${stamp}.xlsx` };
  }
}

export default ReportsService;
