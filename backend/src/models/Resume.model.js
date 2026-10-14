const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    publicId: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    extractedText: {
      type: String,
      maxlength: 8000,
    },
    parsedData: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      skills: [{ type: String }],
      experience: [
        {
          company: String,
          role: String,
          duration: String,
          description: String,
          technologies: [String],
        },
      ],
      projects: [
        {
          title: String,
          description: String,
          technologies: [String],
          link: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          fieldOfStudy: String,
          graduationYear: String,
        },
      ],
      certifications: [String],
      summary: String,
    },
  },
  {
    timestamps: true,
  }
);

// When setting a resume as default, unmark others for the same user
resumeSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
