import { Subscription } from "../subscription";

export interface PostSupervisor {
    id: number | string;
    subscription: Subscription;
}
