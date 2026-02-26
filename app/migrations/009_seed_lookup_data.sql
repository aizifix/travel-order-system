-- ============================================================
-- Migration 009: Seed all lookup tables with initial data
-- Travel Order System — Master data from project context
-- ============================================================

-- -----------------------------------------------
-- Divisions (30 entries)
-- -----------------------------------------------
INSERT INTO `divisions` (`division_name`) VALUES
  ('ADMIN AND FINANCE DIVISION'),
  ('AGRIBUSINESS AND MARKETING ASSISTANCE DIVISION'),
  ('FIELD OPERATIONS DIVISION'),
  ('INTEGRATED LABORATORIES DIVISION'),
  ('OFFICE OF THE REGIONAL EXECUTIVE DIRECTOR'),
  ('OFFICE OF THE PROJECT DIRECTOR/DEPUTY PROJECT DIRECTOR (OPD/DPD)'),
  ('PLANNING MONITORING AND EVALUATION DIVISION'),
  ('REGIONAL AGRICULTURAL AND FISHERY COUNCIL'),
  ('REGIONAL CROP PROTECTION CENTER'),
  ('REGIONAL AGRICULTURAL AND FISHERIES INFORMATION SECTION'),
  ('REGIONAL AGRICULTURAL ENGINEERING DIVISION'),
  ('REGULATORY DIVISION'),
  ('RESEARCH DIVISION'),
  ('MINDANAO INCLUSIVE AGRICULTURE DEVELOPMENT PROJECT'),
  ('PHILIPPINE RURAL DEVELOPMENT PROJECT'),
  ('MIADP Component 1: Ancestral Domain Planning and Social Preparation'),
  ('MIADP Component 2: Resilient Ancestral Domain Agri-Fisheries Infrastructure'),
  ('MIADP Component 3: Ancestral Domain Agri-Fisheries Production and Enterprise Development'),
  ('MIADP Component 4: Project Management and Support, Monitoring, and Evaluation'),
  ('MIADP M&E'),
  ('MIADP SES'),
  ('MIADP PROCUREMENT'),
  ('MIADP ADMIN and FINANCE'),
  ('PRDP I-PLAN'),
  ('PRDP I-BUILD'),
  ('PRDP I-REAP'),
  ('PRDP I-SUPPORT'),
  ('RTD for OPERATION'),
  ('RTD for RESEARCH and REGULATION');

-- -----------------------------------------------
-- Employment Statuses (7 entries)
-- -----------------------------------------------
INSERT INTO `employment_statuses` (`employment_status_name`) VALUES
  ('REGULAR'),
  ('CONTRACT OF SERVICE'),
  ('JOB ORDER'),
  ('PRDP-COS'),
  ('MIADP-COS'),
  ('GOVERNMENT'),
  ('PRIVATE');

-- -----------------------------------------------
-- Designations (7 entries)
-- -----------------------------------------------
INSERT INTO `designations` (`designation_name`) VALUES
  ('COMPONENT HEAD'),
  ('DEPUTY PROJECT DIRECTOR'),
  ('DIVISION CHIEF'),
  ('OIC'),
  ('RTD for Operation'),
  ('RTD for Research and Regulation'),
  ('UNIT HEAD');

-- -----------------------------------------------
-- Travel Types (8 entries)
-- -----------------------------------------------
INSERT INTO `travel_types` (`travel_type_name`) VALUES
  ('Attendance to Trainings, Seminar'),
  ('Facilitator to Training and Seminar'),
  ('Monitoring of Programs/Projects'),
  ('To accompany Visitors'),
  ('To Submit Documents'),
  ('To Transport Staff (for Drivers)'),
  ('Other related Project Travel'),
  ('Other related Travel');

-- -----------------------------------------------
-- Transportations (4 entries)
-- -----------------------------------------------
INSERT INTO `transportations` (`transportation_name`) VALUES
  ('PUJ/Bus'),
  ('Plane'),
  ('Boat'),
  ('RP');

-- -----------------------------------------------
-- Programs (38 entries)
-- -----------------------------------------------
INSERT INTO `programs` (`program_name`) VALUES
  ('4Ks - FOD'),
  ('AMIA PROGRAM'),
  ('BIDS and AWARDS COMMITTEE - GOODS'),
  ('CCAMIA'),
  ('CERRMU/FOD'),
  ('CFIDP'),
  ('COA'),
  ('CONVERGENCE'),
  ('CORN'),
  ('F2C2'),
  ('FMRDP'),
  ('GAD'),
  ('HVCDP'),
  ('I-PLAN Component'),
  ('LIVESTOCK'),
  ('MIADP'),
  ('NUPAP'),
  ('OA'),
  ('PRDP - IBUILD'),
  ('PRDP I-REAP'),
  ('PRDP I-SUPPORT'),
  ('PRDP - RPCO'),
  ('PRIME'),
  ('PRISM'),
  ('RICE'),
  ('RSBSA'),
  ('RSBSA - Geotagging'),
  ('RSL'),
  ('SAAD'),
  ('SPIS'),
  ('STO DOPP - FOD'),
  ('STO-ILD'),
  ('TECHNOLOGY BUSINESS INCUBATION PROGRAM (TBI)'),
  ('VPSS/IPM'),
  ('YOUTH PARTICIPANTS'),
  ('VARIOUS'),
  ('Other Programs and Projects'),
  ('Others');

-- -----------------------------------------------
-- Travel Statuses (TO lifecycle + special types)
-- -----------------------------------------------
INSERT INTO `travel_statuses` (`travel_status_name`, `travel_status_desc`) VALUES
  ('DRAFT',                'Travel order created but not yet submitted'),
  ('PENDING',              'Submitted and awaiting first approval'),
  ('STEP1_APPROVED',       'Recommending approval granted, awaiting final approval'),
  ('APPROVED',             'Final approval granted — ready for print/export'),
  ('REJECTED',             'Travel order rejected by an approver'),
  ('RETURNED',             'Returned to requester for revision'),
  ('CANCELLED',            'Travel order cancelled by requester or admin'),
  ('EXTENSION',            'Approved travel order extension'),
  ('ADDITIONAL_DEST',      'Additional destinations to approved travel order'),
  ('RESCHEDULED',          'Reschedule of cancelled travel order');
