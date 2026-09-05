import 'dotenv/config';

import {
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '@guddi-silai/shared';
import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma.js';

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: 'Full access to every admin area.',
  ORDER_MANAGER: 'Manage orders and customer enquiries.',
  PRODUCT_MANAGER: 'Manage products, catalogue reference data, and inventory.',
  STITCHING_MANAGER: 'Manage customized orders and measurements.',
  ANALYST: 'View analytics reports and dashboards.',
};

async function seedPermissions(): Promise<Record<string, string>> {
  const keyToId: Record<string, string> = {};
  for (const key of ADMIN_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, name: key },
    });
    keyToId[key] = record.id;
  }
  return keyToId;
}

async function seedRoles(keyToId: Record<string, string>): Promise<void> {
  for (const name of ADMIN_ROLES) {
    const permissionIds = ROLE_PERMISSIONS[name].map((perm) => keyToId[perm]);
    await prisma.adminRole.upsert({
      where: { name },
      update: { permissionIds },
      create: {
        name,
        description: roleDescriptions[name] ?? null,
        permissionIds,
        isSystem: true,
      },
    });
  }
}

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      'ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping bootstrap SUPER_ADMIN creation.'
    );
    return;
  }

  const superRole = await prisma.adminRole.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  if (!superRole) {
    throw new Error('SUPER_ADMIN role not found during seed');
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || '12'));
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash, roleIds: [superRole.id], isActive: true },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        name: email.split('@')[0] ?? 'Super Admin',
        email,
        passwordHash,
        roleIds: [superRole.id],
      },
    });
  }
}

// ──────────────────────────────────────────────
// Phase 3: sample catalogue reference data
// ──────────────────────────────────────────────

const CATEGORIES = [
  {
    name: 'Ready-Made Blouses',
    slug: 'ready-made-blouses',
    description: 'Ready-to-wear blouses stitched and ready to ship.',
    displayOrder: 0,
  },
  {
    name: 'Custom Stitching',
    slug: 'custom-stitching',
    description: 'Bespoke blouses stitched to your exact measurements.',
    displayOrder: 1,
  },
  {
    name: 'Bridal Collection',
    slug: 'bridal-collection',
    description: 'Premium bridal blouses with rich embroidery.',
    displayOrder: 2,
  },
] as const;

const SUBCATEGORIES = [
  { name: 'Sleeveless', slug: 'sleeveless', category: 'ready-made-blouses' },
  { name: 'Short Sleeve', slug: 'short-sleeve', category: 'ready-made-blouses' },
  { name: 'Full Sleeve', slug: 'full-sleeve', category: 'ready-made-blouses' },
  { name: 'Boat Neck', slug: 'boat-neck', category: 'custom-stitching' },
  { name: 'Designer Neck', slug: 'designer-neck', category: 'custom-stitching' },
  { name: 'Bridal Special', slug: 'bridal-special', category: 'bridal-collection' },
  { name: 'Lehenga Blouse', slug: 'lehenga-blouse', category: 'bridal-collection' },
] as const;

const COLORS = [
  { name: 'Maroon', hex: '#800000' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Black', hex: '#000000' },
  { name: 'Powder Blue', hex: '#B0E0E6' },
  { name: 'Emerald Green', hex: '#50C878' },
  { name: 'Royal Navy', hex: '#002366' },
  { name: 'Blush Pink', hex: '#FFB6C1' },
  { name: 'Red', hex: '#FF0000' },
] as const;

const SIZES = [
  { name: 'XS', code: 'XS' },
  { name: 'S', code: 'S' },
  { name: 'M', code: 'M' },
  { name: 'L', code: 'L' },
  { name: 'XL', code: 'XL' },
  { name: 'XXL', code: 'XXL' },
  { name: 'Custom', code: 'CUSTOM' },
] as const;

const FIBERS = [
  { name: 'Cotton', price: 150, description: 'Soft, breathable everyday cotton.' },
  { name: 'Silk', price: 450, description: 'Lustrous pure silk with a rich drape.' },
  { name: 'Georgette', price: 350, description: 'Sheer, flowing, printed georgette.' },
  { name: 'Satin', price: 300, description: 'Smooth glossy satin with structure.' },
  { name: 'Velvet', price: 500, description: 'Plush velvet for festive occasions.' },
  { name: 'Raw Silk', price: 550, description: 'Handloom raw silk with texture.' },
] as const;

const EMBROIDERIES = [
  { name: 'Plain', surcharge: 0 },
  { name: 'Zardosi', surcharge: 800 },
  { name: 'Stone Work', surcharge: 350 },
  { name: 'Mirror Work', surcharge: 250 },
  { name: 'Hand Embroidery', surcharge: 500 },
  { name: 'Bead Work', surcharge: 300 },
] as const;

const PRODUCT_SEEDS = [
  {
    name: 'Handloom Silk Boat Neck Blouse',
    slug: 'handloom-silk-boat-neck-blouse',
    designId: 'GS-201',
    type: 'READY_MADE',
    description:
      'Elegant boat-neck blouse in handloom raw silk with a delicate hand-embroidered edge.',
    category: 'bridal-collection',
    subcategory: 'bridal-special',
    basePrice: 2799,
    compareAtPrice: 3299,
    colors: ['Ivory', 'Maroon', 'Blush Pink'],
    sizes: ['S', 'M', 'L', 'XL'],
    fibers: ['Raw Silk'],
    embroideries: ['Hand Embroidery'],
    tags: ['bridal', 'silk', 'handloom'],
    stock: 8,
  },
  {
    name: 'Cotton Sleeveless Everyday Blouse',
    slug: 'cotton-sleeveless-everyday-blouse',
    designId: 'GS-202',
    type: 'READY_MADE',
    description: 'Breathable cotton blouse with a clean profile — perfect for everyday wear.',
    category: 'ready-made-blouses',
    subcategory: 'sleeveless',
    basePrice: 1199,
    colors: ['Powder Blue', 'Blush Pink', 'Black'],
    sizes: ['S', 'M', 'L'],
    fibers: ['Cotton'],
    embroideries: ['Plain'],
    tags: ['cotton', 'everyday', 'sleeveless'],
    stock: 20,
  },
  {
    name: 'Embroidered Velvet Full Sleeve Blouse',
    slug: 'embroidered-velvet-full-sleeve-blouse',
    designId: 'GS-203',
    type: 'READY_MADE',
    description: 'Festive velvet blouse with full sleeves and zardosi accents.',
    category: 'bridal-collection',
    subcategory: 'lehenga-blouse',
    basePrice: 3499,
    compareAtPrice: 3999,
    colors: ['Maroon', 'Black', 'Emerald Green'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    fibers: ['Velvet'],
    embroideries: ['Zardosi'],
    tags: ['festive', 'velvet', 'zardosi'],
    stock: 12,
  },
  {
    name: 'Georgette Saree Blouse',
    slug: 'georgette-saree-blouse',
    designId: 'GS-204',
    type: 'CUSTOMIZE',
    description:
      'Made-to-measure georgette blouse for your saree — choose fabric, neck, and sleeves.',
    category: 'custom-stitching',
    subcategory: 'designer-neck',
    basePrice: 1499,
    colors: ['Ivory', 'Red', 'Royal Navy', 'Powder Blue'],
    sizes: ['Custom'],
    fibers: ['Georgette', 'Satin'],
    embroideries: ['Stone Work', 'Bead Work'],
    tags: ['custom', 'georgette', 'measurements'],
    stock: 0,
    expectedAvailability: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Silk Designer Neck Party Blouse',
    slug: 'silk-designer-neck-party-blouse',
    designId: 'GS-205',
    type: 'READY_MADE',
    description: 'Statement party blouse in silk satin with a daring cut.',
    category: 'ready-made-blouses',
    subcategory: 'short-sleeve',
    basePrice: 2399,
    colors: ['Black', 'Royal Navy', 'Red'],
    sizes: ['S', 'M', 'L'],
    fibers: ['Silk'],
    embroideries: ['Bead Work'],
    tags: ['party', 'silk', 'designer'],
    stock: 5,
  },
  {
    name: 'Mirror Work Square Neck Blouse',
    slug: 'mirror-work-square-neck-blouse',
    designId: 'GS-206',
    type: 'SHOWCASE',
    description: 'Designer showcase piece with traditional mirror work.',
    category: 'ready-made-blouses',
    subcategory: 'boat-neck',
    basePrice: 1999,
    colors: ['Emerald Green', 'Blush Pink'],
    sizes: ['M', 'L'],
    fibers: ['Silk'],
    embroideries: ['Mirror Work'],
    tags: ['showcase', 'mirror-work', 'designer'],
    stock: 0,
  },
] as const;

async function getOrCreate<T extends { id: string }, C extends Record<string, unknown>>(
  find: (name: string) => Promise<T | null>,
  create: (name: string) => Promise<T>,
  name: string
): Promise<string> {
  const existing = await find(name);
  if (existing) return existing.id;
  const record = await create(name);
  return record.id;
}

async function seedCatalogue(): Promise<{
  categoryId: Record<string, string>;
  subCategoryId: Record<string, string>;
  colorId: Record<string, string>;
  sizeId: Record<string, string>;
  fiberId: Record<string, string>;
  embroideryId: Record<string, string>;
}> {
  const categoryId: Record<string, string> = {};
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
      },
    });
    categoryId[category.slug] = record.id;
  }

  const subCategoryId: Record<string, string> = {};
  for (const sub of SUBCATEGORIES) {
    const record = await prisma.subCategory.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, categoryId: categoryId[sub.category], isActive: true },
      create: {
        name: sub.name,
        slug: sub.slug,
        categoryId: categoryId[sub.category],
      },
    });
    subCategoryId[sub.slug] = record.id;
  }

  const colorId: Record<string, string> = {};
  for (const color of COLORS) {
    colorId[color.name] = await getOrCreate(
      (name) => prisma.color.findFirst({ where: { name } }),
      (name) => prisma.color.create({ data: { name, hex: color.hex } }),
      color.name
    );
  }

  const sizeId: Record<string, string> = {};
  for (const size of SIZES) {
    sizeId[size.name] = await getOrCreate(
      (name) => prisma.size.findFirst({ where: { name } }),
      (name) => prisma.size.create({ data: { name, code: size.code } }),
      size.name
    );
  }

  const fiberId: Record<string, string> = {};
  for (const fiber of FIBERS) {
    const record = await prisma.fiber.upsert({
      where: { name: fiber.name },
      update: { price: fiber.price, description: fiber.description, isActive: true },
      create: {
        name: fiber.name,
        price: fiber.price,
        description: fiber.description,
      },
    });
    fiberId[fiber.name] = record.id;
  }

  const embroideryId: Record<string, string> = {};
  for (const embroidery of EMBROIDERIES) {
    embroideryId[embroidery.name] = await getOrCreate(
      (name) => prisma.embroidery.findFirst({ where: { name } }),
      (name) =>
        prisma.embroidery.create({
          data: { name, surcharge: embroidery.surcharge },
        }),
      embroidery.name
    );
  }

  return {
    categoryId,
    subCategoryId,
    colorId,
    sizeId,
    fiberId,
    embroideryId,
  };
}

async function seedProducts(
  ids: {
    categoryId: Record<string, string>;
    subCategoryId: Record<string, string>;
    colorId: Record<string, string>;
    sizeId: Record<string, string>;
    fiberId: Record<string, string>;
    embroideryId: Record<string, string>;
  }
): Promise<void> {
  for (const seed of PRODUCT_SEEDS) {
    const fiberOptions = seed.fibers.map((name) => {
      const fiber = FIBERS.find((f) => f.name === name)!;
      return {
        id: ids.fiberId[name],
        name: fiber.name,
        price: fiber.price,
        isActive: true,
      };
    });
    const embroideryOptions = seed.embroideries.map((name) => {
      const record = EMBROIDERIES.find((e) => e.name === name)!;
      return {
        id: ids.embroideryId[name],
        name: name,
        surcharge: record.surcharge ?? null,
        isActive: true,
      };
    });
    const colors = seed.colors.map((name) => ({
      colorId: ids.colorId[name],
      sizeId: null,
    }));
    const sizes = seed.sizes.map((name) => ({
      colorId: null,
      sizeId: ids.sizeId[name],
    }));

    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        designId: seed.designId,
        description: seed.description,
        type: seed.type,
        categoryId: ids.categoryId[seed.category],
        subCategoryId: ids.subCategoryId[seed.subcategory] ?? null,
        basePrice: seed.basePrice,
        compareAtPrice: seed.compareAtPrice ?? null,
        colors,
        sizes,
        fiberOptions,
        embroideryOptions,
        images: [`https://picsum.photos/seed/${seed.slug}/600/750`],
        videos: [],
        tags: seed.tags,
        expectedAvailability: seed.expectedAvailability ?? null,
        isActive: true,
      },
      create: {
        name: seed.name,
        slug: seed.slug,
        designId: seed.designId,
        description: seed.description,
        type: seed.type,
        categoryId: ids.categoryId[seed.category],
        subCategoryId: ids.subCategoryId[seed.subcategory] ?? null,
        basePrice: seed.basePrice,
        compareAtPrice: seed.compareAtPrice ?? null,
        colors,
        sizes,
        fiberOptions,
        embroideryOptions,
        images: [`https://picsum.photos/seed/${seed.slug}/600/750`],
        videos: [],
        tags: seed.tags,
        expectedAvailability: seed.expectedAvailability ?? null,
      },
    });

    const variantSizes = seed.sizes.filter((name) => ids.sizeId[name]).slice(0, 3);
    for (let index = 0; index < variantSizes.length; index += 1) {
      const sku = `${seed.designId}-${index + 1}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          colorId: ids.colorId[seed.colors[0]],
          sizeId: ids.sizeId[variantSizes[index]],
          price: seed.basePrice,
          stock: seed.stock,
        },
        create: {
          productId: product.id,
          sku,
          colorId: ids.colorId[seed.colors[0]],
          sizeId: ids.sizeId[variantSizes[index]],
          price: seed.basePrice,
          stock: seed.stock,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  const keyToId = await seedPermissions();
  await seedRoles(keyToId);
  await seedSuperAdmin();
  const ids = await seedCatalogue();
  await seedProducts(ids);
}

main()
  .then(() => {
    console.log('Seeding complete.');
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });