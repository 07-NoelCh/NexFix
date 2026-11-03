import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryPartRepository, InMemoryUserRepository } from './repositories/inMemory';
import { AuthService, type AuthConfig } from './services/authService';
import { CustomerService } from './services/customerService';
import { OrderService } from './services/orderService';
import { PartService } from './services/partService';
import { UserService } from './services/userService';

/** Composition root: único lugar donde se eligen las implementaciones concretas (hoy, en memoria). */
export function buildContainer(config: AuthConfig) {
  const userRepository = new InMemoryUserRepository();
  const customerRepository = new InMemoryCustomerRepository();
  const partRepository = new InMemoryPartRepository();
  const orderRepository = new InMemoryOrderRepository();

  const authService = new AuthService(userRepository, config);
  return {
    userRepository,
    customerRepository,
    partRepository,
    orderRepository,
    authService,
    userService: new UserService(userRepository, authService),
    customerService: new CustomerService(customerRepository),
    partService: new PartService(partRepository),
    orderService: new OrderService(orderRepository, customerRepository, userRepository, partRepository)
  };
}

export type Container = ReturnType<typeof buildContainer>;
