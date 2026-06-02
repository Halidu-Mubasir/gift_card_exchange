import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin1234', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@giftcards.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@giftcards.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      phone: '+233200000000',
    },
  })

  // Create test seller
  const sellerPassword = await bcrypt.hash('seller1234', 12)
  const seller = await prisma.user.upsert({
    where: { email: 'seller@giftcards.com' },
    update: {},
    create: {
      name: 'Test Seller',
      email: 'seller@giftcards.com',
      passwordHash: sellerPassword,
      role: Role.SELLER,
      phone: '+233200000001',
      momoNumber: '+233200000001',
    },
  })

  // Create card types with exchange rates
  const cardTypes = [
    { name: 'Amazon' },
    { name: 'iTunes' },
    { name: 'Steam' },
    { name: 'Google Play' },
    { name: 'Xbox' },
    { name: 'PlayStation' },
  ]

  const denominations = [25, 50, 100, 200]
  const baseRates: Record<string, number> = {
    Amazon: 12.5,
    iTunes: 11.8,
    Steam: 11.0,
    'Google Play': 11.5,
    Xbox: 10.8,
    PlayStation: 11.2,
  }

  for (const ct of cardTypes) {
    const cardType = await prisma.cardType.upsert({
      where: { name: ct.name },
      update: {},
      create: ct,
    })

    for (const denom of denominations) {
      await prisma.exchangeRate.upsert({
        where: { cardTypeId_denomination: { cardTypeId: cardType.id, denomination: denom } },
        update: {},
        create: {
          cardTypeId: cardType.id,
          denomination: denom,
          ratePerDollar: baseRates[ct.name],
          currency: 'GHS',
        },
      })
    }
  }

  console.log('✅ Seeding complete!')
  console.log(`   Admin:  admin@giftcards.com  /  admin1234`)
  console.log(`   Seller: seller@giftcards.com /  seller1234`)
  console.log(`   ${admin.id} | ${seller.id}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
