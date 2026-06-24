alter table "public"."frame"
  add constraint "frame_user_fkey"
  foreign key ("user")
  references "auth"."users"
  ("id") on update restrict on delete restrict;
