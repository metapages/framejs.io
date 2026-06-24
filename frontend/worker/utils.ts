import { createDefine } from "fresh";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface State {
  user: User | null;
  accessToken: string | null;
}

export const define = createDefine<State>();
