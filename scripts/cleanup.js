const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const itemsToDelete = [
  // Backend models
  'backend/app/model/target_allocation_model.py',
  'backend/app/model/historical_category_data.py',
  'backend/app/model/pos_achievement_model.py',
  'backend/app/model/target_allocation_control_model.py',
  'backend/app/model/branch_location_master_stg_model.py',
  'backend/app/model/digital_ambassador_employee_model.py',
  'backend/app/model/knowledge_center_model.py',
  'backend/app/model/api_audit_log_model.py',
  'backend/app/model/payment_model.py',
  
  // Backend routes
  'backend/app/api/routes/admin_cache.py',
  'backend/app/api/routes/category_master.py',
  'backend/app/api/routes/chunked_upload.py',
  'backend/app/api/routes/dashboard.py',
  'backend/app/api/routes/knowledge_center.py',
  'backend/app/api/routes/payment_router.py',
  'backend/app/api/routes/pos_achievement.py',
  'backend/app/api/routes/reports.py',
  'backend/app/api/routes/scorecard_api.py',
  'backend/app/api/routes/target_achievement.py',
  'backend/app/api/routes/target_allocation.py',
  'backend/app/api/routes/atm_router.py',
  'backend/app/api/routes/atm_monitoring_router.py',
  'backend/app/api/routes/atm',
  
  // Backend services
  'backend/app/services/achievement_calculator.py',
  'backend/app/services/category_master_service.py',
  'backend/app/services/dashboard_service.py',
  'backend/app/services/knowledge_center_service.py',
  'backend/app/services/pos_achievement_service.py',
  'backend/app/services/raw_target_allocation_service.py',
  'backend/app/services/report_service.py',
  'backend/app/services/scorecard_service.py',
  'backend/app/services/target_achievement_service.py',
  'backend/app/services/target_allocation_service.py',
  'backend/app/services/cache_warmer.py',
  'backend/app/services/atm_monitoring_service.py',
  'backend/app/services/dap',
  'backend/app/services/papg',
  'backend/app/services/atm',
  
  // Backend repository
  'backend/app/repository/category_master_repo.py',
  'backend/app/repository/dashboard_repo.py',
  'backend/app/repository/digital_ambassador_employee_repo.py',
  'backend/app/repository/knowledge_center_repo.py',
  'backend/app/repository/target_allocation_repo.py',
  
  // Backend archives & scratch scripts
  'backend/app.zip',
  'backend/app/app.7z',
  'backend/app/dap-apis.py',
  'backend/check_calc.py',
  'backend/check_cats.py',
  'backend/check_db_counts.py',
  'backend/check_oracle_tables.py',
  'backend/creattioncommond.sql',
  'backend/fix_branch_ids.py',
  'backend/migrate_add_file_contents.py',
  'backend/pos_achievement_setup.sql',
  'backend/run_snapshot.py',
  'backend/scratch_verify.py',
  'backend/test_chunked_target_allocation.py',
  'backend/test_cp_dev.py',
  'backend/test_payloads.json',
  'unzip_papg.js',

  // Frontend pages & modules
  'frontend/src/modules/generatePPTX.js',
  'frontend/src/modules/digital-ambassador',
  'frontend/src/modules/payment',
  'frontend/src/modules/BO',
  'frontend/src/modules/CentralOffice',
  'frontend/src/modules/ProgressUpload',
  'frontend/src/modules/Reports',
  'frontend/src/modules/TargetAllocation',
  'frontend/src/modules/hrms',
  'frontend/src/pages/AddPerformance.jsx',
  'frontend/src/pages/CategoryMaster.jsx',
  'frontend/src/pages/CategoryPerformanceDetails.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/DigitalScoreCard.jsx',
  'frontend/src/pages/KnowledgeCenter.jsx',
  'frontend/src/pages/PerformanceDashboard.jsx',
  'frontend/src/pages/ProgressUpload.jsx',
  'frontend/src/pages/Reports.jsx',
  'frontend/src/pages/TargetAllocation.jsx',
  'frontend/src/pages/ATMDetails',
  'frontend/src/pages/ATMManagement',
  'frontend/src/pages/CashManagement',
  'frontend/src/pages/Dashboard'
];

let deleted = 0;
for (const rel of itemsToDelete) {
  const fullPath = path.join(ROOT, rel);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Deleted folder: ${rel}`);
      deleted++;
    } else {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${rel}`);
      deleted++;
    }
  }
}
console.log(`Successfully deleted ${deleted} non-ATM items.`);
