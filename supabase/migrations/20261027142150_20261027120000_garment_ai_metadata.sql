/*
# Add garment AI metadata

1. New columns on `garments`
- `season`: one of Primavera/Estate, Autunno/Inverno, Quattro stagioni.
- `material`: one of Cotone, Lino, Denim, Lana, Poliestere, Misto, Pelle / Camoscio.
- `avatar_section`: busto, gambe, or scarpe, used to place the garment in virtual try-on prompts.

2. Modified table
- Adds only nullable metadata columns to `garments`; existing wardrobe rows and all existing values remain unchanged.

3. Security
- No new tables or policies are introduced. Existing owner-scoped RLS policies on `garments` continue to protect these columns.

4. Important notes
- Columns are nullable so existing records remain valid and can be enriched when edited or reanalyzed.
- The application validates and normalizes AI labels before saving them.
*/

ALTER TABLE garments ADD COLUMN IF NOT EXISTS season text;
ALTER TABLE garments ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE garments ADD COLUMN IF NOT EXISTS avatar_section text;