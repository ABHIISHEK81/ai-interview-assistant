/**
 * Seed Admin Account Script
 * Reference: interviewAI PDF Documentation pp. 53, 66
 * Usage: node backend/src/scripts/seedAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User.model');
const logger = require('../config/logger');

const ADMIN_EMAIL = 'aftab@admin.com';
const ADMIN_PASSWORD = 'passwore123'; // As specified in PDF p. 66

const seedAdmin = async () => {
  try {
    logger.info('Connecting to database to seed initial admin...');
    await connectDB();

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (!existingAdmin) {
      const superAdmin = await User.create({
        name: 'Aftab Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'super_admin',
        isActive: true,
        isBanned: false,
      });

      console.log('\n=============================================');
      console.log('  SUCCESS: Super Admin Account Created');
      console.log('=============================================');
      console.log(`  Email:    ${superAdmin.email}`);
      console.log(`  Password: ${ADMIN_PASSWORD}`);
      console.log(`  Role:     ${superAdmin.role}`);
      console.log('=============================================\n');
    } else {
      // Per PDF p. 66: If account already exists, update role to admin and reset password
      existingAdmin.role = 'admin';
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.isActive = true;
      existingAdmin.isBanned = false;
      await existingAdmin.save();

      console.log('\n=============================================');
      console.log('  SUCCESS: Existing Admin Account Reset');
      console.log('=============================================');
      console.log(`  Email:    ${existingAdmin.email}`);
      console.log(`  Password: ${ADMIN_PASSWORD}`);
      console.log(`  Role:     ${existingAdmin.role}`);
      console.log('=============================================\n');
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding admin: ${error.message}`);
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
