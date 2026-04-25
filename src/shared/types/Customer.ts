import type {User} from "@shared/types/User.ts";
import type {Order} from "@shared/types/Order.ts";

type Customer = User & {
  orders: Order[];
}