import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dropshipping.com' },
    update: {},
    create: {
      email: 'admin@dropshipping.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created admin user:', adminUser.email);

  // Create Dropshipper Users
  const dropshipper1 = await prisma.user.upsert({
    where: { email: 'dropshipper1@example.com' },
    update: {},
    create: {
      email: 'dropshipper1@example.com',
      passwordHash: hashedPassword,
      role: 'DROPSHIPPER',
      status: 'ACTIVE',
      dropshipperProfile: {
        create: {
          cuit: '20-12345678-9',
          razonSocial: 'Dropshipper Company S.A.',
          address: 'Av. Corrientes 1234, CABA, Buenos Aires',
          commissionRate: 0.15,
          afipValidatedAt: new Date(),
        },
      },
    },
  });
  console.log('✓ Created dropshipper user 1:', dropshipper1.email);

  const dropshipper2 = await prisma.user.upsert({
    where: { email: 'dropshipper2@example.com' },
    update: {},
    create: {
      email: 'dropshipper2@example.com',
      passwordHash: hashedPassword,
      role: 'DROPSHIPPER',
      status: 'ACTIVE',
      dropshipperProfile: {
        create: {
          cuit: '20-98765432-1',
          razonSocial: 'E-Commerce Plus S.R.L.',
          address: 'Av. Santa Fe 5678, CABA, Buenos Aires',
          commissionRate: 0.12,
          afipValidatedAt: new Date(),
        },
      },
    },
  });
  console.log('✓ Created dropshipper user 2:', dropshipper2.email);

  // Create Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { code: 'SUP001' },
    update: {},
    create: {
      code: 'SUP001',
      name: 'Tech Wholesale Argentina',
      cuit: '30-11111111-1',
      contactEmail: 'contact@techwholesale.com.ar',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created supplier:', supplier1.name);

  const supplier2 = await prisma.supplier.upsert({
    where: { code: 'SUP002' },
    update: {},
    create: {
      code: 'SUP002',
      name: 'Fashion Distributor SA',
      cuit: '30-22222222-2',
      contactEmail: 'ventas@fashiondist.com',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created supplier:', supplier2.name);

  // Create Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      supplierId: supplier1.id,
      name: 'Tech Warehouse Central',
      address: 'Parque Industrial, Villa Martelli, Buenos Aires',
      operatingHours: 'Lun-Vie 8:00-18:00',
      capacity: 10000,
    },
  });
  console.log('✓ Created warehouse:', warehouse1.name);

  const warehouse2 = await prisma.warehouse.create({
    data: {
      supplierId: supplier2.id,
      name: 'Fashion Distribution Center',
      address: 'Zona Franca, La Plata, Buenos Aires',
      operatingHours: 'Lun-Vie 9:00-17:00',
      capacity: 5000,
    },
  });
  console.log('✓ Created warehouse:', warehouse2.name);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'TECH-001',
        name: 'Smartphone Samsung Galaxy A54',
        description: 'Smartphone 5G, 128GB, 6GB RAM, Triple Camera 50MP',
        costPrice: 350000,
        suggestedPrice: 450000,
        stock: 50,
        lowStockThreshold: 10,
        weight: 0.195,
        dimensions: { length: 15.8, width: 7.6, height: 0.83 },
        supplierId: supplier1.id,
        visibilityType: 'PUBLIC',
        imagesUrls: [
          'https://example.com/images/samsung-a54-front.jpg',
          'https://example.com/images/samsung-a54-back.jpg',
        ],
      },
    }),
    prisma.product.create({
      data: {
        sku: 'TECH-002',
        name: 'Notebook HP 15.6" Intel i5',
        description: 'Notebook HP 15.6", Intel Core i5 11th Gen, 8GB RAM, 256GB SSD',
        costPrice: 650000,
        suggestedPrice: 850000,
        stock: 30,
        lowStockThreshold: 5,
        weight: 1.74,
        dimensions: { length: 35.8, width: 24.2, height: 1.79 },
        supplierId: supplier1.id,
        visibilityType: 'PUBLIC',
        imagesUrls: ['https://example.com/images/hp-notebook.jpg'],
      },
    }),
    prisma.product.create({
      data: {
        sku: 'TECH-003',
        name: 'Auriculares Bluetooth Sony WH-1000XM4',
        description: 'Auriculares inalámbricos con cancelación de ruido',
        costPrice: 280000,
        suggestedPrice: 380000,
        stock: 100,
        lowStockThreshold: 20,
        weight: 0.254,
        dimensions: { length: 20, width: 18, height: 8 },
        supplierId: supplier1.id,
        visibilityType: 'PUBLIC',
        imagesUrls: ['https://example.com/images/sony-wh1000xm4.jpg'],
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FASH-001',
        name: 'Remera Básica Algodón',
        description: 'Remera básica 100% algodón, talles S a XXL',
        costPrice: 5000,
        suggestedPrice: 8000,
        stock: 500,
        lowStockThreshold: 100,
        weight: 0.2,
        dimensions: { length: 30, width: 25, height: 2 },
        supplierId: supplier2.id,
        visibilityType: 'PUBLIC',
        imagesUrls: ['https://example.com/images/basic-tshirt.jpg'],
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FASH-002',
        name: 'Zapatillas Deportivas Running',
        description: 'Zapatillas deportivas para running, talles 35-45',
        costPrice: 35000,
        suggestedPrice: 55000,
        stock: 200,
        lowStockThreshold: 30,
        weight: 0.6,
        dimensions: { length: 30, width: 20, height: 12 },
        supplierId: supplier2.id,
        visibilityType: 'PUBLIC',
        imagesUrls: ['https://example.com/images/running-shoes.jpg'],
      },
    }),
  ]);
  console.log(`✓ Created ${products.length} products`);

  // Get dropshipper profiles
  const dropshipperProfile1 = await prisma.dropshipperProfile.findUnique({
    where: { userId: dropshipper1.id },
  });

  const dropshipperProfile2 = await prisma.dropshipperProfile.findUnique({
    where: { userId: dropshipper2.id },
  });

  if (!dropshipperProfile1 || !dropshipperProfile2) {
    throw new Error('Dropshipper profiles not found');
  }

  // Create Bank Accounts
  const bankAccount1 = await prisma.bankAccount.create({
    data: {
      dropshipperId: dropshipperProfile1.id,
      cbu: '0170123420000012345678',
      alias: 'DROPSHIPPER.SHOP',
      accountHolder: 'Dropshipper Company S.A.',
      accountType: 'Cuenta Corriente',
      bankName: 'Banco Galicia',
      validatedAt: new Date(),
    },
  });
  console.log('✓ Created bank account for dropshipper 1');

  const bankAccount2 = await prisma.bankAccount.create({
    data: {
      dropshipperId: dropshipperProfile2.id,
      cbu: '0720987620000098765432',
      alias: 'ECOMMERCE.PLUS',
      accountHolder: 'E-Commerce Plus S.R.L.',
      accountType: 'Caja de Ahorro',
      bankName: 'Banco Santander',
      validatedAt: new Date(),
    },
  });
  console.log('✓ Created bank account for dropshipper 2');

  // Create Sample Order
  const order1 = await prisma.order.create({
    data: {
      dropshipperId: dropshipperProfile1.id,
      shopifyOrderId: 'shopify_12345678',
      storeId: 'store_001',
      customerName: 'Juan Pérez',
      customerEmail: 'juan.perez@example.com',
      shippingAddress: {
        street: 'Av. Belgrano 1234',
        city: 'CABA',
        province: 'Buenos Aires',
        postalCode: '1092',
        country: 'Argentina',
      },
      paymentType: 'TC',
      state: 'CONFIRMED',
      totalAmount: 450000,
      productCost: 350000,
      shippingCost: 5000,
      commissionAmount: 14250, // 15% of (totalAmount - shippingCost - productCost)
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: 450000,
            subtotal: 450000,
          },
        ],
      },
      events: {
        create: [
          {
            fromState: null,
            toState: 'PENDING',
            changedByUserId: dropshipper1.id,
            reason: 'Orden creada desde Shopify',
          },
          {
            fromState: 'PENDING',
            toState: 'CONFIRMED',
            changedByUserId: adminUser.id,
            reason: 'Pago confirmado',
          },
        ],
      },
    },
  });
  console.log('✓ Created sample order:', order1.id);

  // Create Wallet Transactions
  await prisma.walletTransaction.create({
    data: {
      dropshipperId: dropshipperProfile1.id,
      type: 'ORDER_CHARGE',
      creditAmount: 14250,
      debitAmount: 0,
      balanceAfter: 14250,
      orderId: order1.id,
      description: `Comisión por venta - Orden ${order1.id}`,
      createdByUserId: adminUser.id,
    },
  });
  console.log('✓ Created wallet transaction for order commission');

  // Create Deposit Request
  await prisma.depositRequest.create({
    data: {
      dropshipperId: dropshipperProfile1.id,
      amount: 100000,
      receiptUrl: 'https://example.com/receipts/deposit-001.pdf',
      observations: 'Depósito inicial para comenzar operaciones',
      status: 'APPROVED',
      reviewedByUserId: adminUser.id,
      reviewedAt: new Date(),
    },
  });
  console.log('✓ Created deposit request');

  // Create Shopify Connection
  await prisma.shopifyConnection.create({
    data: {
      dropshipperId: dropshipperProfile1.id,
      shopDomain: 'my-dropshipping-store.myshopify.com',
      accessToken: 'shpat_dummy_token_for_development',
      status: 'ACTIVE',
      lastSyncAt: new Date(),
    },
  });
  console.log('✓ Created Shopify connection');

  console.log('');
  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin: admin@dropshipping.com / password123');
  console.log('  Dropshipper 1: dropshipper1@example.com / password123');
  console.log('  Dropshipper 2: dropshipper2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });