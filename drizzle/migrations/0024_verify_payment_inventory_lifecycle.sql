DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.test_payment_inventory_regression()'::regprocedure) INTO definition;
 definition:=replace(definition,'PERFORM set_config(''request.jwt.claims'',''{}'',true);','PERFORM set_config(''request.jwt.claims'',''{}'',true); token:=gen_random_uuid();');
 EXECUTE definition;
 IF public.test_payment_inventory_regression() IS DISTINCT FROM true THEN RAISE EXCEPTION 'Payment inventory regression failed'; END IF;
END $$;