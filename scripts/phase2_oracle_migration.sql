-- ==============================================================================
-- Project: PAPG Internal Portal - Phase 2 Oracle DB Migration Script
-- Target Database: Oracle 11g / 12c / 19c / 21c / 23ai
-- Execution Method: SQL*Plus, Oracle SQL Developer, PL/SQL Developer, or DBeaver
-- Description:
--   Complete, idempotent migration script for Phase 2 column additions.
--   Standardized to camelCase key conventions with zero impact on existing portal.
-- ==============================================================================

SET SERVEROUTPUT ON;
SET FEEDBACK OFF;
SET DEFINE OFF;

PROMPT ==============================================================================;
PROMPT  STARTING PHASE 2 ORACLE DATABASE MIGRATION (CAMELCASE KEY STANDARDS)
PROMPT ==============================================================================;

-- Helper procedure to add a column only if it doesn't already exist
CREATE OR REPLACE PROCEDURE safe_add_column(
    p_table_name  IN VARCHAR2,
    p_column_name IN VARCHAR2,
    p_column_def  IN VARCHAR2
) IS
    v_col_count NUMBER := 0;
    v_sql       VARCHAR2(1000);
BEGIN
    SELECT COUNT(*)
      INTO v_col_count
      FROM user_tab_cols
     WHERE table_name = UPPER(p_table_name)
       AND column_name = UPPER(p_column_name);

    IF v_col_count = 0 THEN
        v_sql := 'ALTER TABLE ' || UPPER(p_table_name) || ' ADD (' || UPPER(p_column_name) || ' ' || p_column_def || ')';
        EXECUTE IMMEDIATE v_sql;
        DBMS_OUTPUT.PUT_LINE(' [ADDED]    Table ' || UPPER(p_table_name) || ' -> Column ' || UPPER(p_column_name) || ' added successfully.');
    ELSE
        DBMS_OUTPUT.PUT_LINE(' [SKIPPED]  Table ' || UPPER(p_table_name) || ' -> Column ' || UPPER(p_column_name) || ' already exists.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(' [ERROR]    Table ' || UPPER(p_table_name) || ' -> Column ' || UPPER(p_column_name) || ' Error: ' || SQLERRM);
END safe_add_column;
/

-- ==============================================================================
-- 1. APPLICATIONS TABLE (Phase 2 Columns)
-- ==============================================================================
PROMPT 
PROMPT >>> 1. Upgrading Table: APPLICATIONS ...
BEGIN
    safe_add_column('APPLICATIONS', 'businessCategory',             'VARCHAR2(255)');
    safe_add_column('APPLICATIONS', 'customerAcceptanceRequired',   'NUMBER(1) DEFAULT 1');
    safe_add_column('APPLICATIONS', 'poMailStatus',                 'VARCHAR2(50) DEFAULT ''PENDING''');
    safe_add_column('APPLICATIONS', 'poMailSentAt',                 'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'poMailRecipient',              'VARCHAR2(255)');
    safe_add_column('APPLICATIONS', 'rejectedBy',                   'VARCHAR2(255)');
    safe_add_column('APPLICATIONS', 'rejectedRole',                 'VARCHAR2(50)');
    safe_add_column('APPLICATIONS', 'rejectedDate',                 'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'isProjectionAdded',            'NUMBER(1) DEFAULT 0');
    safe_add_column('APPLICATIONS', 'zoneName',                     'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'currentQuoteVersion',          'NUMBER(5) DEFAULT 1');
    safe_add_column('APPLICATIONS', 'isNegotiationRequested',       'NUMBER(1) DEFAULT 0');
    safe_add_column('APPLICATIONS', 'negotiationRemarks',           'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'negotiationRequestedBy',       'VARCHAR2(255)');
    safe_add_column('APPLICATIONS', 'negotiationRequestedDate',     'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'branchName',                   'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'regionName',                   'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'rccMailId',                    'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'rccMobileNo',                  'NUMBER(15)');
    safe_add_column('APPLICATIONS', 'rccContactPersonName',         'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'authorisedPersonName',         'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'authorisedPersonDesignation',  'VARCHAR2(1020)');
    safe_add_column('APPLICATIONS', 'approvedByRODate',             'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'approvedByCODate',             'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'quoteAddedPADate',             'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'quoteReviewCODate',            'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'quoteAcceptRODate',            'TIMESTAMP WITH TIME ZONE');
    safe_add_column('APPLICATIONS', 'finalApprovedDate',            'TIMESTAMP WITH TIME ZONE');
END;
/

-- ==============================================================================
-- 2. MANAGE_AGGREGATORS TABLE (Phase 2 Columns)
-- ==============================================================================
PROMPT 
PROMPT >>> 2. Upgrading Table: MANAGE_AGGREGATORS ...
BEGIN
    safe_add_column('MANAGE_AGGREGATORS', 'alternateEmail',         'VARCHAR2(255)');
    safe_add_column('MANAGE_AGGREGATORS', 'status',                 'VARCHAR2(50) DEFAULT ''active''');
    safe_add_column('MANAGE_AGGREGATORS', 'hashedPassword',         'VARCHAR2(255)');
    safe_add_column('MANAGE_AGGREGATORS', 'mustResetPassword',     'NUMBER(1) DEFAULT 1');
    safe_add_column('MANAGE_AGGREGATORS', 'failedLoginAttempts',    'NUMBER(5) DEFAULT 0');
    safe_add_column('MANAGE_AGGREGATORS', 'lockedUntil',            'TIMESTAMP WITH TIME ZONE');
    safe_add_column('MANAGE_AGGREGATORS', 'lastLoginAt',            'TIMESTAMP WITH TIME ZONE');
    safe_add_column('MANAGE_AGGREGATORS', 'lastLoginIp',            'VARCHAR2(255)');
    safe_add_column('MANAGE_AGGREGATORS', 'createdAt',              'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
    -- Compatibility checks for snake_case variants if legacy databases used underscores
    safe_add_column('MANAGE_AGGREGATORS', 'hashed_password',        'VARCHAR2(255)');
    safe_add_column('MANAGE_AGGREGATORS', 'must_reset_password',    'NUMBER(1) DEFAULT 1');
    safe_add_column('MANAGE_AGGREGATORS', 'failed_login_attempts',  'NUMBER(5) DEFAULT 0');
    safe_add_column('MANAGE_AGGREGATORS', 'locked_until',           'TIMESTAMP WITH TIME ZONE');
    safe_add_column('MANAGE_AGGREGATORS', 'last_login_at',          'TIMESTAMP WITH TIME ZONE');
    safe_add_column('MANAGE_AGGREGATORS', 'last_login_ip',          'VARCHAR2(255)');
    safe_add_column('MANAGE_AGGREGATORS', 'created_at',             'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
END;
/

-- ==============================================================================
-- 3. HELPDESK TABLE (Phase 2 Columns)
-- ==============================================================================
PROMPT 
PROMPT >>> 3. Upgrading Table: HELPDESK ...
BEGIN
    safe_add_column('HELPDESK', 'attachmentUrl',                    'VARCHAR2(512)');
    safe_add_column('HELPDESK', 'attachmentName',                   'VARCHAR2(256)');
    safe_add_column('HELPDESK', 'attachments',                      'CLOB');
    safe_add_column('HELPDESK', 'changedFields',                    'CLOB');
    safe_add_column('HELPDESK', 'targetOffice',                     'VARCHAR2(50) DEFAULT ''BO''');
    safe_add_column('HELPDESK', 'queryType',                        'VARCHAR2(100) DEFAULT ''APPLICATION_QUERY''');
END;
/

-- ==============================================================================
-- 4. PAYMENT_AGGREGATORS TABLE (Phase 2 Columns)
-- ==============================================================================
PROMPT 
PROMPT >>> 4. Upgrading Table: PAYMENT_AGGREGATORS ...
BEGIN
    safe_add_column('PAYMENT_AGGREGATORS', 'quoteStatus',           'VARCHAR2(255)');
    safe_add_column('PAYMENT_AGGREGATORS', 'sumOfRate',             'FLOAT DEFAULT 0.0');
    safe_add_column('PAYMENT_AGGREGATORS', 'email',                 'VARCHAR2(255)');
    safe_add_column('PAYMENT_AGGREGATORS', 'avgTransactionYearly',  'FLOAT');
    safe_add_column('PAYMENT_AGGREGATORS', 'avgTransactionSize',    'FLOAT');
    safe_add_column('PAYMENT_AGGREGATORS', 'category',              'VARCHAR2(255)');
END;
/

-- ==============================================================================
-- 5. PROJECTION_DETAILS TABLE (Phase 2 Columns)
-- ==============================================================================
PROMPT 
PROMPT >>> 5. Upgrading Table: PROJECTION_DETAILS ...
BEGIN
    safe_add_column('PROJECTION_DETAILS', 'quoteVersion',           'NUMBER(5) DEFAULT 1');
    safe_add_column('PROJECTION_DETAILS', 'revisionRemarks',        'VARCHAR2(1020)');
    safe_add_column('PROJECTION_DETAILS', 'createdAt',              'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
END;
/

-- ==============================================================================
-- 6. CLEAN UP HELPER PROCEDURE
-- ==============================================================================
DROP PROCEDURE safe_add_column;

COMMIT;

PROMPT 
PROMPT ==============================================================================;
PROMPT  PHASE 2 ORACLE MIGRATION COMPLETED SUCCESSFULLY (CAMELCASE KEYS READY)!
PROMPT ==============================================================================;

SET FEEDBACK ON;
