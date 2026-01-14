-- Insert new landing page settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('landing_price', '1600'),
  ('landing_original_price', '5894'),
  ('landing_installments', '12x de R$ 162,81'),
  ('landing_payment_link', 'https://mpago.la/1KiNKG2'),
  ('landing_special_condition', 'janeiro')
ON CONFLICT (setting_key) DO NOTHING;