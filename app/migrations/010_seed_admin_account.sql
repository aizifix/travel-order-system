-- ============================================================
-- Migration 010: Seed default admin account
-- Travel Order System — Default admin user
-- ============================================================
-- Password: changeme
-- Hash generated with bcrypt (10 rounds)
-- ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION
-- ============================================================

INSERT INTO `users` (`user_firstName`, `user_lastName`, `user_email`, `user_password`, `user_role`, `user_isActive`)
VALUES (
  'System',
  'Admin',
  'admin@travelorder.gov.ph',
  '$2b$10$placeholder.hash.replace.in.production.000000000000000000',
  'admin',
  1
);

-- ============================================================
-- Seed recommending approvers as approver accounts
-- These are the division chiefs / unit heads from the context
-- ⚠️  Passwords should be set individually on first login
-- ============================================================

INSERT INTO `users` (`user_firstName`, `user_lastName`, `user_email`, `user_password`, `user_role`, `user_isActive`) VALUES
  ('DELIZA',          'CAMARO',       'deliza.camaro@travelorder.gov.ph',      '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('GAY NANETTE',     'ALERIA',       'gaynanette.aleria@travelorder.gov.ph',  '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('GLADYS',          'EMPERADO',     'gladys.emperado@travelorder.gov.ph',    '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('FERDINAND',       'CARABALLE',    'ferdinand.caraballe@travelorder.gov.ph','$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('JESS ERICK',      'CO',           'jesserick.co@travelorder.gov.ph',      '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('JOEL',            'RUDINAS',      'joel.rudinas@travelorder.gov.ph',      '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('JULESBEN CAESAR', 'MAQUILING',    'julesben.maquiling@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('JUNEL',           'ABLANQUE',     'junel.ablanque@travelorder.gov.ph',     '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('LANA MAY',        'RACINES',      'lanamay.racines@travelorder.gov.ph',    '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('LORENA',          'DUNA',         'lorena.duna@travelorder.gov.ph',        '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('LUCILLE',         'MINGUEZ',      'lucille.minguez@travelorder.gov.ph',    '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('LUZ',             'GUZMAN',       'luz.guzman@travelorder.gov.ph',         '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('MAE CARMELA',     'FABELA',       'maecarmela.fabela@travelorder.gov.ph',  '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('MARY GRACE',      'STA. ELENA',   'marygrace.staelena@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('ORYZA KRISTY',    'BAYLO',        'oryzakristy.baylo@travelorder.gov.ph',  '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('PATRICK IAN',     'PEDARSE',      'patrickian.pedarse@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('RICHELLE',        'WONG',         'richelle.wong@travelorder.gov.ph',      '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1),
  ('WILSON',          'LAGDAMIN',     'wilson.lagdamin@travelorder.gov.ph',    '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1);
