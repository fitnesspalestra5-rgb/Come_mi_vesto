/*
# Save every detected color of a garment

1. Modified tables
- `garments`: new nullable column `colors` (jsonb). It stores the list of
  detected colors as objects with `name` and `hex`, up to 3 per garment.

2. Notes
- Existing rows are untouched: `colors` stays NULL for them and the app keeps
  using `color` and `color_hex` as before.
- No data is deleted or changed.

3. Security
- No change to RLS policies or grants. The column inherits the table's existing
  access rules, which already restrict each user to their own garments.
*/

ALTER TABLE garments ADD COLUMN IF NOT EXISTS colors jsonb;
