"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContainer = buildContainer;
const inMemory_1 = require("./repositories/inMemory");
const prisma_1 = require("./repositories/prisma");
const authService_1 = require("./services/authService");
const customerService_1 = require("./services/customerService");
const orderService_1 = require("./services/orderService");
const partService_1 = require("./services/partService");
const userService_1 = require("./services/userService");
/** Composition root: único lugar donde se eligen las implementaciones concretas. */
function buildContainer(config, db) {
    const userRepository = db ? new prisma_1.PrismaUserRepository(db) : new inMemory_1.InMemoryUserRepository();
    const customerRepository = db ? new prisma_1.PrismaCustomerRepository(db) : new inMemory_1.InMemoryCustomerRepository();
    const partRepository = db ? new prisma_1.PrismaPartRepository(db) : new inMemory_1.InMemoryPartRepository();
    const orderRepository = db ? new prisma_1.PrismaOrderRepository(db) : new inMemory_1.InMemoryOrderRepository();
    const authService = new authService_1.AuthService(userRepository, config);
    return {
        userRepository,
        customerRepository,
        partRepository,
        orderRepository,
        authService,
        userService: new userService_1.UserService(userRepository, authService),
        customerService: new customerService_1.CustomerService(customerRepository),
        partService: new partService_1.PartService(partRepository),
        orderService: new orderService_1.OrderService(orderRepository, customerRepository, userRepository, partRepository)
    };
}
//# sourceMappingURL=container.js.map