alter table "public"."frame"
  add constraint "frames_user_fkey"
  foreign key ("user")
  references "auth"."users"
  ("id") on update restrict on delete restrict;
