import ReportsService from '../services/reportsService.js';

class ReportsController {
  static restaurants = async (req, res) => {
    const data = await ReportsService.listRestaurants(req.auth);
    res.json({ success: true, data });
  };

  static salesOverview = async (req, res) => {
    const { restaurantId, dateFrom, dateTo } = req.query;
    const data = await ReportsService.salesOverview({ auth: req.auth, restaurantId, dateFrom, dateTo });
    res.json({ success: true, data });
  };

  static topItems = async (req, res) => {
    const { restaurantId, dateFrom, dateTo, limit } = req.query;
    const data = await ReportsService.topItems({ auth: req.auth, restaurantId, dateFrom, dateTo, limit });
    res.json({ success: true, data });
  };

  static orders = async (req, res) => {
    const { restaurantId, dateFrom, dateTo, status, page, limit } = req.query;
    const result = await ReportsService.listOrders({ auth: req.auth, restaurantId, dateFrom, dateTo, status, page, limit });
    res.json({ success: true, ...result });
  };

  static menu = async (req, res) => {
    const data = await ReportsService.menu({ auth: req.auth, restaurantId: req.query.restaurantId });
    res.json({ success: true, data });
  };

  static ordersCsv = async (req, res) => {
    const { restaurantId, dateFrom, dateTo } = req.query;
    const csv = await ReportsService.ordersCsv({ auth: req.auth, restaurantId, dateFrom, dateTo });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-report.csv"');
    res.send(csv);
  };
}

export default ReportsController;
