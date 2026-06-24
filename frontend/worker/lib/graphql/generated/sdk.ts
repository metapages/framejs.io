/* eslint-disable */
import { GraphQLClient, RequestOptions } from "graphql-request";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> =
  & Omit<T, K>
  & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> =
  & Omit<T, K>
  & { [SubKey in K]: Maybe<T[SubKey]> };
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  bigint: any;
  bytea: any;
  citext: any;
  jsonb: any;
  timestamptz: any;
  uuid: any;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: Maybe<Scalars["Boolean"]>;
  _gt?: Maybe<Scalars["Boolean"]>;
  _gte?: Maybe<Scalars["Boolean"]>;
  _in?: Maybe<Array<Scalars["Boolean"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["Boolean"]>;
  _lte?: Maybe<Scalars["Boolean"]>;
  _neq?: Maybe<Scalars["Boolean"]>;
  _nin?: Maybe<Array<Scalars["Boolean"]>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: Maybe<Scalars["Int"]>;
  _gt?: Maybe<Scalars["Int"]>;
  _gte?: Maybe<Scalars["Int"]>;
  _in?: Maybe<Array<Scalars["Int"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["Int"]>;
  _lte?: Maybe<Scalars["Int"]>;
  _neq?: Maybe<Scalars["Int"]>;
  _nin?: Maybe<Array<Scalars["Int"]>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Array_Comparison_Exp = {
  /** is the array contained in the given array value */
  _contained_in?: Maybe<Array<Scalars["String"]>>;
  /** does the array contain the given value */
  _contains?: Maybe<Array<Scalars["String"]>>;
  _eq?: Maybe<Array<Scalars["String"]>>;
  _gt?: Maybe<Array<Scalars["String"]>>;
  _gte?: Maybe<Array<Scalars["String"]>>;
  _in?: Maybe<Array<Array<Scalars["String"]>>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Array<Scalars["String"]>>;
  _lte?: Maybe<Array<Scalars["String"]>>;
  _neq?: Maybe<Array<Scalars["String"]>>;
  _nin?: Maybe<Array<Array<Scalars["String"]>>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: Maybe<Scalars["String"]>;
  _gt?: Maybe<Scalars["String"]>;
  _gte?: Maybe<Scalars["String"]>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: Maybe<Scalars["String"]>;
  _in?: Maybe<Array<Scalars["String"]>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: Maybe<Scalars["String"]>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  /** does the column match the given pattern */
  _like?: Maybe<Scalars["String"]>;
  _lt?: Maybe<Scalars["String"]>;
  _lte?: Maybe<Scalars["String"]>;
  _neq?: Maybe<Scalars["String"]>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: Maybe<Scalars["String"]>;
  _nin?: Maybe<Array<Scalars["String"]>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: Maybe<Scalars["String"]>;
  /** does the column NOT match the given pattern */
  _nlike?: Maybe<Scalars["String"]>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: Maybe<Scalars["String"]>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: Maybe<Scalars["String"]>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: Maybe<Scalars["String"]>;
  /** does the column match the given SQL regular expression */
  _similar?: Maybe<Scalars["String"]>;
};

/** In-flight OAuth2 authorization requests. */
export type AuthOauth2AuthRequests = {
  __typename?: "authOauth2AuthRequests";
  authTime?: Maybe<Scalars["timestamptz"]>;
  /** An array relationship */
  authorizationCodes: Array<AuthOauth2AuthorizationCodes>;
  /** An aggregate relationship */
  authorizationCodes_aggregate: AuthOauth2AuthorizationCodes_Aggregate;
  /** An object relationship */
  client: AuthOauth2Clients;
  clientId: Scalars["String"];
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt: Scalars["timestamptz"];
  done: Scalars["Boolean"];
  expiresAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
  nonce?: Maybe<Scalars["String"]>;
  redirectUri: Scalars["String"];
  /** An array relationship */
  refreshTokens: Array<AuthOauth2RefreshTokens>;
  /** An aggregate relationship */
  refreshTokens_aggregate: AuthOauth2RefreshTokens_Aggregate;
  resource?: Maybe<Scalars["String"]>;
  responseType: Scalars["String"];
  scopes: Array<Scalars["String"]>;
  state?: Maybe<Scalars["String"]>;
  /** An object relationship */
  user?: Maybe<Users>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** In-flight OAuth2 authorization requests. */
export type AuthOauth2AuthRequestsAuthorizationCodesArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

/** In-flight OAuth2 authorization requests. */
export type AuthOauth2AuthRequestsAuthorizationCodes_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

/** In-flight OAuth2 authorization requests. */
export type AuthOauth2AuthRequestsRefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** In-flight OAuth2 authorization requests. */
export type AuthOauth2AuthRequestsRefreshTokens_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** aggregated selection of "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Aggregate = {
  __typename?: "authOauth2AuthRequests_aggregate";
  aggregate?: Maybe<AuthOauth2AuthRequests_Aggregate_Fields>;
  nodes: Array<AuthOauth2AuthRequests>;
};

export type AuthOauth2AuthRequests_Aggregate_Bool_Exp = {
  bool_and?: Maybe<AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: Maybe<AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_Or>;
  count?: Maybe<AuthOauth2AuthRequests_Aggregate_Bool_Exp_Count>;
};

export type AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_And = {
  arguments:
    AuthOauth2AuthRequests_Select_Column_AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_Or = {
  arguments:
    AuthOauth2AuthRequests_Select_Column_AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type AuthOauth2AuthRequests_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Aggregate_Fields = {
  __typename?: "authOauth2AuthRequests_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthOauth2AuthRequests_Max_Fields>;
  min?: Maybe<AuthOauth2AuthRequests_Min_Fields>;
};

/** aggregate fields of "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthOauth2AuthRequests_Max_Order_By>;
  min?: Maybe<AuthOauth2AuthRequests_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Arr_Rel_Insert_Input = {
  data: Array<AuthOauth2AuthRequests_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthOauth2AuthRequests_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.oauth2_auth_requests". All fields are combined with a logical 'AND'. */
export type AuthOauth2AuthRequests_Bool_Exp = {
  _and?: Maybe<Array<AuthOauth2AuthRequests_Bool_Exp>>;
  _not?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  _or?: Maybe<Array<AuthOauth2AuthRequests_Bool_Exp>>;
  authTime?: Maybe<Timestamptz_Comparison_Exp>;
  authorizationCodes?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
  authorizationCodes_aggregate?: Maybe<
    AuthOauth2AuthorizationCodes_Aggregate_Bool_Exp
  >;
  client?: Maybe<AuthOauth2Clients_Bool_Exp>;
  clientId?: Maybe<String_Comparison_Exp>;
  codeChallenge?: Maybe<String_Comparison_Exp>;
  codeChallengeMethod?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  done?: Maybe<Boolean_Comparison_Exp>;
  expiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  nonce?: Maybe<String_Comparison_Exp>;
  redirectUri?: Maybe<String_Comparison_Exp>;
  refreshTokens?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
  refreshTokens_aggregate?: Maybe<AuthOauth2RefreshTokens_Aggregate_Bool_Exp>;
  resource?: Maybe<String_Comparison_Exp>;
  responseType?: Maybe<String_Comparison_Exp>;
  scopes?: Maybe<String_Array_Comparison_Exp>;
  state?: Maybe<String_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.oauth2_auth_requests" */
export enum AuthOauth2AuthRequests_Constraint {
  /** unique or primary key constraint on columns "id" */
  Oauth2AuthRequestsPkey = "oauth2_auth_requests_pkey",
}

/** input type for inserting data into table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Insert_Input = {
  authTime?: Maybe<Scalars["timestamptz"]>;
  authorizationCodes?: Maybe<AuthOauth2AuthorizationCodes_Arr_Rel_Insert_Input>;
  client?: Maybe<AuthOauth2Clients_Obj_Rel_Insert_Input>;
  clientId?: Maybe<Scalars["String"]>;
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  done?: Maybe<Scalars["Boolean"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  nonce?: Maybe<Scalars["String"]>;
  redirectUri?: Maybe<Scalars["String"]>;
  refreshTokens?: Maybe<AuthOauth2RefreshTokens_Arr_Rel_Insert_Input>;
  resource?: Maybe<Scalars["String"]>;
  responseType?: Maybe<Scalars["String"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  state?: Maybe<Scalars["String"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthOauth2AuthRequests_Max_Fields = {
  __typename?: "authOauth2AuthRequests_max_fields";
  authTime?: Maybe<Scalars["timestamptz"]>;
  clientId?: Maybe<Scalars["String"]>;
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  nonce?: Maybe<Scalars["String"]>;
  redirectUri?: Maybe<Scalars["String"]>;
  resource?: Maybe<Scalars["String"]>;
  responseType?: Maybe<Scalars["String"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  state?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Max_Order_By = {
  authTime?: Maybe<Order_By>;
  clientId?: Maybe<Order_By>;
  codeChallenge?: Maybe<Order_By>;
  codeChallengeMethod?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nonce?: Maybe<Order_By>;
  redirectUri?: Maybe<Order_By>;
  resource?: Maybe<Order_By>;
  responseType?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  state?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthOauth2AuthRequests_Min_Fields = {
  __typename?: "authOauth2AuthRequests_min_fields";
  authTime?: Maybe<Scalars["timestamptz"]>;
  clientId?: Maybe<Scalars["String"]>;
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  nonce?: Maybe<Scalars["String"]>;
  redirectUri?: Maybe<Scalars["String"]>;
  resource?: Maybe<Scalars["String"]>;
  responseType?: Maybe<Scalars["String"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  state?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Min_Order_By = {
  authTime?: Maybe<Order_By>;
  clientId?: Maybe<Order_By>;
  codeChallenge?: Maybe<Order_By>;
  codeChallengeMethod?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nonce?: Maybe<Order_By>;
  redirectUri?: Maybe<Order_By>;
  resource?: Maybe<Order_By>;
  responseType?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  state?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Mutation_Response = {
  __typename?: "authOauth2AuthRequests_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthOauth2AuthRequests>;
};

/** input type for inserting object relation for remote table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Obj_Rel_Insert_Input = {
  data: AuthOauth2AuthRequests_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<AuthOauth2AuthRequests_On_Conflict>;
};

/** on_conflict condition type for table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_On_Conflict = {
  constraint: AuthOauth2AuthRequests_Constraint;
  update_columns?: Array<AuthOauth2AuthRequests_Update_Column>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.oauth2_auth_requests". */
export type AuthOauth2AuthRequests_Order_By = {
  authTime?: Maybe<Order_By>;
  authorizationCodes_aggregate?: Maybe<
    AuthOauth2AuthorizationCodes_Aggregate_Order_By
  >;
  client?: Maybe<AuthOauth2Clients_Order_By>;
  clientId?: Maybe<Order_By>;
  codeChallenge?: Maybe<Order_By>;
  codeChallengeMethod?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  done?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nonce?: Maybe<Order_By>;
  redirectUri?: Maybe<Order_By>;
  refreshTokens_aggregate?: Maybe<AuthOauth2RefreshTokens_Aggregate_Order_By>;
  resource?: Maybe<Order_By>;
  responseType?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  state?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.oauth2_auth_requests */
export type AuthOauth2AuthRequests_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.oauth2_auth_requests" */
export enum AuthOauth2AuthRequests_Select_Column {
  /** column name */
  AuthTime = "authTime",
  /** column name */
  ClientId = "clientId",
  /** column name */
  CodeChallenge = "codeChallenge",
  /** column name */
  CodeChallengeMethod = "codeChallengeMethod",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Done = "done",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Nonce = "nonce",
  /** column name */
  RedirectUri = "redirectUri",
  /** column name */
  Resource = "resource",
  /** column name */
  ResponseType = "responseType",
  /** column name */
  Scopes = "scopes",
  /** column name */
  State = "state",
  /** column name */
  UserId = "userId",
}

/** select "authOauth2AuthRequests_aggregate_bool_exp_bool_and_arguments_columns" columns of table "auth.oauth2_auth_requests" */
export enum AuthOauth2AuthRequests_Select_Column_AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  Done = "done",
}

/** select "authOauth2AuthRequests_aggregate_bool_exp_bool_or_arguments_columns" columns of table "auth.oauth2_auth_requests" */
export enum AuthOauth2AuthRequests_Select_Column_AuthOauth2AuthRequests_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  Done = "done",
}

/** input type for updating data in table "auth.oauth2_auth_requests" */
export type AuthOauth2AuthRequests_Set_Input = {
  authTime?: Maybe<Scalars["timestamptz"]>;
  clientId?: Maybe<Scalars["String"]>;
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  done?: Maybe<Scalars["Boolean"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  nonce?: Maybe<Scalars["String"]>;
  redirectUri?: Maybe<Scalars["String"]>;
  resource?: Maybe<Scalars["String"]>;
  responseType?: Maybe<Scalars["String"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  state?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authOauth2AuthRequests" */
export type AuthOauth2AuthRequests_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthOauth2AuthRequests_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthOauth2AuthRequests_Stream_Cursor_Value_Input = {
  authTime?: Maybe<Scalars["timestamptz"]>;
  clientId?: Maybe<Scalars["String"]>;
  codeChallenge?: Maybe<Scalars["String"]>;
  codeChallengeMethod?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  done?: Maybe<Scalars["Boolean"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  nonce?: Maybe<Scalars["String"]>;
  redirectUri?: Maybe<Scalars["String"]>;
  resource?: Maybe<Scalars["String"]>;
  responseType?: Maybe<Scalars["String"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  state?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.oauth2_auth_requests" */
export enum AuthOauth2AuthRequests_Update_Column {
  /** column name */
  AuthTime = "authTime",
  /** column name */
  ClientId = "clientId",
  /** column name */
  CodeChallenge = "codeChallenge",
  /** column name */
  CodeChallengeMethod = "codeChallengeMethod",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Done = "done",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Nonce = "nonce",
  /** column name */
  RedirectUri = "redirectUri",
  /** column name */
  Resource = "resource",
  /** column name */
  ResponseType = "responseType",
  /** column name */
  Scopes = "scopes",
  /** column name */
  State = "state",
  /** column name */
  UserId = "userId",
}

export type AuthOauth2AuthRequests_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthOauth2AuthRequests_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthOauth2AuthRequests_Bool_Exp;
};

/** OAuth2 authorization codes pending exchange for tokens. */
export type AuthOauth2AuthorizationCodes = {
  __typename?: "authOauth2AuthorizationCodes";
  /** An object relationship */
  authRequest: AuthOauth2AuthRequests;
  authRequestId: Scalars["uuid"];
  codeHash: Scalars["String"];
  createdAt: Scalars["timestamptz"];
  expiresAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
};

/** aggregated selection of "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Aggregate = {
  __typename?: "authOauth2AuthorizationCodes_aggregate";
  aggregate?: Maybe<AuthOauth2AuthorizationCodes_Aggregate_Fields>;
  nodes: Array<AuthOauth2AuthorizationCodes>;
};

export type AuthOauth2AuthorizationCodes_Aggregate_Bool_Exp = {
  count?: Maybe<AuthOauth2AuthorizationCodes_Aggregate_Bool_Exp_Count>;
};

export type AuthOauth2AuthorizationCodes_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Aggregate_Fields = {
  __typename?: "authOauth2AuthorizationCodes_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthOauth2AuthorizationCodes_Max_Fields>;
  min?: Maybe<AuthOauth2AuthorizationCodes_Min_Fields>;
};

/** aggregate fields of "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthOauth2AuthorizationCodes_Max_Order_By>;
  min?: Maybe<AuthOauth2AuthorizationCodes_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Arr_Rel_Insert_Input = {
  data: Array<AuthOauth2AuthorizationCodes_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthOauth2AuthorizationCodes_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.oauth2_authorization_codes". All fields are combined with a logical 'AND'. */
export type AuthOauth2AuthorizationCodes_Bool_Exp = {
  _and?: Maybe<Array<AuthOauth2AuthorizationCodes_Bool_Exp>>;
  _not?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
  _or?: Maybe<Array<AuthOauth2AuthorizationCodes_Bool_Exp>>;
  authRequest?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  authRequestId?: Maybe<Uuid_Comparison_Exp>;
  codeHash?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  expiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.oauth2_authorization_codes" */
export enum AuthOauth2AuthorizationCodes_Constraint {
  /** unique or primary key constraint on columns "code_hash" */
  Oauth2AuthorizationCodesCodeHashKey =
    "oauth2_authorization_codes_code_hash_key",
  /** unique or primary key constraint on columns "id" */
  Oauth2AuthorizationCodesPkey = "oauth2_authorization_codes_pkey",
}

/** input type for inserting data into table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Insert_Input = {
  authRequest?: Maybe<AuthOauth2AuthRequests_Obj_Rel_Insert_Input>;
  authRequestId?: Maybe<Scalars["uuid"]>;
  codeHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthOauth2AuthorizationCodes_Max_Fields = {
  __typename?: "authOauth2AuthorizationCodes_max_fields";
  authRequestId?: Maybe<Scalars["uuid"]>;
  codeHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Max_Order_By = {
  authRequestId?: Maybe<Order_By>;
  codeHash?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthOauth2AuthorizationCodes_Min_Fields = {
  __typename?: "authOauth2AuthorizationCodes_min_fields";
  authRequestId?: Maybe<Scalars["uuid"]>;
  codeHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Min_Order_By = {
  authRequestId?: Maybe<Order_By>;
  codeHash?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Mutation_Response = {
  __typename?: "authOauth2AuthorizationCodes_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthOauth2AuthorizationCodes>;
};

/** on_conflict condition type for table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_On_Conflict = {
  constraint: AuthOauth2AuthorizationCodes_Constraint;
  update_columns?: Array<AuthOauth2AuthorizationCodes_Update_Column>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.oauth2_authorization_codes". */
export type AuthOauth2AuthorizationCodes_Order_By = {
  authRequest?: Maybe<AuthOauth2AuthRequests_Order_By>;
  authRequestId?: Maybe<Order_By>;
  codeHash?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.oauth2_authorization_codes */
export type AuthOauth2AuthorizationCodes_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.oauth2_authorization_codes" */
export enum AuthOauth2AuthorizationCodes_Select_Column {
  /** column name */
  AuthRequestId = "authRequestId",
  /** column name */
  CodeHash = "codeHash",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
}

/** input type for updating data in table "auth.oauth2_authorization_codes" */
export type AuthOauth2AuthorizationCodes_Set_Input = {
  authRequestId?: Maybe<Scalars["uuid"]>;
  codeHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authOauth2AuthorizationCodes" */
export type AuthOauth2AuthorizationCodes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthOauth2AuthorizationCodes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthOauth2AuthorizationCodes_Stream_Cursor_Value_Input = {
  authRequestId?: Maybe<Scalars["uuid"]>;
  codeHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.oauth2_authorization_codes" */
export enum AuthOauth2AuthorizationCodes_Update_Column {
  /** column name */
  AuthRequestId = "authRequestId",
  /** column name */
  CodeHash = "codeHash",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
}

export type AuthOauth2AuthorizationCodes_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthOauth2AuthorizationCodes_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthOauth2AuthorizationCodes_Bool_Exp;
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2Clients = {
  __typename?: "authOauth2Clients";
  /** An array relationship */
  authRequests: Array<AuthOauth2AuthRequests>;
  /** An aggregate relationship */
  authRequests_aggregate: AuthOauth2AuthRequests_Aggregate;
  clientId: Scalars["String"];
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt: Scalars["timestamptz"];
  createdBy?: Maybe<Scalars["uuid"]>;
  /** An object relationship */
  createdByUser?: Maybe<Users>;
  metadata?: Maybe<Scalars["jsonb"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  /** An array relationship */
  oauth2RefreshTokens: Array<AuthOauth2RefreshTokens>;
  /** An aggregate relationship */
  oauth2RefreshTokens_aggregate: AuthOauth2RefreshTokens_Aggregate;
  redirectUris: Array<Scalars["String"]>;
  scopes: Array<Scalars["String"]>;
  type: Scalars["String"];
  updatedAt: Scalars["timestamptz"];
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2ClientsAuthRequestsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2ClientsAuthRequests_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2ClientsMetadataArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2ClientsOauth2RefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** Registered OAuth2 client applications for the identity provider. */
export type AuthOauth2ClientsOauth2RefreshTokens_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** aggregated selection of "auth.oauth2_clients" */
export type AuthOauth2Clients_Aggregate = {
  __typename?: "authOauth2Clients_aggregate";
  aggregate?: Maybe<AuthOauth2Clients_Aggregate_Fields>;
  nodes: Array<AuthOauth2Clients>;
};

/** aggregate fields of "auth.oauth2_clients" */
export type AuthOauth2Clients_Aggregate_Fields = {
  __typename?: "authOauth2Clients_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthOauth2Clients_Max_Fields>;
  min?: Maybe<AuthOauth2Clients_Min_Fields>;
};

/** aggregate fields of "auth.oauth2_clients" */
export type AuthOauth2Clients_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthOauth2Clients_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type AuthOauth2Clients_Append_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** Boolean expression to filter rows from the table "auth.oauth2_clients". All fields are combined with a logical 'AND'. */
export type AuthOauth2Clients_Bool_Exp = {
  _and?: Maybe<Array<AuthOauth2Clients_Bool_Exp>>;
  _not?: Maybe<AuthOauth2Clients_Bool_Exp>;
  _or?: Maybe<Array<AuthOauth2Clients_Bool_Exp>>;
  authRequests?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  authRequests_aggregate?: Maybe<AuthOauth2AuthRequests_Aggregate_Bool_Exp>;
  clientId?: Maybe<String_Comparison_Exp>;
  clientSecretHash?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  createdBy?: Maybe<Uuid_Comparison_Exp>;
  createdByUser?: Maybe<Users_Bool_Exp>;
  metadata?: Maybe<Jsonb_Comparison_Exp>;
  metadataDocumentFetchedAt?: Maybe<Timestamptz_Comparison_Exp>;
  oauth2RefreshTokens?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
  oauth2RefreshTokens_aggregate?: Maybe<
    AuthOauth2RefreshTokens_Aggregate_Bool_Exp
  >;
  redirectUris?: Maybe<String_Array_Comparison_Exp>;
  scopes?: Maybe<String_Array_Comparison_Exp>;
  type?: Maybe<String_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.oauth2_clients" */
export enum AuthOauth2Clients_Constraint {
  /** unique or primary key constraint on columns "client_id" */
  Oauth2ClientsPkey = "oauth2_clients_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type AuthOauth2Clients_Delete_At_Path_Input = {
  metadata?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type AuthOauth2Clients_Delete_Elem_Input = {
  metadata?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type AuthOauth2Clients_Delete_Key_Input = {
  metadata?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "auth.oauth2_clients" */
export type AuthOauth2Clients_Insert_Input = {
  authRequests?: Maybe<AuthOauth2AuthRequests_Arr_Rel_Insert_Input>;
  clientId?: Maybe<Scalars["String"]>;
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  createdBy?: Maybe<Scalars["uuid"]>;
  createdByUser?: Maybe<Users_Obj_Rel_Insert_Input>;
  metadata?: Maybe<Scalars["jsonb"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  oauth2RefreshTokens?: Maybe<AuthOauth2RefreshTokens_Arr_Rel_Insert_Input>;
  redirectUris?: Maybe<Array<Scalars["String"]>>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  type?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type AuthOauth2Clients_Max_Fields = {
  __typename?: "authOauth2Clients_max_fields";
  clientId?: Maybe<Scalars["String"]>;
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  createdBy?: Maybe<Scalars["uuid"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  redirectUris?: Maybe<Array<Scalars["String"]>>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  type?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate min on columns */
export type AuthOauth2Clients_Min_Fields = {
  __typename?: "authOauth2Clients_min_fields";
  clientId?: Maybe<Scalars["String"]>;
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  createdBy?: Maybe<Scalars["uuid"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  redirectUris?: Maybe<Array<Scalars["String"]>>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  type?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** response of any mutation on the table "auth.oauth2_clients" */
export type AuthOauth2Clients_Mutation_Response = {
  __typename?: "authOauth2Clients_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthOauth2Clients>;
};

/** input type for inserting object relation for remote table "auth.oauth2_clients" */
export type AuthOauth2Clients_Obj_Rel_Insert_Input = {
  data: AuthOauth2Clients_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<AuthOauth2Clients_On_Conflict>;
};

/** on_conflict condition type for table "auth.oauth2_clients" */
export type AuthOauth2Clients_On_Conflict = {
  constraint: AuthOauth2Clients_Constraint;
  update_columns?: Array<AuthOauth2Clients_Update_Column>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.oauth2_clients". */
export type AuthOauth2Clients_Order_By = {
  authRequests_aggregate?: Maybe<AuthOauth2AuthRequests_Aggregate_Order_By>;
  clientId?: Maybe<Order_By>;
  clientSecretHash?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  createdBy?: Maybe<Order_By>;
  createdByUser?: Maybe<Users_Order_By>;
  metadata?: Maybe<Order_By>;
  metadataDocumentFetchedAt?: Maybe<Order_By>;
  oauth2RefreshTokens_aggregate?: Maybe<
    AuthOauth2RefreshTokens_Aggregate_Order_By
  >;
  redirectUris?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  type?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.oauth2_clients */
export type AuthOauth2Clients_Pk_Columns_Input = {
  clientId: Scalars["String"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type AuthOauth2Clients_Prepend_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "auth.oauth2_clients" */
export enum AuthOauth2Clients_Select_Column {
  /** column name */
  ClientId = "clientId",
  /** column name */
  ClientSecretHash = "clientSecretHash",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CreatedBy = "createdBy",
  /** column name */
  Metadata = "metadata",
  /** column name */
  MetadataDocumentFetchedAt = "metadataDocumentFetchedAt",
  /** column name */
  RedirectUris = "redirectUris",
  /** column name */
  Scopes = "scopes",
  /** column name */
  Type = "type",
  /** column name */
  UpdatedAt = "updatedAt",
}

/** input type for updating data in table "auth.oauth2_clients" */
export type AuthOauth2Clients_Set_Input = {
  clientId?: Maybe<Scalars["String"]>;
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  createdBy?: Maybe<Scalars["uuid"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  redirectUris?: Maybe<Array<Scalars["String"]>>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  type?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "authOauth2Clients" */
export type AuthOauth2Clients_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthOauth2Clients_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthOauth2Clients_Stream_Cursor_Value_Input = {
  clientId?: Maybe<Scalars["String"]>;
  clientSecretHash?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  createdBy?: Maybe<Scalars["uuid"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  metadataDocumentFetchedAt?: Maybe<Scalars["timestamptz"]>;
  redirectUris?: Maybe<Array<Scalars["String"]>>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  type?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "auth.oauth2_clients" */
export enum AuthOauth2Clients_Update_Column {
  /** column name */
  ClientId = "clientId",
  /** column name */
  ClientSecretHash = "clientSecretHash",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CreatedBy = "createdBy",
  /** column name */
  Metadata = "metadata",
  /** column name */
  MetadataDocumentFetchedAt = "metadataDocumentFetchedAt",
  /** column name */
  RedirectUris = "redirectUris",
  /** column name */
  Scopes = "scopes",
  /** column name */
  Type = "type",
  /** column name */
  UpdatedAt = "updatedAt",
}

export type AuthOauth2Clients_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<AuthOauth2Clients_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<AuthOauth2Clients_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<AuthOauth2Clients_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<AuthOauth2Clients_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<AuthOauth2Clients_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthOauth2Clients_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthOauth2Clients_Bool_Exp;
};

/** OAuth2 refresh tokens with client and scope binding. */
export type AuthOauth2RefreshTokens = {
  __typename?: "authOauth2RefreshTokens";
  /** An object relationship */
  authRequest?: Maybe<AuthOauth2AuthRequests>;
  authRequestId?: Maybe<Scalars["uuid"]>;
  /** An object relationship */
  client: AuthOauth2Clients;
  clientId: Scalars["String"];
  createdAt: Scalars["timestamptz"];
  expiresAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
  scopes: Array<Scalars["String"]>;
  tokenHash: Scalars["String"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Aggregate = {
  __typename?: "authOauth2RefreshTokens_aggregate";
  aggregate?: Maybe<AuthOauth2RefreshTokens_Aggregate_Fields>;
  nodes: Array<AuthOauth2RefreshTokens>;
};

export type AuthOauth2RefreshTokens_Aggregate_Bool_Exp = {
  count?: Maybe<AuthOauth2RefreshTokens_Aggregate_Bool_Exp_Count>;
};

export type AuthOauth2RefreshTokens_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Aggregate_Fields = {
  __typename?: "authOauth2RefreshTokens_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthOauth2RefreshTokens_Max_Fields>;
  min?: Maybe<AuthOauth2RefreshTokens_Min_Fields>;
};

/** aggregate fields of "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthOauth2RefreshTokens_Max_Order_By>;
  min?: Maybe<AuthOauth2RefreshTokens_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Arr_Rel_Insert_Input = {
  data: Array<AuthOauth2RefreshTokens_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthOauth2RefreshTokens_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.oauth2_refresh_tokens". All fields are combined with a logical 'AND'. */
export type AuthOauth2RefreshTokens_Bool_Exp = {
  _and?: Maybe<Array<AuthOauth2RefreshTokens_Bool_Exp>>;
  _not?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
  _or?: Maybe<Array<AuthOauth2RefreshTokens_Bool_Exp>>;
  authRequest?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  authRequestId?: Maybe<Uuid_Comparison_Exp>;
  client?: Maybe<AuthOauth2Clients_Bool_Exp>;
  clientId?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  expiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  scopes?: Maybe<String_Array_Comparison_Exp>;
  tokenHash?: Maybe<String_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.oauth2_refresh_tokens" */
export enum AuthOauth2RefreshTokens_Constraint {
  /** unique or primary key constraint on columns "id" */
  Oauth2RefreshTokensPkey = "oauth2_refresh_tokens_pkey",
  /** unique or primary key constraint on columns "token_hash" */
  Oauth2RefreshTokensTokenHashKey = "oauth2_refresh_tokens_token_hash_key",
}

/** input type for inserting data into table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Insert_Input = {
  authRequest?: Maybe<AuthOauth2AuthRequests_Obj_Rel_Insert_Input>;
  authRequestId?: Maybe<Scalars["uuid"]>;
  client?: Maybe<AuthOauth2Clients_Obj_Rel_Insert_Input>;
  clientId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  tokenHash?: Maybe<Scalars["String"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthOauth2RefreshTokens_Max_Fields = {
  __typename?: "authOauth2RefreshTokens_max_fields";
  authRequestId?: Maybe<Scalars["uuid"]>;
  clientId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  tokenHash?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Max_Order_By = {
  authRequestId?: Maybe<Order_By>;
  clientId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  tokenHash?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthOauth2RefreshTokens_Min_Fields = {
  __typename?: "authOauth2RefreshTokens_min_fields";
  authRequestId?: Maybe<Scalars["uuid"]>;
  clientId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  tokenHash?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Min_Order_By = {
  authRequestId?: Maybe<Order_By>;
  clientId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  tokenHash?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Mutation_Response = {
  __typename?: "authOauth2RefreshTokens_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthOauth2RefreshTokens>;
};

/** on_conflict condition type for table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_On_Conflict = {
  constraint: AuthOauth2RefreshTokens_Constraint;
  update_columns?: Array<AuthOauth2RefreshTokens_Update_Column>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.oauth2_refresh_tokens". */
export type AuthOauth2RefreshTokens_Order_By = {
  authRequest?: Maybe<AuthOauth2AuthRequests_Order_By>;
  authRequestId?: Maybe<Order_By>;
  client?: Maybe<AuthOauth2Clients_Order_By>;
  clientId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  scopes?: Maybe<Order_By>;
  tokenHash?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.oauth2_refresh_tokens */
export type AuthOauth2RefreshTokens_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.oauth2_refresh_tokens" */
export enum AuthOauth2RefreshTokens_Select_Column {
  /** column name */
  AuthRequestId = "authRequestId",
  /** column name */
  ClientId = "clientId",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Scopes = "scopes",
  /** column name */
  TokenHash = "tokenHash",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "auth.oauth2_refresh_tokens" */
export type AuthOauth2RefreshTokens_Set_Input = {
  authRequestId?: Maybe<Scalars["uuid"]>;
  clientId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  tokenHash?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authOauth2RefreshTokens" */
export type AuthOauth2RefreshTokens_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthOauth2RefreshTokens_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthOauth2RefreshTokens_Stream_Cursor_Value_Input = {
  authRequestId?: Maybe<Scalars["uuid"]>;
  clientId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  scopes?: Maybe<Array<Scalars["String"]>>;
  tokenHash?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.oauth2_refresh_tokens" */
export enum AuthOauth2RefreshTokens_Update_Column {
  /** column name */
  AuthRequestId = "authRequestId",
  /** column name */
  ClientId = "clientId",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Scopes = "scopes",
  /** column name */
  TokenHash = "tokenHash",
  /** column name */
  UserId = "userId",
}

export type AuthOauth2RefreshTokens_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthOauth2RefreshTokens_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthOauth2RefreshTokens_Bool_Exp;
};

/** Oauth requests, inserted before redirecting to the provider's site. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthProviderRequests = {
  __typename?: "authProviderRequests";
  id: Scalars["uuid"];
  options?: Maybe<Scalars["jsonb"]>;
};

/** Oauth requests, inserted before redirecting to the provider's site. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthProviderRequestsOptionsArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "auth.provider_requests" */
export type AuthProviderRequests_Aggregate = {
  __typename?: "authProviderRequests_aggregate";
  aggregate?: Maybe<AuthProviderRequests_Aggregate_Fields>;
  nodes: Array<AuthProviderRequests>;
};

/** aggregate fields of "auth.provider_requests" */
export type AuthProviderRequests_Aggregate_Fields = {
  __typename?: "authProviderRequests_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthProviderRequests_Max_Fields>;
  min?: Maybe<AuthProviderRequests_Min_Fields>;
};

/** aggregate fields of "auth.provider_requests" */
export type AuthProviderRequests_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthProviderRequests_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type AuthProviderRequests_Append_Input = {
  options?: Maybe<Scalars["jsonb"]>;
};

/** Boolean expression to filter rows from the table "auth.provider_requests". All fields are combined with a logical 'AND'. */
export type AuthProviderRequests_Bool_Exp = {
  _and?: Maybe<Array<AuthProviderRequests_Bool_Exp>>;
  _not?: Maybe<AuthProviderRequests_Bool_Exp>;
  _or?: Maybe<Array<AuthProviderRequests_Bool_Exp>>;
  id?: Maybe<Uuid_Comparison_Exp>;
  options?: Maybe<Jsonb_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.provider_requests" */
export enum AuthProviderRequests_Constraint {
  /** unique or primary key constraint on columns "id" */
  ProviderRequestsPkey = "provider_requests_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type AuthProviderRequests_Delete_At_Path_Input = {
  options?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type AuthProviderRequests_Delete_Elem_Input = {
  options?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type AuthProviderRequests_Delete_Key_Input = {
  options?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "auth.provider_requests" */
export type AuthProviderRequests_Insert_Input = {
  id?: Maybe<Scalars["uuid"]>;
  options?: Maybe<Scalars["jsonb"]>;
};

/** aggregate max on columns */
export type AuthProviderRequests_Max_Fields = {
  __typename?: "authProviderRequests_max_fields";
  id?: Maybe<Scalars["uuid"]>;
};

/** aggregate min on columns */
export type AuthProviderRequests_Min_Fields = {
  __typename?: "authProviderRequests_min_fields";
  id?: Maybe<Scalars["uuid"]>;
};

/** response of any mutation on the table "auth.provider_requests" */
export type AuthProviderRequests_Mutation_Response = {
  __typename?: "authProviderRequests_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthProviderRequests>;
};

/** on_conflict condition type for table "auth.provider_requests" */
export type AuthProviderRequests_On_Conflict = {
  constraint: AuthProviderRequests_Constraint;
  update_columns?: Array<AuthProviderRequests_Update_Column>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.provider_requests". */
export type AuthProviderRequests_Order_By = {
  id?: Maybe<Order_By>;
  options?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.provider_requests */
export type AuthProviderRequests_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type AuthProviderRequests_Prepend_Input = {
  options?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "auth.provider_requests" */
export enum AuthProviderRequests_Select_Column {
  /** column name */
  Id = "id",
  /** column name */
  Options = "options",
}

/** input type for updating data in table "auth.provider_requests" */
export type AuthProviderRequests_Set_Input = {
  id?: Maybe<Scalars["uuid"]>;
  options?: Maybe<Scalars["jsonb"]>;
};

/** Streaming cursor of the table "authProviderRequests" */
export type AuthProviderRequests_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthProviderRequests_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthProviderRequests_Stream_Cursor_Value_Input = {
  id?: Maybe<Scalars["uuid"]>;
  options?: Maybe<Scalars["jsonb"]>;
};

/** update columns of table "auth.provider_requests" */
export enum AuthProviderRequests_Update_Column {
  /** column name */
  Id = "id",
  /** column name */
  Options = "options",
}

export type AuthProviderRequests_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<AuthProviderRequests_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<AuthProviderRequests_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<AuthProviderRequests_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<AuthProviderRequests_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<AuthProviderRequests_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthProviderRequests_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthProviderRequests_Bool_Exp;
};

/** List of available Oauth providers. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthProviders = {
  __typename?: "authProviders";
  id: Scalars["String"];
  /** An array relationship */
  userProviders: Array<AuthUserProviders>;
  /** An aggregate relationship */
  userProviders_aggregate: AuthUserProviders_Aggregate;
};

/** List of available Oauth providers. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthProvidersUserProvidersArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

/** List of available Oauth providers. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthProvidersUserProviders_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

/** aggregated selection of "auth.providers" */
export type AuthProviders_Aggregate = {
  __typename?: "authProviders_aggregate";
  aggregate?: Maybe<AuthProviders_Aggregate_Fields>;
  nodes: Array<AuthProviders>;
};

/** aggregate fields of "auth.providers" */
export type AuthProviders_Aggregate_Fields = {
  __typename?: "authProviders_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthProviders_Max_Fields>;
  min?: Maybe<AuthProviders_Min_Fields>;
};

/** aggregate fields of "auth.providers" */
export type AuthProviders_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthProviders_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "auth.providers". All fields are combined with a logical 'AND'. */
export type AuthProviders_Bool_Exp = {
  _and?: Maybe<Array<AuthProviders_Bool_Exp>>;
  _not?: Maybe<AuthProviders_Bool_Exp>;
  _or?: Maybe<Array<AuthProviders_Bool_Exp>>;
  id?: Maybe<String_Comparison_Exp>;
  userProviders?: Maybe<AuthUserProviders_Bool_Exp>;
  userProviders_aggregate?: Maybe<AuthUserProviders_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "auth.providers" */
export enum AuthProviders_Constraint {
  /** unique or primary key constraint on columns "id" */
  ProvidersPkey = "providers_pkey",
}

/** input type for inserting data into table "auth.providers" */
export type AuthProviders_Insert_Input = {
  id?: Maybe<Scalars["String"]>;
  userProviders?: Maybe<AuthUserProviders_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type AuthProviders_Max_Fields = {
  __typename?: "authProviders_max_fields";
  id?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type AuthProviders_Min_Fields = {
  __typename?: "authProviders_min_fields";
  id?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "auth.providers" */
export type AuthProviders_Mutation_Response = {
  __typename?: "authProviders_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthProviders>;
};

/** input type for inserting object relation for remote table "auth.providers" */
export type AuthProviders_Obj_Rel_Insert_Input = {
  data: AuthProviders_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<AuthProviders_On_Conflict>;
};

/** on_conflict condition type for table "auth.providers" */
export type AuthProviders_On_Conflict = {
  constraint: AuthProviders_Constraint;
  update_columns?: Array<AuthProviders_Update_Column>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.providers". */
export type AuthProviders_Order_By = {
  id?: Maybe<Order_By>;
  userProviders_aggregate?: Maybe<AuthUserProviders_Aggregate_Order_By>;
};

/** primary key columns input for table: auth.providers */
export type AuthProviders_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "auth.providers" */
export enum AuthProviders_Select_Column {
  /** column name */
  Id = "id",
}

/** input type for updating data in table "auth.providers" */
export type AuthProviders_Set_Input = {
  id?: Maybe<Scalars["String"]>;
};

/** Streaming cursor of the table "authProviders" */
export type AuthProviders_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthProviders_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthProviders_Stream_Cursor_Value_Input = {
  id?: Maybe<Scalars["String"]>;
};

/** update columns of table "auth.providers" */
export enum AuthProviders_Update_Column {
  /** column name */
  Id = "id",
}

export type AuthProviders_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthProviders_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthProviders_Bool_Exp;
};

/** columns and relationships of "auth.refresh_token_types" */
export type AuthRefreshTokenTypes = {
  __typename?: "authRefreshTokenTypes";
  comment?: Maybe<Scalars["String"]>;
  /** An array relationship */
  refreshTokens: Array<AuthRefreshTokens>;
  /** An aggregate relationship */
  refreshTokens_aggregate: AuthRefreshTokens_Aggregate;
  value: Scalars["String"];
};

/** columns and relationships of "auth.refresh_token_types" */
export type AuthRefreshTokenTypesRefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

/** columns and relationships of "auth.refresh_token_types" */
export type AuthRefreshTokenTypesRefreshTokens_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

/** aggregated selection of "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Aggregate = {
  __typename?: "authRefreshTokenTypes_aggregate";
  aggregate?: Maybe<AuthRefreshTokenTypes_Aggregate_Fields>;
  nodes: Array<AuthRefreshTokenTypes>;
};

/** aggregate fields of "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Aggregate_Fields = {
  __typename?: "authRefreshTokenTypes_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthRefreshTokenTypes_Max_Fields>;
  min?: Maybe<AuthRefreshTokenTypes_Min_Fields>;
};

/** aggregate fields of "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthRefreshTokenTypes_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "auth.refresh_token_types". All fields are combined with a logical 'AND'. */
export type AuthRefreshTokenTypes_Bool_Exp = {
  _and?: Maybe<Array<AuthRefreshTokenTypes_Bool_Exp>>;
  _not?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
  _or?: Maybe<Array<AuthRefreshTokenTypes_Bool_Exp>>;
  comment?: Maybe<String_Comparison_Exp>;
  refreshTokens?: Maybe<AuthRefreshTokens_Bool_Exp>;
  refreshTokens_aggregate?: Maybe<AuthRefreshTokens_Aggregate_Bool_Exp>;
  value?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.refresh_token_types" */
export enum AuthRefreshTokenTypes_Constraint {
  /** unique or primary key constraint on columns "value" */
  RefreshTokenTypesPkey = "refresh_token_types_pkey",
}

/** input type for inserting data into table "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Insert_Input = {
  comment?: Maybe<Scalars["String"]>;
  refreshTokens?: Maybe<AuthRefreshTokens_Arr_Rel_Insert_Input>;
  value?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type AuthRefreshTokenTypes_Max_Fields = {
  __typename?: "authRefreshTokenTypes_max_fields";
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type AuthRefreshTokenTypes_Min_Fields = {
  __typename?: "authRefreshTokenTypes_min_fields";
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Mutation_Response = {
  __typename?: "authRefreshTokenTypes_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthRefreshTokenTypes>;
};

/** on_conflict condition type for table "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_On_Conflict = {
  constraint: AuthRefreshTokenTypes_Constraint;
  update_columns?: Array<AuthRefreshTokenTypes_Update_Column>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.refresh_token_types". */
export type AuthRefreshTokenTypes_Order_By = {
  comment?: Maybe<Order_By>;
  refreshTokens_aggregate?: Maybe<AuthRefreshTokens_Aggregate_Order_By>;
  value?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.refresh_token_types */
export type AuthRefreshTokenTypes_Pk_Columns_Input = {
  value: Scalars["String"];
};

/** select columns of table "auth.refresh_token_types" */
export enum AuthRefreshTokenTypes_Select_Column {
  /** column name */
  Comment = "comment",
  /** column name */
  Value = "value",
}

/** input type for updating data in table "auth.refresh_token_types" */
export type AuthRefreshTokenTypes_Set_Input = {
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** Streaming cursor of the table "authRefreshTokenTypes" */
export type AuthRefreshTokenTypes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthRefreshTokenTypes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthRefreshTokenTypes_Stream_Cursor_Value_Input = {
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** update columns of table "auth.refresh_token_types" */
export enum AuthRefreshTokenTypes_Update_Column {
  /** column name */
  Comment = "comment",
  /** column name */
  Value = "value",
}

export type AuthRefreshTokenTypes_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthRefreshTokenTypes_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthRefreshTokenTypes_Bool_Exp;
};

/** User refresh tokens. Hasura auth uses them to rotate new access tokens as long as the refresh token is not expired. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRefreshTokens = {
  __typename?: "authRefreshTokens";
  createdAt: Scalars["timestamptz"];
  expiresAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
  metadata?: Maybe<Scalars["jsonb"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type: Scalars["String"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** User refresh tokens. Hasura auth uses them to rotate new access tokens as long as the refresh token is not expired. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRefreshTokensMetadataArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "auth.refresh_tokens" */
export type AuthRefreshTokens_Aggregate = {
  __typename?: "authRefreshTokens_aggregate";
  aggregate?: Maybe<AuthRefreshTokens_Aggregate_Fields>;
  nodes: Array<AuthRefreshTokens>;
};

export type AuthRefreshTokens_Aggregate_Bool_Exp = {
  count?: Maybe<AuthRefreshTokens_Aggregate_Bool_Exp_Count>;
};

export type AuthRefreshTokens_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthRefreshTokens_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.refresh_tokens" */
export type AuthRefreshTokens_Aggregate_Fields = {
  __typename?: "authRefreshTokens_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthRefreshTokens_Max_Fields>;
  min?: Maybe<AuthRefreshTokens_Min_Fields>;
};

/** aggregate fields of "auth.refresh_tokens" */
export type AuthRefreshTokens_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.refresh_tokens" */
export type AuthRefreshTokens_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthRefreshTokens_Max_Order_By>;
  min?: Maybe<AuthRefreshTokens_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type AuthRefreshTokens_Append_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "auth.refresh_tokens" */
export type AuthRefreshTokens_Arr_Rel_Insert_Input = {
  data: Array<AuthRefreshTokens_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthRefreshTokens_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.refresh_tokens". All fields are combined with a logical 'AND'. */
export type AuthRefreshTokens_Bool_Exp = {
  _and?: Maybe<Array<AuthRefreshTokens_Bool_Exp>>;
  _not?: Maybe<AuthRefreshTokens_Bool_Exp>;
  _or?: Maybe<Array<AuthRefreshTokens_Bool_Exp>>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  expiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  metadata?: Maybe<Jsonb_Comparison_Exp>;
  refreshTokenHash?: Maybe<String_Comparison_Exp>;
  type?: Maybe<String_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.refresh_tokens" */
export enum AuthRefreshTokens_Constraint {
  /** unique or primary key constraint on columns "id" */
  RefreshTokensPkey = "refresh_tokens_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type AuthRefreshTokens_Delete_At_Path_Input = {
  metadata?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type AuthRefreshTokens_Delete_Elem_Input = {
  metadata?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type AuthRefreshTokens_Delete_Key_Input = {
  metadata?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "auth.refresh_tokens" */
export type AuthRefreshTokens_Insert_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthRefreshTokens_Max_Fields = {
  __typename?: "authRefreshTokens_max_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.refresh_tokens" */
export type AuthRefreshTokens_Max_Order_By = {
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  refreshTokenHash?: Maybe<Order_By>;
  type?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthRefreshTokens_Min_Fields = {
  __typename?: "authRefreshTokens_min_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.refresh_tokens" */
export type AuthRefreshTokens_Min_Order_By = {
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  refreshTokenHash?: Maybe<Order_By>;
  type?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.refresh_tokens" */
export type AuthRefreshTokens_Mutation_Response = {
  __typename?: "authRefreshTokens_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthRefreshTokens>;
};

/** on_conflict condition type for table "auth.refresh_tokens" */
export type AuthRefreshTokens_On_Conflict = {
  constraint: AuthRefreshTokens_Constraint;
  update_columns?: Array<AuthRefreshTokens_Update_Column>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.refresh_tokens". */
export type AuthRefreshTokens_Order_By = {
  createdAt?: Maybe<Order_By>;
  expiresAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  metadata?: Maybe<Order_By>;
  refreshTokenHash?: Maybe<Order_By>;
  type?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.refresh_tokens */
export type AuthRefreshTokens_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type AuthRefreshTokens_Prepend_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "auth.refresh_tokens" */
export enum AuthRefreshTokens_Select_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Metadata = "metadata",
  /** column name */
  RefreshTokenHash = "refreshTokenHash",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "auth.refresh_tokens" */
export type AuthRefreshTokens_Set_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authRefreshTokens" */
export type AuthRefreshTokens_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthRefreshTokens_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthRefreshTokens_Stream_Cursor_Value_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  expiresAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  refreshTokenHash?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.refresh_tokens" */
export enum AuthRefreshTokens_Update_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  ExpiresAt = "expiresAt",
  /** column name */
  Id = "id",
  /** column name */
  Metadata = "metadata",
  /** column name */
  RefreshTokenHash = "refreshTokenHash",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "userId",
}

export type AuthRefreshTokens_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<AuthRefreshTokens_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<AuthRefreshTokens_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<AuthRefreshTokens_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<AuthRefreshTokens_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<AuthRefreshTokens_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthRefreshTokens_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthRefreshTokens_Bool_Exp;
};

/** Persistent Hasura roles for users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRoles = {
  __typename?: "authRoles";
  role: Scalars["String"];
  /** An array relationship */
  userRoles: Array<AuthUserRoles>;
  /** An aggregate relationship */
  userRoles_aggregate: AuthUserRoles_Aggregate;
  /** An array relationship */
  usersByDefaultRole: Array<Users>;
  /** An aggregate relationship */
  usersByDefaultRole_aggregate: Users_Aggregate;
};

/** Persistent Hasura roles for users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRolesUserRolesArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

/** Persistent Hasura roles for users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRolesUserRoles_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

/** Persistent Hasura roles for users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRolesUsersByDefaultRoleArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

/** Persistent Hasura roles for users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthRolesUsersByDefaultRole_AggregateArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

/** aggregated selection of "auth.roles" */
export type AuthRoles_Aggregate = {
  __typename?: "authRoles_aggregate";
  aggregate?: Maybe<AuthRoles_Aggregate_Fields>;
  nodes: Array<AuthRoles>;
};

/** aggregate fields of "auth.roles" */
export type AuthRoles_Aggregate_Fields = {
  __typename?: "authRoles_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthRoles_Max_Fields>;
  min?: Maybe<AuthRoles_Min_Fields>;
};

/** aggregate fields of "auth.roles" */
export type AuthRoles_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthRoles_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "auth.roles". All fields are combined with a logical 'AND'. */
export type AuthRoles_Bool_Exp = {
  _and?: Maybe<Array<AuthRoles_Bool_Exp>>;
  _not?: Maybe<AuthRoles_Bool_Exp>;
  _or?: Maybe<Array<AuthRoles_Bool_Exp>>;
  role?: Maybe<String_Comparison_Exp>;
  userRoles?: Maybe<AuthUserRoles_Bool_Exp>;
  userRoles_aggregate?: Maybe<AuthUserRoles_Aggregate_Bool_Exp>;
  usersByDefaultRole?: Maybe<Users_Bool_Exp>;
  usersByDefaultRole_aggregate?: Maybe<Users_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "auth.roles" */
export enum AuthRoles_Constraint {
  /** unique or primary key constraint on columns "role" */
  RolesPkey = "roles_pkey",
}

/** input type for inserting data into table "auth.roles" */
export type AuthRoles_Insert_Input = {
  role?: Maybe<Scalars["String"]>;
  userRoles?: Maybe<AuthUserRoles_Arr_Rel_Insert_Input>;
  usersByDefaultRole?: Maybe<Users_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type AuthRoles_Max_Fields = {
  __typename?: "authRoles_max_fields";
  role?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type AuthRoles_Min_Fields = {
  __typename?: "authRoles_min_fields";
  role?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "auth.roles" */
export type AuthRoles_Mutation_Response = {
  __typename?: "authRoles_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthRoles>;
};

/** input type for inserting object relation for remote table "auth.roles" */
export type AuthRoles_Obj_Rel_Insert_Input = {
  data: AuthRoles_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<AuthRoles_On_Conflict>;
};

/** on_conflict condition type for table "auth.roles" */
export type AuthRoles_On_Conflict = {
  constraint: AuthRoles_Constraint;
  update_columns?: Array<AuthRoles_Update_Column>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.roles". */
export type AuthRoles_Order_By = {
  role?: Maybe<Order_By>;
  userRoles_aggregate?: Maybe<AuthUserRoles_Aggregate_Order_By>;
  usersByDefaultRole_aggregate?: Maybe<Users_Aggregate_Order_By>;
};

/** primary key columns input for table: auth.roles */
export type AuthRoles_Pk_Columns_Input = {
  role: Scalars["String"];
};

/** select columns of table "auth.roles" */
export enum AuthRoles_Select_Column {
  /** column name */
  Role = "role",
}

/** input type for updating data in table "auth.roles" */
export type AuthRoles_Set_Input = {
  role?: Maybe<Scalars["String"]>;
};

/** Streaming cursor of the table "authRoles" */
export type AuthRoles_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthRoles_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthRoles_Stream_Cursor_Value_Input = {
  role?: Maybe<Scalars["String"]>;
};

/** update columns of table "auth.roles" */
export enum AuthRoles_Update_Column {
  /** column name */
  Role = "role",
}

export type AuthRoles_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthRoles_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthRoles_Bool_Exp;
};

/** Active providers for a given user. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthUserProviders = {
  __typename?: "authUserProviders";
  accessToken: Scalars["String"];
  createdAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
  /** An object relationship */
  provider: AuthProviders;
  providerId: Scalars["String"];
  providerUserId: Scalars["String"];
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt: Scalars["timestamptz"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "auth.user_providers" */
export type AuthUserProviders_Aggregate = {
  __typename?: "authUserProviders_aggregate";
  aggregate?: Maybe<AuthUserProviders_Aggregate_Fields>;
  nodes: Array<AuthUserProviders>;
};

export type AuthUserProviders_Aggregate_Bool_Exp = {
  count?: Maybe<AuthUserProviders_Aggregate_Bool_Exp_Count>;
};

export type AuthUserProviders_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthUserProviders_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthUserProviders_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.user_providers" */
export type AuthUserProviders_Aggregate_Fields = {
  __typename?: "authUserProviders_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthUserProviders_Max_Fields>;
  min?: Maybe<AuthUserProviders_Min_Fields>;
};

/** aggregate fields of "auth.user_providers" */
export type AuthUserProviders_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthUserProviders_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.user_providers" */
export type AuthUserProviders_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthUserProviders_Max_Order_By>;
  min?: Maybe<AuthUserProviders_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.user_providers" */
export type AuthUserProviders_Arr_Rel_Insert_Input = {
  data: Array<AuthUserProviders_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthUserProviders_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.user_providers". All fields are combined with a logical 'AND'. */
export type AuthUserProviders_Bool_Exp = {
  _and?: Maybe<Array<AuthUserProviders_Bool_Exp>>;
  _not?: Maybe<AuthUserProviders_Bool_Exp>;
  _or?: Maybe<Array<AuthUserProviders_Bool_Exp>>;
  accessToken?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  provider?: Maybe<AuthProviders_Bool_Exp>;
  providerId?: Maybe<String_Comparison_Exp>;
  providerUserId?: Maybe<String_Comparison_Exp>;
  refreshToken?: Maybe<String_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.user_providers" */
export enum AuthUserProviders_Constraint {
  /** unique or primary key constraint on columns "id" */
  UserProvidersPkey = "user_providers_pkey",
  /** unique or primary key constraint on columns "provider_user_id", "provider_id" */
  UserProvidersProviderIdProviderUserIdKey =
    "user_providers_provider_id_provider_user_id_key",
}

/** input type for inserting data into table "auth.user_providers" */
export type AuthUserProviders_Insert_Input = {
  accessToken?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  provider?: Maybe<AuthProviders_Obj_Rel_Insert_Input>;
  providerId?: Maybe<Scalars["String"]>;
  providerUserId?: Maybe<Scalars["String"]>;
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthUserProviders_Max_Fields = {
  __typename?: "authUserProviders_max_fields";
  accessToken?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  providerId?: Maybe<Scalars["String"]>;
  providerUserId?: Maybe<Scalars["String"]>;
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.user_providers" */
export type AuthUserProviders_Max_Order_By = {
  accessToken?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  providerId?: Maybe<Order_By>;
  providerUserId?: Maybe<Order_By>;
  refreshToken?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthUserProviders_Min_Fields = {
  __typename?: "authUserProviders_min_fields";
  accessToken?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  providerId?: Maybe<Scalars["String"]>;
  providerUserId?: Maybe<Scalars["String"]>;
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.user_providers" */
export type AuthUserProviders_Min_Order_By = {
  accessToken?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  providerId?: Maybe<Order_By>;
  providerUserId?: Maybe<Order_By>;
  refreshToken?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.user_providers" */
export type AuthUserProviders_Mutation_Response = {
  __typename?: "authUserProviders_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthUserProviders>;
};

/** on_conflict condition type for table "auth.user_providers" */
export type AuthUserProviders_On_Conflict = {
  constraint: AuthUserProviders_Constraint;
  update_columns?: Array<AuthUserProviders_Update_Column>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.user_providers". */
export type AuthUserProviders_Order_By = {
  accessToken?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  provider?: Maybe<AuthProviders_Order_By>;
  providerId?: Maybe<Order_By>;
  providerUserId?: Maybe<Order_By>;
  refreshToken?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.user_providers */
export type AuthUserProviders_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.user_providers" */
export enum AuthUserProviders_Select_Column {
  /** column name */
  AccessToken = "accessToken",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Id = "id",
  /** column name */
  ProviderId = "providerId",
  /** column name */
  ProviderUserId = "providerUserId",
  /** column name */
  RefreshToken = "refreshToken",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "auth.user_providers" */
export type AuthUserProviders_Set_Input = {
  accessToken?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  providerId?: Maybe<Scalars["String"]>;
  providerUserId?: Maybe<Scalars["String"]>;
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authUserProviders" */
export type AuthUserProviders_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthUserProviders_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthUserProviders_Stream_Cursor_Value_Input = {
  accessToken?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  providerId?: Maybe<Scalars["String"]>;
  providerUserId?: Maybe<Scalars["String"]>;
  refreshToken?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.user_providers" */
export enum AuthUserProviders_Update_Column {
  /** column name */
  AccessToken = "accessToken",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Id = "id",
  /** column name */
  ProviderId = "providerId",
  /** column name */
  ProviderUserId = "providerUserId",
  /** column name */
  RefreshToken = "refreshToken",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

export type AuthUserProviders_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthUserProviders_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthUserProviders_Bool_Exp;
};

/** Roles of users. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthUserRoles = {
  __typename?: "authUserRoles";
  createdAt: Scalars["timestamptz"];
  id: Scalars["uuid"];
  role: Scalars["String"];
  /** An object relationship */
  roleByRole: AuthRoles;
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "auth.user_roles" */
export type AuthUserRoles_Aggregate = {
  __typename?: "authUserRoles_aggregate";
  aggregate?: Maybe<AuthUserRoles_Aggregate_Fields>;
  nodes: Array<AuthUserRoles>;
};

export type AuthUserRoles_Aggregate_Bool_Exp = {
  count?: Maybe<AuthUserRoles_Aggregate_Bool_Exp_Count>;
};

export type AuthUserRoles_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthUserRoles_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthUserRoles_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.user_roles" */
export type AuthUserRoles_Aggregate_Fields = {
  __typename?: "authUserRoles_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<AuthUserRoles_Max_Fields>;
  min?: Maybe<AuthUserRoles_Min_Fields>;
};

/** aggregate fields of "auth.user_roles" */
export type AuthUserRoles_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthUserRoles_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.user_roles" */
export type AuthUserRoles_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<AuthUserRoles_Max_Order_By>;
  min?: Maybe<AuthUserRoles_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.user_roles" */
export type AuthUserRoles_Arr_Rel_Insert_Input = {
  data: Array<AuthUserRoles_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthUserRoles_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.user_roles". All fields are combined with a logical 'AND'. */
export type AuthUserRoles_Bool_Exp = {
  _and?: Maybe<Array<AuthUserRoles_Bool_Exp>>;
  _not?: Maybe<AuthUserRoles_Bool_Exp>;
  _or?: Maybe<Array<AuthUserRoles_Bool_Exp>>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  role?: Maybe<String_Comparison_Exp>;
  roleByRole?: Maybe<AuthRoles_Bool_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.user_roles" */
export enum AuthUserRoles_Constraint {
  /** unique or primary key constraint on columns "id" */
  UserRolesPkey = "user_roles_pkey",
  /** unique or primary key constraint on columns "user_id", "role" */
  UserRolesUserIdRoleKey = "user_roles_user_id_role_key",
}

/** input type for inserting data into table "auth.user_roles" */
export type AuthUserRoles_Insert_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  role?: Maybe<Scalars["String"]>;
  roleByRole?: Maybe<AuthRoles_Obj_Rel_Insert_Input>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthUserRoles_Max_Fields = {
  __typename?: "authUserRoles_max_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  role?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.user_roles" */
export type AuthUserRoles_Max_Order_By = {
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  role?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthUserRoles_Min_Fields = {
  __typename?: "authUserRoles_min_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  role?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.user_roles" */
export type AuthUserRoles_Min_Order_By = {
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  role?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.user_roles" */
export type AuthUserRoles_Mutation_Response = {
  __typename?: "authUserRoles_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthUserRoles>;
};

/** on_conflict condition type for table "auth.user_roles" */
export type AuthUserRoles_On_Conflict = {
  constraint: AuthUserRoles_Constraint;
  update_columns?: Array<AuthUserRoles_Update_Column>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.user_roles". */
export type AuthUserRoles_Order_By = {
  createdAt?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  role?: Maybe<Order_By>;
  roleByRole?: Maybe<AuthRoles_Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.user_roles */
export type AuthUserRoles_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.user_roles" */
export enum AuthUserRoles_Select_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "auth.user_roles" */
export type AuthUserRoles_Set_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  role?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "authUserRoles" */
export type AuthUserRoles_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthUserRoles_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthUserRoles_Stream_Cursor_Value_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  role?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "auth.user_roles" */
export enum AuthUserRoles_Update_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  UserId = "userId",
}

export type AuthUserRoles_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthUserRoles_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthUserRoles_Bool_Exp;
};

/** User webauthn security keys. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type AuthUserSecurityKeys = {
  __typename?: "authUserSecurityKeys";
  counter: Scalars["bigint"];
  credentialId: Scalars["String"];
  credentialPublicKey?: Maybe<Scalars["bytea"]>;
  id: Scalars["uuid"];
  nickname?: Maybe<Scalars["String"]>;
  transports: Scalars["String"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "auth.user_security_keys" */
export type AuthUserSecurityKeys_Aggregate = {
  __typename?: "authUserSecurityKeys_aggregate";
  aggregate?: Maybe<AuthUserSecurityKeys_Aggregate_Fields>;
  nodes: Array<AuthUserSecurityKeys>;
};

export type AuthUserSecurityKeys_Aggregate_Bool_Exp = {
  count?: Maybe<AuthUserSecurityKeys_Aggregate_Bool_Exp_Count>;
};

export type AuthUserSecurityKeys_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.user_security_keys" */
export type AuthUserSecurityKeys_Aggregate_Fields = {
  __typename?: "authUserSecurityKeys_aggregate_fields";
  avg?: Maybe<AuthUserSecurityKeys_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<AuthUserSecurityKeys_Max_Fields>;
  min?: Maybe<AuthUserSecurityKeys_Min_Fields>;
  stddev?: Maybe<AuthUserSecurityKeys_Stddev_Fields>;
  stddev_pop?: Maybe<AuthUserSecurityKeys_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<AuthUserSecurityKeys_Stddev_Samp_Fields>;
  sum?: Maybe<AuthUserSecurityKeys_Sum_Fields>;
  var_pop?: Maybe<AuthUserSecurityKeys_Var_Pop_Fields>;
  var_samp?: Maybe<AuthUserSecurityKeys_Var_Samp_Fields>;
  variance?: Maybe<AuthUserSecurityKeys_Variance_Fields>;
};

/** aggregate fields of "auth.user_security_keys" */
export type AuthUserSecurityKeys_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Aggregate_Order_By = {
  avg?: Maybe<AuthUserSecurityKeys_Avg_Order_By>;
  count?: Maybe<Order_By>;
  max?: Maybe<AuthUserSecurityKeys_Max_Order_By>;
  min?: Maybe<AuthUserSecurityKeys_Min_Order_By>;
  stddev?: Maybe<AuthUserSecurityKeys_Stddev_Order_By>;
  stddev_pop?: Maybe<AuthUserSecurityKeys_Stddev_Pop_Order_By>;
  stddev_samp?: Maybe<AuthUserSecurityKeys_Stddev_Samp_Order_By>;
  sum?: Maybe<AuthUserSecurityKeys_Sum_Order_By>;
  var_pop?: Maybe<AuthUserSecurityKeys_Var_Pop_Order_By>;
  var_samp?: Maybe<AuthUserSecurityKeys_Var_Samp_Order_By>;
  variance?: Maybe<AuthUserSecurityKeys_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Arr_Rel_Insert_Input = {
  data: Array<AuthUserSecurityKeys_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<AuthUserSecurityKeys_On_Conflict>;
};

/** aggregate avg on columns */
export type AuthUserSecurityKeys_Avg_Fields = {
  __typename?: "authUserSecurityKeys_avg_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Avg_Order_By = {
  counter?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "auth.user_security_keys". All fields are combined with a logical 'AND'. */
export type AuthUserSecurityKeys_Bool_Exp = {
  _and?: Maybe<Array<AuthUserSecurityKeys_Bool_Exp>>;
  _not?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
  _or?: Maybe<Array<AuthUserSecurityKeys_Bool_Exp>>;
  counter?: Maybe<Bigint_Comparison_Exp>;
  credentialId?: Maybe<String_Comparison_Exp>;
  credentialPublicKey?: Maybe<Bytea_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  nickname?: Maybe<String_Comparison_Exp>;
  transports?: Maybe<String_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.user_security_keys" */
export enum AuthUserSecurityKeys_Constraint {
  /** unique or primary key constraint on columns "credential_id" */
  UserSecurityKeyCredentialIdKey = "user_security_key_credential_id_key",
  /** unique or primary key constraint on columns "id" */
  UserSecurityKeysPkey = "user_security_keys_pkey",
}

/** input type for incrementing numeric columns in table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Inc_Input = {
  counter?: Maybe<Scalars["bigint"]>;
};

/** input type for inserting data into table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Insert_Input = {
  counter?: Maybe<Scalars["bigint"]>;
  credentialId?: Maybe<Scalars["String"]>;
  credentialPublicKey?: Maybe<Scalars["bytea"]>;
  id?: Maybe<Scalars["uuid"]>;
  nickname?: Maybe<Scalars["String"]>;
  transports?: Maybe<Scalars["String"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type AuthUserSecurityKeys_Max_Fields = {
  __typename?: "authUserSecurityKeys_max_fields";
  counter?: Maybe<Scalars["bigint"]>;
  credentialId?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  nickname?: Maybe<Scalars["String"]>;
  transports?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Max_Order_By = {
  counter?: Maybe<Order_By>;
  credentialId?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nickname?: Maybe<Order_By>;
  transports?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type AuthUserSecurityKeys_Min_Fields = {
  __typename?: "authUserSecurityKeys_min_fields";
  counter?: Maybe<Scalars["bigint"]>;
  credentialId?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  nickname?: Maybe<Scalars["String"]>;
  transports?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Min_Order_By = {
  counter?: Maybe<Order_By>;
  credentialId?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nickname?: Maybe<Order_By>;
  transports?: Maybe<Order_By>;
  userId?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Mutation_Response = {
  __typename?: "authUserSecurityKeys_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<AuthUserSecurityKeys>;
};

/** on_conflict condition type for table "auth.user_security_keys" */
export type AuthUserSecurityKeys_On_Conflict = {
  constraint: AuthUserSecurityKeys_Constraint;
  update_columns?: Array<AuthUserSecurityKeys_Update_Column>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.user_security_keys". */
export type AuthUserSecurityKeys_Order_By = {
  counter?: Maybe<Order_By>;
  credentialId?: Maybe<Order_By>;
  credentialPublicKey?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  nickname?: Maybe<Order_By>;
  transports?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: auth.user_security_keys */
export type AuthUserSecurityKeys_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "auth.user_security_keys" */
export enum AuthUserSecurityKeys_Select_Column {
  /** column name */
  Counter = "counter",
  /** column name */
  CredentialId = "credentialId",
  /** column name */
  CredentialPublicKey = "credentialPublicKey",
  /** column name */
  Id = "id",
  /** column name */
  Nickname = "nickname",
  /** column name */
  Transports = "transports",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Set_Input = {
  counter?: Maybe<Scalars["bigint"]>;
  credentialId?: Maybe<Scalars["String"]>;
  credentialPublicKey?: Maybe<Scalars["bytea"]>;
  id?: Maybe<Scalars["uuid"]>;
  nickname?: Maybe<Scalars["String"]>;
  transports?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate stddev on columns */
export type AuthUserSecurityKeys_Stddev_Fields = {
  __typename?: "authUserSecurityKeys_stddev_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Stddev_Order_By = {
  counter?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type AuthUserSecurityKeys_Stddev_Pop_Fields = {
  __typename?: "authUserSecurityKeys_stddev_pop_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Stddev_Pop_Order_By = {
  counter?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type AuthUserSecurityKeys_Stddev_Samp_Fields = {
  __typename?: "authUserSecurityKeys_stddev_samp_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Stddev_Samp_Order_By = {
  counter?: Maybe<Order_By>;
};

/** Streaming cursor of the table "authUserSecurityKeys" */
export type AuthUserSecurityKeys_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: AuthUserSecurityKeys_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthUserSecurityKeys_Stream_Cursor_Value_Input = {
  counter?: Maybe<Scalars["bigint"]>;
  credentialId?: Maybe<Scalars["String"]>;
  credentialPublicKey?: Maybe<Scalars["bytea"]>;
  id?: Maybe<Scalars["uuid"]>;
  nickname?: Maybe<Scalars["String"]>;
  transports?: Maybe<Scalars["String"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate sum on columns */
export type AuthUserSecurityKeys_Sum_Fields = {
  __typename?: "authUserSecurityKeys_sum_fields";
  counter?: Maybe<Scalars["bigint"]>;
};

/** order by sum() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Sum_Order_By = {
  counter?: Maybe<Order_By>;
};

/** update columns of table "auth.user_security_keys" */
export enum AuthUserSecurityKeys_Update_Column {
  /** column name */
  Counter = "counter",
  /** column name */
  CredentialId = "credentialId",
  /** column name */
  CredentialPublicKey = "credentialPublicKey",
  /** column name */
  Id = "id",
  /** column name */
  Nickname = "nickname",
  /** column name */
  Transports = "transports",
  /** column name */
  UserId = "userId",
}

export type AuthUserSecurityKeys_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: Maybe<AuthUserSecurityKeys_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<AuthUserSecurityKeys_Set_Input>;
  /** filter the rows which have to be updated */
  where: AuthUserSecurityKeys_Bool_Exp;
};

/** aggregate var_pop on columns */
export type AuthUserSecurityKeys_Var_Pop_Fields = {
  __typename?: "authUserSecurityKeys_var_pop_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Var_Pop_Order_By = {
  counter?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type AuthUserSecurityKeys_Var_Samp_Fields = {
  __typename?: "authUserSecurityKeys_var_samp_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Var_Samp_Order_By = {
  counter?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type AuthUserSecurityKeys_Variance_Fields = {
  __typename?: "authUserSecurityKeys_variance_fields";
  counter?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "auth.user_security_keys" */
export type AuthUserSecurityKeys_Variance_Order_By = {
  counter?: Maybe<Order_By>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: Maybe<Scalars["bigint"]>;
  _gt?: Maybe<Scalars["bigint"]>;
  _gte?: Maybe<Scalars["bigint"]>;
  _in?: Maybe<Array<Scalars["bigint"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["bigint"]>;
  _lte?: Maybe<Scalars["bigint"]>;
  _neq?: Maybe<Scalars["bigint"]>;
  _nin?: Maybe<Array<Scalars["bigint"]>>;
};

/** columns and relationships of "storage.buckets" */
export type Buckets = {
  __typename?: "buckets";
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt: Scalars["timestamptz"];
  downloadExpiration: Scalars["Int"];
  /** An array relationship */
  files: Array<Files>;
  /** An aggregate relationship */
  files_aggregate: Files_Aggregate;
  id: Scalars["String"];
  maxUploadFileSize: Scalars["Int"];
  minUploadFileSize: Scalars["Int"];
  presignedUrlsEnabled: Scalars["Boolean"];
  updatedAt: Scalars["timestamptz"];
};

/** columns and relationships of "storage.buckets" */
export type BucketsFilesArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

/** columns and relationships of "storage.buckets" */
export type BucketsFiles_AggregateArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

/** aggregated selection of "storage.buckets" */
export type Buckets_Aggregate = {
  __typename?: "buckets_aggregate";
  aggregate?: Maybe<Buckets_Aggregate_Fields>;
  nodes: Array<Buckets>;
};

/** aggregate fields of "storage.buckets" */
export type Buckets_Aggregate_Fields = {
  __typename?: "buckets_aggregate_fields";
  avg?: Maybe<Buckets_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Buckets_Max_Fields>;
  min?: Maybe<Buckets_Min_Fields>;
  stddev?: Maybe<Buckets_Stddev_Fields>;
  stddev_pop?: Maybe<Buckets_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Buckets_Stddev_Samp_Fields>;
  sum?: Maybe<Buckets_Sum_Fields>;
  var_pop?: Maybe<Buckets_Var_Pop_Fields>;
  var_samp?: Maybe<Buckets_Var_Samp_Fields>;
  variance?: Maybe<Buckets_Variance_Fields>;
};

/** aggregate fields of "storage.buckets" */
export type Buckets_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Buckets_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** aggregate avg on columns */
export type Buckets_Avg_Fields = {
  __typename?: "buckets_avg_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** Boolean expression to filter rows from the table "storage.buckets". All fields are combined with a logical 'AND'. */
export type Buckets_Bool_Exp = {
  _and?: Maybe<Array<Buckets_Bool_Exp>>;
  _not?: Maybe<Buckets_Bool_Exp>;
  _or?: Maybe<Array<Buckets_Bool_Exp>>;
  cacheControl?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  downloadExpiration?: Maybe<Int_Comparison_Exp>;
  files?: Maybe<Files_Bool_Exp>;
  files_aggregate?: Maybe<Files_Aggregate_Bool_Exp>;
  id?: Maybe<String_Comparison_Exp>;
  maxUploadFileSize?: Maybe<Int_Comparison_Exp>;
  minUploadFileSize?: Maybe<Int_Comparison_Exp>;
  presignedUrlsEnabled?: Maybe<Boolean_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "storage.buckets" */
export enum Buckets_Constraint {
  /** unique or primary key constraint on columns "id" */
  BucketsPkey = "buckets_pkey",
}

/** input type for incrementing numeric columns in table "storage.buckets" */
export type Buckets_Inc_Input = {
  downloadExpiration?: Maybe<Scalars["Int"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "storage.buckets" */
export type Buckets_Insert_Input = {
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  downloadExpiration?: Maybe<Scalars["Int"]>;
  files?: Maybe<Files_Arr_Rel_Insert_Input>;
  id?: Maybe<Scalars["String"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
  presignedUrlsEnabled?: Maybe<Scalars["Boolean"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Buckets_Max_Fields = {
  __typename?: "buckets_max_fields";
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  downloadExpiration?: Maybe<Scalars["Int"]>;
  id?: Maybe<Scalars["String"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate min on columns */
export type Buckets_Min_Fields = {
  __typename?: "buckets_min_fields";
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  downloadExpiration?: Maybe<Scalars["Int"]>;
  id?: Maybe<Scalars["String"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** response of any mutation on the table "storage.buckets" */
export type Buckets_Mutation_Response = {
  __typename?: "buckets_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Buckets>;
};

/** input type for inserting object relation for remote table "storage.buckets" */
export type Buckets_Obj_Rel_Insert_Input = {
  data: Buckets_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<Buckets_On_Conflict>;
};

/** on_conflict condition type for table "storage.buckets" */
export type Buckets_On_Conflict = {
  constraint: Buckets_Constraint;
  update_columns?: Array<Buckets_Update_Column>;
  where?: Maybe<Buckets_Bool_Exp>;
};

/** Ordering options when selecting data from "storage.buckets". */
export type Buckets_Order_By = {
  cacheControl?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  downloadExpiration?: Maybe<Order_By>;
  files_aggregate?: Maybe<Files_Aggregate_Order_By>;
  id?: Maybe<Order_By>;
  maxUploadFileSize?: Maybe<Order_By>;
  minUploadFileSize?: Maybe<Order_By>;
  presignedUrlsEnabled?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
};

/** primary key columns input for table: storage.buckets */
export type Buckets_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "storage.buckets" */
export enum Buckets_Select_Column {
  /** column name */
  CacheControl = "cacheControl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  DownloadExpiration = "downloadExpiration",
  /** column name */
  Id = "id",
  /** column name */
  MaxUploadFileSize = "maxUploadFileSize",
  /** column name */
  MinUploadFileSize = "minUploadFileSize",
  /** column name */
  PresignedUrlsEnabled = "presignedUrlsEnabled",
  /** column name */
  UpdatedAt = "updatedAt",
}

/** input type for updating data in table "storage.buckets" */
export type Buckets_Set_Input = {
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  downloadExpiration?: Maybe<Scalars["Int"]>;
  id?: Maybe<Scalars["String"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
  presignedUrlsEnabled?: Maybe<Scalars["Boolean"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type Buckets_Stddev_Fields = {
  __typename?: "buckets_stddev_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_pop on columns */
export type Buckets_Stddev_Pop_Fields = {
  __typename?: "buckets_stddev_pop_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_samp on columns */
export type Buckets_Stddev_Samp_Fields = {
  __typename?: "buckets_stddev_samp_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** Streaming cursor of the table "buckets" */
export type Buckets_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Buckets_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Buckets_Stream_Cursor_Value_Input = {
  cacheControl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  downloadExpiration?: Maybe<Scalars["Int"]>;
  id?: Maybe<Scalars["String"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
  presignedUrlsEnabled?: Maybe<Scalars["Boolean"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate sum on columns */
export type Buckets_Sum_Fields = {
  __typename?: "buckets_sum_fields";
  downloadExpiration?: Maybe<Scalars["Int"]>;
  maxUploadFileSize?: Maybe<Scalars["Int"]>;
  minUploadFileSize?: Maybe<Scalars["Int"]>;
};

/** update columns of table "storage.buckets" */
export enum Buckets_Update_Column {
  /** column name */
  CacheControl = "cacheControl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  DownloadExpiration = "downloadExpiration",
  /** column name */
  Id = "id",
  /** column name */
  MaxUploadFileSize = "maxUploadFileSize",
  /** column name */
  MinUploadFileSize = "minUploadFileSize",
  /** column name */
  PresignedUrlsEnabled = "presignedUrlsEnabled",
  /** column name */
  UpdatedAt = "updatedAt",
}

export type Buckets_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: Maybe<Buckets_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Buckets_Set_Input>;
  /** filter the rows which have to be updated */
  where: Buckets_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Buckets_Var_Pop_Fields = {
  __typename?: "buckets_var_pop_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** aggregate var_samp on columns */
export type Buckets_Var_Samp_Fields = {
  __typename?: "buckets_var_samp_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** aggregate variance on columns */
export type Buckets_Variance_Fields = {
  __typename?: "buckets_variance_fields";
  downloadExpiration?: Maybe<Scalars["Float"]>;
  maxUploadFileSize?: Maybe<Scalars["Float"]>;
  minUploadFileSize?: Maybe<Scalars["Float"]>;
};

/** Boolean expression to compare columns of type "bytea". All fields are combined with logical 'AND'. */
export type Bytea_Comparison_Exp = {
  _eq?: Maybe<Scalars["bytea"]>;
  _gt?: Maybe<Scalars["bytea"]>;
  _gte?: Maybe<Scalars["bytea"]>;
  _in?: Maybe<Array<Scalars["bytea"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["bytea"]>;
  _lte?: Maybe<Scalars["bytea"]>;
  _neq?: Maybe<Scalars["bytea"]>;
  _nin?: Maybe<Array<Scalars["bytea"]>>;
};

/** Boolean expression to compare columns of type "citext". All fields are combined with logical 'AND'. */
export type Citext_Comparison_Exp = {
  _eq?: Maybe<Scalars["citext"]>;
  _gt?: Maybe<Scalars["citext"]>;
  _gte?: Maybe<Scalars["citext"]>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: Maybe<Scalars["citext"]>;
  _in?: Maybe<Array<Scalars["citext"]>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: Maybe<Scalars["citext"]>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  /** does the column match the given pattern */
  _like?: Maybe<Scalars["citext"]>;
  _lt?: Maybe<Scalars["citext"]>;
  _lte?: Maybe<Scalars["citext"]>;
  _neq?: Maybe<Scalars["citext"]>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: Maybe<Scalars["citext"]>;
  _nin?: Maybe<Array<Scalars["citext"]>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: Maybe<Scalars["citext"]>;
  /** does the column NOT match the given pattern */
  _nlike?: Maybe<Scalars["citext"]>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: Maybe<Scalars["citext"]>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: Maybe<Scalars["citext"]>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: Maybe<Scalars["citext"]>;
  /** does the column match the given SQL regular expression */
  _similar?: Maybe<Scalars["citext"]>;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = "ASC",
  /** descending ordering of the cursor */
  Desc = "DESC",
}

/** columns and relationships of "storage.files" */
export type Files = {
  __typename?: "files";
  /** An object relationship */
  bucket: Buckets;
  bucketId: Scalars["String"];
  createdAt: Scalars["timestamptz"];
  etag?: Maybe<Scalars["String"]>;
  id: Scalars["uuid"];
  isUploaded?: Maybe<Scalars["Boolean"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt: Scalars["timestamptz"];
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** columns and relationships of "storage.files" */
export type FilesMetadataArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "storage.files" */
export type Files_Aggregate = {
  __typename?: "files_aggregate";
  aggregate?: Maybe<Files_Aggregate_Fields>;
  nodes: Array<Files>;
};

export type Files_Aggregate_Bool_Exp = {
  bool_and?: Maybe<Files_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: Maybe<Files_Aggregate_Bool_Exp_Bool_Or>;
  count?: Maybe<Files_Aggregate_Bool_Exp_Count>;
};

export type Files_Aggregate_Bool_Exp_Bool_And = {
  arguments:
    Files_Select_Column_Files_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Files_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Files_Aggregate_Bool_Exp_Bool_Or = {
  arguments:
    Files_Select_Column_Files_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Files_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Files_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<Files_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Files_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "storage.files" */
export type Files_Aggregate_Fields = {
  __typename?: "files_aggregate_fields";
  avg?: Maybe<Files_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Files_Max_Fields>;
  min?: Maybe<Files_Min_Fields>;
  stddev?: Maybe<Files_Stddev_Fields>;
  stddev_pop?: Maybe<Files_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Files_Stddev_Samp_Fields>;
  sum?: Maybe<Files_Sum_Fields>;
  var_pop?: Maybe<Files_Var_Pop_Fields>;
  var_samp?: Maybe<Files_Var_Samp_Fields>;
  variance?: Maybe<Files_Variance_Fields>;
};

/** aggregate fields of "storage.files" */
export type Files_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Files_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "storage.files" */
export type Files_Aggregate_Order_By = {
  avg?: Maybe<Files_Avg_Order_By>;
  count?: Maybe<Order_By>;
  max?: Maybe<Files_Max_Order_By>;
  min?: Maybe<Files_Min_Order_By>;
  stddev?: Maybe<Files_Stddev_Order_By>;
  stddev_pop?: Maybe<Files_Stddev_Pop_Order_By>;
  stddev_samp?: Maybe<Files_Stddev_Samp_Order_By>;
  sum?: Maybe<Files_Sum_Order_By>;
  var_pop?: Maybe<Files_Var_Pop_Order_By>;
  var_samp?: Maybe<Files_Var_Samp_Order_By>;
  variance?: Maybe<Files_Variance_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Files_Append_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "storage.files" */
export type Files_Arr_Rel_Insert_Input = {
  data: Array<Files_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<Files_On_Conflict>;
};

/** aggregate avg on columns */
export type Files_Avg_Fields = {
  __typename?: "files_avg_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "storage.files" */
export type Files_Avg_Order_By = {
  size?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "storage.files". All fields are combined with a logical 'AND'. */
export type Files_Bool_Exp = {
  _and?: Maybe<Array<Files_Bool_Exp>>;
  _not?: Maybe<Files_Bool_Exp>;
  _or?: Maybe<Array<Files_Bool_Exp>>;
  bucket?: Maybe<Buckets_Bool_Exp>;
  bucketId?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  etag?: Maybe<String_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  isUploaded?: Maybe<Boolean_Comparison_Exp>;
  metadata?: Maybe<Jsonb_Comparison_Exp>;
  mimeType?: Maybe<String_Comparison_Exp>;
  name?: Maybe<String_Comparison_Exp>;
  size?: Maybe<Int_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  uploadedByUserId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "storage.files" */
export enum Files_Constraint {
  /** unique or primary key constraint on columns "id" */
  FilesPkey = "files_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Files_Delete_At_Path_Input = {
  metadata?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Files_Delete_Elem_Input = {
  metadata?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Files_Delete_Key_Input = {
  metadata?: Maybe<Scalars["String"]>;
};

/** input type for incrementing numeric columns in table "storage.files" */
export type Files_Inc_Input = {
  size?: Maybe<Scalars["Int"]>;
};

/** input type for inserting data into table "storage.files" */
export type Files_Insert_Input = {
  bucket?: Maybe<Buckets_Obj_Rel_Insert_Input>;
  bucketId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  etag?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isUploaded?: Maybe<Scalars["Boolean"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Files_Max_Fields = {
  __typename?: "files_max_fields";
  bucketId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  etag?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "storage.files" */
export type Files_Max_Order_By = {
  bucketId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  etag?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  mimeType?: Maybe<Order_By>;
  name?: Maybe<Order_By>;
  size?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  uploadedByUserId?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Files_Min_Fields = {
  __typename?: "files_min_fields";
  bucketId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  etag?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "storage.files" */
export type Files_Min_Order_By = {
  bucketId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  etag?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  mimeType?: Maybe<Order_By>;
  name?: Maybe<Order_By>;
  size?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  uploadedByUserId?: Maybe<Order_By>;
};

/** response of any mutation on the table "storage.files" */
export type Files_Mutation_Response = {
  __typename?: "files_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Files>;
};

/** input type for inserting object relation for remote table "storage.files" */
export type Files_Obj_Rel_Insert_Input = {
  data: Files_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<Files_On_Conflict>;
};

/** on_conflict condition type for table "storage.files" */
export type Files_On_Conflict = {
  constraint: Files_Constraint;
  update_columns?: Array<Files_Update_Column>;
  where?: Maybe<Files_Bool_Exp>;
};

/** Ordering options when selecting data from "storage.files". */
export type Files_Order_By = {
  bucket?: Maybe<Buckets_Order_By>;
  bucketId?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  etag?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  isUploaded?: Maybe<Order_By>;
  metadata?: Maybe<Order_By>;
  mimeType?: Maybe<Order_By>;
  name?: Maybe<Order_By>;
  size?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  uploadedByUserId?: Maybe<Order_By>;
};

/** primary key columns input for table: storage.files */
export type Files_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Files_Prepend_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "storage.files" */
export enum Files_Select_Column {
  /** column name */
  BucketId = "bucketId",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Etag = "etag",
  /** column name */
  Id = "id",
  /** column name */
  IsUploaded = "isUploaded",
  /** column name */
  Metadata = "metadata",
  /** column name */
  MimeType = "mimeType",
  /** column name */
  Name = "name",
  /** column name */
  Size = "size",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UploadedByUserId = "uploadedByUserId",
}

/** select "files_aggregate_bool_exp_bool_and_arguments_columns" columns of table "storage.files" */
export enum Files_Select_Column_Files_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsUploaded = "isUploaded",
}

/** select "files_aggregate_bool_exp_bool_or_arguments_columns" columns of table "storage.files" */
export enum Files_Select_Column_Files_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsUploaded = "isUploaded",
}

/** input type for updating data in table "storage.files" */
export type Files_Set_Input = {
  bucketId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  etag?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isUploaded?: Maybe<Scalars["Boolean"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** aggregate stddev on columns */
export type Files_Stddev_Fields = {
  __typename?: "files_stddev_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "storage.files" */
export type Files_Stddev_Order_By = {
  size?: Maybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Files_Stddev_Pop_Fields = {
  __typename?: "files_stddev_pop_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "storage.files" */
export type Files_Stddev_Pop_Order_By = {
  size?: Maybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Files_Stddev_Samp_Fields = {
  __typename?: "files_stddev_samp_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "storage.files" */
export type Files_Stddev_Samp_Order_By = {
  size?: Maybe<Order_By>;
};

/** Streaming cursor of the table "files" */
export type Files_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Files_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Files_Stream_Cursor_Value_Input = {
  bucketId?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  etag?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isUploaded?: Maybe<Scalars["Boolean"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  mimeType?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  size?: Maybe<Scalars["Int"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  uploadedByUserId?: Maybe<Scalars["uuid"]>;
};

/** aggregate sum on columns */
export type Files_Sum_Fields = {
  __typename?: "files_sum_fields";
  size?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "storage.files" */
export type Files_Sum_Order_By = {
  size?: Maybe<Order_By>;
};

/** update columns of table "storage.files" */
export enum Files_Update_Column {
  /** column name */
  BucketId = "bucketId",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Etag = "etag",
  /** column name */
  Id = "id",
  /** column name */
  IsUploaded = "isUploaded",
  /** column name */
  Metadata = "metadata",
  /** column name */
  MimeType = "mimeType",
  /** column name */
  Name = "name",
  /** column name */
  Size = "size",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UploadedByUserId = "uploadedByUserId",
}

export type Files_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<Files_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<Files_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<Files_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<Files_Delete_Key_Input>;
  /** increments the numeric columns with given value of the filtered values */
  _inc?: Maybe<Files_Inc_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<Files_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Files_Set_Input>;
  /** filter the rows which have to be updated */
  where: Files_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Files_Var_Pop_Fields = {
  __typename?: "files_var_pop_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "storage.files" */
export type Files_Var_Pop_Order_By = {
  size?: Maybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Files_Var_Samp_Fields = {
  __typename?: "files_var_samp_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "storage.files" */
export type Files_Var_Samp_Order_By = {
  size?: Maybe<Order_By>;
};

/** aggregate variance on columns */
export type Files_Variance_Fields = {
  __typename?: "files_variance_fields";
  size?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "storage.files" */
export type Files_Variance_Order_By = {
  size?: Maybe<Order_By>;
};

/** Reference to a frameio.js item */
export type Frame = {
  __typename?: "frame";
  created_at: Scalars["timestamptz"];
  deleted: Scalars["Boolean"];
  /** An array relationship */
  frame_versions: Array<Frame_Version>;
  /** An aggregate relationship */
  frame_versions_aggregate: Frame_Version_Aggregate;
  id: Scalars["uuid"];
  public: Scalars["Boolean"];
  user?: Maybe<Scalars["uuid"]>;
  /** An object relationship */
  users?: Maybe<Users>;
};

/** Reference to a frameio.js item */
export type FrameFrame_VersionsArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

/** Reference to a frameio.js item */
export type FrameFrame_Versions_AggregateArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

/** aggregated selection of "frame" */
export type Frame_Aggregate = {
  __typename?: "frame_aggregate";
  aggregate?: Maybe<Frame_Aggregate_Fields>;
  nodes: Array<Frame>;
};

/** aggregate fields of "frame" */
export type Frame_Aggregate_Fields = {
  __typename?: "frame_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Frame_Max_Fields>;
  min?: Maybe<Frame_Min_Fields>;
};

/** aggregate fields of "frame" */
export type Frame_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Frame_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "frame". All fields are combined with a logical 'AND'. */
export type Frame_Bool_Exp = {
  _and?: Maybe<Array<Frame_Bool_Exp>>;
  _not?: Maybe<Frame_Bool_Exp>;
  _or?: Maybe<Array<Frame_Bool_Exp>>;
  created_at?: Maybe<Timestamptz_Comparison_Exp>;
  deleted?: Maybe<Boolean_Comparison_Exp>;
  frame_versions?: Maybe<Frame_Version_Bool_Exp>;
  frame_versions_aggregate?: Maybe<Frame_Version_Aggregate_Bool_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  public?: Maybe<Boolean_Comparison_Exp>;
  user?: Maybe<Uuid_Comparison_Exp>;
  users?: Maybe<Users_Bool_Exp>;
};

/** unique or primary key constraints on table "frame" */
export enum Frame_Constraint {
  /** unique or primary key constraint on columns "id" */
  FramePkey = "frame_pkey",
}

/** input type for inserting data into table "frame" */
export type Frame_Insert_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  frame_versions?: Maybe<Frame_Version_Arr_Rel_Insert_Input>;
  id?: Maybe<Scalars["uuid"]>;
  public?: Maybe<Scalars["Boolean"]>;
  user?: Maybe<Scalars["uuid"]>;
  users?: Maybe<Users_Obj_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Frame_Max_Fields = {
  __typename?: "frame_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  user?: Maybe<Scalars["uuid"]>;
};

/** aggregate min on columns */
export type Frame_Min_Fields = {
  __typename?: "frame_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  user?: Maybe<Scalars["uuid"]>;
};

/** response of any mutation on the table "frame" */
export type Frame_Mutation_Response = {
  __typename?: "frame_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Frame>;
};

/** input type for inserting object relation for remote table "frame" */
export type Frame_Obj_Rel_Insert_Input = {
  data: Frame_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<Frame_On_Conflict>;
};

/** on_conflict condition type for table "frame" */
export type Frame_On_Conflict = {
  constraint: Frame_Constraint;
  update_columns?: Array<Frame_Update_Column>;
  where?: Maybe<Frame_Bool_Exp>;
};

/** Ordering options when selecting data from "frame". */
export type Frame_Order_By = {
  created_at?: Maybe<Order_By>;
  deleted?: Maybe<Order_By>;
  frame_versions_aggregate?: Maybe<Frame_Version_Aggregate_Order_By>;
  id?: Maybe<Order_By>;
  public?: Maybe<Order_By>;
  user?: Maybe<Order_By>;
  users?: Maybe<Users_Order_By>;
};

/** primary key columns input for table: frame */
export type Frame_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "frame" */
export enum Frame_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Deleted = "deleted",
  /** column name */
  Id = "id",
  /** column name */
  Public = "public",
  /** column name */
  User = "user",
}

/** input type for updating data in table "frame" */
export type Frame_Set_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  id?: Maybe<Scalars["uuid"]>;
  public?: Maybe<Scalars["Boolean"]>;
  user?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "frame" */
export type Frame_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Frame_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Frame_Stream_Cursor_Value_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  id?: Maybe<Scalars["uuid"]>;
  public?: Maybe<Scalars["Boolean"]>;
  user?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "frame" */
export enum Frame_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Deleted = "deleted",
  /** column name */
  Id = "id",
  /** column name */
  Public = "public",
  /** column name */
  User = "user",
}

export type Frame_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Frame_Set_Input>;
  /** filter the rows which have to be updated */
  where: Frame_Bool_Exp;
};

/** Actual saved versions of a frame */
export type Frame_Version = {
  __typename?: "frame_version";
  created_at: Scalars["timestamptz"];
  file?: Maybe<Scalars["uuid"]>;
  frame: Scalars["uuid"];
  /** An object relationship */
  frames: Frame;
  id: Scalars["uuid"];
  og?: Maybe<Scalars["jsonb"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** Actual saved versions of a frame */
export type Frame_VersionOgArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "frame_version" */
export type Frame_Version_Aggregate = {
  __typename?: "frame_version_aggregate";
  aggregate?: Maybe<Frame_Version_Aggregate_Fields>;
  nodes: Array<Frame_Version>;
};

export type Frame_Version_Aggregate_Bool_Exp = {
  count?: Maybe<Frame_Version_Aggregate_Bool_Exp_Count>;
};

export type Frame_Version_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<Frame_Version_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Frame_Version_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "frame_version" */
export type Frame_Version_Aggregate_Fields = {
  __typename?: "frame_version_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Frame_Version_Max_Fields>;
  min?: Maybe<Frame_Version_Min_Fields>;
};

/** aggregate fields of "frame_version" */
export type Frame_Version_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Frame_Version_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "frame_version" */
export type Frame_Version_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<Frame_Version_Max_Order_By>;
  min?: Maybe<Frame_Version_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Frame_Version_Append_Input = {
  og?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "frame_version" */
export type Frame_Version_Arr_Rel_Insert_Input = {
  data: Array<Frame_Version_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<Frame_Version_On_Conflict>;
};

/** Boolean expression to filter rows from the table "frame_version". All fields are combined with a logical 'AND'. */
export type Frame_Version_Bool_Exp = {
  _and?: Maybe<Array<Frame_Version_Bool_Exp>>;
  _not?: Maybe<Frame_Version_Bool_Exp>;
  _or?: Maybe<Array<Frame_Version_Bool_Exp>>;
  created_at?: Maybe<Timestamptz_Comparison_Exp>;
  file?: Maybe<Uuid_Comparison_Exp>;
  frame?: Maybe<Uuid_Comparison_Exp>;
  frames?: Maybe<Frame_Bool_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  og?: Maybe<Jsonb_Comparison_Exp>;
  sha256?: Maybe<String_Comparison_Exp>;
  url?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "frame_version" */
export enum Frame_Version_Constraint {
  /** unique or primary key constraint on columns "id" */
  FrameVersionPkey = "frame_version_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Frame_Version_Delete_At_Path_Input = {
  og?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Frame_Version_Delete_Elem_Input = {
  og?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Frame_Version_Delete_Key_Input = {
  og?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "frame_version" */
export type Frame_Version_Insert_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Scalars["uuid"]>;
  frame?: Maybe<Scalars["uuid"]>;
  frames?: Maybe<Frame_Obj_Rel_Insert_Input>;
  id?: Maybe<Scalars["uuid"]>;
  og?: Maybe<Scalars["jsonb"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Frame_Version_Max_Fields = {
  __typename?: "frame_version_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Scalars["uuid"]>;
  frame?: Maybe<Scalars["uuid"]>;
  id?: Maybe<Scalars["uuid"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "frame_version" */
export type Frame_Version_Max_Order_By = {
  created_at?: Maybe<Order_By>;
  file?: Maybe<Order_By>;
  frame?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  sha256?: Maybe<Order_By>;
  url?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Frame_Version_Min_Fields = {
  __typename?: "frame_version_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Scalars["uuid"]>;
  frame?: Maybe<Scalars["uuid"]>;
  id?: Maybe<Scalars["uuid"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "frame_version" */
export type Frame_Version_Min_Order_By = {
  created_at?: Maybe<Order_By>;
  file?: Maybe<Order_By>;
  frame?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  sha256?: Maybe<Order_By>;
  url?: Maybe<Order_By>;
};

/** response of any mutation on the table "frame_version" */
export type Frame_Version_Mutation_Response = {
  __typename?: "frame_version_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Frame_Version>;
};

/** on_conflict condition type for table "frame_version" */
export type Frame_Version_On_Conflict = {
  constraint: Frame_Version_Constraint;
  update_columns?: Array<Frame_Version_Update_Column>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

/** Ordering options when selecting data from "frame_version". */
export type Frame_Version_Order_By = {
  created_at?: Maybe<Order_By>;
  file?: Maybe<Order_By>;
  frame?: Maybe<Order_By>;
  frames?: Maybe<Frame_Order_By>;
  id?: Maybe<Order_By>;
  og?: Maybe<Order_By>;
  sha256?: Maybe<Order_By>;
  url?: Maybe<Order_By>;
};

/** primary key columns input for table: frame_version */
export type Frame_Version_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Frame_Version_Prepend_Input = {
  og?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "frame_version" */
export enum Frame_Version_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  File = "file",
  /** column name */
  Frame = "frame",
  /** column name */
  Id = "id",
  /** column name */
  Og = "og",
  /** column name */
  Sha256 = "sha256",
  /** column name */
  Url = "url",
}

/** input type for updating data in table "frame_version" */
export type Frame_Version_Set_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Scalars["uuid"]>;
  frame?: Maybe<Scalars["uuid"]>;
  id?: Maybe<Scalars["uuid"]>;
  og?: Maybe<Scalars["jsonb"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** Streaming cursor of the table "frame_version" */
export type Frame_Version_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Frame_Version_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Frame_Version_Stream_Cursor_Value_Input = {
  created_at?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Scalars["uuid"]>;
  frame?: Maybe<Scalars["uuid"]>;
  id?: Maybe<Scalars["uuid"]>;
  og?: Maybe<Scalars["jsonb"]>;
  sha256?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

/** update columns of table "frame_version" */
export enum Frame_Version_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  File = "file",
  /** column name */
  Frame = "frame",
  /** column name */
  Id = "id",
  /** column name */
  Og = "og",
  /** column name */
  Sha256 = "sha256",
  /** column name */
  Url = "url",
}

export type Frame_Version_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<Frame_Version_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<Frame_Version_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<Frame_Version_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<Frame_Version_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<Frame_Version_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Frame_Version_Set_Input>;
  /** filter the rows which have to be updated */
  where: Frame_Version_Bool_Exp;
};

export type Jsonb_Cast_Exp = {
  String?: Maybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: Maybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: Maybe<Scalars["jsonb"]>;
  /** does the column contain the given json value at the top level */
  _contains?: Maybe<Scalars["jsonb"]>;
  _eq?: Maybe<Scalars["jsonb"]>;
  _gt?: Maybe<Scalars["jsonb"]>;
  _gte?: Maybe<Scalars["jsonb"]>;
  /** does the string exist as a top-level key in the column */
  _has_key?: Maybe<Scalars["String"]>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: Maybe<Array<Scalars["String"]>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: Maybe<Array<Scalars["String"]>>;
  _in?: Maybe<Array<Scalars["jsonb"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["jsonb"]>;
  _lte?: Maybe<Scalars["jsonb"]>;
  _neq?: Maybe<Scalars["jsonb"]>;
  _nin?: Maybe<Array<Scalars["jsonb"]>>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: "mutation_root";
  /** delete single row from the table: "auth.oauth2_auth_requests" */
  deleteAuthOauth2AuthRequest?: Maybe<AuthOauth2AuthRequests>;
  /** delete data from the table: "auth.oauth2_auth_requests" */
  deleteAuthOauth2AuthRequests?: Maybe<
    AuthOauth2AuthRequests_Mutation_Response
  >;
  /** delete single row from the table: "auth.oauth2_authorization_codes" */
  deleteAuthOauth2AuthorizationCode?: Maybe<AuthOauth2AuthorizationCodes>;
  /** delete data from the table: "auth.oauth2_authorization_codes" */
  deleteAuthOauth2AuthorizationCodes?: Maybe<
    AuthOauth2AuthorizationCodes_Mutation_Response
  >;
  /** delete single row from the table: "auth.oauth2_clients" */
  deleteAuthOauth2Client?: Maybe<AuthOauth2Clients>;
  /** delete data from the table: "auth.oauth2_clients" */
  deleteAuthOauth2Clients?: Maybe<AuthOauth2Clients_Mutation_Response>;
  /** delete single row from the table: "auth.oauth2_refresh_tokens" */
  deleteAuthOauth2RefreshToken?: Maybe<AuthOauth2RefreshTokens>;
  /** delete data from the table: "auth.oauth2_refresh_tokens" */
  deleteAuthOauth2RefreshTokens?: Maybe<
    AuthOauth2RefreshTokens_Mutation_Response
  >;
  /** delete single row from the table: "auth.providers" */
  deleteAuthProvider?: Maybe<AuthProviders>;
  /** delete single row from the table: "auth.provider_requests" */
  deleteAuthProviderRequest?: Maybe<AuthProviderRequests>;
  /** delete data from the table: "auth.provider_requests" */
  deleteAuthProviderRequests?: Maybe<AuthProviderRequests_Mutation_Response>;
  /** delete data from the table: "auth.providers" */
  deleteAuthProviders?: Maybe<AuthProviders_Mutation_Response>;
  /** delete single row from the table: "auth.refresh_tokens" */
  deleteAuthRefreshToken?: Maybe<AuthRefreshTokens>;
  /** delete single row from the table: "auth.refresh_token_types" */
  deleteAuthRefreshTokenType?: Maybe<AuthRefreshTokenTypes>;
  /** delete data from the table: "auth.refresh_token_types" */
  deleteAuthRefreshTokenTypes?: Maybe<AuthRefreshTokenTypes_Mutation_Response>;
  /** delete data from the table: "auth.refresh_tokens" */
  deleteAuthRefreshTokens?: Maybe<AuthRefreshTokens_Mutation_Response>;
  /** delete single row from the table: "auth.roles" */
  deleteAuthRole?: Maybe<AuthRoles>;
  /** delete data from the table: "auth.roles" */
  deleteAuthRoles?: Maybe<AuthRoles_Mutation_Response>;
  /** delete single row from the table: "auth.user_providers" */
  deleteAuthUserProvider?: Maybe<AuthUserProviders>;
  /** delete data from the table: "auth.user_providers" */
  deleteAuthUserProviders?: Maybe<AuthUserProviders_Mutation_Response>;
  /** delete single row from the table: "auth.user_roles" */
  deleteAuthUserRole?: Maybe<AuthUserRoles>;
  /** delete data from the table: "auth.user_roles" */
  deleteAuthUserRoles?: Maybe<AuthUserRoles_Mutation_Response>;
  /** delete single row from the table: "auth.user_security_keys" */
  deleteAuthUserSecurityKey?: Maybe<AuthUserSecurityKeys>;
  /** delete data from the table: "auth.user_security_keys" */
  deleteAuthUserSecurityKeys?: Maybe<AuthUserSecurityKeys_Mutation_Response>;
  /** delete single row from the table: "storage.buckets" */
  deleteBucket?: Maybe<Buckets>;
  /** delete data from the table: "storage.buckets" */
  deleteBuckets?: Maybe<Buckets_Mutation_Response>;
  /** delete single row from the table: "storage.files" */
  deleteFile?: Maybe<Files>;
  /** delete data from the table: "storage.files" */
  deleteFiles?: Maybe<Files_Mutation_Response>;
  /** delete single row from the table: "auth.users" */
  deleteUser?: Maybe<Users>;
  /** delete data from the table: "auth.users" */
  deleteUsers?: Maybe<Users_Mutation_Response>;
  /** delete single row from the table: "storage.virus" */
  deleteVirus?: Maybe<Virus>;
  /** delete data from the table: "storage.virus" */
  deleteViruses?: Maybe<Virus_Mutation_Response>;
  /** delete data from the table: "frame" */
  delete_frame?: Maybe<Frame_Mutation_Response>;
  /** delete single row from the table: "frame" */
  delete_frame_by_pk?: Maybe<Frame>;
  /** delete data from the table: "frame_version" */
  delete_frame_version?: Maybe<Frame_Version_Mutation_Response>;
  /** delete single row from the table: "frame_version" */
  delete_frame_version_by_pk?: Maybe<Frame_Version>;
  /** delete data from the table: "profiles" */
  delete_profiles?: Maybe<Profiles_Mutation_Response>;
  /** delete single row from the table: "profiles" */
  delete_profiles_by_pk?: Maybe<Profiles>;
  /** delete data from the table: "projects" */
  delete_projects?: Maybe<Projects_Mutation_Response>;
  /** delete single row from the table: "projects" */
  delete_projects_by_pk?: Maybe<Projects>;
  /** insert a single row into the table: "auth.oauth2_auth_requests" */
  insertAuthOauth2AuthRequest?: Maybe<AuthOauth2AuthRequests>;
  /** insert data into the table: "auth.oauth2_auth_requests" */
  insertAuthOauth2AuthRequests?: Maybe<
    AuthOauth2AuthRequests_Mutation_Response
  >;
  /** insert a single row into the table: "auth.oauth2_authorization_codes" */
  insertAuthOauth2AuthorizationCode?: Maybe<AuthOauth2AuthorizationCodes>;
  /** insert data into the table: "auth.oauth2_authorization_codes" */
  insertAuthOauth2AuthorizationCodes?: Maybe<
    AuthOauth2AuthorizationCodes_Mutation_Response
  >;
  /** insert a single row into the table: "auth.oauth2_clients" */
  insertAuthOauth2Client?: Maybe<AuthOauth2Clients>;
  /** insert data into the table: "auth.oauth2_clients" */
  insertAuthOauth2Clients?: Maybe<AuthOauth2Clients_Mutation_Response>;
  /** insert a single row into the table: "auth.oauth2_refresh_tokens" */
  insertAuthOauth2RefreshToken?: Maybe<AuthOauth2RefreshTokens>;
  /** insert data into the table: "auth.oauth2_refresh_tokens" */
  insertAuthOauth2RefreshTokens?: Maybe<
    AuthOauth2RefreshTokens_Mutation_Response
  >;
  /** insert a single row into the table: "auth.providers" */
  insertAuthProvider?: Maybe<AuthProviders>;
  /** insert a single row into the table: "auth.provider_requests" */
  insertAuthProviderRequest?: Maybe<AuthProviderRequests>;
  /** insert data into the table: "auth.provider_requests" */
  insertAuthProviderRequests?: Maybe<AuthProviderRequests_Mutation_Response>;
  /** insert data into the table: "auth.providers" */
  insertAuthProviders?: Maybe<AuthProviders_Mutation_Response>;
  /** insert a single row into the table: "auth.refresh_tokens" */
  insertAuthRefreshToken?: Maybe<AuthRefreshTokens>;
  /** insert a single row into the table: "auth.refresh_token_types" */
  insertAuthRefreshTokenType?: Maybe<AuthRefreshTokenTypes>;
  /** insert data into the table: "auth.refresh_token_types" */
  insertAuthRefreshTokenTypes?: Maybe<AuthRefreshTokenTypes_Mutation_Response>;
  /** insert data into the table: "auth.refresh_tokens" */
  insertAuthRefreshTokens?: Maybe<AuthRefreshTokens_Mutation_Response>;
  /** insert a single row into the table: "auth.roles" */
  insertAuthRole?: Maybe<AuthRoles>;
  /** insert data into the table: "auth.roles" */
  insertAuthRoles?: Maybe<AuthRoles_Mutation_Response>;
  /** insert a single row into the table: "auth.user_providers" */
  insertAuthUserProvider?: Maybe<AuthUserProviders>;
  /** insert data into the table: "auth.user_providers" */
  insertAuthUserProviders?: Maybe<AuthUserProviders_Mutation_Response>;
  /** insert a single row into the table: "auth.user_roles" */
  insertAuthUserRole?: Maybe<AuthUserRoles>;
  /** insert data into the table: "auth.user_roles" */
  insertAuthUserRoles?: Maybe<AuthUserRoles_Mutation_Response>;
  /** insert a single row into the table: "auth.user_security_keys" */
  insertAuthUserSecurityKey?: Maybe<AuthUserSecurityKeys>;
  /** insert data into the table: "auth.user_security_keys" */
  insertAuthUserSecurityKeys?: Maybe<AuthUserSecurityKeys_Mutation_Response>;
  /** insert a single row into the table: "storage.buckets" */
  insertBucket?: Maybe<Buckets>;
  /** insert data into the table: "storage.buckets" */
  insertBuckets?: Maybe<Buckets_Mutation_Response>;
  /** insert a single row into the table: "storage.files" */
  insertFile?: Maybe<Files>;
  /** insert data into the table: "storage.files" */
  insertFiles?: Maybe<Files_Mutation_Response>;
  /** insert a single row into the table: "auth.users" */
  insertUser?: Maybe<Users>;
  /** insert data into the table: "auth.users" */
  insertUsers?: Maybe<Users_Mutation_Response>;
  /** insert a single row into the table: "storage.virus" */
  insertVirus?: Maybe<Virus>;
  /** insert data into the table: "storage.virus" */
  insertViruses?: Maybe<Virus_Mutation_Response>;
  /** insert data into the table: "frame" */
  insert_frame?: Maybe<Frame_Mutation_Response>;
  /** insert a single row into the table: "frame" */
  insert_frame_one?: Maybe<Frame>;
  /** insert data into the table: "frame_version" */
  insert_frame_version?: Maybe<Frame_Version_Mutation_Response>;
  /** insert a single row into the table: "frame_version" */
  insert_frame_version_one?: Maybe<Frame_Version>;
  /** insert data into the table: "profiles" */
  insert_profiles?: Maybe<Profiles_Mutation_Response>;
  /** insert a single row into the table: "profiles" */
  insert_profiles_one?: Maybe<Profiles>;
  /** insert data into the table: "projects" */
  insert_projects?: Maybe<Projects_Mutation_Response>;
  /** insert a single row into the table: "projects" */
  insert_projects_one?: Maybe<Projects>;
  /** update single row of the table: "auth.oauth2_auth_requests" */
  updateAuthOauth2AuthRequest?: Maybe<AuthOauth2AuthRequests>;
  /** update data of the table: "auth.oauth2_auth_requests" */
  updateAuthOauth2AuthRequests?: Maybe<
    AuthOauth2AuthRequests_Mutation_Response
  >;
  /** update single row of the table: "auth.oauth2_authorization_codes" */
  updateAuthOauth2AuthorizationCode?: Maybe<AuthOauth2AuthorizationCodes>;
  /** update data of the table: "auth.oauth2_authorization_codes" */
  updateAuthOauth2AuthorizationCodes?: Maybe<
    AuthOauth2AuthorizationCodes_Mutation_Response
  >;
  /** update single row of the table: "auth.oauth2_clients" */
  updateAuthOauth2Client?: Maybe<AuthOauth2Clients>;
  /** update data of the table: "auth.oauth2_clients" */
  updateAuthOauth2Clients?: Maybe<AuthOauth2Clients_Mutation_Response>;
  /** update single row of the table: "auth.oauth2_refresh_tokens" */
  updateAuthOauth2RefreshToken?: Maybe<AuthOauth2RefreshTokens>;
  /** update data of the table: "auth.oauth2_refresh_tokens" */
  updateAuthOauth2RefreshTokens?: Maybe<
    AuthOauth2RefreshTokens_Mutation_Response
  >;
  /** update single row of the table: "auth.providers" */
  updateAuthProvider?: Maybe<AuthProviders>;
  /** update single row of the table: "auth.provider_requests" */
  updateAuthProviderRequest?: Maybe<AuthProviderRequests>;
  /** update data of the table: "auth.provider_requests" */
  updateAuthProviderRequests?: Maybe<AuthProviderRequests_Mutation_Response>;
  /** update data of the table: "auth.providers" */
  updateAuthProviders?: Maybe<AuthProviders_Mutation_Response>;
  /** update single row of the table: "auth.refresh_tokens" */
  updateAuthRefreshToken?: Maybe<AuthRefreshTokens>;
  /** update single row of the table: "auth.refresh_token_types" */
  updateAuthRefreshTokenType?: Maybe<AuthRefreshTokenTypes>;
  /** update data of the table: "auth.refresh_token_types" */
  updateAuthRefreshTokenTypes?: Maybe<AuthRefreshTokenTypes_Mutation_Response>;
  /** update data of the table: "auth.refresh_tokens" */
  updateAuthRefreshTokens?: Maybe<AuthRefreshTokens_Mutation_Response>;
  /** update single row of the table: "auth.roles" */
  updateAuthRole?: Maybe<AuthRoles>;
  /** update data of the table: "auth.roles" */
  updateAuthRoles?: Maybe<AuthRoles_Mutation_Response>;
  /** update single row of the table: "auth.user_providers" */
  updateAuthUserProvider?: Maybe<AuthUserProviders>;
  /** update data of the table: "auth.user_providers" */
  updateAuthUserProviders?: Maybe<AuthUserProviders_Mutation_Response>;
  /** update single row of the table: "auth.user_roles" */
  updateAuthUserRole?: Maybe<AuthUserRoles>;
  /** update data of the table: "auth.user_roles" */
  updateAuthUserRoles?: Maybe<AuthUserRoles_Mutation_Response>;
  /** update single row of the table: "auth.user_security_keys" */
  updateAuthUserSecurityKey?: Maybe<AuthUserSecurityKeys>;
  /** update data of the table: "auth.user_security_keys" */
  updateAuthUserSecurityKeys?: Maybe<AuthUserSecurityKeys_Mutation_Response>;
  /** update single row of the table: "storage.buckets" */
  updateBucket?: Maybe<Buckets>;
  /** update data of the table: "storage.buckets" */
  updateBuckets?: Maybe<Buckets_Mutation_Response>;
  /** update single row of the table: "storage.files" */
  updateFile?: Maybe<Files>;
  /** update data of the table: "storage.files" */
  updateFiles?: Maybe<Files_Mutation_Response>;
  /** update single row of the table: "auth.users" */
  updateUser?: Maybe<Users>;
  /** update data of the table: "auth.users" */
  updateUsers?: Maybe<Users_Mutation_Response>;
  /** update single row of the table: "storage.virus" */
  updateVirus?: Maybe<Virus>;
  /** update data of the table: "storage.virus" */
  updateViruses?: Maybe<Virus_Mutation_Response>;
  /** update multiples rows of table: "auth.oauth2_auth_requests" */
  update_authOauth2AuthRequests_many?: Maybe<
    Array<Maybe<AuthOauth2AuthRequests_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.oauth2_authorization_codes" */
  update_authOauth2AuthorizationCodes_many?: Maybe<
    Array<Maybe<AuthOauth2AuthorizationCodes_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.oauth2_clients" */
  update_authOauth2Clients_many?: Maybe<
    Array<Maybe<AuthOauth2Clients_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.oauth2_refresh_tokens" */
  update_authOauth2RefreshTokens_many?: Maybe<
    Array<Maybe<AuthOauth2RefreshTokens_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.provider_requests" */
  update_authProviderRequests_many?: Maybe<
    Array<Maybe<AuthProviderRequests_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.providers" */
  update_authProviders_many?: Maybe<
    Array<Maybe<AuthProviders_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.refresh_token_types" */
  update_authRefreshTokenTypes_many?: Maybe<
    Array<Maybe<AuthRefreshTokenTypes_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.refresh_tokens" */
  update_authRefreshTokens_many?: Maybe<
    Array<Maybe<AuthRefreshTokens_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.roles" */
  update_authRoles_many?: Maybe<Array<Maybe<AuthRoles_Mutation_Response>>>;
  /** update multiples rows of table: "auth.user_providers" */
  update_authUserProviders_many?: Maybe<
    Array<Maybe<AuthUserProviders_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.user_roles" */
  update_authUserRoles_many?: Maybe<
    Array<Maybe<AuthUserRoles_Mutation_Response>>
  >;
  /** update multiples rows of table: "auth.user_security_keys" */
  update_authUserSecurityKeys_many?: Maybe<
    Array<Maybe<AuthUserSecurityKeys_Mutation_Response>>
  >;
  /** update multiples rows of table: "storage.buckets" */
  update_buckets_many?: Maybe<Array<Maybe<Buckets_Mutation_Response>>>;
  /** update multiples rows of table: "storage.files" */
  update_files_many?: Maybe<Array<Maybe<Files_Mutation_Response>>>;
  /** update data of the table: "frame" */
  update_frame?: Maybe<Frame_Mutation_Response>;
  /** update single row of the table: "frame" */
  update_frame_by_pk?: Maybe<Frame>;
  /** update multiples rows of table: "frame" */
  update_frame_many?: Maybe<Array<Maybe<Frame_Mutation_Response>>>;
  /** update data of the table: "frame_version" */
  update_frame_version?: Maybe<Frame_Version_Mutation_Response>;
  /** update single row of the table: "frame_version" */
  update_frame_version_by_pk?: Maybe<Frame_Version>;
  /** update multiples rows of table: "frame_version" */
  update_frame_version_many?: Maybe<
    Array<Maybe<Frame_Version_Mutation_Response>>
  >;
  /** update data of the table: "profiles" */
  update_profiles?: Maybe<Profiles_Mutation_Response>;
  /** update single row of the table: "profiles" */
  update_profiles_by_pk?: Maybe<Profiles>;
  /** update multiples rows of table: "profiles" */
  update_profiles_many?: Maybe<Array<Maybe<Profiles_Mutation_Response>>>;
  /** update data of the table: "projects" */
  update_projects?: Maybe<Projects_Mutation_Response>;
  /** update single row of the table: "projects" */
  update_projects_by_pk?: Maybe<Projects>;
  /** update multiples rows of table: "projects" */
  update_projects_many?: Maybe<Array<Maybe<Projects_Mutation_Response>>>;
  /** update multiples rows of table: "auth.users" */
  update_users_many?: Maybe<Array<Maybe<Users_Mutation_Response>>>;
  /** update multiples rows of table: "storage.virus" */
  update_virus_many?: Maybe<Array<Maybe<Virus_Mutation_Response>>>;
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2AuthRequestArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2AuthRequestsArgs = {
  where: AuthOauth2AuthRequests_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2AuthorizationCodeArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2AuthorizationCodesArgs = {
  where: AuthOauth2AuthorizationCodes_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2ClientArgs = {
  clientId: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2ClientsArgs = {
  where: AuthOauth2Clients_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2RefreshTokenArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthOauth2RefreshTokensArgs = {
  where: AuthOauth2RefreshTokens_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthProviderArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDeleteAuthProviderRequestArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthProviderRequestsArgs = {
  where: AuthProviderRequests_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthProvidersArgs = {
  where: AuthProviders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthRefreshTokenArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthRefreshTokenTypeArgs = {
  value: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDeleteAuthRefreshTokenTypesArgs = {
  where: AuthRefreshTokenTypes_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthRefreshTokensArgs = {
  where: AuthRefreshTokens_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthRoleArgs = {
  role: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDeleteAuthRolesArgs = {
  where: AuthRoles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthUserProviderArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthUserProvidersArgs = {
  where: AuthUserProviders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthUserRoleArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthUserRolesArgs = {
  where: AuthUserRoles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteAuthUserSecurityKeyArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteAuthUserSecurityKeysArgs = {
  where: AuthUserSecurityKeys_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteBucketArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDeleteBucketsArgs = {
  where: Buckets_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteFileArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteFilesArgs = {
  where: Files_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteUserArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteUsersArgs = {
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDeleteVirusArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDeleteVirusesArgs = {
  where: Virus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_FrameArgs = {
  where: Frame_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Frame_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Frame_VersionArgs = {
  where: Frame_Version_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Frame_Version_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ProfilesArgs = {
  where: Profiles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Profiles_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ProjectsArgs = {
  where: Projects_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Projects_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2AuthRequestArgs = {
  object: AuthOauth2AuthRequests_Insert_Input;
  on_conflict?: Maybe<AuthOauth2AuthRequests_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2AuthRequestsArgs = {
  objects: Array<AuthOauth2AuthRequests_Insert_Input>;
  on_conflict?: Maybe<AuthOauth2AuthRequests_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2AuthorizationCodeArgs = {
  object: AuthOauth2AuthorizationCodes_Insert_Input;
  on_conflict?: Maybe<AuthOauth2AuthorizationCodes_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2AuthorizationCodesArgs = {
  objects: Array<AuthOauth2AuthorizationCodes_Insert_Input>;
  on_conflict?: Maybe<AuthOauth2AuthorizationCodes_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2ClientArgs = {
  object: AuthOauth2Clients_Insert_Input;
  on_conflict?: Maybe<AuthOauth2Clients_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2ClientsArgs = {
  objects: Array<AuthOauth2Clients_Insert_Input>;
  on_conflict?: Maybe<AuthOauth2Clients_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2RefreshTokenArgs = {
  object: AuthOauth2RefreshTokens_Insert_Input;
  on_conflict?: Maybe<AuthOauth2RefreshTokens_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthOauth2RefreshTokensArgs = {
  objects: Array<AuthOauth2RefreshTokens_Insert_Input>;
  on_conflict?: Maybe<AuthOauth2RefreshTokens_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthProviderArgs = {
  object: AuthProviders_Insert_Input;
  on_conflict?: Maybe<AuthProviders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthProviderRequestArgs = {
  object: AuthProviderRequests_Insert_Input;
  on_conflict?: Maybe<AuthProviderRequests_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthProviderRequestsArgs = {
  objects: Array<AuthProviderRequests_Insert_Input>;
  on_conflict?: Maybe<AuthProviderRequests_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthProvidersArgs = {
  objects: Array<AuthProviders_Insert_Input>;
  on_conflict?: Maybe<AuthProviders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRefreshTokenArgs = {
  object: AuthRefreshTokens_Insert_Input;
  on_conflict?: Maybe<AuthRefreshTokens_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRefreshTokenTypeArgs = {
  object: AuthRefreshTokenTypes_Insert_Input;
  on_conflict?: Maybe<AuthRefreshTokenTypes_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRefreshTokenTypesArgs = {
  objects: Array<AuthRefreshTokenTypes_Insert_Input>;
  on_conflict?: Maybe<AuthRefreshTokenTypes_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRefreshTokensArgs = {
  objects: Array<AuthRefreshTokens_Insert_Input>;
  on_conflict?: Maybe<AuthRefreshTokens_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRoleArgs = {
  object: AuthRoles_Insert_Input;
  on_conflict?: Maybe<AuthRoles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthRolesArgs = {
  objects: Array<AuthRoles_Insert_Input>;
  on_conflict?: Maybe<AuthRoles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserProviderArgs = {
  object: AuthUserProviders_Insert_Input;
  on_conflict?: Maybe<AuthUserProviders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserProvidersArgs = {
  objects: Array<AuthUserProviders_Insert_Input>;
  on_conflict?: Maybe<AuthUserProviders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserRoleArgs = {
  object: AuthUserRoles_Insert_Input;
  on_conflict?: Maybe<AuthUserRoles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserRolesArgs = {
  objects: Array<AuthUserRoles_Insert_Input>;
  on_conflict?: Maybe<AuthUserRoles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserSecurityKeyArgs = {
  object: AuthUserSecurityKeys_Insert_Input;
  on_conflict?: Maybe<AuthUserSecurityKeys_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertAuthUserSecurityKeysArgs = {
  objects: Array<AuthUserSecurityKeys_Insert_Input>;
  on_conflict?: Maybe<AuthUserSecurityKeys_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertBucketArgs = {
  object: Buckets_Insert_Input;
  on_conflict?: Maybe<Buckets_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertBucketsArgs = {
  objects: Array<Buckets_Insert_Input>;
  on_conflict?: Maybe<Buckets_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertFileArgs = {
  object: Files_Insert_Input;
  on_conflict?: Maybe<Files_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertFilesArgs = {
  objects: Array<Files_Insert_Input>;
  on_conflict?: Maybe<Files_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertUserArgs = {
  object: Users_Insert_Input;
  on_conflict?: Maybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertUsersArgs = {
  objects: Array<Users_Insert_Input>;
  on_conflict?: Maybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertVirusArgs = {
  object: Virus_Insert_Input;
  on_conflict?: Maybe<Virus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsertVirusesArgs = {
  objects: Array<Virus_Insert_Input>;
  on_conflict?: Maybe<Virus_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_FrameArgs = {
  objects: Array<Frame_Insert_Input>;
  on_conflict?: Maybe<Frame_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Frame_OneArgs = {
  object: Frame_Insert_Input;
  on_conflict?: Maybe<Frame_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Frame_VersionArgs = {
  objects: Array<Frame_Version_Insert_Input>;
  on_conflict?: Maybe<Frame_Version_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Frame_Version_OneArgs = {
  object: Frame_Version_Insert_Input;
  on_conflict?: Maybe<Frame_Version_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ProfilesArgs = {
  objects: Array<Profiles_Insert_Input>;
  on_conflict?: Maybe<Profiles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Profiles_OneArgs = {
  object: Profiles_Insert_Input;
  on_conflict?: Maybe<Profiles_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ProjectsArgs = {
  objects: Array<Projects_Insert_Input>;
  on_conflict?: Maybe<Projects_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Projects_OneArgs = {
  object: Projects_Insert_Input;
  on_conflict?: Maybe<Projects_On_Conflict>;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2AuthRequestArgs = {
  _set?: Maybe<AuthOauth2AuthRequests_Set_Input>;
  pk_columns: AuthOauth2AuthRequests_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2AuthRequestsArgs = {
  _set?: Maybe<AuthOauth2AuthRequests_Set_Input>;
  where: AuthOauth2AuthRequests_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2AuthorizationCodeArgs = {
  _set?: Maybe<AuthOauth2AuthorizationCodes_Set_Input>;
  pk_columns: AuthOauth2AuthorizationCodes_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2AuthorizationCodesArgs = {
  _set?: Maybe<AuthOauth2AuthorizationCodes_Set_Input>;
  where: AuthOauth2AuthorizationCodes_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2ClientArgs = {
  _append?: Maybe<AuthOauth2Clients_Append_Input>;
  _delete_at_path?: Maybe<AuthOauth2Clients_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthOauth2Clients_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthOauth2Clients_Delete_Key_Input>;
  _prepend?: Maybe<AuthOauth2Clients_Prepend_Input>;
  _set?: Maybe<AuthOauth2Clients_Set_Input>;
  pk_columns: AuthOauth2Clients_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2ClientsArgs = {
  _append?: Maybe<AuthOauth2Clients_Append_Input>;
  _delete_at_path?: Maybe<AuthOauth2Clients_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthOauth2Clients_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthOauth2Clients_Delete_Key_Input>;
  _prepend?: Maybe<AuthOauth2Clients_Prepend_Input>;
  _set?: Maybe<AuthOauth2Clients_Set_Input>;
  where: AuthOauth2Clients_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2RefreshTokenArgs = {
  _set?: Maybe<AuthOauth2RefreshTokens_Set_Input>;
  pk_columns: AuthOauth2RefreshTokens_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthOauth2RefreshTokensArgs = {
  _set?: Maybe<AuthOauth2RefreshTokens_Set_Input>;
  where: AuthOauth2RefreshTokens_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthProviderArgs = {
  _set?: Maybe<AuthProviders_Set_Input>;
  pk_columns: AuthProviders_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthProviderRequestArgs = {
  _append?: Maybe<AuthProviderRequests_Append_Input>;
  _delete_at_path?: Maybe<AuthProviderRequests_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthProviderRequests_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthProviderRequests_Delete_Key_Input>;
  _prepend?: Maybe<AuthProviderRequests_Prepend_Input>;
  _set?: Maybe<AuthProviderRequests_Set_Input>;
  pk_columns: AuthProviderRequests_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthProviderRequestsArgs = {
  _append?: Maybe<AuthProviderRequests_Append_Input>;
  _delete_at_path?: Maybe<AuthProviderRequests_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthProviderRequests_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthProviderRequests_Delete_Key_Input>;
  _prepend?: Maybe<AuthProviderRequests_Prepend_Input>;
  _set?: Maybe<AuthProviderRequests_Set_Input>;
  where: AuthProviderRequests_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthProvidersArgs = {
  _set?: Maybe<AuthProviders_Set_Input>;
  where: AuthProviders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthRefreshTokenArgs = {
  _append?: Maybe<AuthRefreshTokens_Append_Input>;
  _delete_at_path?: Maybe<AuthRefreshTokens_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthRefreshTokens_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthRefreshTokens_Delete_Key_Input>;
  _prepend?: Maybe<AuthRefreshTokens_Prepend_Input>;
  _set?: Maybe<AuthRefreshTokens_Set_Input>;
  pk_columns: AuthRefreshTokens_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthRefreshTokenTypeArgs = {
  _set?: Maybe<AuthRefreshTokenTypes_Set_Input>;
  pk_columns: AuthRefreshTokenTypes_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthRefreshTokenTypesArgs = {
  _set?: Maybe<AuthRefreshTokenTypes_Set_Input>;
  where: AuthRefreshTokenTypes_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthRefreshTokensArgs = {
  _append?: Maybe<AuthRefreshTokens_Append_Input>;
  _delete_at_path?: Maybe<AuthRefreshTokens_Delete_At_Path_Input>;
  _delete_elem?: Maybe<AuthRefreshTokens_Delete_Elem_Input>;
  _delete_key?: Maybe<AuthRefreshTokens_Delete_Key_Input>;
  _prepend?: Maybe<AuthRefreshTokens_Prepend_Input>;
  _set?: Maybe<AuthRefreshTokens_Set_Input>;
  where: AuthRefreshTokens_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthRoleArgs = {
  _set?: Maybe<AuthRoles_Set_Input>;
  pk_columns: AuthRoles_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthRolesArgs = {
  _set?: Maybe<AuthRoles_Set_Input>;
  where: AuthRoles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserProviderArgs = {
  _set?: Maybe<AuthUserProviders_Set_Input>;
  pk_columns: AuthUserProviders_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserProvidersArgs = {
  _set?: Maybe<AuthUserProviders_Set_Input>;
  where: AuthUserProviders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserRoleArgs = {
  _set?: Maybe<AuthUserRoles_Set_Input>;
  pk_columns: AuthUserRoles_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserRolesArgs = {
  _set?: Maybe<AuthUserRoles_Set_Input>;
  where: AuthUserRoles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserSecurityKeyArgs = {
  _inc?: Maybe<AuthUserSecurityKeys_Inc_Input>;
  _set?: Maybe<AuthUserSecurityKeys_Set_Input>;
  pk_columns: AuthUserSecurityKeys_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateAuthUserSecurityKeysArgs = {
  _inc?: Maybe<AuthUserSecurityKeys_Inc_Input>;
  _set?: Maybe<AuthUserSecurityKeys_Set_Input>;
  where: AuthUserSecurityKeys_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateBucketArgs = {
  _inc?: Maybe<Buckets_Inc_Input>;
  _set?: Maybe<Buckets_Set_Input>;
  pk_columns: Buckets_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateBucketsArgs = {
  _inc?: Maybe<Buckets_Inc_Input>;
  _set?: Maybe<Buckets_Set_Input>;
  where: Buckets_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateFileArgs = {
  _append?: Maybe<Files_Append_Input>;
  _delete_at_path?: Maybe<Files_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Files_Delete_Elem_Input>;
  _delete_key?: Maybe<Files_Delete_Key_Input>;
  _inc?: Maybe<Files_Inc_Input>;
  _prepend?: Maybe<Files_Prepend_Input>;
  _set?: Maybe<Files_Set_Input>;
  pk_columns: Files_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateFilesArgs = {
  _append?: Maybe<Files_Append_Input>;
  _delete_at_path?: Maybe<Files_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Files_Delete_Elem_Input>;
  _delete_key?: Maybe<Files_Delete_Key_Input>;
  _inc?: Maybe<Files_Inc_Input>;
  _prepend?: Maybe<Files_Prepend_Input>;
  _set?: Maybe<Files_Set_Input>;
  where: Files_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateUserArgs = {
  _append?: Maybe<Users_Append_Input>;
  _delete_at_path?: Maybe<Users_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Users_Delete_Elem_Input>;
  _delete_key?: Maybe<Users_Delete_Key_Input>;
  _prepend?: Maybe<Users_Prepend_Input>;
  _set?: Maybe<Users_Set_Input>;
  pk_columns: Users_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateUsersArgs = {
  _append?: Maybe<Users_Append_Input>;
  _delete_at_path?: Maybe<Users_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Users_Delete_Elem_Input>;
  _delete_key?: Maybe<Users_Delete_Key_Input>;
  _prepend?: Maybe<Users_Prepend_Input>;
  _set?: Maybe<Users_Set_Input>;
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdateVirusArgs = {
  _append?: Maybe<Virus_Append_Input>;
  _delete_at_path?: Maybe<Virus_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Virus_Delete_Elem_Input>;
  _delete_key?: Maybe<Virus_Delete_Key_Input>;
  _prepend?: Maybe<Virus_Prepend_Input>;
  _set?: Maybe<Virus_Set_Input>;
  pk_columns: Virus_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdateVirusesArgs = {
  _append?: Maybe<Virus_Append_Input>;
  _delete_at_path?: Maybe<Virus_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Virus_Delete_Elem_Input>;
  _delete_key?: Maybe<Virus_Delete_Key_Input>;
  _prepend?: Maybe<Virus_Prepend_Input>;
  _set?: Maybe<Virus_Set_Input>;
  where: Virus_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_AuthOauth2AuthRequests_ManyArgs = {
  updates: Array<AuthOauth2AuthRequests_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthOauth2AuthorizationCodes_ManyArgs = {
  updates: Array<AuthOauth2AuthorizationCodes_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthOauth2Clients_ManyArgs = {
  updates: Array<AuthOauth2Clients_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthOauth2RefreshTokens_ManyArgs = {
  updates: Array<AuthOauth2RefreshTokens_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthProviderRequests_ManyArgs = {
  updates: Array<AuthProviderRequests_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthProviders_ManyArgs = {
  updates: Array<AuthProviders_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthRefreshTokenTypes_ManyArgs = {
  updates: Array<AuthRefreshTokenTypes_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthRefreshTokens_ManyArgs = {
  updates: Array<AuthRefreshTokens_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthRoles_ManyArgs = {
  updates: Array<AuthRoles_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthUserProviders_ManyArgs = {
  updates: Array<AuthUserProviders_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthUserRoles_ManyArgs = {
  updates: Array<AuthUserRoles_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AuthUserSecurityKeys_ManyArgs = {
  updates: Array<AuthUserSecurityKeys_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Buckets_ManyArgs = {
  updates: Array<Buckets_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Files_ManyArgs = {
  updates: Array<Files_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_FrameArgs = {
  _set?: Maybe<Frame_Set_Input>;
  where: Frame_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Frame_By_PkArgs = {
  _set?: Maybe<Frame_Set_Input>;
  pk_columns: Frame_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Frame_ManyArgs = {
  updates: Array<Frame_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Frame_VersionArgs = {
  _append?: Maybe<Frame_Version_Append_Input>;
  _delete_at_path?: Maybe<Frame_Version_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Frame_Version_Delete_Elem_Input>;
  _delete_key?: Maybe<Frame_Version_Delete_Key_Input>;
  _prepend?: Maybe<Frame_Version_Prepend_Input>;
  _set?: Maybe<Frame_Version_Set_Input>;
  where: Frame_Version_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Frame_Version_By_PkArgs = {
  _append?: Maybe<Frame_Version_Append_Input>;
  _delete_at_path?: Maybe<Frame_Version_Delete_At_Path_Input>;
  _delete_elem?: Maybe<Frame_Version_Delete_Elem_Input>;
  _delete_key?: Maybe<Frame_Version_Delete_Key_Input>;
  _prepend?: Maybe<Frame_Version_Prepend_Input>;
  _set?: Maybe<Frame_Version_Set_Input>;
  pk_columns: Frame_Version_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Frame_Version_ManyArgs = {
  updates: Array<Frame_Version_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_ProfilesArgs = {
  _set?: Maybe<Profiles_Set_Input>;
  where: Profiles_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Profiles_By_PkArgs = {
  _set?: Maybe<Profiles_Set_Input>;
  pk_columns: Profiles_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Profiles_ManyArgs = {
  updates: Array<Profiles_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_ProjectsArgs = {
  _set?: Maybe<Projects_Set_Input>;
  where: Projects_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Projects_By_PkArgs = {
  _set?: Maybe<Projects_Set_Input>;
  pk_columns: Projects_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Projects_ManyArgs = {
  updates: Array<Projects_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Users_ManyArgs = {
  updates: Array<Users_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Virus_ManyArgs = {
  updates: Array<Virus_Updates>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = "asc",
  /** in ascending order, nulls first */
  AscNullsFirst = "asc_nulls_first",
  /** in ascending order, nulls last */
  AscNullsLast = "asc_nulls_last",
  /** in descending order, nulls first */
  Desc = "desc",
  /** in descending order, nulls first */
  DescNullsFirst = "desc_nulls_first",
  /** in descending order, nulls last */
  DescNullsLast = "desc_nulls_last",
}

/** columns and relationships of "profiles" */
export type Profiles = {
  __typename?: "profiles";
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt: Scalars["timestamptz"];
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id: Scalars["uuid"];
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt: Scalars["timestamptz"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "profiles" */
export type Profiles_Aggregate = {
  __typename?: "profiles_aggregate";
  aggregate?: Maybe<Profiles_Aggregate_Fields>;
  nodes: Array<Profiles>;
};

/** aggregate fields of "profiles" */
export type Profiles_Aggregate_Fields = {
  __typename?: "profiles_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Profiles_Max_Fields>;
  min?: Maybe<Profiles_Min_Fields>;
};

/** aggregate fields of "profiles" */
export type Profiles_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Profiles_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "profiles". All fields are combined with a logical 'AND'. */
export type Profiles_Bool_Exp = {
  _and?: Maybe<Array<Profiles_Bool_Exp>>;
  _not?: Maybe<Profiles_Bool_Exp>;
  _or?: Maybe<Array<Profiles_Bool_Exp>>;
  avatarUrl?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  currentPeriodEnd?: Maybe<Timestamptz_Comparison_Exp>;
  displayName?: Maybe<String_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  plan?: Maybe<String_Comparison_Exp>;
  stripeCustomerId?: Maybe<String_Comparison_Exp>;
  subscriptionStatus?: Maybe<String_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "profiles" */
export enum Profiles_Constraint {
  /** unique or primary key constraint on columns "id" */
  ProfilesPkey = "profiles_pkey",
  /** unique or primary key constraint on columns "stripe_customer_id" */
  ProfilesStripeCustomerIdKey = "profiles_stripe_customer_id_key",
  /** unique or primary key constraint on columns "user_id" */
  ProfilesUserIdKey = "profiles_user_id_key",
}

/** input type for inserting data into table "profiles" */
export type Profiles_Insert_Input = {
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Profiles_Max_Fields = {
  __typename?: "profiles_max_fields";
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate min on columns */
export type Profiles_Min_Fields = {
  __typename?: "profiles_min_fields";
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** response of any mutation on the table "profiles" */
export type Profiles_Mutation_Response = {
  __typename?: "profiles_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Profiles>;
};

/** on_conflict condition type for table "profiles" */
export type Profiles_On_Conflict = {
  constraint: Profiles_Constraint;
  update_columns?: Array<Profiles_Update_Column>;
  where?: Maybe<Profiles_Bool_Exp>;
};

/** Ordering options when selecting data from "profiles". */
export type Profiles_Order_By = {
  avatarUrl?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  currentPeriodEnd?: Maybe<Order_By>;
  displayName?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  plan?: Maybe<Order_By>;
  stripeCustomerId?: Maybe<Order_By>;
  subscriptionStatus?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: profiles */
export type Profiles_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "profiles" */
export enum Profiles_Select_Column {
  /** column name */
  AvatarUrl = "avatarUrl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CurrentPeriodEnd = "currentPeriodEnd",
  /** column name */
  DisplayName = "displayName",
  /** column name */
  Id = "id",
  /** column name */
  Plan = "plan",
  /** column name */
  StripeCustomerId = "stripeCustomerId",
  /** column name */
  SubscriptionStatus = "subscriptionStatus",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "profiles" */
export type Profiles_Set_Input = {
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "profiles" */
export type Profiles_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Profiles_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Profiles_Stream_Cursor_Value_Input = {
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentPeriodEnd?: Maybe<Scalars["timestamptz"]>;
  displayName?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  plan?: Maybe<Scalars["String"]>;
  stripeCustomerId?: Maybe<Scalars["String"]>;
  subscriptionStatus?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "profiles" */
export enum Profiles_Update_Column {
  /** column name */
  AvatarUrl = "avatarUrl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CurrentPeriodEnd = "currentPeriodEnd",
  /** column name */
  DisplayName = "displayName",
  /** column name */
  Id = "id",
  /** column name */
  Plan = "plan",
  /** column name */
  StripeCustomerId = "stripeCustomerId",
  /** column name */
  SubscriptionStatus = "subscriptionStatus",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

export type Profiles_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Profiles_Set_Input>;
  /** filter the rows which have to be updated */
  where: Profiles_Bool_Exp;
};

/** columns and relationships of "projects" */
export type Projects = {
  __typename?: "projects";
  createdAt: Scalars["timestamptz"];
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id: Scalars["uuid"];
  isPublic?: Maybe<Scalars["Boolean"]>;
  key: Scalars["String"];
  storageFileId?: Maybe<Scalars["String"]>;
  title: Scalars["String"];
  updatedAt: Scalars["timestamptz"];
  /** An object relationship */
  user: Users;
  userId: Scalars["uuid"];
};

/** aggregated selection of "projects" */
export type Projects_Aggregate = {
  __typename?: "projects_aggregate";
  aggregate?: Maybe<Projects_Aggregate_Fields>;
  nodes: Array<Projects>;
};

/** aggregate fields of "projects" */
export type Projects_Aggregate_Fields = {
  __typename?: "projects_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Projects_Max_Fields>;
  min?: Maybe<Projects_Min_Fields>;
};

/** aggregate fields of "projects" */
export type Projects_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Projects_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "projects". All fields are combined with a logical 'AND'. */
export type Projects_Bool_Exp = {
  _and?: Maybe<Array<Projects_Bool_Exp>>;
  _not?: Maybe<Projects_Bool_Exp>;
  _or?: Maybe<Array<Projects_Bool_Exp>>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  description?: Maybe<String_Comparison_Exp>;
  hashParams?: Maybe<String_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  isPublic?: Maybe<Boolean_Comparison_Exp>;
  key?: Maybe<String_Comparison_Exp>;
  storageFileId?: Maybe<String_Comparison_Exp>;
  title?: Maybe<String_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  user?: Maybe<Users_Bool_Exp>;
  userId?: Maybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "projects" */
export enum Projects_Constraint {
  /** unique or primary key constraint on columns "key" */
  ProjectsKeyKey = "projects_key_key",
  /** unique or primary key constraint on columns "id" */
  ProjectsPkey = "projects_pkey",
}

/** input type for inserting data into table "projects" */
export type Projects_Insert_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isPublic?: Maybe<Scalars["Boolean"]>;
  key?: Maybe<Scalars["String"]>;
  storageFileId?: Maybe<Scalars["String"]>;
  title?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  user?: Maybe<Users_Obj_Rel_Insert_Input>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Projects_Max_Fields = {
  __typename?: "projects_max_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  key?: Maybe<Scalars["String"]>;
  storageFileId?: Maybe<Scalars["String"]>;
  title?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** aggregate min on columns */
export type Projects_Min_Fields = {
  __typename?: "projects_min_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  key?: Maybe<Scalars["String"]>;
  storageFileId?: Maybe<Scalars["String"]>;
  title?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** response of any mutation on the table "projects" */
export type Projects_Mutation_Response = {
  __typename?: "projects_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Projects>;
};

/** on_conflict condition type for table "projects" */
export type Projects_On_Conflict = {
  constraint: Projects_Constraint;
  update_columns?: Array<Projects_Update_Column>;
  where?: Maybe<Projects_Bool_Exp>;
};

/** Ordering options when selecting data from "projects". */
export type Projects_Order_By = {
  createdAt?: Maybe<Order_By>;
  description?: Maybe<Order_By>;
  hashParams?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  isPublic?: Maybe<Order_By>;
  key?: Maybe<Order_By>;
  storageFileId?: Maybe<Order_By>;
  title?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  user?: Maybe<Users_Order_By>;
  userId?: Maybe<Order_By>;
};

/** primary key columns input for table: projects */
export type Projects_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "projects" */
export enum Projects_Select_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Description = "description",
  /** column name */
  HashParams = "hashParams",
  /** column name */
  Id = "id",
  /** column name */
  IsPublic = "isPublic",
  /** column name */
  Key = "key",
  /** column name */
  StorageFileId = "storageFileId",
  /** column name */
  Title = "title",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

/** input type for updating data in table "projects" */
export type Projects_Set_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isPublic?: Maybe<Scalars["Boolean"]>;
  key?: Maybe<Scalars["String"]>;
  storageFileId?: Maybe<Scalars["String"]>;
  title?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "projects" */
export type Projects_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Projects_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Projects_Stream_Cursor_Value_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hashParams?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  isPublic?: Maybe<Scalars["Boolean"]>;
  key?: Maybe<Scalars["String"]>;
  storageFileId?: Maybe<Scalars["String"]>;
  title?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userId?: Maybe<Scalars["uuid"]>;
};

/** update columns of table "projects" */
export enum Projects_Update_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  Description = "description",
  /** column name */
  HashParams = "hashParams",
  /** column name */
  Id = "id",
  /** column name */
  IsPublic = "isPublic",
  /** column name */
  Key = "key",
  /** column name */
  StorageFileId = "storageFileId",
  /** column name */
  Title = "title",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserId = "userId",
}

export type Projects_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Projects_Set_Input>;
  /** filter the rows which have to be updated */
  where: Projects_Bool_Exp;
};

export type Query_Root = {
  __typename?: "query_root";
  /** fetch data from the table: "auth.oauth2_auth_requests" using primary key columns */
  authOauth2AuthRequest?: Maybe<AuthOauth2AuthRequests>;
  /** fetch data from the table: "auth.oauth2_auth_requests" */
  authOauth2AuthRequests: Array<AuthOauth2AuthRequests>;
  /** fetch aggregated fields from the table: "auth.oauth2_auth_requests" */
  authOauth2AuthRequestsAggregate: AuthOauth2AuthRequests_Aggregate;
  /** fetch data from the table: "auth.oauth2_authorization_codes" using primary key columns */
  authOauth2AuthorizationCode?: Maybe<AuthOauth2AuthorizationCodes>;
  /** fetch data from the table: "auth.oauth2_authorization_codes" */
  authOauth2AuthorizationCodes: Array<AuthOauth2AuthorizationCodes>;
  /** fetch aggregated fields from the table: "auth.oauth2_authorization_codes" */
  authOauth2AuthorizationCodesAggregate: AuthOauth2AuthorizationCodes_Aggregate;
  /** fetch data from the table: "auth.oauth2_clients" using primary key columns */
  authOauth2Client?: Maybe<AuthOauth2Clients>;
  /** fetch data from the table: "auth.oauth2_clients" */
  authOauth2Clients: Array<AuthOauth2Clients>;
  /** fetch aggregated fields from the table: "auth.oauth2_clients" */
  authOauth2ClientsAggregate: AuthOauth2Clients_Aggregate;
  /** fetch data from the table: "auth.oauth2_refresh_tokens" using primary key columns */
  authOauth2RefreshToken?: Maybe<AuthOauth2RefreshTokens>;
  /** fetch data from the table: "auth.oauth2_refresh_tokens" */
  authOauth2RefreshTokens: Array<AuthOauth2RefreshTokens>;
  /** fetch aggregated fields from the table: "auth.oauth2_refresh_tokens" */
  authOauth2RefreshTokensAggregate: AuthOauth2RefreshTokens_Aggregate;
  /** fetch data from the table: "auth.providers" using primary key columns */
  authProvider?: Maybe<AuthProviders>;
  /** fetch data from the table: "auth.provider_requests" using primary key columns */
  authProviderRequest?: Maybe<AuthProviderRequests>;
  /** fetch data from the table: "auth.provider_requests" */
  authProviderRequests: Array<AuthProviderRequests>;
  /** fetch aggregated fields from the table: "auth.provider_requests" */
  authProviderRequestsAggregate: AuthProviderRequests_Aggregate;
  /** fetch data from the table: "auth.providers" */
  authProviders: Array<AuthProviders>;
  /** fetch aggregated fields from the table: "auth.providers" */
  authProvidersAggregate: AuthProviders_Aggregate;
  /** fetch data from the table: "auth.refresh_tokens" using primary key columns */
  authRefreshToken?: Maybe<AuthRefreshTokens>;
  /** fetch data from the table: "auth.refresh_token_types" using primary key columns */
  authRefreshTokenType?: Maybe<AuthRefreshTokenTypes>;
  /** fetch data from the table: "auth.refresh_token_types" */
  authRefreshTokenTypes: Array<AuthRefreshTokenTypes>;
  /** fetch aggregated fields from the table: "auth.refresh_token_types" */
  authRefreshTokenTypesAggregate: AuthRefreshTokenTypes_Aggregate;
  /** fetch data from the table: "auth.refresh_tokens" */
  authRefreshTokens: Array<AuthRefreshTokens>;
  /** fetch aggregated fields from the table: "auth.refresh_tokens" */
  authRefreshTokensAggregate: AuthRefreshTokens_Aggregate;
  /** fetch data from the table: "auth.roles" using primary key columns */
  authRole?: Maybe<AuthRoles>;
  /** fetch data from the table: "auth.roles" */
  authRoles: Array<AuthRoles>;
  /** fetch aggregated fields from the table: "auth.roles" */
  authRolesAggregate: AuthRoles_Aggregate;
  /** fetch data from the table: "auth.user_providers" using primary key columns */
  authUserProvider?: Maybe<AuthUserProviders>;
  /** fetch data from the table: "auth.user_providers" */
  authUserProviders: Array<AuthUserProviders>;
  /** fetch aggregated fields from the table: "auth.user_providers" */
  authUserProvidersAggregate: AuthUserProviders_Aggregate;
  /** fetch data from the table: "auth.user_roles" using primary key columns */
  authUserRole?: Maybe<AuthUserRoles>;
  /** fetch data from the table: "auth.user_roles" */
  authUserRoles: Array<AuthUserRoles>;
  /** fetch aggregated fields from the table: "auth.user_roles" */
  authUserRolesAggregate: AuthUserRoles_Aggregate;
  /** fetch data from the table: "auth.user_security_keys" using primary key columns */
  authUserSecurityKey?: Maybe<AuthUserSecurityKeys>;
  /** fetch data from the table: "auth.user_security_keys" */
  authUserSecurityKeys: Array<AuthUserSecurityKeys>;
  /** fetch aggregated fields from the table: "auth.user_security_keys" */
  authUserSecurityKeysAggregate: AuthUserSecurityKeys_Aggregate;
  /** fetch data from the table: "storage.buckets" using primary key columns */
  bucket?: Maybe<Buckets>;
  /** fetch data from the table: "storage.buckets" */
  buckets: Array<Buckets>;
  /** fetch aggregated fields from the table: "storage.buckets" */
  bucketsAggregate: Buckets_Aggregate;
  /** fetch data from the table: "storage.files" using primary key columns */
  file?: Maybe<Files>;
  /** An array relationship */
  files: Array<Files>;
  /** fetch aggregated fields from the table: "storage.files" */
  filesAggregate: Files_Aggregate;
  /** fetch data from the table: "frame" */
  frame: Array<Frame>;
  /** fetch aggregated fields from the table: "frame" */
  frame_aggregate: Frame_Aggregate;
  /** fetch data from the table: "frame" using primary key columns */
  frame_by_pk?: Maybe<Frame>;
  /** fetch data from the table: "frame_version" */
  frame_version: Array<Frame_Version>;
  /** fetch aggregated fields from the table: "frame_version" */
  frame_version_aggregate: Frame_Version_Aggregate;
  /** fetch data from the table: "frame_version" using primary key columns */
  frame_version_by_pk?: Maybe<Frame_Version>;
  /** fetch data from the table: "profiles" */
  profiles: Array<Profiles>;
  /** fetch aggregated fields from the table: "profiles" */
  profiles_aggregate: Profiles_Aggregate;
  /** fetch data from the table: "profiles" using primary key columns */
  profiles_by_pk?: Maybe<Profiles>;
  /** fetch data from the table: "projects" */
  projects: Array<Projects>;
  /** fetch aggregated fields from the table: "projects" */
  projects_aggregate: Projects_Aggregate;
  /** fetch data from the table: "projects" using primary key columns */
  projects_by_pk?: Maybe<Projects>;
  /** fetch data from the table: "auth.users" using primary key columns */
  user?: Maybe<Users>;
  /** fetch data from the table: "auth.users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "auth.users" */
  usersAggregate: Users_Aggregate;
  /** fetch data from the table: "storage.virus" using primary key columns */
  virus?: Maybe<Virus>;
  /** fetch data from the table: "storage.virus" */
  viruses: Array<Virus>;
  /** fetch aggregated fields from the table: "storage.virus" */
  virusesAggregate: Virus_Aggregate;
};

export type Query_RootAuthOauth2AuthRequestArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthOauth2AuthRequestsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

export type Query_RootAuthOauth2AuthRequestsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

export type Query_RootAuthOauth2AuthorizationCodeArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthOauth2AuthorizationCodesArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

export type Query_RootAuthOauth2AuthorizationCodesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

export type Query_RootAuthOauth2ClientArgs = {
  clientId: Scalars["String"];
};

export type Query_RootAuthOauth2ClientsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2Clients_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2Clients_Order_By>>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

export type Query_RootAuthOauth2ClientsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2Clients_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2Clients_Order_By>>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

export type Query_RootAuthOauth2RefreshTokenArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthOauth2RefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

export type Query_RootAuthOauth2RefreshTokensAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

export type Query_RootAuthProviderArgs = {
  id: Scalars["String"];
};

export type Query_RootAuthProviderRequestArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthProviderRequestsArgs = {
  distinct_on?: Maybe<Array<AuthProviderRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviderRequests_Order_By>>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

export type Query_RootAuthProviderRequestsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthProviderRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviderRequests_Order_By>>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

export type Query_RootAuthProvidersArgs = {
  distinct_on?: Maybe<Array<AuthProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviders_Order_By>>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

export type Query_RootAuthProvidersAggregateArgs = {
  distinct_on?: Maybe<Array<AuthProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviders_Order_By>>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

export type Query_RootAuthRefreshTokenArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthRefreshTokenTypeArgs = {
  value: Scalars["String"];
};

export type Query_RootAuthRefreshTokenTypesArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokenTypes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokenTypes_Order_By>>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

export type Query_RootAuthRefreshTokenTypesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokenTypes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokenTypes_Order_By>>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

export type Query_RootAuthRefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

export type Query_RootAuthRefreshTokensAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

export type Query_RootAuthRoleArgs = {
  role: Scalars["String"];
};

export type Query_RootAuthRolesArgs = {
  distinct_on?: Maybe<Array<AuthRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRoles_Order_By>>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

export type Query_RootAuthRolesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRoles_Order_By>>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

export type Query_RootAuthUserProviderArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthUserProvidersArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

export type Query_RootAuthUserProvidersAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

export type Query_RootAuthUserRoleArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthUserRolesArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

export type Query_RootAuthUserRolesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

export type Query_RootAuthUserSecurityKeyArgs = {
  id: Scalars["uuid"];
};

export type Query_RootAuthUserSecurityKeysArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

export type Query_RootAuthUserSecurityKeysAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

export type Query_RootBucketArgs = {
  id: Scalars["String"];
};

export type Query_RootBucketsArgs = {
  distinct_on?: Maybe<Array<Buckets_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Buckets_Order_By>>;
  where?: Maybe<Buckets_Bool_Exp>;
};

export type Query_RootBucketsAggregateArgs = {
  distinct_on?: Maybe<Array<Buckets_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Buckets_Order_By>>;
  where?: Maybe<Buckets_Bool_Exp>;
};

export type Query_RootFileArgs = {
  id: Scalars["uuid"];
};

export type Query_RootFilesArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

export type Query_RootFilesAggregateArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

export type Query_RootFrameArgs = {
  distinct_on?: Maybe<Array<Frame_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Order_By>>;
  where?: Maybe<Frame_Bool_Exp>;
};

export type Query_RootFrame_AggregateArgs = {
  distinct_on?: Maybe<Array<Frame_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Order_By>>;
  where?: Maybe<Frame_Bool_Exp>;
};

export type Query_RootFrame_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootFrame_VersionArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

export type Query_RootFrame_Version_AggregateArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

export type Query_RootFrame_Version_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootProfilesArgs = {
  distinct_on?: Maybe<Array<Profiles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Profiles_Order_By>>;
  where?: Maybe<Profiles_Bool_Exp>;
};

export type Query_RootProfiles_AggregateArgs = {
  distinct_on?: Maybe<Array<Profiles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Profiles_Order_By>>;
  where?: Maybe<Profiles_Bool_Exp>;
};

export type Query_RootProfiles_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootProjectsArgs = {
  distinct_on?: Maybe<Array<Projects_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Projects_Order_By>>;
  where?: Maybe<Projects_Bool_Exp>;
};

export type Query_RootProjects_AggregateArgs = {
  distinct_on?: Maybe<Array<Projects_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Projects_Order_By>>;
  where?: Maybe<Projects_Bool_Exp>;
};

export type Query_RootProjects_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootUserArgs = {
  id: Scalars["uuid"];
};

export type Query_RootUsersArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

export type Query_RootUsersAggregateArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

export type Query_RootVirusArgs = {
  id: Scalars["uuid"];
};

export type Query_RootVirusesArgs = {
  distinct_on?: Maybe<Array<Virus_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Virus_Order_By>>;
  where?: Maybe<Virus_Bool_Exp>;
};

export type Query_RootVirusesAggregateArgs = {
  distinct_on?: Maybe<Array<Virus_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Virus_Order_By>>;
  where?: Maybe<Virus_Bool_Exp>;
};

export type Subscription_Root = {
  __typename?: "subscription_root";
  /** fetch data from the table: "auth.oauth2_auth_requests" using primary key columns */
  authOauth2AuthRequest?: Maybe<AuthOauth2AuthRequests>;
  /** fetch data from the table: "auth.oauth2_auth_requests" */
  authOauth2AuthRequests: Array<AuthOauth2AuthRequests>;
  /** fetch aggregated fields from the table: "auth.oauth2_auth_requests" */
  authOauth2AuthRequestsAggregate: AuthOauth2AuthRequests_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.oauth2_auth_requests" */
  authOauth2AuthRequests_stream: Array<AuthOauth2AuthRequests>;
  /** fetch data from the table: "auth.oauth2_authorization_codes" using primary key columns */
  authOauth2AuthorizationCode?: Maybe<AuthOauth2AuthorizationCodes>;
  /** fetch data from the table: "auth.oauth2_authorization_codes" */
  authOauth2AuthorizationCodes: Array<AuthOauth2AuthorizationCodes>;
  /** fetch aggregated fields from the table: "auth.oauth2_authorization_codes" */
  authOauth2AuthorizationCodesAggregate: AuthOauth2AuthorizationCodes_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.oauth2_authorization_codes" */
  authOauth2AuthorizationCodes_stream: Array<AuthOauth2AuthorizationCodes>;
  /** fetch data from the table: "auth.oauth2_clients" using primary key columns */
  authOauth2Client?: Maybe<AuthOauth2Clients>;
  /** fetch data from the table: "auth.oauth2_clients" */
  authOauth2Clients: Array<AuthOauth2Clients>;
  /** fetch aggregated fields from the table: "auth.oauth2_clients" */
  authOauth2ClientsAggregate: AuthOauth2Clients_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.oauth2_clients" */
  authOauth2Clients_stream: Array<AuthOauth2Clients>;
  /** fetch data from the table: "auth.oauth2_refresh_tokens" using primary key columns */
  authOauth2RefreshToken?: Maybe<AuthOauth2RefreshTokens>;
  /** fetch data from the table: "auth.oauth2_refresh_tokens" */
  authOauth2RefreshTokens: Array<AuthOauth2RefreshTokens>;
  /** fetch aggregated fields from the table: "auth.oauth2_refresh_tokens" */
  authOauth2RefreshTokensAggregate: AuthOauth2RefreshTokens_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.oauth2_refresh_tokens" */
  authOauth2RefreshTokens_stream: Array<AuthOauth2RefreshTokens>;
  /** fetch data from the table: "auth.providers" using primary key columns */
  authProvider?: Maybe<AuthProviders>;
  /** fetch data from the table: "auth.provider_requests" using primary key columns */
  authProviderRequest?: Maybe<AuthProviderRequests>;
  /** fetch data from the table: "auth.provider_requests" */
  authProviderRequests: Array<AuthProviderRequests>;
  /** fetch aggregated fields from the table: "auth.provider_requests" */
  authProviderRequestsAggregate: AuthProviderRequests_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.provider_requests" */
  authProviderRequests_stream: Array<AuthProviderRequests>;
  /** fetch data from the table: "auth.providers" */
  authProviders: Array<AuthProviders>;
  /** fetch aggregated fields from the table: "auth.providers" */
  authProvidersAggregate: AuthProviders_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.providers" */
  authProviders_stream: Array<AuthProviders>;
  /** fetch data from the table: "auth.refresh_tokens" using primary key columns */
  authRefreshToken?: Maybe<AuthRefreshTokens>;
  /** fetch data from the table: "auth.refresh_token_types" using primary key columns */
  authRefreshTokenType?: Maybe<AuthRefreshTokenTypes>;
  /** fetch data from the table: "auth.refresh_token_types" */
  authRefreshTokenTypes: Array<AuthRefreshTokenTypes>;
  /** fetch aggregated fields from the table: "auth.refresh_token_types" */
  authRefreshTokenTypesAggregate: AuthRefreshTokenTypes_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.refresh_token_types" */
  authRefreshTokenTypes_stream: Array<AuthRefreshTokenTypes>;
  /** fetch data from the table: "auth.refresh_tokens" */
  authRefreshTokens: Array<AuthRefreshTokens>;
  /** fetch aggregated fields from the table: "auth.refresh_tokens" */
  authRefreshTokensAggregate: AuthRefreshTokens_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.refresh_tokens" */
  authRefreshTokens_stream: Array<AuthRefreshTokens>;
  /** fetch data from the table: "auth.roles" using primary key columns */
  authRole?: Maybe<AuthRoles>;
  /** fetch data from the table: "auth.roles" */
  authRoles: Array<AuthRoles>;
  /** fetch aggregated fields from the table: "auth.roles" */
  authRolesAggregate: AuthRoles_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.roles" */
  authRoles_stream: Array<AuthRoles>;
  /** fetch data from the table: "auth.user_providers" using primary key columns */
  authUserProvider?: Maybe<AuthUserProviders>;
  /** fetch data from the table: "auth.user_providers" */
  authUserProviders: Array<AuthUserProviders>;
  /** fetch aggregated fields from the table: "auth.user_providers" */
  authUserProvidersAggregate: AuthUserProviders_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.user_providers" */
  authUserProviders_stream: Array<AuthUserProviders>;
  /** fetch data from the table: "auth.user_roles" using primary key columns */
  authUserRole?: Maybe<AuthUserRoles>;
  /** fetch data from the table: "auth.user_roles" */
  authUserRoles: Array<AuthUserRoles>;
  /** fetch aggregated fields from the table: "auth.user_roles" */
  authUserRolesAggregate: AuthUserRoles_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.user_roles" */
  authUserRoles_stream: Array<AuthUserRoles>;
  /** fetch data from the table: "auth.user_security_keys" using primary key columns */
  authUserSecurityKey?: Maybe<AuthUserSecurityKeys>;
  /** fetch data from the table: "auth.user_security_keys" */
  authUserSecurityKeys: Array<AuthUserSecurityKeys>;
  /** fetch aggregated fields from the table: "auth.user_security_keys" */
  authUserSecurityKeysAggregate: AuthUserSecurityKeys_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.user_security_keys" */
  authUserSecurityKeys_stream: Array<AuthUserSecurityKeys>;
  /** fetch data from the table: "storage.buckets" using primary key columns */
  bucket?: Maybe<Buckets>;
  /** fetch data from the table: "storage.buckets" */
  buckets: Array<Buckets>;
  /** fetch aggregated fields from the table: "storage.buckets" */
  bucketsAggregate: Buckets_Aggregate;
  /** fetch data from the table in a streaming manner: "storage.buckets" */
  buckets_stream: Array<Buckets>;
  /** fetch data from the table: "storage.files" using primary key columns */
  file?: Maybe<Files>;
  /** An array relationship */
  files: Array<Files>;
  /** fetch aggregated fields from the table: "storage.files" */
  filesAggregate: Files_Aggregate;
  /** fetch data from the table in a streaming manner: "storage.files" */
  files_stream: Array<Files>;
  /** fetch data from the table: "frame" */
  frame: Array<Frame>;
  /** fetch aggregated fields from the table: "frame" */
  frame_aggregate: Frame_Aggregate;
  /** fetch data from the table: "frame" using primary key columns */
  frame_by_pk?: Maybe<Frame>;
  /** fetch data from the table in a streaming manner: "frame" */
  frame_stream: Array<Frame>;
  /** fetch data from the table: "frame_version" */
  frame_version: Array<Frame_Version>;
  /** fetch aggregated fields from the table: "frame_version" */
  frame_version_aggregate: Frame_Version_Aggregate;
  /** fetch data from the table: "frame_version" using primary key columns */
  frame_version_by_pk?: Maybe<Frame_Version>;
  /** fetch data from the table in a streaming manner: "frame_version" */
  frame_version_stream: Array<Frame_Version>;
  /** fetch data from the table: "profiles" */
  profiles: Array<Profiles>;
  /** fetch aggregated fields from the table: "profiles" */
  profiles_aggregate: Profiles_Aggregate;
  /** fetch data from the table: "profiles" using primary key columns */
  profiles_by_pk?: Maybe<Profiles>;
  /** fetch data from the table in a streaming manner: "profiles" */
  profiles_stream: Array<Profiles>;
  /** fetch data from the table: "projects" */
  projects: Array<Projects>;
  /** fetch aggregated fields from the table: "projects" */
  projects_aggregate: Projects_Aggregate;
  /** fetch data from the table: "projects" using primary key columns */
  projects_by_pk?: Maybe<Projects>;
  /** fetch data from the table in a streaming manner: "projects" */
  projects_stream: Array<Projects>;
  /** fetch data from the table: "auth.users" using primary key columns */
  user?: Maybe<Users>;
  /** fetch data from the table: "auth.users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "auth.users" */
  usersAggregate: Users_Aggregate;
  /** fetch data from the table in a streaming manner: "auth.users" */
  users_stream: Array<Users>;
  /** fetch data from the table: "storage.virus" using primary key columns */
  virus?: Maybe<Virus>;
  /** fetch data from the table in a streaming manner: "storage.virus" */
  virus_stream: Array<Virus>;
  /** fetch data from the table: "storage.virus" */
  viruses: Array<Virus>;
  /** fetch aggregated fields from the table: "storage.virus" */
  virusesAggregate: Virus_Aggregate;
};

export type Subscription_RootAuthOauth2AuthRequestArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthOauth2AuthRequestsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

export type Subscription_RootAuthOauth2AuthRequestsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

export type Subscription_RootAuthOauth2AuthRequests_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthOauth2AuthRequests_Stream_Cursor_Input>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

export type Subscription_RootAuthOauth2AuthorizationCodeArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthOauth2AuthorizationCodesArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

export type Subscription_RootAuthOauth2AuthorizationCodesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthorizationCodes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthorizationCodes_Order_By>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

export type Subscription_RootAuthOauth2AuthorizationCodes_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthOauth2AuthorizationCodes_Stream_Cursor_Input>>;
  where?: Maybe<AuthOauth2AuthorizationCodes_Bool_Exp>;
};

export type Subscription_RootAuthOauth2ClientArgs = {
  clientId: Scalars["String"];
};

export type Subscription_RootAuthOauth2ClientsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2Clients_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2Clients_Order_By>>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

export type Subscription_RootAuthOauth2ClientsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2Clients_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2Clients_Order_By>>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

export type Subscription_RootAuthOauth2Clients_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthOauth2Clients_Stream_Cursor_Input>>;
  where?: Maybe<AuthOauth2Clients_Bool_Exp>;
};

export type Subscription_RootAuthOauth2RefreshTokenArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthOauth2RefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthOauth2RefreshTokensAggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthOauth2RefreshTokens_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthOauth2RefreshTokens_Stream_Cursor_Input>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthProviderArgs = {
  id: Scalars["String"];
};

export type Subscription_RootAuthProviderRequestArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthProviderRequestsArgs = {
  distinct_on?: Maybe<Array<AuthProviderRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviderRequests_Order_By>>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

export type Subscription_RootAuthProviderRequestsAggregateArgs = {
  distinct_on?: Maybe<Array<AuthProviderRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviderRequests_Order_By>>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

export type Subscription_RootAuthProviderRequests_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthProviderRequests_Stream_Cursor_Input>>;
  where?: Maybe<AuthProviderRequests_Bool_Exp>;
};

export type Subscription_RootAuthProvidersArgs = {
  distinct_on?: Maybe<Array<AuthProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviders_Order_By>>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

export type Subscription_RootAuthProvidersAggregateArgs = {
  distinct_on?: Maybe<Array<AuthProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthProviders_Order_By>>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

export type Subscription_RootAuthProviders_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthProviders_Stream_Cursor_Input>>;
  where?: Maybe<AuthProviders_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokenArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthRefreshTokenTypeArgs = {
  value: Scalars["String"];
};

export type Subscription_RootAuthRefreshTokenTypesArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokenTypes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokenTypes_Order_By>>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokenTypesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokenTypes_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokenTypes_Order_By>>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokenTypes_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthRefreshTokenTypes_Stream_Cursor_Input>>;
  where?: Maybe<AuthRefreshTokenTypes_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokensAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthRefreshTokens_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthRefreshTokens_Stream_Cursor_Input>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

export type Subscription_RootAuthRoleArgs = {
  role: Scalars["String"];
};

export type Subscription_RootAuthRolesArgs = {
  distinct_on?: Maybe<Array<AuthRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRoles_Order_By>>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

export type Subscription_RootAuthRolesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRoles_Order_By>>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

export type Subscription_RootAuthRoles_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthRoles_Stream_Cursor_Input>>;
  where?: Maybe<AuthRoles_Bool_Exp>;
};

export type Subscription_RootAuthUserProviderArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthUserProvidersArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

export type Subscription_RootAuthUserProvidersAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

export type Subscription_RootAuthUserProviders_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthUserProviders_Stream_Cursor_Input>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

export type Subscription_RootAuthUserRoleArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthUserRolesArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

export type Subscription_RootAuthUserRolesAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

export type Subscription_RootAuthUserRoles_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthUserRoles_Stream_Cursor_Input>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

export type Subscription_RootAuthUserSecurityKeyArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAuthUserSecurityKeysArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

export type Subscription_RootAuthUserSecurityKeysAggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

export type Subscription_RootAuthUserSecurityKeys_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<AuthUserSecurityKeys_Stream_Cursor_Input>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

export type Subscription_RootBucketArgs = {
  id: Scalars["String"];
};

export type Subscription_RootBucketsArgs = {
  distinct_on?: Maybe<Array<Buckets_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Buckets_Order_By>>;
  where?: Maybe<Buckets_Bool_Exp>;
};

export type Subscription_RootBucketsAggregateArgs = {
  distinct_on?: Maybe<Array<Buckets_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Buckets_Order_By>>;
  where?: Maybe<Buckets_Bool_Exp>;
};

export type Subscription_RootBuckets_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Buckets_Stream_Cursor_Input>>;
  where?: Maybe<Buckets_Bool_Exp>;
};

export type Subscription_RootFileArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootFilesArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

export type Subscription_RootFilesAggregateArgs = {
  distinct_on?: Maybe<Array<Files_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Files_Order_By>>;
  where?: Maybe<Files_Bool_Exp>;
};

export type Subscription_RootFiles_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Files_Stream_Cursor_Input>>;
  where?: Maybe<Files_Bool_Exp>;
};

export type Subscription_RootFrameArgs = {
  distinct_on?: Maybe<Array<Frame_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Order_By>>;
  where?: Maybe<Frame_Bool_Exp>;
};

export type Subscription_RootFrame_AggregateArgs = {
  distinct_on?: Maybe<Array<Frame_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Order_By>>;
  where?: Maybe<Frame_Bool_Exp>;
};

export type Subscription_RootFrame_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootFrame_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Frame_Stream_Cursor_Input>>;
  where?: Maybe<Frame_Bool_Exp>;
};

export type Subscription_RootFrame_VersionArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

export type Subscription_RootFrame_Version_AggregateArgs = {
  distinct_on?: Maybe<Array<Frame_Version_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Frame_Version_Order_By>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

export type Subscription_RootFrame_Version_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootFrame_Version_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Frame_Version_Stream_Cursor_Input>>;
  where?: Maybe<Frame_Version_Bool_Exp>;
};

export type Subscription_RootProfilesArgs = {
  distinct_on?: Maybe<Array<Profiles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Profiles_Order_By>>;
  where?: Maybe<Profiles_Bool_Exp>;
};

export type Subscription_RootProfiles_AggregateArgs = {
  distinct_on?: Maybe<Array<Profiles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Profiles_Order_By>>;
  where?: Maybe<Profiles_Bool_Exp>;
};

export type Subscription_RootProfiles_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootProfiles_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Profiles_Stream_Cursor_Input>>;
  where?: Maybe<Profiles_Bool_Exp>;
};

export type Subscription_RootProjectsArgs = {
  distinct_on?: Maybe<Array<Projects_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Projects_Order_By>>;
  where?: Maybe<Projects_Bool_Exp>;
};

export type Subscription_RootProjects_AggregateArgs = {
  distinct_on?: Maybe<Array<Projects_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Projects_Order_By>>;
  where?: Maybe<Projects_Bool_Exp>;
};

export type Subscription_RootProjects_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootProjects_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Projects_Stream_Cursor_Input>>;
  where?: Maybe<Projects_Bool_Exp>;
};

export type Subscription_RootUserArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootUsersArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

export type Subscription_RootUsersAggregateArgs = {
  distinct_on?: Maybe<Array<Users_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Users_Order_By>>;
  where?: Maybe<Users_Bool_Exp>;
};

export type Subscription_RootUsers_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Users_Stream_Cursor_Input>>;
  where?: Maybe<Users_Bool_Exp>;
};

export type Subscription_RootVirusArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootVirus_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<Maybe<Virus_Stream_Cursor_Input>>;
  where?: Maybe<Virus_Bool_Exp>;
};

export type Subscription_RootVirusesArgs = {
  distinct_on?: Maybe<Array<Virus_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Virus_Order_By>>;
  where?: Maybe<Virus_Bool_Exp>;
};

export type Subscription_RootVirusesAggregateArgs = {
  distinct_on?: Maybe<Array<Virus_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<Virus_Order_By>>;
  where?: Maybe<Virus_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: Maybe<Scalars["timestamptz"]>;
  _gt?: Maybe<Scalars["timestamptz"]>;
  _gte?: Maybe<Scalars["timestamptz"]>;
  _in?: Maybe<Array<Scalars["timestamptz"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["timestamptz"]>;
  _lte?: Maybe<Scalars["timestamptz"]>;
  _neq?: Maybe<Scalars["timestamptz"]>;
  _nin?: Maybe<Array<Scalars["timestamptz"]>>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type Users = {
  __typename?: "users";
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl: Scalars["String"];
  createdAt: Scalars["timestamptz"];
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole: Scalars["String"];
  /** An object relationship */
  defaultRoleByRole: AuthRoles;
  disabled: Scalars["Boolean"];
  displayName: Scalars["String"];
  email?: Maybe<Scalars["citext"]>;
  emailVerified: Scalars["Boolean"];
  id: Scalars["uuid"];
  isAnonymous: Scalars["Boolean"];
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale: Scalars["String"];
  metadata?: Maybe<Scalars["jsonb"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  /** An array relationship */
  oauth2AuthRequests: Array<AuthOauth2AuthRequests>;
  /** An aggregate relationship */
  oauth2AuthRequests_aggregate: AuthOauth2AuthRequests_Aggregate;
  /** An array relationship */
  oauth2RefreshTokens: Array<AuthOauth2RefreshTokens>;
  /** An aggregate relationship */
  oauth2RefreshTokens_aggregate: AuthOauth2RefreshTokens_Aggregate;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt: Scalars["timestamptz"];
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  phoneNumberVerified: Scalars["Boolean"];
  /** An array relationship */
  refreshTokens: Array<AuthRefreshTokens>;
  /** An aggregate relationship */
  refreshTokens_aggregate: AuthRefreshTokens_Aggregate;
  /** An array relationship */
  roles: Array<AuthUserRoles>;
  /** An aggregate relationship */
  roles_aggregate: AuthUserRoles_Aggregate;
  /** An array relationship */
  securityKeys: Array<AuthUserSecurityKeys>;
  /** An aggregate relationship */
  securityKeys_aggregate: AuthUserSecurityKeys_Aggregate;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt: Scalars["timestamptz"];
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt: Scalars["timestamptz"];
  /** An array relationship */
  userProviders: Array<AuthUserProviders>;
  /** An aggregate relationship */
  userProviders_aggregate: AuthUserProviders_Aggregate;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersMetadataArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersOauth2AuthRequestsArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersOauth2AuthRequests_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2AuthRequests_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2AuthRequests_Order_By>>;
  where?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersOauth2RefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersOauth2RefreshTokens_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthOauth2RefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthOauth2RefreshTokens_Order_By>>;
  where?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersRefreshTokensArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersRefreshTokens_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthRefreshTokens_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthRefreshTokens_Order_By>>;
  where?: Maybe<AuthRefreshTokens_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersRolesArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersRoles_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserRoles_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserRoles_Order_By>>;
  where?: Maybe<AuthUserRoles_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersSecurityKeysArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersSecurityKeys_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserSecurityKeys_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserSecurityKeys_Order_By>>;
  where?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersUserProvidersArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

/** User account information. Don't modify its structure as Hasura Auth relies on it to function properly. */
export type UsersUserProviders_AggregateArgs = {
  distinct_on?: Maybe<Array<AuthUserProviders_Select_Column>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  order_by?: Maybe<Array<AuthUserProviders_Order_By>>;
  where?: Maybe<AuthUserProviders_Bool_Exp>;
};

/** aggregated selection of "auth.users" */
export type Users_Aggregate = {
  __typename?: "users_aggregate";
  aggregate?: Maybe<Users_Aggregate_Fields>;
  nodes: Array<Users>;
};

export type Users_Aggregate_Bool_Exp = {
  bool_and?: Maybe<Users_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: Maybe<Users_Aggregate_Bool_Exp_Bool_Or>;
  count?: Maybe<Users_Aggregate_Bool_Exp_Count>;
};

export type Users_Aggregate_Bool_Exp_Bool_And = {
  arguments:
    Users_Select_Column_Users_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Users_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Users_Aggregate_Bool_Exp_Bool_Or = {
  arguments:
    Users_Select_Column_Users_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Users_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Users_Aggregate_Bool_Exp_Count = {
  arguments?: Maybe<Array<Users_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
  filter?: Maybe<Users_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.users" */
export type Users_Aggregate_Fields = {
  __typename?: "users_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Users_Max_Fields>;
  min?: Maybe<Users_Min_Fields>;
};

/** aggregate fields of "auth.users" */
export type Users_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Users_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "auth.users" */
export type Users_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<Users_Max_Order_By>;
  min?: Maybe<Users_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Users_Append_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** input type for inserting array relation for remote table "auth.users" */
export type Users_Arr_Rel_Insert_Input = {
  data: Array<Users_Insert_Input>;
  /** upsert condition */
  on_conflict?: Maybe<Users_On_Conflict>;
};

/** Boolean expression to filter rows from the table "auth.users". All fields are combined with a logical 'AND'. */
export type Users_Bool_Exp = {
  _and?: Maybe<Array<Users_Bool_Exp>>;
  _not?: Maybe<Users_Bool_Exp>;
  _or?: Maybe<Array<Users_Bool_Exp>>;
  activeMfaType?: Maybe<String_Comparison_Exp>;
  avatarUrl?: Maybe<String_Comparison_Exp>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  currentChallenge?: Maybe<String_Comparison_Exp>;
  defaultRole?: Maybe<String_Comparison_Exp>;
  defaultRoleByRole?: Maybe<AuthRoles_Bool_Exp>;
  disabled?: Maybe<Boolean_Comparison_Exp>;
  displayName?: Maybe<String_Comparison_Exp>;
  email?: Maybe<Citext_Comparison_Exp>;
  emailVerified?: Maybe<Boolean_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  isAnonymous?: Maybe<Boolean_Comparison_Exp>;
  lastSeen?: Maybe<Timestamptz_Comparison_Exp>;
  locale?: Maybe<String_Comparison_Exp>;
  metadata?: Maybe<Jsonb_Comparison_Exp>;
  newEmail?: Maybe<Citext_Comparison_Exp>;
  oauth2AuthRequests?: Maybe<AuthOauth2AuthRequests_Bool_Exp>;
  oauth2AuthRequests_aggregate?: Maybe<
    AuthOauth2AuthRequests_Aggregate_Bool_Exp
  >;
  oauth2RefreshTokens?: Maybe<AuthOauth2RefreshTokens_Bool_Exp>;
  oauth2RefreshTokens_aggregate?: Maybe<
    AuthOauth2RefreshTokens_Aggregate_Bool_Exp
  >;
  otpHash?: Maybe<String_Comparison_Exp>;
  otpHashExpiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  otpMethodLastUsed?: Maybe<String_Comparison_Exp>;
  passwordHash?: Maybe<String_Comparison_Exp>;
  phoneNumber?: Maybe<String_Comparison_Exp>;
  phoneNumberVerified?: Maybe<Boolean_Comparison_Exp>;
  refreshTokens?: Maybe<AuthRefreshTokens_Bool_Exp>;
  refreshTokens_aggregate?: Maybe<AuthRefreshTokens_Aggregate_Bool_Exp>;
  roles?: Maybe<AuthUserRoles_Bool_Exp>;
  roles_aggregate?: Maybe<AuthUserRoles_Aggregate_Bool_Exp>;
  securityKeys?: Maybe<AuthUserSecurityKeys_Bool_Exp>;
  securityKeys_aggregate?: Maybe<AuthUserSecurityKeys_Aggregate_Bool_Exp>;
  ticket?: Maybe<String_Comparison_Exp>;
  ticketExpiresAt?: Maybe<Timestamptz_Comparison_Exp>;
  totpSecret?: Maybe<String_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  userProviders?: Maybe<AuthUserProviders_Bool_Exp>;
  userProviders_aggregate?: Maybe<AuthUserProviders_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "auth.users" */
export enum Users_Constraint {
  /** unique or primary key constraint on columns "email" */
  UsersEmailKey = "users_email_key",
  /** unique or primary key constraint on columns "phone_number" */
  UsersPhoneNumberKey = "users_phone_number_key",
  /** unique or primary key constraint on columns "id" */
  UsersPkey = "users_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Users_Delete_At_Path_Input = {
  metadata?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Users_Delete_Elem_Input = {
  metadata?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Users_Delete_Key_Input = {
  metadata?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "auth.users" */
export type Users_Insert_Input = {
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole?: Maybe<Scalars["String"]>;
  defaultRoleByRole?: Maybe<AuthRoles_Obj_Rel_Insert_Input>;
  disabled?: Maybe<Scalars["Boolean"]>;
  displayName?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["citext"]>;
  emailVerified?: Maybe<Scalars["Boolean"]>;
  id?: Maybe<Scalars["uuid"]>;
  isAnonymous?: Maybe<Scalars["Boolean"]>;
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale?: Maybe<Scalars["String"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  oauth2AuthRequests?: Maybe<AuthOauth2AuthRequests_Arr_Rel_Insert_Input>;
  oauth2RefreshTokens?: Maybe<AuthOauth2RefreshTokens_Arr_Rel_Insert_Input>;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt?: Maybe<Scalars["timestamptz"]>;
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  phoneNumberVerified?: Maybe<Scalars["Boolean"]>;
  refreshTokens?: Maybe<AuthRefreshTokens_Arr_Rel_Insert_Input>;
  roles?: Maybe<AuthUserRoles_Arr_Rel_Insert_Input>;
  securityKeys?: Maybe<AuthUserSecurityKeys_Arr_Rel_Insert_Input>;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt?: Maybe<Scalars["timestamptz"]>;
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userProviders?: Maybe<AuthUserProviders_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Users_Max_Fields = {
  __typename?: "users_max_fields";
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole?: Maybe<Scalars["String"]>;
  displayName?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["citext"]>;
  id?: Maybe<Scalars["uuid"]>;
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale?: Maybe<Scalars["String"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt?: Maybe<Scalars["timestamptz"]>;
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt?: Maybe<Scalars["timestamptz"]>;
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "auth.users" */
export type Users_Max_Order_By = {
  activeMfaType?: Maybe<Order_By>;
  avatarUrl?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  currentChallenge?: Maybe<Order_By>;
  defaultRole?: Maybe<Order_By>;
  displayName?: Maybe<Order_By>;
  email?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  lastSeen?: Maybe<Order_By>;
  locale?: Maybe<Order_By>;
  newEmail?: Maybe<Order_By>;
  otpHash?: Maybe<Order_By>;
  otpHashExpiresAt?: Maybe<Order_By>;
  otpMethodLastUsed?: Maybe<Order_By>;
  passwordHash?: Maybe<Order_By>;
  phoneNumber?: Maybe<Order_By>;
  ticket?: Maybe<Order_By>;
  ticketExpiresAt?: Maybe<Order_By>;
  totpSecret?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
};

/** aggregate min on columns */
export type Users_Min_Fields = {
  __typename?: "users_min_fields";
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole?: Maybe<Scalars["String"]>;
  displayName?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["citext"]>;
  id?: Maybe<Scalars["uuid"]>;
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale?: Maybe<Scalars["String"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt?: Maybe<Scalars["timestamptz"]>;
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt?: Maybe<Scalars["timestamptz"]>;
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "auth.users" */
export type Users_Min_Order_By = {
  activeMfaType?: Maybe<Order_By>;
  avatarUrl?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  currentChallenge?: Maybe<Order_By>;
  defaultRole?: Maybe<Order_By>;
  displayName?: Maybe<Order_By>;
  email?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  lastSeen?: Maybe<Order_By>;
  locale?: Maybe<Order_By>;
  newEmail?: Maybe<Order_By>;
  otpHash?: Maybe<Order_By>;
  otpHashExpiresAt?: Maybe<Order_By>;
  otpMethodLastUsed?: Maybe<Order_By>;
  passwordHash?: Maybe<Order_By>;
  phoneNumber?: Maybe<Order_By>;
  ticket?: Maybe<Order_By>;
  ticketExpiresAt?: Maybe<Order_By>;
  totpSecret?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
};

/** response of any mutation on the table "auth.users" */
export type Users_Mutation_Response = {
  __typename?: "users_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Users>;
};

/** input type for inserting object relation for remote table "auth.users" */
export type Users_Obj_Rel_Insert_Input = {
  data: Users_Insert_Input;
  /** upsert condition */
  on_conflict?: Maybe<Users_On_Conflict>;
};

/** on_conflict condition type for table "auth.users" */
export type Users_On_Conflict = {
  constraint: Users_Constraint;
  update_columns?: Array<Users_Update_Column>;
  where?: Maybe<Users_Bool_Exp>;
};

/** Ordering options when selecting data from "auth.users". */
export type Users_Order_By = {
  activeMfaType?: Maybe<Order_By>;
  avatarUrl?: Maybe<Order_By>;
  createdAt?: Maybe<Order_By>;
  currentChallenge?: Maybe<Order_By>;
  defaultRole?: Maybe<Order_By>;
  defaultRoleByRole?: Maybe<AuthRoles_Order_By>;
  disabled?: Maybe<Order_By>;
  displayName?: Maybe<Order_By>;
  email?: Maybe<Order_By>;
  emailVerified?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  isAnonymous?: Maybe<Order_By>;
  lastSeen?: Maybe<Order_By>;
  locale?: Maybe<Order_By>;
  metadata?: Maybe<Order_By>;
  newEmail?: Maybe<Order_By>;
  oauth2AuthRequests_aggregate?: Maybe<
    AuthOauth2AuthRequests_Aggregate_Order_By
  >;
  oauth2RefreshTokens_aggregate?: Maybe<
    AuthOauth2RefreshTokens_Aggregate_Order_By
  >;
  otpHash?: Maybe<Order_By>;
  otpHashExpiresAt?: Maybe<Order_By>;
  otpMethodLastUsed?: Maybe<Order_By>;
  passwordHash?: Maybe<Order_By>;
  phoneNumber?: Maybe<Order_By>;
  phoneNumberVerified?: Maybe<Order_By>;
  refreshTokens_aggregate?: Maybe<AuthRefreshTokens_Aggregate_Order_By>;
  roles_aggregate?: Maybe<AuthUserRoles_Aggregate_Order_By>;
  securityKeys_aggregate?: Maybe<AuthUserSecurityKeys_Aggregate_Order_By>;
  ticket?: Maybe<Order_By>;
  ticketExpiresAt?: Maybe<Order_By>;
  totpSecret?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  userProviders_aggregate?: Maybe<AuthUserProviders_Aggregate_Order_By>;
};

/** primary key columns input for table: auth.users */
export type Users_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Users_Prepend_Input = {
  metadata?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "auth.users" */
export enum Users_Select_Column {
  /** column name */
  ActiveMfaType = "activeMfaType",
  /** column name */
  AvatarUrl = "avatarUrl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CurrentChallenge = "currentChallenge",
  /** column name */
  DefaultRole = "defaultRole",
  /** column name */
  Disabled = "disabled",
  /** column name */
  DisplayName = "displayName",
  /** column name */
  Email = "email",
  /** column name */
  EmailVerified = "emailVerified",
  /** column name */
  Id = "id",
  /** column name */
  IsAnonymous = "isAnonymous",
  /** column name */
  LastSeen = "lastSeen",
  /** column name */
  Locale = "locale",
  /** column name */
  Metadata = "metadata",
  /** column name */
  NewEmail = "newEmail",
  /** column name */
  OtpHash = "otpHash",
  /** column name */
  OtpHashExpiresAt = "otpHashExpiresAt",
  /** column name */
  OtpMethodLastUsed = "otpMethodLastUsed",
  /** column name */
  PasswordHash = "passwordHash",
  /** column name */
  PhoneNumber = "phoneNumber",
  /** column name */
  PhoneNumberVerified = "phoneNumberVerified",
  /** column name */
  Ticket = "ticket",
  /** column name */
  TicketExpiresAt = "ticketExpiresAt",
  /** column name */
  TotpSecret = "totpSecret",
  /** column name */
  UpdatedAt = "updatedAt",
}

/** select "users_aggregate_bool_exp_bool_and_arguments_columns" columns of table "auth.users" */
export enum Users_Select_Column_Users_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  Disabled = "disabled",
  /** column name */
  EmailVerified = "emailVerified",
  /** column name */
  IsAnonymous = "isAnonymous",
  /** column name */
  PhoneNumberVerified = "phoneNumberVerified",
}

/** select "users_aggregate_bool_exp_bool_or_arguments_columns" columns of table "auth.users" */
export enum Users_Select_Column_Users_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  Disabled = "disabled",
  /** column name */
  EmailVerified = "emailVerified",
  /** column name */
  IsAnonymous = "isAnonymous",
  /** column name */
  PhoneNumberVerified = "phoneNumberVerified",
}

/** input type for updating data in table "auth.users" */
export type Users_Set_Input = {
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole?: Maybe<Scalars["String"]>;
  disabled?: Maybe<Scalars["Boolean"]>;
  displayName?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["citext"]>;
  emailVerified?: Maybe<Scalars["Boolean"]>;
  id?: Maybe<Scalars["uuid"]>;
  isAnonymous?: Maybe<Scalars["Boolean"]>;
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale?: Maybe<Scalars["String"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt?: Maybe<Scalars["timestamptz"]>;
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  phoneNumberVerified?: Maybe<Scalars["Boolean"]>;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt?: Maybe<Scalars["timestamptz"]>;
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "users" */
export type Users_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Users_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Users_Stream_Cursor_Value_Input = {
  activeMfaType?: Maybe<Scalars["String"]>;
  avatarUrl?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["timestamptz"]>;
  currentChallenge?: Maybe<Scalars["String"]>;
  defaultRole?: Maybe<Scalars["String"]>;
  disabled?: Maybe<Scalars["Boolean"]>;
  displayName?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["citext"]>;
  emailVerified?: Maybe<Scalars["Boolean"]>;
  id?: Maybe<Scalars["uuid"]>;
  isAnonymous?: Maybe<Scalars["Boolean"]>;
  lastSeen?: Maybe<Scalars["timestamptz"]>;
  locale?: Maybe<Scalars["String"]>;
  metadata?: Maybe<Scalars["jsonb"]>;
  newEmail?: Maybe<Scalars["citext"]>;
  otpHash?: Maybe<Scalars["String"]>;
  otpHashExpiresAt?: Maybe<Scalars["timestamptz"]>;
  otpMethodLastUsed?: Maybe<Scalars["String"]>;
  passwordHash?: Maybe<Scalars["String"]>;
  phoneNumber?: Maybe<Scalars["String"]>;
  phoneNumberVerified?: Maybe<Scalars["Boolean"]>;
  ticket?: Maybe<Scalars["String"]>;
  ticketExpiresAt?: Maybe<Scalars["timestamptz"]>;
  totpSecret?: Maybe<Scalars["String"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
};

/** update columns of table "auth.users" */
export enum Users_Update_Column {
  /** column name */
  ActiveMfaType = "activeMfaType",
  /** column name */
  AvatarUrl = "avatarUrl",
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  CurrentChallenge = "currentChallenge",
  /** column name */
  DefaultRole = "defaultRole",
  /** column name */
  Disabled = "disabled",
  /** column name */
  DisplayName = "displayName",
  /** column name */
  Email = "email",
  /** column name */
  EmailVerified = "emailVerified",
  /** column name */
  Id = "id",
  /** column name */
  IsAnonymous = "isAnonymous",
  /** column name */
  LastSeen = "lastSeen",
  /** column name */
  Locale = "locale",
  /** column name */
  Metadata = "metadata",
  /** column name */
  NewEmail = "newEmail",
  /** column name */
  OtpHash = "otpHash",
  /** column name */
  OtpHashExpiresAt = "otpHashExpiresAt",
  /** column name */
  OtpMethodLastUsed = "otpMethodLastUsed",
  /** column name */
  PasswordHash = "passwordHash",
  /** column name */
  PhoneNumber = "phoneNumber",
  /** column name */
  PhoneNumberVerified = "phoneNumberVerified",
  /** column name */
  Ticket = "ticket",
  /** column name */
  TicketExpiresAt = "ticketExpiresAt",
  /** column name */
  TotpSecret = "totpSecret",
  /** column name */
  UpdatedAt = "updatedAt",
}

export type Users_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<Users_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<Users_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<Users_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<Users_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<Users_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Users_Set_Input>;
  /** filter the rows which have to be updated */
  where: Users_Bool_Exp;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: Maybe<Scalars["uuid"]>;
  _gt?: Maybe<Scalars["uuid"]>;
  _gte?: Maybe<Scalars["uuid"]>;
  _in?: Maybe<Array<Scalars["uuid"]>>;
  _is_null?: Maybe<Scalars["Boolean"]>;
  _lt?: Maybe<Scalars["uuid"]>;
  _lte?: Maybe<Scalars["uuid"]>;
  _neq?: Maybe<Scalars["uuid"]>;
  _nin?: Maybe<Array<Scalars["uuid"]>>;
};

/** columns and relationships of "storage.virus" */
export type Virus = {
  __typename?: "virus";
  createdAt: Scalars["timestamptz"];
  /** An object relationship */
  file: Files;
  fileId: Scalars["uuid"];
  filename: Scalars["String"];
  id: Scalars["uuid"];
  updatedAt: Scalars["timestamptz"];
  userSession: Scalars["jsonb"];
  virus: Scalars["String"];
};

/** columns and relationships of "storage.virus" */
export type VirusUserSessionArgs = {
  path?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "storage.virus" */
export type Virus_Aggregate = {
  __typename?: "virus_aggregate";
  aggregate?: Maybe<Virus_Aggregate_Fields>;
  nodes: Array<Virus>;
};

/** aggregate fields of "storage.virus" */
export type Virus_Aggregate_Fields = {
  __typename?: "virus_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Virus_Max_Fields>;
  min?: Maybe<Virus_Min_Fields>;
};

/** aggregate fields of "storage.virus" */
export type Virus_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Virus_Select_Column>>;
  distinct?: Maybe<Scalars["Boolean"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Virus_Append_Input = {
  userSession?: Maybe<Scalars["jsonb"]>;
};

/** Boolean expression to filter rows from the table "storage.virus". All fields are combined with a logical 'AND'. */
export type Virus_Bool_Exp = {
  _and?: Maybe<Array<Virus_Bool_Exp>>;
  _not?: Maybe<Virus_Bool_Exp>;
  _or?: Maybe<Array<Virus_Bool_Exp>>;
  createdAt?: Maybe<Timestamptz_Comparison_Exp>;
  file?: Maybe<Files_Bool_Exp>;
  fileId?: Maybe<Uuid_Comparison_Exp>;
  filename?: Maybe<String_Comparison_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  updatedAt?: Maybe<Timestamptz_Comparison_Exp>;
  userSession?: Maybe<Jsonb_Comparison_Exp>;
  virus?: Maybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "storage.virus" */
export enum Virus_Constraint {
  /** unique or primary key constraint on columns "id" */
  VirusPkey = "virus_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Virus_Delete_At_Path_Input = {
  userSession?: Maybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Virus_Delete_Elem_Input = {
  userSession?: Maybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Virus_Delete_Key_Input = {
  userSession?: Maybe<Scalars["String"]>;
};

/** input type for inserting data into table "storage.virus" */
export type Virus_Insert_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  file?: Maybe<Files_Obj_Rel_Insert_Input>;
  fileId?: Maybe<Scalars["uuid"]>;
  filename?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userSession?: Maybe<Scalars["jsonb"]>;
  virus?: Maybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Virus_Max_Fields = {
  __typename?: "virus_max_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  fileId?: Maybe<Scalars["uuid"]>;
  filename?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  virus?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Virus_Min_Fields = {
  __typename?: "virus_min_fields";
  createdAt?: Maybe<Scalars["timestamptz"]>;
  fileId?: Maybe<Scalars["uuid"]>;
  filename?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  virus?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "storage.virus" */
export type Virus_Mutation_Response = {
  __typename?: "virus_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Virus>;
};

/** on_conflict condition type for table "storage.virus" */
export type Virus_On_Conflict = {
  constraint: Virus_Constraint;
  update_columns?: Array<Virus_Update_Column>;
  where?: Maybe<Virus_Bool_Exp>;
};

/** Ordering options when selecting data from "storage.virus". */
export type Virus_Order_By = {
  createdAt?: Maybe<Order_By>;
  file?: Maybe<Files_Order_By>;
  fileId?: Maybe<Order_By>;
  filename?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  updatedAt?: Maybe<Order_By>;
  userSession?: Maybe<Order_By>;
  virus?: Maybe<Order_By>;
};

/** primary key columns input for table: storage.virus */
export type Virus_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Virus_Prepend_Input = {
  userSession?: Maybe<Scalars["jsonb"]>;
};

/** select columns of table "storage.virus" */
export enum Virus_Select_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  FileId = "fileId",
  /** column name */
  Filename = "filename",
  /** column name */
  Id = "id",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserSession = "userSession",
  /** column name */
  Virus = "virus",
}

/** input type for updating data in table "storage.virus" */
export type Virus_Set_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  fileId?: Maybe<Scalars["uuid"]>;
  filename?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userSession?: Maybe<Scalars["jsonb"]>;
  virus?: Maybe<Scalars["String"]>;
};

/** Streaming cursor of the table "virus" */
export type Virus_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Virus_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: Maybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Virus_Stream_Cursor_Value_Input = {
  createdAt?: Maybe<Scalars["timestamptz"]>;
  fileId?: Maybe<Scalars["uuid"]>;
  filename?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  updatedAt?: Maybe<Scalars["timestamptz"]>;
  userSession?: Maybe<Scalars["jsonb"]>;
  virus?: Maybe<Scalars["String"]>;
};

/** update columns of table "storage.virus" */
export enum Virus_Update_Column {
  /** column name */
  CreatedAt = "createdAt",
  /** column name */
  FileId = "fileId",
  /** column name */
  Filename = "filename",
  /** column name */
  Id = "id",
  /** column name */
  UpdatedAt = "updatedAt",
  /** column name */
  UserSession = "userSession",
  /** column name */
  Virus = "virus",
}

export type Virus_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: Maybe<Virus_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: Maybe<Virus_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: Maybe<Virus_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: Maybe<Virus_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: Maybe<Virus_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: Maybe<Virus_Set_Input>;
  /** filter the rows which have to be updated */
  where: Virus_Bool_Exp;
};

export type GetFramesQueryVariables = Exact<{
  userId: Scalars["uuid"];
}>;

export type GetFramesQuery =
  & { __typename?: "query_root" }
  & {
    frame: Array<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "public" | "created_at">
        & {
          frame_versions: Array<
            (
              & { __typename?: "frame_version" }
              & Pick<Frame_Version, "id" | "url" | "og" | "created_at">
            )
          >;
        }
      )
    >;
  };

export type GetFrameByIdQueryVariables = Exact<{
  id: Scalars["uuid"];
}>;

export type GetFrameByIdQuery =
  & { __typename?: "query_root" }
  & {
    frame_by_pk?: Maybe<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "public" | "deleted" | "created_at" | "user">
        & {
          frame_versions: Array<
            (
              & { __typename?: "frame_version" }
              & Pick<
                Frame_Version,
                "id" | "url" | "og" | "sha256" | "created_at"
              >
            )
          >;
        }
      )
    >;
  };

export type GetFrameDetailQueryVariables = Exact<{
  id: Scalars["uuid"];
}>;

export type GetFrameDetailQuery =
  & { __typename?: "query_root" }
  & {
    frame_by_pk?: Maybe<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "public" | "deleted" | "created_at" | "user">
        & {
          frame_versions: Array<
            (
              & { __typename?: "frame_version" }
              & Pick<
                Frame_Version,
                "id" | "url" | "og" | "sha256" | "created_at"
              >
            )
          >;
        }
      )
    >;
  };

export type InsertFrameMutationVariables = Exact<{
  object: Frame_Insert_Input;
}>;

export type InsertFrameMutation =
  & { __typename?: "mutation_root" }
  & {
    insert_frame_one?: Maybe<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "public" | "created_at">
        & {
          frame_versions: Array<
            (
              & { __typename?: "frame_version" }
              & Pick<Frame_Version, "id" | "url" | "og" | "created_at">
            )
          >;
        }
      )
    >;
  };

export type InsertFrameVersionMutationVariables = Exact<{
  object: Frame_Version_Insert_Input;
}>;

export type InsertFrameVersionMutation =
  & { __typename?: "mutation_root" }
  & {
    insert_frame_version_one?: Maybe<
      (
        & { __typename?: "frame_version" }
        & Pick<Frame_Version, "id" | "frame" | "url" | "og" | "created_at">
      )
    >;
  };

export type DeleteFrameMutationVariables = Exact<{
  id: Scalars["uuid"];
}>;

export type DeleteFrameMutation =
  & { __typename?: "mutation_root" }
  & {
    update_frame_by_pk?: Maybe<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "deleted">
      )
    >;
  };

export type SetFramePublicMutationVariables = Exact<{
  id: Scalars["uuid"];
  public: Scalars["Boolean"];
}>;

export type SetFramePublicMutation =
  & { __typename?: "mutation_root" }
  & {
    update_frame_by_pk?: Maybe<
      (
        & { __typename?: "frame" }
        & Pick<Frame, "id" | "public">
      )
    >;
  };

export type TouchFrameVersionMutationVariables = Exact<{
  id: Scalars["uuid"];
  created_at: Scalars["timestamptz"];
}>;

export type TouchFrameVersionMutation =
  & { __typename?: "mutation_root" }
  & {
    update_frame_version_by_pk?: Maybe<
      (
        & { __typename?: "frame_version" }
        & Pick<Frame_Version, "id" | "created_at">
      )
    >;
  };

export type GetProjectsQueryVariables = Exact<{ [key: string]: never }>;

export type GetProjectsQuery =
  & { __typename?: "query_root" }
  & {
    projects: Array<
      (
        & { __typename?: "projects" }
        & Pick<
          Projects,
          | "id"
          | "key"
          | "title"
          | "description"
          | "isPublic"
          | "createdAt"
          | "updatedAt"
        >
      )
    >;
  };

export type GetProjectByKeyQueryVariables = Exact<{
  key: Scalars["String"];
}>;

export type GetProjectByKeyQuery =
  & { __typename?: "query_root" }
  & {
    projects: Array<
      (
        & { __typename?: "projects" }
        & Pick<
          Projects,
          | "id"
          | "key"
          | "title"
          | "description"
          | "userId"
          | "hashParams"
          | "storageFileId"
          | "isPublic"
        >
      )
    >;
  };

export type InsertProjectMutationVariables = Exact<{
  object: Projects_Insert_Input;
}>;

export type InsertProjectMutation =
  & { __typename?: "mutation_root" }
  & {
    insert_projects_one?: Maybe<
      (
        & { __typename?: "projects" }
        & Pick<
          Projects,
          | "id"
          | "key"
          | "title"
          | "description"
          | "isPublic"
          | "createdAt"
          | "updatedAt"
        >
      )
    >;
  };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars["uuid"];
}>;

export type DeleteProjectMutation =
  & { __typename?: "mutation_root" }
  & {
    delete_projects_by_pk?: Maybe<
      (
        & { __typename?: "projects" }
        & Pick<Projects, "id">
      )
    >;
  };

export const GetFramesDocument = `
    query GetFrames($userId: uuid!) {
  frame(
    where: {user: {_eq: $userId}, deleted: {_eq: false}}
    order_by: {created_at: desc}
  ) {
    id
    public
    created_at
    frame_versions(order_by: {created_at: desc}, limit: 1) {
      id
      url
      og
      created_at
    }
  }
}
    `;
export const GetFrameByIdDocument = `
    query GetFrameById($id: uuid!) {
  frame_by_pk(id: $id) {
    id
    public
    deleted
    created_at
    user
    frame_versions(order_by: {created_at: desc}, limit: 1) {
      id
      url
      og
      sha256
      created_at
    }
  }
}
    `;
export const GetFrameDetailDocument = `
    query GetFrameDetail($id: uuid!) {
  frame_by_pk(id: $id) {
    id
    public
    deleted
    created_at
    user
    frame_versions(order_by: {created_at: desc}) {
      id
      url
      og
      sha256
      created_at
    }
  }
}
    `;
export const InsertFrameDocument = `
    mutation InsertFrame($object: frame_insert_input!) {
  insert_frame_one(object: $object) {
    id
    public
    created_at
    frame_versions(order_by: {created_at: desc}, limit: 1) {
      id
      url
      og
      created_at
    }
  }
}
    `;
export const InsertFrameVersionDocument = `
    mutation InsertFrameVersion($object: frame_version_insert_input!) {
  insert_frame_version_one(object: $object) {
    id
    frame
    url
    og
    created_at
  }
}
    `;
export const DeleteFrameDocument = `
    mutation DeleteFrame($id: uuid!) {
  update_frame_by_pk(pk_columns: {id: $id}, _set: {deleted: true}) {
    id
    deleted
  }
}
    `;
export const SetFramePublicDocument = `
    mutation SetFramePublic($id: uuid!, $public: Boolean!) {
  update_frame_by_pk(pk_columns: {id: $id}, _set: {public: $public}) {
    id
    public
  }
}
    `;
export const TouchFrameVersionDocument = `
    mutation TouchFrameVersion($id: uuid!, $created_at: timestamptz!) {
  update_frame_version_by_pk(
    pk_columns: {id: $id}
    _set: {created_at: $created_at}
  ) {
    id
    created_at
  }
}
    `;
export const GetProjectsDocument = `
    query GetProjects {
  projects(order_by: {updatedAt: desc}) {
    id
    key
    title
    description
    isPublic
    createdAt
    updatedAt
  }
}
    `;
export const GetProjectByKeyDocument = `
    query GetProjectByKey($key: String!) {
  projects(where: {key: {_eq: $key}}, limit: 1) {
    id
    key
    title
    description
    userId
    hashParams
    storageFileId
    isPublic
  }
}
    `;
export const InsertProjectDocument = `
    mutation InsertProject($object: projects_insert_input!) {
  insert_projects_one(object: $object) {
    id
    key
    title
    description
    isPublic
    createdAt
    updatedAt
  }
}
    `;
export const DeleteProjectDocument = `
    mutation DeleteProject($id: uuid!) {
  delete_projects_by_pk(id: $id) {
    id
  }
}
    `;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    GetFrames(
      variables: GetFramesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetFramesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetFramesQuery>(GetFramesDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetFrames",
        "query",
        variables,
      );
    },
    GetFrameById(
      variables: GetFrameByIdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetFrameByIdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetFrameByIdQuery>(GetFrameByIdDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetFrameById",
        "query",
        variables,
      );
    },
    GetFrameDetail(
      variables: GetFrameDetailQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetFrameDetailQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetFrameDetailQuery>(
            GetFrameDetailDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetFrameDetail",
        "query",
        variables,
      );
    },
    InsertFrame(
      variables: InsertFrameMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertFrameMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertFrameMutation>(InsertFrameDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertFrame",
        "mutation",
        variables,
      );
    },
    InsertFrameVersion(
      variables: InsertFrameVersionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertFrameVersionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertFrameVersionMutation>(
            InsertFrameVersionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertFrameVersion",
        "mutation",
        variables,
      );
    },
    DeleteFrame(
      variables: DeleteFrameMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteFrameMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteFrameMutation>(DeleteFrameDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "DeleteFrame",
        "mutation",
        variables,
      );
    },
    SetFramePublic(
      variables: SetFramePublicMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SetFramePublicMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SetFramePublicMutation>(
            SetFramePublicDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "SetFramePublic",
        "mutation",
        variables,
      );
    },
    TouchFrameVersion(
      variables: TouchFrameVersionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<TouchFrameVersionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<TouchFrameVersionMutation>(
            TouchFrameVersionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "TouchFrameVersion",
        "mutation",
        variables,
      );
    },
    GetProjects(
      variables?: GetProjectsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetProjectsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetProjectsQuery>(GetProjectsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetProjects",
        "query",
        variables,
      );
    },
    GetProjectByKey(
      variables: GetProjectByKeyQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetProjectByKeyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetProjectByKeyQuery>(
            GetProjectByKeyDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetProjectByKey",
        "query",
        variables,
      );
    },
    InsertProject(
      variables: InsertProjectMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertProjectMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertProjectMutation>(
            InsertProjectDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertProject",
        "mutation",
        variables,
      );
    },
    DeleteProject(
      variables: DeleteProjectMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteProjectMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteProjectMutation>(
            DeleteProjectDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteProject",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
