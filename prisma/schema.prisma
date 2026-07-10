generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
enum Role { USER ADMIN }
enum AgentStatus { DRAFT PUBLISHED ARCHIVED }
model User { id String @id @default(cuid()); email String @unique; name String?; role Role @default(USER); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; agents Agent[] }
model Category { id String @id @default(cuid()); slug String @unique; name String; nameAr String; agents Agent[] }
model Agent { id String @id @default(cuid()); slug String @unique; name String; nameAr String; summary String; description String; priceMonthly Int; status AgentStatus @default(DRAFT); categoryId String; category Category @relation(fields:[categoryId],references:[id]); ownerId String; owner User @relation(fields:[ownerId],references:[id]); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; @@index([status,categoryId]) }
