# Database rule tests

`rules_test.sql` runs the database rules (discount band, double booking, the 4-hour cancellation cutoff, permissions) against a plain local Postgres. `local_auth_stub.sql` stands in for Supabase's login system.

```bash
createdb pb_test
psql -d pb_test -f supabase/tests/local_auth_stub.sql -f supabase/migrations/20261104000000_initial_schema.sql -c "grant select,insert,update,delete on all tables in schema public to anon, authenticated"
psql -d pb_test -f supabase/tests/rules_test.sql
```
