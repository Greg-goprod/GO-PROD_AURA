-- Locks a batch of 'pending' rows for a company by marking them 'processing' atomically.
CREATE OR REPLACE FUNCTION public.lock_enrich_batch(_company_id uuid, _limit int DEFAULT 10)
RETURNS TABLE (id uuid, artist_id uuid, company_id uuid, priority text, retries int, attempts int)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id
    FROM public.artist_enrich_queue
    WHERE company_id = _company_id
      AND status = 'pending'
    ORDER BY
      CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
      created_at
    LIMIT _limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.artist_enrich_queue q
  SET status='processing', last_try=now(), attempts=q.attempts+1, updated_at=now()
  FROM picked
  WHERE q.id = picked.id
  RETURNING q.id, q.artist_id, q.company_id, q.priority::text, q.retries, q.attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_enrich_batch(uuid,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_enrich_batch(uuid,int) TO service_role;

