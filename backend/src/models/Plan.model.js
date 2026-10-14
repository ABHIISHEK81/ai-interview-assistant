const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['free', '1-month', '3-months', '1-year', 'basic', 'medium', 'advanced'],
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
      default: 0,
    },
    priceAnnual: {
      type: Number,
      required: true,
      default: 0,
    },
    creditQuota: {
      type: Number,
      required: true,
      default: 2,
    },
    monthlyQuota: {
      type: Number,
      default: 0,
    },
    durationMonths: {
      type: Number,
      default: 1,
    },
    stripePriceIdMonthly: {
      type: String,
      default: null,
    },
    stripePriceIdAnnual: {
      type: String,
      default: null,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Seed default plans per Part 5 Credit System & Subscription Pricing Structure
 */
planSchema.statics.seedDefaultPlans = async function () {
  const defaultPlans = [
    {
      name: 'free',
      displayName: 'Free Starter Trial',
      priceMonthly: 0,
      priceAnnual: 0,
      creditQuota: 2,
      monthlyQuota: 2,
      durationMonths: 1,
      features: [
        '2 Free Demo Credits upon email registration',
        'Strictly 1 claim per unique email address',
        'Valid for 1 month demo cycle (unused credits expire)',
        'Full AI Mock Interview Question Generation',
        'AI Resume ATS Score & Role-Based Suggestions',
        'Live Quiz Arena Competitions & Leaderboards',
      ],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: '1-month',
      displayName: '1 Month Plan',
      priceMonthly: 249,
      priceAnnual: 249,
      creditQuota: 10,
      monthlyQuota: 10,
      durationMonths: 1,
      features: [
        '10 Credits allocated immediately',
        '₹249 one-time monthly subscription',
        'Valid for 1 month (30 days cycle)',
        'Strict monthly validity: unused credits expire at period end',
        'Resume ATS Score & Role-Based Suggestions',
        'Resume AI Questioning & Project Interrogation',
      ],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: '3-months',
      displayName: '3 Months Plan',
      priceMonthly: 449,
      priceAnnual: 449,
      creditQuota: 30,
      monthlyQuota: 10,
      durationMonths: 3,
      features: [
        '30 Total Credits distributed over 3 months',
        '10 Credits allocated per monthly cycle',
        '₹449 full 3-month upfront payment (save ₹298)',
        'Monthly limits & validity rules apply (unused expire monthly)',
        'Full AI Mock Tests & Interactive Leaderboards',
        'Deep Project Interrogation Chamber',
      ],
      isActive: true,
      sortOrder: 3,
    },
    {
      name: '1-year',
      displayName: '1 Year Plan',
      priceMonthly: 2500,
      priceAnnual: 2500,
      creditQuota: 120, // Annual Pool
      monthlyQuota: 10,
      durationMonths: 12,
      features: [
        'Direct Access / Annual Pool (120+ credits pool)',
        '₹2500 full upfront annual payment',
        '365 Days continuous platform access',
        'Priority Groq LLaMA 3.3 70B token queue',
        'Unlimited Resume ATS Scorings & Target Role Edits',
        'Executive Behavioral & System Design Deep Dives',
      ],
      isActive: true,
      sortOrder: 4,
    },
    // Retain legacy plans for compatibility
    {
      name: 'basic',
      displayName: 'Basic Plan',
      priceMonthly: 99,
      priceAnnual: 999,
      creditQuota: 5,
      features: [
        '5 Full AI Mock Interview Rounds / Month',
      ],
      isActive: false,
      sortOrder: 5,
    },
    {
      name: 'medium',
      displayName: 'Medium Plan',
      priceMonthly: 149,
      priceAnnual: 1499,
      creditQuota: 10,
      features: [
        '10 Full AI Mock Interview Rounds / Month',
      ],
      isActive: false,
      sortOrder: 6,
    },
    {
      name: 'advanced',
      displayName: 'Advanced Plan',
      priceMonthly: 199,
      priceAnnual: 1999,
      creditQuota: 20,
      features: [
        '20 High-Fidelity Mock Rounds / Month',
      ],
      isActive: false,
      sortOrder: 7,
    },
  ];

  for (const planData of defaultPlans) {
    await this.findOneAndUpdate(
      { name: planData.name },
      { $set: planData },
      { upsert: true, new: true }
    );
  }
};

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
