import type { PrismaClient } from '@prisma/client';
import type { CustomerRepository, OrderRepository, PartRepository, UserRepository } from './repositories/interfaces';
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryPartRepository, InMemoryUserRepository } from './repositories/inMemory';
import { PrismaCustomerRepository, PrismaOrderRepository, PrismaPartRepository, PrismaUserRepository } from './repositories/prisma';
import { AuthService, type AuthConfig } from './services/authService';
import { CustomerService } from './services/customerService';
import { OrderService } from './services/orderService';
import { PartService } from './services/partService';
import { UserService } from './services/userService';

/** Composition root: único lugar donde se eligen las implementaciones concretas. */
export function buildContainer(config: AuthConfig, db?: PrismaClient) {
  const userRepository: UserRepository = db ? new PrismaUserRepository(db) : new InMemoryUserRepository();
  const customerRepository: CustomerRepository = db ? new PrismaCustomerRepository(db) : new InMemoryCustomerRepository();
  const partRepository: PartRepository = db ? new PrismaPartRepository(db) : new InMemoryPartRepository();
  const orderRepository: OrderRepository = db ? new PrismaOrderRepository(db) : new InMemoryOrderRepository();

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