-- Migration: Ajouter le champ fee_is_net à la table artist_performances
-- Date: 2025-11-17 14:02:16
-- Description: Ajoute une colonne boolean pour indiquer si le montant du cachet est net (true) ou brut (false)

-- Ajouter la colonne fee_is_net (par défaut false = montant brut) si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artist_performances' 
    AND column_name = 'fee_is_net'
  ) THEN
    ALTER TABLE artist_performances
    ADD COLUMN fee_is_net BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Commentaire sur la colonne
COMMENT ON COLUMN artist_performances.fee_is_net IS 'Indique si le montant du cachet est net (true) ou brut (false). Par défaut: false (brut)';

