-- Sample catalog so Shop / Designs / Builder work before admin adds real items.
-- Run AFTER schema2.sql. Safe to re-run (idempotent via slug / name checks).

-- Categories
insert into public.categories (name, slug, kind) values
  ('Kurtis', 'kurtis', 'product'),
  ('Salwar Suits', 'salwar-suits', 'product'),
  ('Gowns', 'gowns', 'product'),
  ('Plazo Sets', 'plazo-sets', 'product')
on conflict (slug) do nothing;

-- Products (images empty → UI shows elegant placeholder)
insert into public.products (category_id, name, description, price, mrp, sizes, stock, available)
select c.id, p.name, p.description, p.price, p.mrp, p.sizes::text[], p.stock, true
from public.categories c
join (values
  ('kurtis', 'Festive Rayon Kurti', 'Comfortable daily-wear kurti with lace detailing.', 799, 999, '{S,M,L,XL,XXL}', 12),
  ('kurtis', 'Handloom Cotton Kurti', 'Breathable handloom cotton, perfect for Nagpur summers.', 699, 899, '{S,M,L,XL}', 8),
  ('salwar-suits', 'Classic Salwar Suit', 'Three-piece suit with printed dupatta.', 1499, 1899, '{S,M,L,XL,XXL}', 6),
  ('gowns', 'Evening Anarkali Gown', 'Flowy anarkali gown for weddings and functions.', 2499, 2999, '{M,L,XL}', 4),
  ('plazo-sets', 'Kurti + Plazo Set', 'Matching kurti-plazo combo in soft crepe.', 1199, 1499, '{S,M,L,XL,XXL}', 10),
  ('salwar-suits', 'Pant Kurti Set', 'Modern straight pant with long kurti.', 1299, 1599, '{S,M,L,XL}', 7)
) as p(slug, name, description, price, mrp, sizes, stock)
on p.slug = c.slug
where not exists (select 1 from public.products where name = p.name);

-- Materials for the dress builder
insert into public.materials (kind, name, description, price_addon, available) values
  ('fabric', 'Pure Cotton', 'Soft breathable cotton, ideal for daily wear.', 0, true),
  ('fabric', 'Rayon Crepe', 'Flowy drape for kurtis and gowns.', 100, true),
  ('fabric', 'Georgette', 'Lightweight sheer fabric for festive wear.', 200, true),
  ('fabric', 'Silk Blend', 'Rich festive silk-blend fabric.', 400, true),
  ('neck_front', 'Round Neck', 'Classic round front neckline.', 0, true),
  ('neck_front', 'V-Neck', 'Elegant V front neckline.', 50, true),
  ('neck_front', 'Boat Neck', 'Wide graceful boat neckline.', 50, true),
  ('neck_back', 'Deep Back with Latkan', 'Festive deep back with decorative latkan.', 100, true),
  ('neck_back', 'Buttoned Back', 'Simple buttoned back neckline.', 0, true),
  ('sleeve', 'Sleeveless', 'Clean sleeveless finish.', 0, true),
  ('sleeve', 'Short Sleeve', 'Classic short sleeve.', 0, true),
  ('sleeve', '3/4 Sleeve with Lace', 'Three-quarter sleeve with lace border.', 80, true),
  ('sleeve', 'Full Designer Sleeve', 'Full sleeve with pattern detailing.', 120, true),
  ('decorative', 'Zumka Latkan Pair', 'Traditional zumka latkans for back neck.', 150, true),
  ('decorative', 'Lace Border (per mtr)', 'Premium lace for sleeves and hem.', 60, true),
  ('decorative', 'Mirror Work Patch', 'Handcrafted mirror patch for yoke.', 180, true)
on conflict do nothing;

-- Transformation examples
insert into public.transformation_examples (title, dress_type, description) values
  ('Old Saree → Anarkali Gown', 'Gown', 'A treasured silk saree reborn as a festive anarkali gown. Bring your own saree!'),
  ('Leftover Fabric → Kurti + Plazo', 'Kurti Set', 'Dress material + old dupatta converted into a modern kurti-plazo set.'),
  ('Plain Suit → Designer Suit', 'Salwar Suit', 'Simple suit upgraded with neck redesign, lace sleeves and latkans.')
on conflict do nothing;

-- Sample offer
insert into public.offers (title, description, conditions, active) values
  ('Festive Special — 1 Free Stitching on 4 Dresses',
   'Get one blouse stitching absolutely free when you order 4 or more dresses in a single booking.',
   'Valid on stitching orders only. Free item is the lowest-priced blouse in your order. Mention this offer while booking.',
   true)
on conflict do nothing;
