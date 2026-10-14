const cron = require('node-cron');
const reportService = require('../services/report.service');
const logger = require('../config/logger');

/**
 * Initialize monthly report generation scheduler
 */
const initMonthlyReportScheduler = () => {
  // Run on the 1st of every month at midnight: 0 0 1 * *
  cron.schedule('0 0 1 * *', async () => {
    try {
      const now = new Date();
      // Compile the previous month that just closed
      let prevMonth = now.getMonth(); // 0 for Jan, meaning prev was Dec (12)
      let prevYear = now.getFullYear();
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      logger.info(`[MonthlyReportScheduler] Compiling closed month report for ${reportService.MONTH_NAMES[prevMonth - 1]} ${prevYear}...`);
      await reportService.generateMonthlyExcelReport(prevYear, prevMonth, { force: true });
      logger.info(`[MonthlyReportScheduler] Successfully generated automated monthly Excel report for ${reportService.MONTH_NAMES[prevMonth - 1]} ${prevYear}`);
    } catch (err) {
      logger.error(`[MonthlyReportScheduler] Cron execution failed: ${err.message}`);
    }
  });

  // Startup check after 35 seconds to ensure historical reports exist
  setTimeout(async () => {
    try {
      logger.info('[MonthlyReportScheduler] Verifying historical monthly reports on startup...');
      await reportService.seedDefaultHistoricalReports();
    } catch (err) {
      logger.warn(`[MonthlyReportScheduler] Startup seed notice: ${err.message}`);
    }
  }, 35000);

  logger.info('[MonthlyReportScheduler] Automated Monthly Excel Export scheduler registered (1st of each month).');
};

module.exports = {
  initMonthlyReportScheduler,
};
